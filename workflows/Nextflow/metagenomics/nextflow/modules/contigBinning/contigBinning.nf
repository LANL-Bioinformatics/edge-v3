process runBinning {
    label 'binning'
    label 'small'
    publishDir(
        path: "${settings["binningOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path contigs
    path abundances

    output:
    path "${settings["projName"]}_bin*", emit:binDir //output binning directory
    path "${settings["projName"]}_bin.summary", emit: binSummary

    script:
    """
    mkdir ./Binning

    run_MaxBin.pl \
    -contig $contigs \
    -out ${settings['projName']}_bin \
    -abund $abundances -thread ${task.cpus} \
    -plotmarker -min_contig_length ${settings["binningMinLength"]} \
    -max_iteration ${settings["binningMaxItr"]} \
    -prob_threshold ${settings["binningProb"]} \
    -markerset ${settings["binningMarkerSet"]}
    """
}

process checkM {
    label 'binning'
    containerOptions "--bind=${settings["checkMdb"]}:/venv/checkM --env \"CHECKM_DATA_PATH=/venv/checkM\""
    input:
    val settings
    path summary
    path binDir

    output:

    script:
    """
    checkm lineage_wf --tmpdir . -q --tab_table \
    -e 1e-10 \
    -l 0.7 \
    -f $summary \
    -t ${task.cpus} \
    -x fasta $binDir . 1>CheckM_log.txt 2>&1
    """
}


workflow BINNING {
    take:
    settings
    contigs
    abundances


    main:
    
    runBinning(settings, contigs, abundances)
    if(settings["doCheckM"]) {
        checkM(settings, runBinning.out.binSummary, runBinning.out.binDir)
    }

}