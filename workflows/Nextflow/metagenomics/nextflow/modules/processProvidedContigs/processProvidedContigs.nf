#!/usr/bin/env nextflow

process processProvidedContigs {
    label "processContigs"
    label "tiny"
    publishDir(
        path: "${settings["processProvidedContigsOutDir"]}",
	    mode: 'copy'
    )

    input:
    val settings
    path contigs

    output:
    path "${settings["projName"]}_contigs.fa", emit: contigs
    path "${settings["projName"]}_contigs_*up.fa", emit: contigsForAnnotation
    path "contigs_stats.txt"

    script:
    def annotation = settings["annotation"] ? "-ann 1" : ""

    """
    FASTA=\$(isFasta.pl $contigs)
    if [ "\$FASTA" = "Yes" ]; then
        if [ "$contigs" = "*.gz" ]; then
            contig_num=\$(zcat | grep -c \">\" $contigs)
        else
            contig_num=\$(grep -c \">\" $contigs)
        fi
        echo \$contig_num
        renameFilterFasta.pl \
        -u $contigs\
        -d .\
        -filt ${settings["minContigSize"]} \
        -maxseq \$contig_num \
        -ann_size ${settings["contigSizeForAnnotation"]} \
        -n ${settings["projName"]} \
        -id 1 \
        $annotation
    else
        echo "Provided contigs are not in FASTA format" >&2
    fi
    contig_stats.pl -p ${settings["projName"]}_contigs.fa > contigs_stats.txt
    """
}


workflow PROCESSCONTIGS {
    take:
    settings
    contigs

    main:
    processProvidedContigs(settings, contigs)
    outContigs = processProvidedContigs.out.contigs
    annotationContigs = processProvidedContigs.out.contigsForAnnotation

    emit:
    outContigs
    annotationContigs

}