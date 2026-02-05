#!/usr/bin/env nextflow


//double-checks that any provided adapter file is in FASTA format
process adapterFileCheck {
    label "qc"
    input:
    path adapterFile

    output:
    stdout

    script:
    """
    isFasta.pl $adapterFile
    """
}

//main QC process. puts parameters together and runs FaQCs.
process qc {
    label "qc"
    label "small"
    publishDir(
        path: "${settings["qcOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    val platform
    path paired
    path unpaired
    val validAdapter
    path adapter
    val avgLen

    output:
    path "QC.{1,2}.trimmed.fastq", optional:true, emit: pairedQC
    path "QC.unpaired.trimmed.fastq", optional:true, emit: unpairedQC
    path "QC_qc_report.pdf", optional: true, emit: qcReport
    path "QC.stats.txt", optional: true, emit: qcStatsTxt
    path "QC.*.{txt,matrix}", optional: true, emit: qcStats
    path "QC.log", emit: log
    path "qa*.{txt,matrix}",optional: true, emit: qaStats

    script:
    //adjust minLength
    min = settings["minLen"]
    if(settings["minLen"] < 1) {
        min = Math.abs(settings["minLen"] * avgLen.toInteger())
    }

    def qcSoftware = "FaQCs"
    if(platform != null && (platform.contains("PACBIO") || platform.contains("NANOPORE"))) {
        qcSoftware = "illumina_fastq_QC.pl"
    }
    def pairedArg = paired[0].name != "NO_FILE" ? "-1 ${paired[0]} -2 ${paired[1]}" : ""
    if(pairedArg != "" && platform != null && (platform.contains("PACBIO") || platform.contains("NANOPORE"))) {
        pairedArg = "-p $paired"
    }
    def unpairedArg = unpaired.name != "NO_FILE2" ? "-u $unpaired" : ""

    def adapterArg = ""
    if(adapter.name != "NO_FILE3" && validAdapter == "Yes"){
        adapterArg = "--adapter --artifactFile $adapter"
    } 

    filesforhtmlreport = settings["htmlreport"] ? "--debug" : ""
    polyA = settings["trimPolyA"] ? "--polyA" : ""
    phiX = settings["filtPhiX"] ? "--phiX" : ""

    def trim = ""
    if(platform != null && (platform.contains("PACBIO") || platform.contains("NANOPORE"))) {
        trim = "--trim_only"
    }

    """
    $qcSoftware $pairedArg $unpairedArg \
    -q ${settings["trimQual"]} --min_L $min --avg_q ${settings["avgQual"]} \
    -n ${settings["numN"]} --lc ${settings["filtLC"]} --5end ${settings["trim5end"]} --3end ${settings["trim3end"]} \
    --split_size 1000000  -d . -t ${task.cpus} \
    $polyA \
    $trim \
    $adapterArg \
    $phiX \
    $filesforhtmlreport \
    1>QC.log 2>&1
    """
}

process nanoplot {
    label "qc"
    label "small"

    publishDir(
        path: "${settings["qcOutDir"]}",
        mode: 'copy'
    )
    input:
    val settings
    val platform
    path unpaired

    output:
    path "*" //lots of output plots

    when:
    platform != null && platform.contains("NANOPORE")

    script:
    """
    NanoPlot --fastq $unpaired --N50 --loglength -t ${task.cpus} -f pdf --outdir . 2>/dev/null
    """

}

//Porechop for removing adapters from ONT or PacBio reads
process porechop {
    label "qc"
    label "small"
    publishDir(
        path: "${settings["qcOutDir"]}",
        mode: 'copy'
    )


    input:
    val settings
    val platform
    path trimmed
    path log

    output:
    path "*.porechop.fastq", emit: porechopped

    when:
    platform != null && platform.contains("NANOPORE")
    
    script:
    """
    porechop -i $trimmed -o ./QC.unpaired.porechop.fastq -t ${task.cpus} > $log
    """
}

process jsonQCstats {
    label "qc"
    label "tiny"

    publishDir(
        path: "${settings["qcOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path stats 
    path qaStats 

    output:
    path "QC.stats.json", emit: qcStatsJson
    path "QC_summary_plots.html", emit: qcSummaryHtml
    path "QC_final_report.html", emit: qcFinalReportHtml

    script:
    def statsTXTfile = (stats instanceof List) ? stats.find { it.name == "QC.stats.txt" } : stats
    """
    statsToJSON.py --trim5 ${settings["trim5end"]} --json_out ./QC.stats.json --html_out ./QC_summary_plots.html $statsTXTfile 
    """
}

workflow FAQCS {
    take:
    settings
    platform
    paired
    unpaired
    avgLen


    main:
 
    //adapter setup
    adapter_ch = channel.fromPath(settings["artifactFile"], checkIfExists:true)
    //checks to see if the provided adapter file is a valid FASTA
    adapterFileCheck(adapter_ch)

    //main QC process
    qc(settings, platform, paired, unpaired, adapterFileCheck.out, adapter_ch, avgLen)

    //make JSON file from QC stats
    jsonQCstats(settings, qc.out.qcStats, qc.out.qaStats)

    //run porechop and nanoplot if fastq source is nanopore
    porechop(settings, platform, qc.out.unpairedQC, qc.out.log)
    nanoplot(settings, platform, porechop.out.porechopped)
    

    paired = qc.out.pairedQC
    unpaired = qc.out.unpairedQC
    qcReport = qc.out.qcReport
    qcStats = qc.out.qcStatsTxt
    
    emit:
    paired
    unpaired
    qcReport
    qcStats

}