#!/usr/bin/env nextflow

//André Watson
//apwat@lanl.gov
//2025

include {PHYLOSRA} from '../sra2fastq/sra2fastq.nf' 

//prepares control file for phame and runs it with the specified options
process prepareSNPphylogeny {
    debug true
    label 'phyl'
    containerOptions "--bind=${settings["snpDBbase"]}:/venv/bin/database"

    publishDir(
        path: "${settings["phylogenyOutDir"]}",
        mode: 'copy',
        saveAs: {
            filename ->
            if(filename.startsWith("results/tables/${settings["projName"]}")) {
                filename.drop(15)
            }
            else if(filename.startsWith("results/alignments/${settings["projName"]}")) {
                filename.drop(19)
            }
            else if(filename.endsWith(".fasttree")) {
                null
            }
            else {
                null
            }
        }
    )

    input:
    val settings
    path paired
    path unpaired
    path contigs
    path sraPaired //these just need staging into this work directory and phame will pick them up
    path sraUnpaired //these just need staging into this work directory and phame will pick them up

    output:
    path "results/trees/{*all.fasttree,RAxML_bestTree.*_all}", emit: allTree
    path "results/trees/{*cds.fasttree,RAxML_bestTree.*_cds}", emit:cdsTree
    path "results/alignments/${settings["projName"]}_*", optional: true
    path "results/tables/${settings["projName"]}_*", optional:true
    path "results/RaXML_*", optional: true
    path "results/trees/RAxML_bipartitions.*_all_best", emit: bootstrapTree, optional: true
    path "annotation.txt", emit: phyloAnn

    script:

    def kingdom = settings["taxKingdom"] != null ? "-kingdom ${settings["taxKingdom"]}" : ""
    def bootstrap = settings["phameBootstrap"] != false ? "-bootstrap -bootstrap_n ${settings["phameBootstrapNum"]}" : ""
    def db = settings["snpDBname"] != null ? "-db ${settings["snpDBname"]}" : ""
    def genomeNames = settings["snpGenomes"].size() != 0 ? "-genomesList ${settings["snpGenomes"].join(",")}" : ""
    def genomeFiles = settings["snpGenomesFiles"].size() != 0 ? "-genomesFiles ${settings["snpGenomesFiles"].join(",")}" : ""
    reference = settings["snpRefGenome"] != null ? "-reference ${settings["snpRefGenome"]}" : ""
    if(settings["snpRefGenome"].equalsIgnoreCase("random")) {
        randomOrderGenomes = settings["snpGenomesFiles"].plus(settings["snpGenomes"])
        randomOrderGenomes.shuffle()
        reference = "-reference ${randomOrderGenomes[0]}"
    }
    def pair = paired.name != "NO_FILE" ? "-p $paired" : ""
    def single = unpaired.name != "NO_FILE2" ? "-s $unpaired" : ""
    def contig = contigs.name != "NO_FILE3" ? "-c $contigs" : ""
    def lr = (settings["fastqSource"] != null && (settings["fastqSource"].equalsIgnoreCase("nanopore") || settings["fastqSource"].equalsIgnoreCase("pacbio"))) ? "-nanopore" : ""

    """
    prepare_SNP_phylogeny.pl \
    -o . \
    -n ${settings["projName"]} \
    -tree ${settings["treeMaker"]} \
    -cpu ${task.cpus} \
    -kingdom ${settings["taxKingdom"]} \
    -map "/venv/bin/database/SNPdb/reference.txt" \
    -bwa_id_map "/venv/bin/database/bwa_index/id_mapping.txt"\
    -bwa_genome_index "/venv/bin/database/bwa_index/NCBI-Bacteria-Virus.fna" \
    $bootstrap \
    $db \
    -db_path "/venv/bin/database" \
    $genomeNames \
    $genomeFiles \
    $reference \
    $pair \
    $contig \
    $single \
    $lr >> log.txt

    phame phame.ctrl 1>> log.txt 2>&1
    """

}

//converts .nwk-format phylogeny to XML format
process prepareXMLphylogeny {
    label 'phyl'
    
    publishDir(
        path: "${settings["phylogenyOutDir"]}",
        mode: 'copy',
        saveAs: {
            filename ->
            if(filename.endsWith("_cds.fasttree.nwk") || filename.endsWith("cds.nwk")) {
                "SNPphyloTree.cds.nwk"
            }
            else if(filename.endsWith("_cds.fasttree.xml") || filename.endsWith("cds.xml")) {
                "SNPphyloTree.cds.xml"
            }
            else if(filename.endsWith("fasttree.nwk")|| filename.endsWith("all.nwk")) {
                "SNPphyloTree.all.nwk"
            }
            else if(filename.endsWith("fasttree.xml")|| filename.endsWith("all.xml")) {
                "SNPphyloTree.all.xml"
            }
        }
    )

    input:
    val settings
    each path(tree)
    path ann

    output:
    path "*.nwk", emit: nwk
    path "*.xml"

    script:
    """
    newickToPhyloXML.pl -m -i  \
    $tree -o . \
    $ann
    """
}

process visualizePhylogenyHTML {
    label 'phyl'

    publishDir(
        path: "${settings["phylogenyOutDir"]}",
        mode: 'copy',
        saveAs: {
            filename ->
            if(filename.endsWith("_cds.fasttree.html") || filename.endsWith("cds.html")) {
                "SNPphyloTree.cds.html"
            }
            else if(filename.endsWith("fasttree.html")|| filename.endsWith("all.html")) {
                "SNPphyloTree.all.html"
            }
        }
    )

    input:
    val settings
    path treeFiles

    output:
    path "*.html", emit: treeHTML

    script:
    def outName = treeFiles.name.replaceAll(/\.nwk$/, ".html")
    """
    phylocanvas_tree_with_controls.py "${treeFiles}" "${outName}"
    """
}


//Workflow for phylogenetic analysis
//takes: parameters, channel of paired-end read files, channel of single-end read files, channel of a contig file 
//Needs at least one of the reads/contig channels as input.
workflow PHYLOGENETICANALYSIS {

    take:
    settings
    paired
    unpaired
    contigs

    main:
    //get sra downloads
    sraPaired = channel.empty()
    sraSingle = channel.empty()
    if(settings["phylAccessions"].size() != 0) {
        PHYLOSRA(settings)
        sraPaired = PHYLOSRA.out.paired
        sraSingle = PHYLOSRA.out.unpaired
    }
    //prepare phame control file and run phame
    prepareSNPphylogeny(settings,paired,unpaired,contigs, sraPaired.ifEmpty("${projectDir}/nf_assets/NO_FILE4"), sraSingle.ifEmpty("${projectDir}/nf_assets/NO_FILE5"))

    //prepare and format output
    resultTree = prepareSNPphylogeny.out.bootstrapTree.concat(prepareSNPphylogeny.out.allTree).first()
    if(settings["snpRefGenome"] != null || (settings["snpDBname"] != null && !(settings["snpDBname"]).equalsIgnoreCase("hantavirus"))) {
        resultTree = resultTree.concat(prepareSNPphylogeny.out.cdsTree)
    }
    prepareXMLphylogeny(settings,
                        resultTree,
                        prepareSNPphylogeny.out.phyloAnn)

    visualizePhylogenyHTML(settings, prepareXMLphylogeny.out.nwk)

}