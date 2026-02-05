#!/usr/bin/env nextflow

//André Watson
//2025

//checks reference genome format, aligns input to reference, and generates consensus sequence if desired
process referenceBasedPipeline {
    label "r2g"
    label "medium"
    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path reference
    val platform
    path paired
    path unpaired

    output:
    path "*"
    path "readsToRef.gaps", emit: gaps
    path "readsToRef.vcf", optional:true, emit: vcf
    path "*.sort.bam", emit: bam
    path "reference.gff", optional:true, emit:gff
    path "*consensus.changelog", optional:true, emit:consensusLogs
    path "*consensus.gaps", optional:true, emit:consensusGaps

    script:
    def taxKingdom = settings["taxKingdom"] != null ? "-kingdom ${settings["taxKingdom"]}" : ""
    def pairedFiles = paired.name != "NO_FILE" ? "-p \"$paired\"" : ""
    def unpairedFiles = unpaired.name != "NO_FILE2" ? "-u $unpaired" : ""
    def platformArg = platform != null ? "-plat $platform" : ""
    def alnOptions = settings["r2gAlignerOptions"] != "" ? "-alnOpt ${settings["r2gAlignerOptions"]}" : ""
    def minMapQual = settings["r2gMinMapQual"] != null ? "-minmap ${settings["r2gMinMapQual"]}" : ""
    def maxClip = settings["r2gMaxClip"] != null ? "-maxclip ${settings["r2gMaxClip"]}" : ""
    def extractMapped = settings["r2gExtractMapped"] != false ? "-x-mapped ${settings["r2gExtractMapped"]}" : "" 
    
    //variant call configurations
    def variantCall = settings["r2gVariantCall"] != false ? "-vc 1" : ""
    def vcQual = settings["r2gVariantCallMinQual"] != null ? "-vc-qual ${settings["r2gVariantCallMinQual"]}" : ""
    def vcPloidy = settings["r2gVariantCallPloidy"] != null ? "-vc-ploidy ${settings["r2gVariantCallPloidy"]}" : ""
    

    //consensus sequence configurations
    def doConsensus = settings["r2gGetConsensus"] != false ? "-consensus 1" : ""
    def consensusMapQual = settings["r2gConsensusMinMapQual"] != null ? "-c-mapq ${settings["r2gConsensusMinMapQual"]}" : ""
    def consensusMinCov = settings["r2gConsensusMinCov"] != null ? "-c-mincov ${settings["r2gConsensusMinCov"]}" : ""
    def consensusMaxCov = settings["r2gConsensusMaxCov"] != null ? "-c-maxcov ${settings["r2gConsensusMaxCov"]}" : ""
    def consensusAltProp = settings["r2gConsensusAltProp"] != null ? "-c-altprop ${settings["r2gConsensusAltProp"]}" : ""
    def consensusAltIndelProp = settings["r2gConsensusAltIndelProp"] != null ? "-c-indelprop ${settings["r2gConsensusAltProp"]}" : ""
    def consensusMinBaseQual = settings["r2gConsensusMinBaseQ"] != null ? "-c-baseq ${settings["r2gConsensusMinBaseQ"]}" : ""
    def consensusDisableBAQ = settings["r2gConsensusDisableBAQ"] != false ? "-c-baq 0" : ""
    def consensusPCRdedup = settings["r2gConsensusPCRdedup"] != false ? "-c-dedup 1" : "" 
    def consensusHomopolymerFilt = settings["r2gConsensusHomopolymerFilt"] != false ? "-c-polymer 1" : ""
    def consensusStrandBiasFilt = settings["r2gConsensusStrandBiasFilt"] != false ? "-c-sb 1" : ""
    def consensusVarlogOpt = settings["r2gConsensusVarlogOpt"] != false ? "-c-varlog 1" : ""
    def consensusCompOpt = settings["r2gConsensusCompOpt"] != false ? "-c-compopt 1" : ""

    """
    ref_pipeline.pl -ref $reference \
    $pairedFiles \
    $unpairedFiles \
    -t ${task.cpus} \
    -proj ${settings["projName"]} \
    -out \$PWD \
    $taxKingdom \
    $platformArg \
    -aln ${settings["r2gAligner"].toLowerCase()} \
    $alnOptions \
    $minMapQual \
    $maxClip \
    $variantCall \
    $vcQual \
    $vcPloidy \
    $extractMapped \
    $doConsensus \
    $consensusMapQual \
    $consensusMinCov \
    $consensusMaxCov \
    $consensusAltProp \
    $consensusMinBaseQual \
    $consensusAltIndelProp \
    $consensusMinBaseQual \
    $consensusDisableBAQ \
    $consensusPCRdedup \
    $consensusHomopolymerFilt \
    $consensusStrandBiasFilt \
    $consensusVarlogOpt \
    $consensusCompOpt 
    """

    
}

//extracts reads that were unmapped to reference
process retrieveUnmappedReads {
    label "r2g"
    label "small"

    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path reference
    path paired
    path bams //staged into workdir for retrieve_unmapped.pl

    output:
    stdout emit: count
    path "singleEnd.fastq", emit: singleUnmapped, optional: true
    path "pairedEnd.*.fastq", emit: pairedUnmapped, optional: true
    

    script:
    def pairedFiles =  paired.name != "NO_FILE" ? "-paired" : ""

    """
    mkdir UnmappedReads
    retrieve_unmapped.pl \
    -ref $reference \
    $pairedFiles
    """

}

//attempts to map unmapped reads to RefSeq
process mapUnmapped {
    label "r2g"
    label "medium"
    
    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )

    containerOptions "--bind=${settings["refDB"].take(settings["refDB"].lastIndexOf('/'))}:/venv/database "
    input:
    val settings
    path unmappedPaired
    path unmappedUnpaired
    val count
    val platform

    when:
    !count.contains("Total Unmapped:0")

    output:
    
    script:
    def ontFlag = (platform != null && platform.contains("NANOPORE")) ?  "-x ont2d -T ${settings["minLen"] != null ? settings["minLen"] : 50} " : ""
    def pbFlag =  (platform != null && platform.contains("PACBIO")) ? "-x pacbio -T ${settings["minLen"] != null ? settings["minLen"] : 50} " : ""
    def pairedFiles = unmappedPaired.name != "NO_FILE" ? "-p \"$unmappedPaired\"" : ""
    def unpairedFiles = unmappedUnpaired.name != "NO_FILE2" ? "-u $unmappedUnpaired" : ""
    def maxClip = settings["r2gMaxClip"] != null ? "-max_clip ${settings["r2gMaxClip"]}" : ""

    """
    runReadsToContig.pl \
    -c 0 \
    -cpu ${task.cpus} \
    $pairedFiles \
    $unpairedFiles \
    $maxClip \
    -bwa_options \'${ontFlag}${pbFlag}\' \
    -d . -pre UnmappedReads -ref /venv/database/${settings["refDB"].drop(settings["refDB"].lastIndexOf('/'))} \
    &>mapping.log

    id_mapping_w_gi.pl UnmappedReads_coverage.table reads > UnmappedReads_coverage.txt
    """
}

//if contigs were provided or assembled, align them to the reference
process contigToGenome {
    label "r2g"
    label "medium"

    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path reference
    path contigs

    when:
    !contigs.name.endsWith("NO_FILE3")

    output:    
    path "*_query_novel_region_30bpUP.fasta", emit: unusedContig
    path "*.snps", emit: contigSNPindel
    path "*_ref_zero_cov_coord.txt", emit: contigGaps
    script:
    """
    nucmer_genome_coverage.pl -d -e 1 \
    -i ${settings["identity"]} \
    -p contigsToRef \
    $reference \
    $contigs
    """
}

//attempt taxonomic classification of contigs not mapping to the reference
process mapContigs {
    label "cta"
    label "medium"
    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )

    containerOptions "--bind=${settings["contigRefDB"]}:/venv/database "
    input:
    val settings
    path contigs

    output:
    script:
    """
    miccr.py -x asm10 -d /venv/database/NCBI-Bacteria-Virus.fna.mmi -t ${task.cpus} -p UnmappedContigs -i $contigs &>log.txt
    get_unclassified_fasta.pl -in $contigs -classified UnmappedContigs.lca_ctg.tsv -output "" -log log.txt
    """
}


//variant calling process
process variantCalling {
    label "r2g"
    label "medium"

    publishDir(
        path: "${settings["refBasedOutDir"]}",
        mode: 'copy'
    )
    
    input:
    val settings
    path contigSNPindel
    path contigGaps
    path readsVCF
    path readsGaps
    path readsGFF
    path consensusLogs
    path consensusGaps
    path reference

    output:
    path "*" //all non-hidden outputs

    script:
    def consensusLogArg = consensusLogs.name != "DNE6" ? "-cons_logs $consensusLogs" : ""
    def consensusGapArg = consensusGaps.name != "DNE7" ? "-cons_gaps $consensusGaps" : ""

    """
    variant_call.pl \
    -ref $reference \
    -c_gap $contigGaps \
    -c_indel $contigSNPindel \
    -r_gap $readsGaps \
    -r_vcf $readsVCF \
    -gff $readsGFF \
    -proj_name ${settings["projName"]} \
    $consensusLogArg \
    $consensusGapArg
    """
}

//retrieve reference genomes selected from EDGE UI rather than uploaded
process retrieveNCBIgenomes {
    label 'tiny'
    label 'r2g'
    containerOptions "--bind=${settings["genomeLocation"]}:/venv/database "

    input:
    val settings
    val reference

    output:
    path "*.{gbff,gbk}", emit: foundGenomes
    
    script:
    """
    for f in `find /venv/database/${reference} -name "*.gbff" -o -name "*.gbk"`; do
        cp \$f \$PWD/`basename \$f`
    done
    """
}

workflow REFERENCEBASEDANALYSIS {

    take:
    settings
    platform
    paired
    unpaired
    contigs

    main:
    reference = channel.empty()
    if(settings["selectGenomes"].size() > 0 ) {
        retrieveNCBIgenomes(settings, channel.from(settings["selectGenomes"]))
        reference = reference.concat(retrieveNCBIgenomes.out.foundGenomes)
    }

    if(settings["referenceGenomes"].size() > 0) {
        reference = reference.concat(channel.fromPath(settings["referenceGenomes"], checkIfExists: true))
    }

    referenceBasedPipeline(settings, reference.collect(), platform, paired, unpaired)

    //retrieve unmapped READS if mapping or just extracting
    if((settings["r2gMapUnmapped"].toBoolean())|| (settings["r2gExtractUnmapped"].toBoolean())) {
        retrieveUnmappedReads(settings, reference, paired, referenceBasedPipeline.out.bam)
        if(settings["r2gMapUnmapped"]) {
            //map unmapped reads to RefSeq 
            mapUnmapped(settings, 
                retrieveUnmappedReads.out.pairedUnmapped.ifEmpty(["${projectDir}/nf_assets/NO_FILE"]),  
                retrieveUnmappedReads.out.singleUnmapped.ifEmpty("${projectDir}/nf_assets/NO_FILE2"), 
                retrieveUnmappedReads.out.count,
                platform)
        }
    }
    contigToGenome(settings, reference, contigs)
    if(settings["mapUnmappedContigs"].toBoolean()) {
        //map unmapped CONTIGS to RefSeq using miccr if the option is set
        mapContigs(settings, contigToGenome.out.unusedContig)
    }
    if(settings["r2gVariantCall"].toBoolean()) {
        variantCalling(settings, 
            contigToGenome.out.contigSNPindel.ifEmpty(file("DNE")),
            contigToGenome.out.contigGaps.ifEmpty(file("DNE2")),
            referenceBasedPipeline.out.vcf.ifEmpty(file("DNE3")),
            referenceBasedPipeline.out.gaps.ifEmpty(file("DNE4")),
            referenceBasedPipeline.out.gff.ifEmpty(file("DNE5")),
            referenceBasedPipeline.out.consensusLogs.ifEmpty(file("DNE6")),
            referenceBasedPipeline.out.consensusGaps.ifEmpty(file("DNE7")),
            reference)
    }

}
