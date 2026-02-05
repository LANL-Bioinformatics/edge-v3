//André Watson
//Aug 2024
//apwat @ lanl.gov

//base process. Takes a FASTA file containing contigs and performs taxonomic analysis with MICCR (https://github.com/chienchi/miccr).
process contigTaxonomy {
    label 'cta'
    label 'medium'
    containerOptions "--compat --cleanenv \
                        --bind=${settings["miccrDB"]}:/venv/database/miccrDB"
    publishDir(
        path: "${settings["contigsTaxonomyOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path contigs

    output:
    path "${settings["projName"]}.log"
    path "log.txt"
    path "${settings["projName"]}.lca_ctg.tsv", emit: taxLcaResult
    path "${settings["projName"]}.ctg.tsv", emit: taxResult
    path "${settings["projName"]}.unclassified.fasta"
    path "${settings["projName"]}.paf"
    
    script:
    """
    miccr.py -x asm10 -d /venv/database/miccrDB/NCBI-Bacteria-Virus.fna.mmi -t ${task.cpus} -p ${settings["projName"]} -i $contigs 1>log.txt 2>&1 
    get_unclassified_fasta.pl -in $contigs -classified ${settings["projName"]}.lca_ctg.tsv -output ${settings["projName"]}.unclassified.fasta -log log.txt
    """
}

//adds multi-level taxonomic classification to results file. Takes in a .ctg.tsv file produced by MICCR.
process addLineage {
    label 'cta'
    label 'tiny'
    containerOptions "--compat --cleanenv \
                        --bind=${settings["miccrDB"]}:/venv/database/miccrDB"
    publishDir(
        path: "${settings["contigsTaxonomyOutDir"]}",
        mode: 'copy'
    )
    
    input:
    val settings
    path taxResult

    output:
    path "*.lineage", emit: lineage

    script:
    //add_lineage.py is from MICCR repo in container
    """
    add_lineage.py /venv/database/miccrDB/ $taxResult > ${taxResult.name}.lineage
    """
}

//creates taxonomy classification graphs. Takes lineage file, .lca_ctg.tsv file produced by MICCR, 
//and a coverage table (see https://github.com/chienchi/miccr/blob/master/utils/README.md), or from workflow runReadsToContig 
process plotAndTable {
    label 'cta'
    label 'tiny'
    publishDir(
        path: "${settings["contigsTaxonomyOutDir"]}",
	mode: 'copy'
    )
    input:
    val settings
    path lineage
    path covTable
    path lcaResult
    
    output:
    path "${settings["projName"]}.ctg_class.LCA.json"
    path "summary_by_*.txt"
    path "*.pdf", emit: ctaReport
    
    script:
    """
    classification_plot.R $lineage ${settings["projName"]} $covTable
    tab2Json_for_dataTable.pl -project_dir ${settings["outDir"]} -mode contig -limit ${settings["rowLimit"]} $lcaResult > ${settings["projName"]}.ctg_class.LCA.json
    """
}

workflow CONTIGSTAXONOMYASSIGNMENT {
    take:
    settings
    contigs
    coverageTable

    main:
    contigTaxonomy(settings, contigs)
    addLineage(settings, contigTaxonomy.out.taxResult)
    plotAndTable(settings, addLineage.out.lineage, coverageTable, contigTaxonomy.out.taxLcaResult)

    ctaReport = plotAndTable.out.ctaReport

    emit:
    ctaReport
}