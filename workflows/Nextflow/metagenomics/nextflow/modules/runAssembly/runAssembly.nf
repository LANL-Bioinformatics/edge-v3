#!/usr/bin/env nextflow


//main process for assembly with IDBA
process idbaUD {
    label "assembly"
    label "small"
    publishDir (
    path:"${settings["assemblyOutDir"]}",
    mode: 'copy',
    saveAs: {
        filename ->
        if(filename ==~ /log/) {
            "assembly.log"
        }
        else if(filename ==~ /scaffold(s|-level-2|)\.fa(sta)?/) {
            "scaffold.fa"
        }
        else{
            null //do not publish contig-max.fa or intermediate contigs yet, but use them for downstream processes
        }
    }
    )

    input:
    val settings
    path short_paired
    path short_single
    path long_reads
    val avg_len

    output:
    path "log"
    path "scaffold*.{fa,fasta}", optional:true 
    path "contig-max.fa", emit: contigs, optional:true
    path "{contig-*,*contigs.fa,K*/final_contigs.fasta}", emit: intContigs

    script:
    def avg_len = (avg_len as Float).trunc() as Integer
    def runFlag = ""
    if(short_paired.name != "NO_FILE" && short_single.name != "NO_FILE2") {
        runFlag = "-r $short_single --read_level_2 $short_paired "
    }
    else if(short_paired.name != "NO_FILE") {
        runFlag = "-r $short_paired "
    }
    else if(short_single.name != "NO_FILE2") {
        runFlag = "-r $short_single "
    }
    def longReadsFile = long_reads.name != "NO_FILE3" ? "-l $long_reads" : ""
    def maxK = 121
    def maxK_option = "--maxk $maxK "
    if (settings["idba"]["maxK"] == null || settings["idba"]["maxK"] > avg_len) {
        if(avg_len > 0 && avg_len <= 151) {
            maxK = avg_len - 1
            maxK_option = "--maxk ${avg_len - 1}"
        }
    }
    minK = settings["idba"]["minK"] != null ? "--mink ${settings["idba"]["minK"]} " : ""
    step = settings["idba"]["step"] != null ? "--step ${settings["idba"]["step"]} " : ""
    minLen = settings["minContigSize"] != null ? "--min_contig ${settings["minContigSize"]} " : ""

    """
    idba_ud --pre_correction -o . --num_threads ${task.cpus}\
    $runFlag\
    $longReadsFile\
    $maxK_option\
    $minK\
    $step\
    $minLen  &>idba.log || true

    mv contig-${maxK}.fa contig-max.fa
    cat idba.log >> log
    """

}

//prep for idba
process idbaExtractLong {
    label "assembly"
    label "tiny"

    input:
    path paired
    path unpaired

    output:
    path "short_paired.fa"
    path "short_single.fa"
    path "long.fa"

    script:
    def pair_file = paired.name != "NO_FILE" ? "-p $paired " : ""
    def unpaired_file = unpaired.name != "NO_FILE2" ? "-u $unpaired " : ""
    """
    extractLongReads.pl\
    $pair_file\
    $unpaired_file\
    -d .
    """
}

//prep for idba
process idbaPrepReads {
    label "assembly"
    label "tiny"
    input:
    path paired
    path unpaired

    output:
    path "pairedForAssembly.fasta", emit:idba_prep_paired, optional:true
    path "unpairedForAssembly.fasta", emit: idba_prep_unpaired, optional:true

    script:
    def pair_process = paired.name != "NO_FILE" ? "fq2fa --filter --merge ${paired[0]} ${paired[1]} pairedForAssembly.fasta;" : "" 
    def unpair_process = unpaired.name != "NO_FILE2" ? "fq2fa --filter $unpaired unpairedForAssembly.fasta;" : "" 
    
    """
    $pair_process
    $unpair_process
    """

}


//assemble using spades
process spades {
    label "assembly"
    label "small"

    publishDir (
    path: "${settings["assemblyOutDir"]}", 
    mode: 'copy',
    saveAs: {
        filename ->
        if(filename ==~ /spades\.log/) {
            "assembly.log"
        }
        else if(filename ==~ /scaffold(s|-level-2|)\.fa(sta)?/) {
            "scaffold.fa"
        }
        else if(filename ==~ /assembly_graph\.fastg/) {
            "${settings["projName"]}_contigs.fastg"
        }
        else if(filename ==~ /assembly_graph_with_scaffolds\.gfa/) {
            "assembly_graph_with_scaffolds.gfa"
        }
        else if(filename ==~ /(contigs|transcripts)\.fasta/) {
            null //do not publish contigs, but use downstream
        }
        else if(filename ==~ /((contig-.*)|(.*contigs\.fa)|(K.*\/final_contigs\.fasta))/) {
            null //do not publish intermediate contigs, but use downstream
        }
        else{
            filename
        }
    }
    )

    input:
    val settings
    path paired
    path unpaired
    path pacbio
    path nanopore

    output:
    path "scaffold*.{fa,fasta}", optional:true 
    path "spades.log" 
    path "contigs.paths"
    path "{contigs,transcripts}.fasta", emit:contigs, optional:true
    path "assembly_graph.fastg", optional:true
    path "assembly_graph_with_scaffolds.gfa", optional:true
    path "{contig-*,*contigs.fa,K*/final_contigs.fasta}", emit: intContigs


    script:
    def paired = paired.name != "NO_FILE" ? "--pe1-1 ${paired[0]} --pe1-2 ${paired[1]} " : ""
    def unpaired = unpaired.name != "NO_FILE2" ? "--s1 $unpaired " : ""
    def pacbio_file = pacbio.name != "NO_FILE3" ? "--pacbio $pacbio " : ""
    def nanopore_file = nanopore.name != "NO_FILE4" ? "--nanopore $nanopore " : ""
    if(settings["spades"]["algorithm"] == null){
        settings["spades"]["algorithm"] = ""
    }
    meta_flag = (paired != "" && settings["spades"]["algorithm"].startsWith("meta")) ? "--meta " : ""
    sc_flag = settings["spades"]["algorithm"].startsWith("MDA") ? "--sc " : ""
    rna_flag = settings["spades"]["algorithm"].startsWith("rnaSPAdes") ? "--rna " : ""
    plasmid_flag = settings["spades"]["algorithm"].startsWith("plasmid") ? "--plasmid " : ""
    bio_flag = settings["spades"]["algorithm"].startsWith("biosynthetic") ? "--bio " : ""
    corona_flag = settings["spades"]["algorithm"].startsWith("corona") ? "--corona " : ""
    metaviral_flag = settings["spades"]["algorithm"].startsWith("metaviral") ? "--metaviral " : ""
    metaplasmid_flag = settings["spades"]["algorithm"].startsWith("metaplasmid") ? "--metaplasmid " : ""
    rnaviral_flag = settings["spades"]["algorithm"].startsWith("rnaviral") ? "--rnaviral " : ""

    """
    spades.py -o . -t ${task.cpus}\
    $paired\
    $meta_flag\
    $sc_flag\
    $rna_flag\
    $plasmid_flag\
    $bio_flag\
    $corona_flag\
    $metaviral_flag\
    $metaplasmid_flag\
    $rnaviral_flag\
    $unpaired\
    $pacbio_file\
    $nanopore_file\
    """
}

//assemble using megahit
process megahit {
    label "assembly"
    label "small"

    publishDir(
    path: "${settings["assemblyOutDir"]}", 
    mode: 'copy',
    saveAs: {
        filename ->
        if(filename.equals("megahit/log")) {
            "assembly.log"
        }
        else if(filename ==~ /megahit\/scaffold(.*)\.fa(sta)?/) {
            "scaffold.fa"
        }
        else if(filename ==~ /megahit\/final\.contigs\.fa/) {
            null //don't publish, but pass to downstream "renameFilterFasta" process
        }
        else if(filename ==~ /megahit\/((contig-.*)|(.*contigs\.fa)|(K.*\/final_contigs\.fasta))/) {
            null //do not publish intermediate contigs, but use downstream
        }
        else{
            filename
        }
    }
    )

    input:
    val settings
    path paired
    path unpaired

    output:
    path "megahit/log"
    path "megahit/scaffold*.{fa,fasta}", optional:true //I don't believe this is a normal output of megahit, but just in case
    path "megahit/final.contigs.fa", emit: contigs, optional:true
    path "${settings["projName"]}_contigs.fastg"
    path "megahit/{contig-*,*contigs.fa,K*/final_contigs.fasta}", emit: intContigs

    script:
    def paired = paired.name != "NO_FILE" ? "-1 ${paired[0]} -2 ${paired[1]} " : ""
    def unpaired = unpaired.name != "NO_FILE2" ? "-r $unpaired " : ""
    def megahit_preset = settings["megahit"]["preset"] != null ? "--presets ${settings["megahit"]["preset"]} " : ""

    """
    megahit -o ./megahit -t ${task.cpus}\
    $megahit_preset\
    $paired\
    $unpaired\
    2>&1

    LARGESTKMER=\$(head -n 1 megahit/final.contigs.fa | perl -ne '/^>k(\\d+)\\_/; print \$1;')

    megahit_toolkit contig2fastg \$LARGESTKMER megahit/intermediate_contigs/k\${LARGESTKMER}.contigs.fa  > ${settings["projName"]}_contigs.fastg
    """

}


//assembly using unicycler
process unicycler {
    label "assembly"
    label "small"
    publishDir (
        path: "${settings["assemblyOutDir"]}", 
        mode: 'copy',
        saveAs: {
        filename ->
        if(filename ==~ /unicycler\.log/) {
            "assembly.log"
        }
        else if(filename ==~ /scaffold(s|-level-2|)\.fa(sta)?/) {
            "scaffold.fa"
        }
        else if(filename.equals("assembly.gfa")) {
            "${settings["projName"]}_contigs.fastg"
        }
        else if(filename ==~ /assembly\.fasta/) {
            null //don't publish, but emit for use in downstream process "renameFilterFasta"
        }
        else{
            filename
        }
    }
    )

    input:
    val settings
    path paired
    path unpaired
    path longreads //If present, expects filtered long reads.

    output:
    path "unicycler.log"
    path "scaffold*.{fa,fasta}", optional:true //I don't believe this is a normal output of unicycler, but just in case
    path "assembly.fasta", emit: contigs
    path "assembly.gfa", optional:true
    //path "{contig-*,*contigs.fa,K*/final_contigs.fasta}", emit: intContigs | not produced by unicycler

    script:
    def paired = paired.name != "NO_FILE" ? "-1 ${paired[0]} -2 ${paired[1]} " : ""
    def unpaired = unpaired.name != "NO_FILE2" ? "-r $unpaired " : ""
    def filt_lr = longreads.name != "NO_FILE3" ? "-l $longreads " : ""
    def bridge = settings["unicycler"]["bridgingMode"] != "normal" ? "--mode ${settings["unicycler"]["bridgingMode"]} " : "--mode normal"

    """
    export _JAVA_OPTIONS='-Xmx20G'; export TERM='xterm';

    unicycler -t ${task.cpus} -o .\
    $paired\
    $filt_lr\
    $bridge 2>&1 1>/dev/null
    """

}

//filter long reads for unicycler
process unicyclerPrep {
    label "assembly"
    label "tiny"

    input:
    val settings
    path longreads


    output:
    path "long_reads.fasta"

    script:

    """
    echo "Filter long reads with ${settings["unicycler"]["minLongReads"]} (bp) cutoff"
    seqtk seq -A -L \
    ${settings["unicycler"]["minLongReads"]} \
    $longreads > long_reads.fasta
    """
}


//assembly using lrasm
process lrasm {
    label "assembly"
    label "small"

    publishDir (
        path: "${settings["assemblyOutDir"]}", 
        mode: 'copy',
        saveAs: {
        filename ->
        if(filename ==~ /contigs\.log/) {
            "assembly.log"
        }
        else if(filename ==~ /scaffold(s|-level-2|)\.fa(sta)?/) {
            "scaffold.fa"
        }
        else if(filename.equals("Assembly/unitig.gfa")) {
            "${settings["projName"]}_contigs.fastg"
        }
        else if(filename.equals("Assembly/assembly_graph.gfa")) {
            "${settings["projName"]}_contigs.fastg"
        }
        else if(filename.equals("Assembly/assembly_graph.gv")) {
            "${settings["projName"]}_contigs.gv"
        }
        else if(filename.equals("Assembly/assembly_info.txt")) {
            "assembly_info.txt"
        }
        else if(filename ==~ /contigs\.fa/) {
            null //do not publish, but emit for use in downstream process "renameFilterFasta"
        }
        else if(filename ==~ /((contig-.*)|(.*contigs\.fa)|(K.*\/final_contigs\.fasta))/) {
            null //do not publish intermediate contigs, but use downstream
        }
        else{
            filename
        }
    }
    )

    input:
    val settings
    path unpaired

    output:
    path "contigs.log" 
    path "scaffold*.{fa,fasta}", optional:true //I don't believe this is a normal output of lrasm, but just in case
    path "contigs.fa", emit:contigs, optional:true
    path "Assembly/unitig.gfa", optional:true
    path "Assembly/assembly_graph.gfa", optional:true
    path "Assembly/assembly_graph.gv", optional:true
    path "Assembly/assembly_info.txt", optional:true
    path "{contig-*,*contigs.fa,K*/final_contigs.fasta}", emit: intContigs

    script:
    def consensus = settings["lrasm"]["numConsensus"] != null ? "-n ${settings["lrasm"]["numConsensus"]} ": ""
    def preset = settings["lrasm"]["preset"] != null ? "-x ${settings["lrasm"]["preset"]} " : ""
    def errorCorrection = (settings["lrasm"]["ec"] != null && settings["lrasm"]["ec"]) ? "-e " : ""
    def algorithm = settings["lrasm"]["algorithm"] != null ? "-a ${settings["lrasm"]["algorithm"]} " : ""
    def minLenOpt = ""
    if (settings["lrasm"]["algorithm"] == "miniasm") {
        minLenOpt = "--ao \'-s 400\' "
    }
    else if (settings["lrasm"]["algorithm"] == "wtdbg2") {
        minLenOpt = "--wo \'-L 400\' "
    }
    def flyeOpt = settings["lrasm"]["algorithm"] == "metaflye" ? "--fo '--meta' ": ""

    """
    lrasm -o . -t ${task.cpus} \
    $preset\
    $consensus\
    $errorCorrection\
    $algorithm\
    $minLenOpt\
    $flyeOpt\
    $unpaired\
    """
}

process renameFilterFasta {
    label "assembly"
    label "small"

    publishDir(
        path: "${settings["assemblyOutDir"]}",
        mode: 'copy'
    )
    input:
    val settings
    path contigs

    output:
    path "*_contigs.fa", emit: contigs
    path "*_contigs_*up.fa", emit: annotationContigs
    path "id_map.txt"

    script:
    """
    CONTIG_NUMBER=\$(grep -c '>' ${contigs})
    
    renameFilterFasta.pl \
    -u $contigs\
    -d .\
    -filt ${settings["minContigSize"]} \
    -maxseq \$CONTIG_NUMBER\
    -ann_size ${settings["contigSizeForAnnotation"]} \
    -n ${settings["projName"]} \
    -id 1 \
    -ann 1
    """

}

process bestIncompleteAssembly {
    label "assembly"
    label "tiny"
    input:

    val x
    path intContigs

    when:
    x == 'EMPTY'

    output:
    path "bestIntContig/*"

    shell:
    '''
    #!/usr/bin/env perl
    use Cwd;
    my $dir = getcwd;
    use Cwd 'abs_path';
    my @intermediate_contigs = sort { -M $a <=> -M $b} glob("!{intContigs}");
    my $best_int = $dir . "/" . $intermediate_contigs[0];
    mkdir bestIntContig;
    system("cp $best_int ./bestIntContig");
    '''

}

process assembly_vis {
    label "assembly"
    label "tiny"

    publishDir(
        path: "${settings["assemblyOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path contigs

    output:
    path "stats/assembly_stats_report.html" , emit: stats_html
    path "stats/assembly_stats_report.txt" , emit: stats_txt

    script:
    """
    set -euo pipefail
    metaquast.py --version > version.txt
    metaquast.py -o ./stats -m ${settings["minContigSize"]} --no-icarus --max-ref-number 0 ${contigs}
    if [ -f ./stats/report.html ]; then
        sed -e 's/.top-panel {/.top-panel {\\n display:none;/' ./stats/report.html > ./stats/assembly_stats_report.html
        mv ./stats/report.txt ./stats/assembly_stats_report.txt
    else
        ERR_MSG="MetaQUAST failed to generate report. Please check the input contigs file. Contigs should >= ${settings["minContigSize"]} bp for the report"
        echo "\$ERR_MSG" > stats/assembly_stats_report.html
        echo "\$ERR_MSG" > stats/assembly_stats_report.txt
    fi
    """
}
//main workflow logic
workflow ASSEMBLY {
    take:
    settings
    paired
    unpaired
    avgLen

    main:

    //supplementary long read files setup
    spades_pb = file(settings["spades"]["pacbio"], checkIfExists:true)
    spades_np = file(settings["spades"]["nanopore"], checkIfExists:true)
    unicycler_lr = file(settings["unicycler"]["longreads"], checkIfExists:true)


    //output channel setup
    outContigs = channel.empty()
    annotationContigs = channel.empty()

    if (settings["assembler"].equalsIgnoreCase("IDBA_UD")) {

        //input prep
        idbaPrepReads(paired, unpaired)
        c1 = idbaPrepReads.out.idba_prep_paired.ifEmpty({file("${projectDir}/nf_assets/NO_FILE")})
        c2 = idbaPrepReads.out.idba_prep_unpaired.ifEmpty({file("${projectDir}/nf_assets/NO_FILE2")})
        (sp,su,l) = idbaExtractLong(c1,c2)

        //assembly
        idbaUD(settings, sp.filter{ it.size()>0 }.ifEmpty({file("${projectDir}/nf_assets/NO_FILE")}),
            su.filter{ it.size()>0 }.ifEmpty({file("${projectDir}/nf_assets/NO_FILE2")}),
            l.filter{ it.size()>0 }.ifEmpty({file("${projectDir}/nf_assets/NO_FILE3")}),
            avgLen)
        
        //grab best assembly if full process failed
        bestIncompleteAssembly(idbaUD.out.contigs.ifEmpty('EMPTY'), idbaUD.out.intContigs)

        //output formatting and setup (published and channel outputs)
        renameFilterFasta(settings, idbaUD.out.contigs.concat(bestIncompleteAssembly.out).first())
        outContigs = renameFilterFasta.out.contigs
        annotationContigs = renameFilterFasta.out.annotationContigs

    }
    else if (settings["assembler"].equalsIgnoreCase("SPAdes")) {
        //assembly
        spades(settings, paired, unpaired, spades_pb, spades_np)
        
        //grab best assembly if full process failed
        bestIncompleteAssembly(spades.out.contigs.ifEmpty('EMPTY'), spades.out.intContigs)

        //output formatting and setup (published and channel outputs)
        renameFilterFasta(settings, spades.out.contigs.concat(bestIncompleteAssembly.out).first())
        outContigs = renameFilterFasta.out.contigs
        annotationContigs = renameFilterFasta.out.annotationContigs
    }
    else if (settings["assembler"].equalsIgnoreCase("MEGAHIT")) {
        //assembly
        megahit(settings, paired, unpaired)
        //grab best assembly if full process failed
        bestIncompleteAssembly(megahit.out.contigs.ifEmpty('EMPTY'), megahit.out.intContigs)
        //output formatting and setup (published and channel outputs)
        renameFilterFasta(settings, megahit.out.contigs.concat(bestIncompleteAssembly.out).first())
        outContigs = renameFilterFasta.out.contigs
        annotationContigs = renameFilterFasta.out.annotationContigs
    }
    else if (settings["assembler"].equalsIgnoreCase("UniCycler")) {
        //if supplemental long reads file present
        if (settings["unicycler"]["longreads"] != "nf_assets/NO_FILE3") {
            //assembly, including prep for long reads
            unicycler(
                settings,
                paired,
                unpaired,
                unicyclerPrep(settings,unicycler_lr).filter{it.size()>0}.ifEmpty({file("${projectDir}/nf_assets/NO_FILE3")})
                )
            //unicycler produces no intermediate contigs, we let it error out above rather than try to rescue a failed assembly
            renameFilterFasta(settings, unicycler.out.contigs)
            //output formatting and setup (published and channel outputs)
            outContigs = renameFilterFasta.out.contigs
            annotationContigs = renameFilterFasta.out.annotationContigs
        }
        else {
            //assembly with optional input pattern for unprovided long reads file
            unicycler(settings, paired, unpaired, unicycler_lr)
            //output formatting and setup (published and channel outputs)
            renameFilterFasta(settings, unicycler.out.contigs)
            outContigs = renameFilterFasta.out.contigs
            annotationContigs = renameFilterFasta.out.annotationContigs
        }
    }
    else if (settings["assembler"].equalsIgnoreCase("LRASM")) {
        //assembly
        lrasm(settings, unpaired)
        //grab best assembly if full process failed
        bestIncompleteAssembly(lrasm.out.contigs.ifEmpty('EMPTY'), lrasm.out.intContigs)
        //output formatting and setup (published and channel outputs)
        renameFilterFasta(settings, lrasm.out.contigs.concat(bestIncompleteAssembly.out).first())
        outContigs = renameFilterFasta.out.contigs
        annotationContigs = renameFilterFasta.out.annotationContigs
    }
    else {
        error "Invalid assembler: ${settings["assembler"]}"
    }

    //assembly visualization
    assembly_vis(settings, outContigs)

    emit:
    outContigs
    annotationContigs

}