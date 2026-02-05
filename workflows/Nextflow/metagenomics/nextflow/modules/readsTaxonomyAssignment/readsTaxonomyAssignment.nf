#!/usr/bin/env nextflow
import java.nio.file.Path
import java.nio.file.Paths

//main RTA process
process readsTaxonomy {
    label 'rta'
    label 'large'

    //bind in base database directory and any custom DBs
    containerOptions "--compat --cleanenv \
                        --bind=${settings["baseDB"]}:/venv/bin/../../../database \
                        --bind=${settings["baseDB"]}:/venv/opt/krona/taxonomy \
                        ${settings["custom_bwa_db"] != null ? "--bind=${Paths.get(settings["custom_bwa_db"].toString()).getParent()}:/bwa_custom" : ""} \
                        ${settings["custom_metaphlan_db"] != null ? "--bind=${Paths.get(settings["custom_metaphlan_db"].toString()).getParent()}:/metaphlan_custom" : ""} \
                        ${settings["custom_kraken_db"] != null ? "--bind=${Paths.get(settings["custom_kraken_db"].toString()).getParent()}:/kraken_custom" : ""} \
                        ${settings["custom_centrifuge_db"] != null ? "--bind=${Paths.get(settings["custom_centrifuge_db"].toString()).getParent()}:/centrifuge_custom" : ""} \
                        ${settings["custom_pangia_db"] != null ? "--bind=${Paths.get(settings["custom_pangia_db"].toString()).getParent()}:/pangia_custom" : ""} \
                        ${settings["custom_diamond_db"] != null ? "--bind=${Paths.get(settings["custom_diamond_db"].toString()).getParent()}:/diamond_custom" : ""} \
                        ${settings["custom_gottcha_speDB_v"] != null ? "--bind=${Paths.get(settings["custom_gottcha_speDB_v"].toString()).getParent()}:/gottcha_speDBv_custom" : ""} \
                        ${settings["custom_gottcha_speDB_b"] != null ? "--bind=${Paths.get(settings["custom_gottcha_speDB_b"].toString()).getParent()}:/gottcha_speDBb_custom" : ""} \
                        ${settings["custom_gottcha_strDB_v"] != null ? "--bind=${Paths.get(settings["custom_gottcha_strDB_v"].toString()).getParent()}:/gottcha_strDBv_custom" : ""} \
                        ${settings["custom_gottcha_strDB_b"] != null ? "--bind=${Paths.get(settings["custom_gottcha_strDB_b"].toString()).getParent()}:/gottcha_strDBb_custom" : ""} \
                        ${settings["custom_gottcha_genDB_v"] != null ? "--bind=${Paths.get(settings["custom_gottcha_genDB_v"].toString()).getParent()}:/gottcha_genDBv_custom" : ""} \
                        ${settings["custom_gottcha_genDB_b"] != null ? "--bind=${Paths.get(settings["custom_gottcha_genDB_b"].toString()).getParent()}:/gottcha_genDBb_custom" : ""} \
                        ${settings["custom_gottcha2_genDB_v"] != null ? "--bind=${Paths.get(settings["custom_gottcha2_genDB_v"].toString()).getParent()}:/gottcha2_genDBv_custom" : ""} \
                        ${settings["custom_gottcha2_speDB_v"] != null ? "--bind=${Paths.get(settings["custom_gottcha2_speDB_v"].toString()).getParent()}:/gottcha2_speDBv_custom" : ""} \
                        ${settings["custom_gottcha2_speDB_b"] != null ? "--bind=${Paths.get(settings["custom_gottcha2_speDB_b"].toString()).getParent()}:/gottcha2_speDBb_custom" : ""}"

    publishDir(
        path: "${settings["readsTaxonomyOutDir"]}",
	mode: 'copy',
	pattern: "{*.log,log**,report**}"
    )
    
    input:
    val settings
    path paired
    path unpaired
    path taxonomyConfig
    path errorlog

    output:
    //outputs are many and variable
    path "error.log", emit: logfile
    path "taxonomyProfiling.log"
    path "report/**/**/*.svg", emit: svgs
    path "report/**/**/*.tree.pdf", emit: trees
    path "report/heatmap_DATASET*", emit: heatmaps
    path "log**"
    path "report**"

    script:
    """
    cat $paired $unpaired > allReads.fastq
    microbial_profiling.pl -o . \
    -s $taxonomyConfig \
    -c ${task.cpus} \
    allReads.fastq 2>>$errorlog

    svg2pdf.sh  report/*/*/*.svg 2>>$errorlog
    """
}

//creates RTA config file based on input settings
process readsTaxonomyConfig {
    label 'rta'
    label 'small'

    containerOptions "--compat --cleanenv \
                        --bind=${settings["baseDB"]}:/venv/bin/../../../database \
                        --bind=${settings["baseDB"]}:/venv/opt/krona/taxonomy"

    input:
    val settings
    val platform
    val avgLen

    output:
    path "error.log", emit: errorlog
    path "microbial_profiling.settings.ini", emit: config

    script:
    def bwaScoreCut = 30
    if (platform != null && (platform.contains("NANOPORE") || platform.contains("PACBIO"))) {
        if (settings["minLen"] > 1000) {
            bwaScoreCut = settings["minLen"]
        } 
        else {
            bwaScoreCut=1000
        }
    }
    else{
        bwaScoreCut = (avgLen as Integer)*0.8
    }
    bwaScoreCut = bwaScoreCut as Integer
    tools = settings["enabledTools"] != null ? "-tools \'${settings["enabledTools"]}\' " : ""
    splitTrimMinQ = settings["splitTrimMinQ"] != null ? "-splitrim-minq ${settings["splitTrimMinQ"]} " : ""

    base = settings["baseDB"] != null ? "-base-db /database" : ""

    bwa = settings["custom_bwa_db"] != null ? "-bwa-db /bwa_custom/${Paths.get(settings["custom_bwa_db"].toString()).getFileName()} " : ""
    metaphlan = settings["custom_metaphlan_db"] != null ? "-metaphlan-db /metaphlan_custom/${Paths.get(settings["custom_metaphlan_db"].toString()).getFileName()} " : ""
    kraken = settings["custom_kraken_db"] != null ? "-kraken-db /kraken_custom/${Paths.get(settings["custom_kraken_db"].toString()).getFileName()} " : ""
    centrifuge = settings["custom_centrifuge_db"] != null ? "-centrifuge-db /centrifuge_custom/${Paths.get(settings["custom_centrifuge_db"].toString()).getFileName()} " : ""
    pangia = settings["custom_pangia_db"] != null ? "-pangia-db /pangia_custom/${Paths.get(settings["custom_pangia_db"].toString()).getFileName()} " : ""
    diamond = settings["custom_diamond_db"] != null ? "-diamond-db /diamond_custom/${Paths.get(settings["custom_diamond_db"].toString()).getFileName()} " : ""

    gottcha_speDB_v = settings["custom_gottcha_speDB_v"] != null ? "-gottcha-v-speDB /gottcha_speDBv_custom/${Paths.get(settings["custom_gottcha_speDB_v"].toString()).getFileName()} " : ""
    gottcha_speDB_b = settings["custom_gottcha_speDB_b"] != null ? "-gottcha-b-speDB /gottcha_speDBb_custom/${Paths.get(settings["custom_gottcha_speDB_b"].toString()).getFileName()} " : ""
    gottcha_strDB_v = settings["custom_gottcha_strDB_v"] != null ? "-gottcha-v-strDB /gottcha_strDBv_custom/${Paths.get(settings["custom_gottcha_strDB_v"].toString()).getFileName()} " : ""
    gottcha_strDB_b = settings["custom_gottcha_strDB_b"] != null ? "-gottcha-b-strDB /gottcha_strDBb_custom/${Paths.get(settings["custom_gottcha_strDB_b"].toString()).getFileName()} " : ""
    gottcha_genDB_v = settings["custom_gottcha_genDB_v"] != null ? "-gottcha-v-genDB /gottcha_genDBv_custom/${Paths.get(settings["custom_gottcha_genDB_v"].toString()).getFileName()} " : ""
    gottcha_genDB_b = settings["custom_gottcha_genDB_b"] != null ? "-gottcha-b-genDB /gottcha_genDBb_custom/${Paths.get(settings["custom_gottcha_genDB_b"].toString()).getFileName()} " : ""

    gottcha2_genDB_v = settings["custom_gottcha2_genDB_v"] != null ? "-gottcha2-v-genDB /gottcha2_genDBv_custom/${Paths.get(settings["custom_gottcha2_genDB_v"].toString()).getFileName()} " : ""
    gottcha2_speDB_v = settings["custom_gottcha2_speDB_v"] != null ? "-gottcha2-v-speDB /gottcha2_speDBv_custom/${Paths.get(settings["custom_gottcha2_speDB_v"].toString()).getFileName()} " : ""
    gottcha2_speDB_b = settings["custom_gottcha2_speDB_b"] != null ? "-gottcha2-b-speDB /gottcha2_speDBb_custom/${Paths.get(settings["custom_gottcha2_speDB_b"].toString()).getFileName()} " : ""

    np = (platform != null && platform.contains("NANOPORE")) ? "--nanopore " : ""

    """

    mkdir -p /venv/opt/krona/taxonomy
    touch /venv/opt/krona/taxonomy/taxdump.tar.gz
    chmod 777 /venv/opt/krona/taxonomy/taxdump.tar.gz
    updateTaxonomy.sh

    updateAccessions.sh 
    
    microbial_profiling_configure.pl \
    $tools -bwaScoreCut $bwaScoreCut\
    $base\
    $bwa\
    $metaphlan\
    $kraken\
    $centrifuge\
    $pangia\
    $diamond\
    $gottcha_speDB_v\
    $gottcha_speDB_b\
    $gottcha_strDB_v\
    $gottcha_strDB_b\
    $gottcha_genDB_v\
    $gottcha_genDB_b\
    $gottcha2_genDB_v\
    $gottcha2_speDB_v\
    $gottcha2_speDB_b\
    $np >microbial_profiling.settings.ini 2>error.log
    """

}

//TODO: add workflow logic for retrieving unmapped reads
workflow READSTAXONOMYASSIGNMENT {
    take:
    settings
    platform
    paired
    unpaired
    avgLen

    main:
    readsTaxonomyConfig(settings, platform, avgLen)
    readsTaxonomy(settings, paired, unpaired, readsTaxonomyConfig.out.config, readsTaxonomyConfig.out.errorlog)
    trees = readsTaxonomy.out.trees
    heatmaps = readsTaxonomy.out.heatmaps
   
    emit:
    trees
    heatmaps

}
