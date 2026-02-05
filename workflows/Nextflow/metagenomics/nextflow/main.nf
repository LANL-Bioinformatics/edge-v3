#!/usr/bin/env nextflow

include {SRA2FASTQ} from './modules/sra2fastq/sra2fastq.nf'
include {COUNTFASTQ} from './modules/countFastq/countFastq.nf'
include {PROCESSCONTIGS} from './modules/processProvidedContigs/processProvidedContigs.nf'
include {FAQCS} from './modules/runFaQCs/runFaQCs.nf'
include {HOSTREMOVAL} from './modules/hostRemoval/hostRemoval.nf'
include {ASSEMBLY} from './modules/runAssembly/runAssembly.nf'
include {READSTOCONTIGS} from './modules/runReadsToContig/runReadsToContig.nf'
include {READSTAXONOMYASSIGNMENT} from './modules/readsTaxonomyAssignment/readsTaxonomyAssignment.nf'
include {CONTIGSTAXONOMYASSIGNMENT} from './modules/contigsTaxonomyAssignment/contigsTaxonomyAssignment.nf'
include {ANNOTATION} from './modules/runAnnotation/runAnnotation.nf'
include {PHAGEFINDER} from './modules/phageFinder/phageFinder.nf'
include {ANTISMASH} from './modules/runAntiSmash/runAntiSmash.nf'
include {BINNING} from './modules/contigBinning/contigBinning.nf'
include {REFERENCEBASEDANALYSIS} from './modules/referenceBasedAnalysis/refBasedAnalysis.nf'
include {PHYLOGENETICANALYSIS} from './modules/SNPtree/SNPtree.nf'
include {READSGENEFAMILYANALYSIS} from './modules/geneFamilyAnalysis/geneFamilyAnalysis.nf'
include {CONTIGSGENEFAMILYANALYSIS} from './modules/geneFamilyAnalysis/geneFamilyAnalysis.nf'
include {REPORT} from './modules/report/report.nf'

workflow {
    //parameter setup
    baseSettings= params.shared.plus(params.outputLocations).plus(params.modules)
    //input specification

    //reads as input
    //allows multiple unpaired read files, or multiple paired read files, but not both
    paired = channel.empty()
    unpaired = channel.empty()
    //check if params input is empty or not
    if(params.shared.inputFastq.size() > 0) {
        if(params.shared.pairedFile) {
            paired = channel.fromPath([params.shared.inputFastq, params.shared.inputFastq2].transpose().flatten(), checkIfExists:true).collect()
        }
        else {
            unpaired = channel.fromPath(params.shared.inputFastq, checkIfExists:true).collect()
        }
    }

    //contigs as input or pre-assembled from reads
    contigs = channel.empty()
    annContigs = channel.empty()
    if(params.shared.inputContigs != "${projectDir}/nf_assets/NO_FILE3" || params.shared.assembledContigs != "${projectDir}/nf_assets/NO_FILE3") {
        if(params.shared.inputContigs != "${projectDir}/nf_assets/NO_FILE3") {
            contigs = channel.fromPath(params.shared.inputContigs, checkIfExists:true)
        }
        else if(params.shared.assembledContigs != "${projectDir}/nf_assets/NO_FILE3") {
            contigs = channel.fromPath(params.shared.assembledContigs, checkIfExists:true)
        }
        PROCESSCONTIGS(baseSettings.plus(params.assembly).plus(params.annotation), contigs)
        annContigs = PROCESSCONTIGS.out.annotationContigs
    }


    platform = channel.empty()
    //SRA download and processing
    if(params.modules.sra2fastq) {
        SRA2FASTQ(baseSettings.plus(params.sra2fastq))
        COUNTFASTQ(SRA2FASTQ.out.paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"]), SRA2FASTQ.out.unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2"))
        avgLen = COUNTFASTQ.out.avgReadLen
        counts = COUNTFASTQ.out.counts
        paired = COUNTFASTQ.out.paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"])
        unpaired = COUNTFASTQ.out.unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2")
        platform = SRA2FASTQ.out.platform
    }
    else {
        //reads processing
        COUNTFASTQ(paired.ifEmpty("${projectDir}/nf_assets/NO_FILE"), unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2"))
        avgLen = COUNTFASTQ.out.avgReadLen
        counts = COUNTFASTQ.out.counts
        paired = COUNTFASTQ.out.paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"])
        unpaired = COUNTFASTQ.out.unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2")
    }
    platform = platform.ifEmpty{params.shared.fastqSource != null ? "${params.shared.fastqSource.toUpperCase()}" : null}
    //QC
    qcStats = channel.empty()
    qcReport = channel.empty()
    if(params.modules.faqcs) {
        FAQCS(baseSettings.plus(params.faqcs), platform, paired, unpaired,avgLen)

        paired = FAQCS.out.paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"])
        unpaired = FAQCS.out.unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2")
        qcStats = FAQCS.out.qcStats
        qcReport = FAQCS.out.qcReport
    }

    //Host reads removal
    hostRemovalReport = channel.empty()
    if(params.modules.hostRemoval) {

        HOSTREMOVAL(baseSettings.plus(params.hostRemoval).plus(params.faqcs),platform,paired,unpaired)
        paired = HOSTREMOVAL.out.paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"])
        unpaired = HOSTREMOVAL.out.unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2")
        hostRemovalReport = HOSTREMOVAL.out.hostRemovalReport
    }

    //Assembly and validation alignment
    coverageTable = channel.empty()
    abundances = channel.empty()
    contigStatsReport = channel.empty()
    contigPlots = channel.empty()
    alnStats = channel.empty()
    if(!params.binning.binningAbundFile.endsWith("NO_FILE3")) { //user provided abundance file
        abundances = channel.fromPath(params.binning.binningAbundFile, checkIfExists:true)
    }
    if(params.modules.runAssembly) {
        //assemble if not already using assembled or provided contigs
        if (params.shared.inputContigs == "${projectDir}/nf_assets/NO_FILE3" && params.shared.assembledContigs == "${projectDir}/nf_assets/NO_FILE3") {
            ASSEMBLY(baseSettings.plus(params.assembly).plus(params.annotation), paired, unpaired, avgLen)
            contigs = ASSEMBLY.out.outContigs
            annContigs = ASSEMBLY.out.annotationContigs
        }
        //run validation alignment if reads were provided
        if(params.shared.inputFastq.size() != 0 || params.sra2fastq.accessions.size() == 0) {
            READSTOCONTIGS(baseSettings.plus(params.r2c).plus(params.refBased), platform, paired, unpaired, contigs)
            alnStats= READSTOCONTIGS.out.alnStats
            coverageTable = READSTOCONTIGS.out.covTable
            contigStatsReport = READSTOCONTIGS.out.contigStatsReport
            contigPlots = READSTOCONTIGS.out.contigPlots
            if(params.binning.binningAbundFile.endsWith("NO_FILE3")) { //user did not provide abundance file and assembly was run
                abundances = READSTOCONTIGS.out.magnitudes
            }
        }
    }

    //Reference-based analysis
    if(params.modules.refBasedAnalysis) {
        REFERENCEBASEDANALYSIS(baseSettings.plus(params.refBased).plus(params.contigsToRef), platform, paired, unpaired, contigs.ifEmpty("${projectDir}/nf_assets/NO_FILE3"))
    }

    //Reads-based taxonomic classification
    rtaReports = channel.empty()
    if(params.modules.readsTaxonomyAssignment) {
        READSTAXONOMYASSIGNMENT(baseSettings.plus(params.readsTaxonomy).plus(params.faqcs), platform, paired, unpaired, avgLen)
        rtaReports = rtaReports.concat(READSTAXONOMYASSIGNMENT.out.trees, READSTAXONOMYASSIGNMENT.out.heatmaps).collect()

    }

    //Contig-based taxonomic classification
    ctaReport = channel.empty()
    if(params.modules.contigsTaxonomyAssignment) {
        CONTIGSTAXONOMYASSIGNMENT(baseSettings.plus(params.contigsTaxonomy), contigs, coverageTable.ifEmpty{file("DNE")})
        ctaReport = CONTIGSTAXONOMYASSIGNMENT.out.ctaReport
    }

    //Annotation and PhageFinder
    antismashInput = contigs
    annStats = channel.empty()
    annGFF = channel.empty()
    annFAA = channel.empty()
    if(params.modules.annotation) {
        ANNOTATION(baseSettings.plus(params.annotation), annContigs)
        annStats = ANNOTATION.out.annStats
        annGFF = ANNOTATION.out.gff
        annFAA = ANNOTATION.out.faa

        if(params.modules.phageFinder && (params.annotation.taxKingdom == null || !(params.annotation.taxKingdom.equalsIgnoreCase("viruses")))) {
            PHAGEFINDER(baseSettings, annGFF, annFAA, ANNOTATION.out.fna)
        }

        antismashInput = ANNOTATION.out.gbk
    }

    //secondary metabolite analysis
    if(params.modules.secondaryMetaboliteAnalysis) {
        ANTISMASH(baseSettings.plus(params.SMA), antismashInput)
    }

    //binning
    if(params.modules.binning) {
        BINNING(baseSettings.plus(params.binning), contigs, abundances)
    }

    //Phylogenetic analysis
    if(params.modules.snpTree) {
        PHYLOGENETICANALYSIS(baseSettings.plus(params.snpTree).plus(params.annotation), paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"]), unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2"), contigs.ifEmpty("${projectDir}/nf_assets/NO_FILE3"))
    }

    //gene family analysis
        if(params.modules.readsGeneFamilyAnalysis) {
        READSGENEFAMILYANALYSIS(baseSettings.plus(params.geneFamily), 
            paired.ifEmpty(["${projectDir}/nf_assets/NO_FILE"]), 
            unpaired.ifEmpty("${projectDir}/nf_assets/NO_FILE2"),
        )
    }

    if(params.modules.contigsGeneFamilyAnalysis) {
        geneFamilyFAA = channel.empty()
        geneFamilyGFF = channel.empty()
        if(params.geneFamily.inputFAA.endsWith("NO_FILE3")) {
            geneFamilyFAA = annFAA.ifEmpty("${projectDir}/nf_assets/NO_FILE3")
        }
        else {
            geneFamilyFAA = channel.fromPath(params.geneFamily.inputFAA)
        }
        if(params.geneFamily.inputGFF.endsWith("NO_FILE4")) {
            geneFamilyGFF = annGFF.ifEmpty("${projectDir}/nf_assets/NO_FILE4")
        }
        else {
            geneFamilyGFF = channel.fromPath(params.geneFamily.inputGFF)
        }
        CONTIGSGENEFAMILYANALYSIS(baseSettings.plus(params.geneFamily), 
            geneFamilyFAA,
            geneFamilyGFF,
            contigs.ifEmpty("${projectDir}/nf_assets/NO_FILE5")
        )
    }

    //report generation
    REPORT(
        baseSettings, 
        platform,
        counts.ifEmpty{file("${projectDir}/nf_assets/NO_FILE")},
        qcStats.ifEmpty{file("${projectDir}/nf_assets/NO_FILE2")},
        qcReport.ifEmpty{file("${projectDir}/nf_assets/NO_FILE3")},
        hostRemovalReport.ifEmpty{file("${projectDir}/nf_assets/NO_FILE4")},
        rtaReports.ifEmpty{file("${projectDir}/nf_assets/NO_FILE5")}, 
        ctaReport.ifEmpty{file("${projectDir}/nf_assets/NO_FILE6")},
        contigStatsReport.ifEmpty{file("${projectDir}/nf_assets/NO_FILE7")},
        contigPlots.ifEmpty{file("${projectDir}/nf_assets/NO_FILE8")},
        annStats.ifEmpty{file("${projectDir}/nf_assets/NO_FILE9")},
        alnStats.ifEmpty{file("${projectDir}/nf_assets/NO_FILEa")}
    )
}