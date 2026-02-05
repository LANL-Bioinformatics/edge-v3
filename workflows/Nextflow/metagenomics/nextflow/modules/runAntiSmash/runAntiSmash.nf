
//runs ANTISMASH on provided .fa or .gbk input.
process antismash {
    label 'sma'
    label 'medium'
    containerOptions "--bind ${settings["database"]}:/venv/database/antiSMASH"
    publishDir(
        path: "${settings["smaOutDir"]}",
        mode: 'copy'
    )

    input:
    val settings
    path input

    output:
    path "output/*"
    path "antismashLog.txt"

    script:
    def taxon = settings["smaTaxon"].equalsIgnoreCase("fungi") ? "--taxon fungi" : "--taxon bacteria"
    def clusterblast = settings["clusterblast"] == true ? "--cb-general" : ""
    def subclusterblast = settings["subclusterblast"] == true ? "--cb-subclusters" : ""
    def knownclusterblast = settings["knownclusterblast"] == true ? "--cb-knownclusters" : ""
    def mibig = settings["mibig"] == true ? "--cc-mibig" : ""
    def smcogs = settings["smcogs"] == true ? "--smcog-trees" : ""
    def asf = settings["asf"] == true ? "--asf" : ""
    def rre = settings["rre"] == true ? "--rre" : ""
    def fullhmmer = settings["fullhmm"] == true ? "--fullhmmer" : ""
    def tigrfam = settings["tigrfam"] == true ? "--tigrfam" : ""
    def pfam2go = settings["pfam2go"] == true ? "--pfam2go" : ""
    def genefinding = settings["smaTaxon"].equalsIgnoreCase("fungi") ? "--genefinding-tool glimmerhmm" : "--genefinding-tool prodigal-m"
    def cassis = (settings["smaTaxon"].equalsIgnoreCase("fungi") && settings["cassis"] == true) ? "--cassis" : ""

    """
    antismash -c ${task.cpus} $taxon \
    --logfile antismashLog.txt --output-dir ./output \
    --html-title ${settings["projName"]} --database /venv/database/antiSMASH \
    $clusterblast \
    $subclusterblast \
    $knownclusterblast \
    $mibig \
    $smcogs \
    $asf \
    $rre \
    $fullhmmer \
    $tigrfam \
    $pfam2go \
    $cassis \
    $genefinding \
    $input
    """

}


workflow ANTISMASH {
    take:
    settings
    smaInput
    
    main:
    antismash(settings,smaInput)

}