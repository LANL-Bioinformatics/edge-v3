#!/usr/bin/env nextflow


process phageFinderPrep {
    label 'phageFinder'
    label 'tiny'

    input:
    path gff
    path fna

    output:
    path "id_map.txt", emit:idMap //separate output declaration for post-PF processing
    path "*", emit:allPFoutput //all output files will go into the next process


    script:
    """
    phageFinder_prepare.pl -o . $gff $fna
    """
} 

process phageFinder {
    label 'phageFinder'
    label 'small'
    publishDir(
        path: "${settings["phageFinderOutDir"]}",
        mode: 'copy',
        pattern: "log.txt"
    )

    input:
    path prepOut
    path faa, stageAs: "Assembly.pep"
    val settings

    output:
    path "PFPR_tab.txt", emit: phageTable
    path "log.txt"

    //must be on PATH
    script:
    """
    phage_finder_v2.1.sh Assembly ${task.cpus} 1>log.txt 2>&1
    """

}

process summary {
    label 'phageFinder'
    label 'tiny'
    publishDir(
        path: "${settings["phageFinderOutDir"]}",
        mode: 'copy'
    )

    input:
    path idMap
    path pfprTab
    val settings

    output:
    path "phageFinder_summary.txt"

    script:
    """
    phageFinder_summary.pl -t $pfprTab -i $idMap
    """
}


workflow PHAGEFINDER {
    take:
    settings
    gff
    faa
    fna
    
    main:

    phageFinderPrep(gff, fna)
    phageFinder(phageFinderPrep.out.allPFoutput, faa, settings)
    summary(phageFinderPrep.out.idMap,phageFinder.out.phageTable, settings)

}