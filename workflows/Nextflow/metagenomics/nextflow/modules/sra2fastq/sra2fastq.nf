#!/usr/bin/env nextflow
//to run: nextflow run sra2fastq.nf -params-file [JSON parameter file]
//not supporting filesize or run count restrictions


//André Watson
//apwat@lanl.gov
//2024


//
process sraDownload {
    label "sra2fastq"
    label "small"
    tag "$accession"
    publishDir "${settings["sra2fastqOutDir"]}", mode: 'copy'
    containerOptions "--no-home"

    //retries download in case of transient failure, then completes any downloads that didn't fail

    maxRetries 3
    errorStrategy { (task.attempt <= maxRetries) ? 'retry' : 'finish' }

    input: 

    val accession //single accession string
    val settings

    output:
    path "$accession/${accession}.fastq.gz", emit: unpaired, optional:true
    path "$accession/${accession}_{1,2}.fastq.gz", emit: paired, optional:true
    path "$accession/${accession}_metadata.txt", emit: metadata
    path "$accession/sra2fastq_temp/*", optional: true //needed output?

    script: 

    //invoke sra2fastq.py
    //set vdb-config cache to work directory to avoid running out of space in container
    """
    vdb-config -s /repository/user/main/public/root="\$PWD"
    sra2fastq.py $accession \
    --clean True
    """
}

//Searches an SRA download metadata file for Illumina/ONT/PacBio sequencing platforms
//Explicitly searches for platform names because metadata fields are space-separated
process getPlatforms {
    label "sra2fastq"
    label "tiny"

    input:
    path metadata
    output:
    stdout
    script:
    """
    grep -o -e "ILLUMINA" -e "PACBIO_SMRT" -e "OXFORD_NANOPORE" $metadata | tr -d "\n"
    """
}

//For SRA accessions provided as pipeline input, raises an error if multiple unique sequencing platforms are specified
process checkDistinctPlatforms {
    label "tiny"
    input:
    val platforms
    output:
    stdout
    script:
    if(platforms.size() > 1) {
        error "Please only specify SRA accessions that use the same sequencing platform.\nPlatforms detected: ${platforms}"
    } 
    """
    echo -n ${platforms[0]}
    """
}

//SRA download workflow.
//takes: parameters
//emits: channel of paired-end FASTQ files from accessions, 
//channel of single-end FASTQ files from accessions, 
//name of sequencing platform for downstream parameter-setting
workflow SRA2FASTQ {
    take:
    settings

    main:
    accessions_ch = channel.of(settings["accessions"])

    //check for already-downloaded SRA accessions
    accessions_ch.flatten().branch{ acc ->
        pairedExisting: files("${settings["sra2fastqOutDir"]}/$acc/${acc}_{1,2}.fastq.gz").size() > 0
        singleExisting: file("${settings["sra2fastqOutDir"]}/$acc/${acc}.fastq.gz").exists()
        absent: true
    }.set{ split_acc }

    //turn channels containing accession numbers for downloaded SRA accessions
    //into channels referencing the downloaded fastq files themselves
    dl_pe = split_acc.pairedExisting.map{
        acc -> files("${settings["sra2fastqOutDir"]}/$acc/${acc}_{1,2}.fastq.gz")
    }.collect(sort: true)
    dl_se = split_acc.singleExisting.map{
        acc -> file("${settings["sra2fastqOutDir"]}/$acc/${acc}.fastq.gz")
    }.collect(sort: true)
    dl_metadata = split_acc.pairedExisting.concat(split_acc.singleExisting).map{
        acc -> file("${settings["sra2fastqOutDir"]}/$acc/${acc}_metadata.txt")
    }

    //download all NEW SRA accessions
    sraDownload(split_acc.absent.flatten().unique(), settings)

    //collect newly and previously downloaded metadata, scan for platform
    metadata = dl_metadata.concat(sraDownload.out.metadata)
    getPlatforms(metadata)
    checkDistinctPlatforms(getPlatforms.out.unique().collect())
    platform = checkDistinctPlatforms.out

    //join the channels for newly and previously downloaded FASTQs, sorted in the order COUNTFASTQ expects
    paired = sraDownload.out.paired.collect(sort: true).concat(dl_pe)
    unpaired = sraDownload.out.unpaired.collect(sort: true).concat(dl_se)


    emit:
    paired
    unpaired
    platform

}

//SRA download workflow for phylogenetic analysis. identical to main workflow except for not checking sequencing platform.
//takes: parameters
//emits: channel of paired-end FASTQ files from accessions, 
//channel of single-end FASTQ files from accessions 
workflow PHYLOSRA {
    take:
    settings

    main:
    accessions_ch = channel.of(settings["phylAccessions"])
    //check for already-downloaded SRA accessions
    accessions_ch.flatten().branch{ acc ->
        pairedExisting: files("${settings["sra2fastqOutDir"]}/$acc/${acc}_{1,2}.fastq.gz").size() > 0
        singleExisting: file("${settings["sra2fastqOutDir"]}/$acc/${acc}.fastq.gz").exists()
        absent: true
    }.set{ split_acc }

    //turn channels containing accession numbers for downloaded SRA accessions
    //into channels referencing the downloaded fastq files themselves
    dl_pe = split_acc.pairedExisting.map{
        acc -> files("${settings["sra2fastqOutDir"]}/$acc/${acc}_{1,2}.fastq.gz")
    }.collect(sort: true)
    dl_se = split_acc.singleExisting.map{
        acc -> file("${settings["sra2fastqOutDir"]}/$acc/${acc}.fastq.gz")
    }.collect(sort: true)


    //download all NEW SRA accessions
    sraDownload(split_acc.absent.flatten().unique(), settings)

    //join the channels for newly and previously downloaded FASTQs, sorted in the order COUNTFASTQ expects
    paired = sraDownload.out.paired.collect(sort: true).concat(dl_pe)
    unpaired = sraDownload.out.unpaired.collect(sort: true).concat(dl_se)


    emit:
    paired
    unpaired
}