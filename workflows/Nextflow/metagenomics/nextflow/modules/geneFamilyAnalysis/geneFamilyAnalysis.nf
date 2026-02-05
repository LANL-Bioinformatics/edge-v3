#!/usr/bin/env nextflow

//André Watson, 2025

//reads-based search for antibiotic resistomes using RGI. 
process antibioticResistanceReads {
    label 'gfa'
    label 'medium'
    
    containerOptions "--bind=${settings["rgiDB"]}:/bin/RGI"

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/RGI",
        mode: 'copy'
    )

    input:
    val settings
    path reads

    output:
    path "${settings["projName"]}_reads_based_AR_genes_rgi*"

    script:
    def inputArg = reads.size() > 1  ? "-1 ${reads[0]} -2 ${reads[1]}" : "-1 $reads"

    """
    eval "\$(conda shell.bash hook)"
    conda activate rgi_env
    rgi load --card_json /bin/RGI/card.json --local
    rgi card_annotation -i /bin/RGI/card.json > card_annotation.log 2>&1
    rgi load -i /bin/RGI/card.json --card_annotation card_database_v4.0.1.fasta --local

    rgi bwt $inputArg \
    -n ${task.cpus} \
    -o ${settings["projName"]}_reads_based_AR_genes_rgi \
    --clean \
    --local
    """

}

//contig-based search for antibiotic resistomes using RGI. 
process antibioticResistanceContigs {
    label 'gfa'
    label 'medium'

    containerOptions "--bind=${settings["rgiDB"]}:/bin/RGI"

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/RGI",
        mode: 'copy'
    )

    input:
    val settings
    path faa

    output:
    path "${settings["projName"]}_ORF_based_AR_genes_rgi.json", emit: json
    script:
    """
    eval "\$(conda shell.bash hook)"
    conda activate rgi_env
    rgi load --card_json /bin/RGI/card.json --local
    rgi main -i $faa \
    -t protein -o ${settings["projName"]}_ORF_based_AR_genes_rgi \
    -n ${task.cpus} \
    --clean \
    --local
    """

}

//processes JSON output of contig-based RGI into tables with coords, identified ARGS, and more
process processRGIcontigResults {
    label 'gfa'
    label 'small'

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/RGI",
        mode: 'copy'
    )

    input:
    val settings
    path json
    path gff
    path faa

    output:
    path "*ORF_based*"

    script:
    """
    eval "\$(conda shell.bash hook)"
    conda activate rgi_env
    ProcessARRGIJson.py -i  $json \
    -g $gff \
    -p ${settings["projName"]}_ORF_based_AR_genes_rgi

    gff_to_faa.py $faa ${settings["projName"]}_ORF_based_AR_genes_rgi.gff > ${settings["projName"]}_ORF_based_AR_genes_rgi.faa
    """
}


// Uses MetaVF Toolkit to search for virulence factors in input reads
process virulenceFactorReads {
    label 'vf'
    label 'medium'
    containerOptions "--bind=\$PWD:/tmp"

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/MetaVF_Toolkit",
        mode: 'copy',
        saveAs: {
            f -> if(f.endsWith("VF_info.summary")) {"${settings["projName"]}.VF_info.summary"}
            else if(f.endsWith(".summary")) {"${settings["projName"]}.summary"}
        }
    )

    input:
    val settings
    path paired

    output:
    path "${settings["projName"]}_result/${settings["projName"]}/copy_all/*.summary"
    script:
    """
    eval "\$(conda shell.bash hook)"
    conda activate MetaVF_toolkit
    #file manipulation tricks for MetaVF_toolkit's expected input format
    cp \$(readlink ${paired[0]}) ./copy_all_1.fastq
    cp \$(readlink ${paired[1]}) ./copy_all_2.fastq
    gzip copy_*.fastq
    metaVF.py -p /MetaVF_toolkit -pjn ${settings["projName"]} -id \$PWD -m PE -c ${task.cpus}

    """
}

//uses MetaVF Toolkit to look for virulence factors in input contigs
process virulenceFactorContigs {
    label 'vf'
    label 'medium'
    containerOptions "--bind=\$PWD:/tmp"

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/VF_MetaVF_Toolkit",
        mode: 'copy',
        saveAs: {
            f -> if(f.endsWith("VF_info.summary")) {"${settings["projName"]}.VF_info.summary"}
            else if(f.endsWith(".summary")) {"${settings["projName"]}.summary"}
        }
    )



    input:
    val settings
    path contigs

    output:
    path "${settings["projName"]}_result/${settings["projName"]}/copy_contigs/copy_contigs*"


    script:
    """
    eval "\$(conda shell.bash hook)"
    conda activate MetaVF_toolkit
    #file manipulation tricks for MetaVF_toolkit's expected input format
    cp \$(readlink ${contigs}) ./copy_contigs.fna
    metaVF.py -p /MetaVF_toolkit -pjn ${settings["projName"]} -id \$PWD -m draft -c ${task.cpus} -ti 90 -tc 80
    """
}


process virulenceFactorPF2 {
    label 'gfa'
    label 'medium'

    containerOptions "--bind=${settings["pf2DB"]}:/bin/PathoFact2 --bind=${settings["genomadDB"]}:/bin/genomad"

    publishDir(
        path: "${settings["geneFamilyOutDir"]}/VF_PathoFact2",
        mode: 'copy'
    )


    input:
    val settings
    path contigs
    output:
    path "Group_of_sequence/**"
    path "HMM_virulence/*"
    path "log/HMM_virulence/*"
    path "ML_predictions/VF/*"
    path "summary"

    script:
    """
    echo "#sample_name/folder,abs_path_to_contigs,input_type,extension(if folder)" > /samples.csv
    echo "${settings["projName"]}_contigs,\$PWD/$contigs,contigs" >> /samples.csv
    echo "#end" >> /samples.csv

    eval "\$(conda shell.bash hook)"
    conda activate PathoFact_env

    bash run_PathoFact.sh " --configfile  ${settings["pf2Config"]} \
    --conda-frontend conda \
    -s /PathoFact2/Main.smk \
    --conda-prefix /prefix \
    --config work_dir="/PathoFact2" samples_info="/samples.csv" output_dir="\$PWD""

    """
}

workflow CONTIGSGENEFAMILYANALYSIS {
    take:
    settings
    faa
    gff
    contigs

    main:
    //filter unused inputs
    faa = faa.filter{name -> !name.contains("NO_FILE")}
    gff = gff.filter{name -> !name.contains("NO_FILE")}
    contigs = contigs.filter{name -> !name.contains("NO_FILE")}

    //Do contig-based gene family analysis

    //AR genes using RGI
    antibioticResistanceContigs(settings, faa)
    processRGIcontigResults(settings, antibioticResistanceContigs.out.json, gff, faa)

    //choice of MetaVF Toolkit or PathoFact2
    if(settings["virulenceFactorTool"].equalsIgnoreCase("MetaVF Toolkit")) {
        virulenceFactorContigs(settings, contigs)
    }
    else if(settings["virulenceFactorTool"].equalsIgnoreCase("PathoFact2")) {
        virulenceFactorPF2(settings, contigs)
    }
    


}

workflow READSGENEFAMILYANALYSIS {
    take:
    settings
    paired
    unpaired


    main:
    //filter out unused inputs
    paired = paired.flatten().filter{name -> !name.contains("NO_FILE")}.collect()
    unpaired = unpaired.filter{name -> !name.contains("NO_FILE")}

    //use PE reads first. If not available, use SE reads.
    //if paired channel (should be 1 item, list of files) is empty, use unpaired channel. If both empty, no reads provided. 
    reads = paired.concat(unpaired).first()

    //Do read-based gene family analysis
    //AR genes using RGI
    antibioticResistanceReads(settings, reads)
    //PathoFact2 only takes contigs as input, so not available here
    //MetaVF Toolkit only takes PE reads
    if(settings["virulenceFactorTool"].equalsIgnoreCase("MetaVF Toolkit")) {
        virulenceFactorReads(settings, paired)
    }


}