const fs = require('fs')
const path = require('path')
const xlsx = require('node-xlsx').default
const Papa = require('papaparse')
const { execCmd } = require('../utils/common')
const config = require('../config')
const workflowConfig = require('./config')

const cromwellWorkflows = []
const nextflowWorkflows = [
  'sra2fastq',
  'runFaQCs',
  'assembly',
  'annotation',
  'binning',
  'antiSmash',
  'taxonomy',
  'phylogeny',
  'refBased',
  'geneFamily',
  'metagenomics',
]
const nextflowConfigs = {
  executor_config: {
    slurm: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/configs/slurm.config`,
    local: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/configs/local.config`,
  },
  module_params: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/module_params.tmpl`,
  container_config: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/configs/container.config`,
  profiles: `${config.NEXTFLOW.WORKFLOW_DIR}/common/profiles.nf`,
  nf_reports: `${config.NEXTFLOW.WORKFLOW_DIR}/common/nf_reports.tmpl`,
}

const workflowList = {
  sra2fastq: {
    outdir: 'output/sra2fastq',
    nextflow_main: process.env.NEXTFLOW_MAIN
      ? `${process.env.NEXTFLOW_MAIN} -profile local`
      : `${config.NEXTFLOW.WORKFLOW_DIR}/sra2fastq/nextflow/main.nf -profile local`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/sra2fastq/workflow_config.tmpl`,
  },
  runFaQCs: {
    outdir: 'output/ReadsQC',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  assembly: {
    outdir: 'output/Assembly',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  annotation: {
    outdir: 'output/Annotation',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  binning: {
    outdir: 'output/Binning',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  antiSmash: {
    outdir: 'output/AntiSmash',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  taxonomy: {
    outdir: 'output/Taxonomy',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  phylogeny: {
    outdir: 'output/Phylogeny',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  refBased: {
    outdir: 'output/RefBased',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  geneFamily: {
    outdir: 'output/GeneFamily',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  metagenomics: {
    outdir: 'output/Metagenomics',
    report: 'nextflow/report.html',
    log: 'nextflow/.nextflow.log',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/pipeline_config.tmpl`,
  },
}

// eslint-disable-next-line no-unused-vars
const generateNextflowWorkflowParams = async (projHome, projectConf, proj) => {
  let params = {}
  if (projectConf.workflow.name === 'sra2fastq') {
    // download sra data to shared directory
    params.sraOutdir = config.IO.SRA_BASE_DIR
  } else {
    params.sraOutdir = config.IO.SRA_BASE_DIR
    params.keggViewerDir = workflowConfig.KEGG_VIEWER_DIR
    params.executorConfig =
      nextflowConfigs.executor_config[config.NEXTFLOW.EXECUTOR]
    params.moduleParams = nextflowConfigs.module_params
    params.containerConfig = nextflowConfigs.container_config

    if (projectConf.rawReads) {
      if (projectConf.rawReads.paired) {
        // if fastq input is paired-end
        const inputFastq = []
        const inputFastq2 = []
        projectConf.rawReads.inputFiles.forEach(item => {
          inputFastq.push(item.R1)
          inputFastq2.push(item.R2)
        })
        params.inputFastq = inputFastq
        params.inputFastq2 = inputFastq2
      } else {
        params.inputFastq = projectConf.rawReads.inputFiles
      }
    }

    if (projectConf.pipeline) {
      let worflowParams = {
        runFaQCs: false,
        assembly: false,
        annotation: false,
        binning: false,
        antiSmash: false,
        taxonomy: false,
        phylogeny: false,
        refBased: false,
        geneFamily: false,
        contigsOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}`,
        qcOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.runFaQCs.outdir)}`,
        assemblyOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.assembly.outdir)}`,
        annotationOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.annotation.outdir)}`,
        binningOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.binning.outdir)}`,
        antiSmashOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.antiSmash.outdir)}`,
        taxonomyOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.taxonomy.outdir)}`,
        phylogenyOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.phylogeny.outdir)}`,
        refBasedOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.refBased.outdir)}`,
        geneFamilyOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}/${path.basename(workflowList.geneFamily.outdir)}`,
        reportOutdir: `${projHome}/${workflowList[projectConf.workflow.name].outdir}`,
      }
      projectConf.pipeline.forEach(workflow => {
        worflowParams[workflow.name] = true
        worflowParams = { ...worflowParams, ...workflow.input }
      })
      params = { ...params, ...worflowParams }
    }
  }

  return params
}

const metaGWorkflowResult = (outdir, workflow, proj) => {
  const pattern = new RegExp(`^.+${proj.code}/`)
  const result = {}
  result[workflow] = {}

  if (workflow === 'runFaQCs') {
    const statsJsonFile = `${outdir}/QC.stats.json`
    if (fs.existsSync(statsJsonFile)) {
      result[workflow].stats = JSON.parse(fs.readFileSync(statsJsonFile))
    }
    const summaryPlotsFile = `${outdir}/QC_summary_plots.html`
    if (fs.existsSync(summaryPlotsFile)) {
      result[workflow].summaryPlots =
        `${outdir.replace(pattern, '')}/QC_summary_plots.html`
    }
    const reportFile = `${outdir}/QC_final_report.html`
    if (fs.existsSync(reportFile)) {
      result[workflow].report =
        `${outdir.replace(pattern, '')}/QC_final_report.html`
    }
    const reportLongReadsFile = `${outdir}/NanoPlot-report.html`
    if (fs.existsSync(reportLongReadsFile)) {
      result[workflow].report =
        `${outdir.replace(pattern, '')}/NanoPlot-report.html`
    }
  } else if (workflow === 'assembly') {
    const statsFile = `${outdir}/contigs_stats.txt`
    if (fs.existsSync(statsFile)) {
      result[workflow].stats = Papa.parse(
        fs.readFileSync(statsFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
    const reportFile = `${outdir}/final_report.pdf`
    if (fs.existsSync(reportFile)) {
      result[workflow].report =
        `${outdir.replace(pattern, '')}/final_report.pdf`
    }
  } else if (workflow === 'annotation') {
    const statsFile = `${outdir}/annotation_stats_plots.pdf`
    if (fs.existsSync(statsFile)) {
      result[workflow].stats = statsFile.replace(pattern, '')
    }
    result[workflow].opaver_web =
      `opaver_web/pathway_anno.html?data=${proj.code}`
  } else if (workflow === 'binning') {
    const statsFile = `${outdir}/contigs_stats.txt`
    if (fs.existsSync(statsFile)) {
      result[workflow].stats = Papa.parse(
        fs.readFileSync(statsFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
  } else if (workflow === 'antiSmash') {
    // antiSMASH HTML output
    const antiSmashHtml = `${outdir}/output/index.html`
    if (fs.existsSync(antiSmashHtml)) {
      result[workflow].antiSmashHtml =
        `${outdir.replace(pattern, '')}/output/index.html`
    }
  } else if (workflow === 'taxonomy') {
    // summary table for taxonomy annotation
    const summaryFile = `${outdir}/report/summary.txt`
    if (fs.existsSync(summaryFile)) {
      result[workflow].summary = Papa.parse(
        fs.readFileSync(summaryFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
    // figures for taxonomy annotation
    // Taxonomy/report/heatmap_DATASET-allReads.genus.pdf
    // Taxonomy/report/heatmap_DATASET-allReads.species.pdf
    // Taxonomy/report/heatmap_DATASET-allReads.strain.pdf
    // Taxonomy/report/radarchart_DATASET_allReads.genus.html
    // Taxonomy/report/radarchart_DATASET_allReads.species.html
    // Taxonomy/report/radarchart_DATASET_allReads.strain.html
    result[workflow].genus = {}
    result[workflow].species = {}
    result[workflow].strain = {}
    const heatmapGenus = `${outdir}/report/heatmap_DATASET-allReads.genus.pdf`
    if (fs.existsSync(heatmapGenus)) {
      result[workflow].genus.heatmap =
        `${outdir.replace(pattern, '')}/report/heatmap_DATASET-allReads.genus.pdf`
    }
    const heatmapSpecies = `${outdir}/report/heatmap_DATASET-allReads.species.pdf`
    if (fs.existsSync(heatmapSpecies)) {
      result[workflow].species.heatmap =
        `${outdir.replace(pattern, '')}/report/heatmap_DATASET-allReads.species.pdf`
    }
    const heatmapStrain = `${outdir}/report/heatmap_DATASET-allReads.strain.pdf`
    if (fs.existsSync(heatmapStrain)) {
      result[workflow].strain.heatmap =
        `${outdir.replace(pattern, '')}/report/heatmap_DATASET-allReads.strain.pdf`
    }
    const radarGenus = `${outdir}/report/radarchart_DATASET_allReads.genus.html`
    if (fs.existsSync(radarGenus)) {
      result[workflow].genus.radar =
        `${outdir.replace(pattern, '')}/report/radarchart_DATASET_allReads.genus.html`
    }
    const radarSpecies = `${outdir}/report/radarchart_DATASET_allReads.species.html`
    if (fs.existsSync(radarSpecies)) {
      result[workflow].species.radar =
        `${outdir.replace(pattern, '')}/report/radarchart_DATASET_allReads.species.html`
    }
    const radarStrain = `${outdir}/report/radarchart_DATASET_allReads.strain.html`
    if (fs.existsSync(radarStrain)) {
      result[workflow].strain.radar =
        `${outdir.replace(pattern, '')}/report/radarchart_DATASET_allReads.strain.html`
    }
    // Individual Tools result table and figures
    if (fs.existsSync(`${outdir}/report/1_allReads`)) {
      const tools = fs
        .readdirSync(`${outdir}/report/1_allReads`)
        .filter(file =>
          fs.statSync(`${outdir}/report/1_allReads/${file}`).isDirectory(),
        )
      result[workflow].tools = {}
      tools.forEach(tool => {
        result[workflow].tools[tool] = {}
        // table
        // tool/allReads-tool.list.txt
        const toolTable = `${outdir}/report/1_allReads/${tool}/allReads-${tool}.list.txt`
        if (fs.existsSync(toolTable)) {
          result[workflow].tools[tool].table = Papa.parse(
            fs.readFileSync(toolTable).toString(),
            {
              delimiter: '\t',
              header: true,
              skipEmptyLines: true,
            },
          ).data.filter(row =>
            Object.values(row).some(value => value === 'species'),
          )
        }
        // figures
        // gottcha-genDB-b/allReads-gottcha-genDB-b.krona.html
        // gottcha-genDB-b/allReads-gottcha-genDB-b.tree.svg
        const toolKrona = `${outdir}/report/1_allReads/${tool}/allReads-${tool}.krona.html`
        if (fs.existsSync(toolKrona)) {
          result[workflow].tools[tool].krona = toolKrona.replace(pattern, '')
        }
        const toolTree = `${outdir}/report/1_allReads/${tool}/allReads-${tool}.tree.svg`
        if (fs.existsSync(toolTree)) {
          result[workflow].tools[tool].tree = toolTree.replace(pattern, '')
        }
      })
    }
  } else if (workflow === 'phylogeny') {
    const treeAllHtml = `${outdir}/SNPphyloTree.all.html`
    if (fs.existsSync(treeAllHtml)) {
      result[workflow].treeAllHtml =
        `${outdir.replace(pattern, '')}/SNPphyloTree.all.html`
    }
    const treeCdsHtml = `${outdir}/SNPphyloTree.cds.html`
    if (fs.existsSync(treeCdsHtml)) {
      result[workflow].treeCdsHtml =
        `${outdir.replace(pattern, '')}/SNPphyloTree.cds.html`
    }
  } else if (workflow === 'refBased') {
    // summary table for reads aligned to reference
    const statsFile = `${outdir}/readsToRef.alnstats.txt`
    if (fs.existsSync(statsFile)) {
      result[workflow].summary = Papa.parse(
        fs.readFileSync(statsFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
    // base_coverage plot and histogram plot for each reference
    if (fs.existsSync(`${outdir}/Coverage_plots`)) {
      const pngFiles = fs
        .readdirSync(`${outdir}/Coverage_plots`)
        .filter(file => file.endsWith('.png'))
      if (pngFiles.length > 0) {
        result[workflow].coveragePlots = pngFiles.map(
          file => `${outdir.replace(pattern, '')}/Coverage_plots/${file}`,
        )
      }
    }
    // snps
    const snpsFile = `${outdir}/readsToRef.SNPs_report.json`
    if (fs.existsSync(snpsFile)) {
      result[workflow].snps = JSON.parse(fs.readFileSync(snpsFile)).data
    }
    // indels
    const indelsFile = `${outdir}/readsToRef.Indels_report.json`
    if (fs.existsSync(indelsFile)) {
      result[workflow].indels = JSON.parse(fs.readFileSync(indelsFile)).data
    }
    // jbrowse url for reference-based workflow
    const jbrowseUrlFile = `${outdir}/jbrowse2_path.json`
    if (fs.existsSync(jbrowseUrlFile)) {
      result[workflow].jbrowse = JSON.parse(
        fs.readFileSync(jbrowseUrlFile),
      ).jbrowse2_path
    }
  } else if (workflow === 'geneFamily') {
    // gene family summary table
    // GeneFamily/VF_MetaVF_Toolkit/<project name>.VF_info.summary
    const summaryFile = `${outdir}/VF_MetaVF_Toolkit/${proj.name.replace(/\s/g, '_')}.VF_info.summary`
    if (fs.existsSync(summaryFile)) {
      result[workflow].summary = Papa.parse(
        fs.readFileSync(summaryFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
    // GeneFamily/VF_PathoFact2/summary/<project name>_contigs/VF_hits_rep_prot_with_MGE.tsv
    const pathoFactFile = `${outdir}/VF_PathoFact2/summary/${proj.name.replace(/\s/g, '_')}_contigs/VF_hits_rep_prot_with_MGE.tsv`
    if (fs.existsSync(pathoFactFile)) {
      result[workflow].summary = Papa.parse(
        fs.readFileSync(pathoFactFile).toString(),
        {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        },
      ).data
    }
  }

  return result
}

const generateWorkflowResult = proj => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const resultJson = `${projHome}/result.json`

  if (!fs.existsSync(resultJson)) {
    let result = {}
    const projectConf = JSON.parse(fs.readFileSync(`${projHome}/conf.json`))
    const outdir = `${projHome}/${workflowList[projectConf.workflow.name].outdir}`

    if (projectConf.workflow.name === 'sra2fastq') {
      // use relative path
      const { accessions } = projectConf.workflow.input
      accessions.forEach(accession => {
        // link sra downloads to project output
        fs.symlinkSync(`../../../../sra/${accession}`, `${outdir}/${accession}`)
      })
    } else if (projectConf.workflow.name === 'runFaQCs') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'runFaQCs', proj).runFaQCs,
      }
    } else if (projectConf.workflow.name === 'assembly') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'assembly', proj).assembly,
      }
    } else if (projectConf.workflow.name === 'annotation') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'annotation', proj).annotation,
      }
    } else if (projectConf.workflow.name === 'binning') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'binning', proj).binning,
      }
    } else if (projectConf.workflow.name === 'antiSmash') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'antiSmash', proj).antiSmash,
      }
    } else if (projectConf.workflow.name === 'taxonomy') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'taxonomy', proj).taxonomy,
      }
    } else if (projectConf.workflow.name === 'phylogeny') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'phylogeny', proj).phylogeny,
      }
    } else if (projectConf.workflow.name === 'refBased') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'refBased', proj).refBased,
      }
    } else if (projectConf.workflow.name === 'geneFamily') {
      result = {
        ...result,
        ...metaGWorkflowResult(outdir, 'geneFamily', proj).geneFamily,
      }
    } else if (projectConf.workflow.name === 'metagenomics') {
      projectConf.pipeline.forEach(workflow => {
        const workflowResult = metaGWorkflowResult(
          `${outdir}/${path.basename(workflowList[workflow.name].outdir)}`,
          workflow.name,
          proj,
        )
        if (Object.keys(workflowResult[workflow.name]).length > 0) {
          result = {
            ...result,
            ...workflowResult,
          }
        }
      })
    }

    fs.writeFileSync(resultJson, JSON.stringify(result))
  }
}

const checkFlagFile = (proj, jobQueue) => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const outDir = `${projHome}/${workflowList[proj.type].outdir}`
  if (jobQueue === 'local') {
    const flagFile = `${projHome}/.done`
    if (!fs.existsSync(flagFile)) {
      return false
    }
  }
  // check expected output files
  if (proj.type === 'assayDesign') {
    const outJson = `${outDir}/jbrowse/jbrowse_url.json`
    if (!fs.existsSync(outJson)) {
      return false
    }
  }
  return true
}

const getWorkflowCommand = proj => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const projectConf = JSON.parse(fs.readFileSync(`${projHome}/conf.json`))
  const outDir = `${projHome}/${workflowList[projectConf.workflow.name].outdir}`
  let command = ''
  if (proj.type === 'assayDesign') {
    // create bioaiConf.json
    const conf = `${projHome}/bioaiConf.json`
    fs.writeFileSync(
      conf,
      JSON.stringify({
        pipeline: 'bioai',
        params: { ...projectConf.workflow.input, ...projectConf.genomes },
      }),
    )
    command += ` && ${workflowConfig.WORKFLOW.BIOAI_EXEC} -i ${conf} -o ${outDir}`
  }
  return command
}

const validateBulkSubmissionInput = async (bulkExcel, type) => {
  // Parse a file
  const workSheetsFromFile = xlsx.parse(bulkExcel)
  const rows = workSheetsFromFile[0].data.filter(row =>
    // Check if all cells in the row are empty (null, undefined, or empty string after trim)
    row.some(
      cell => cell !== null && cell !== undefined && String(cell).trim() !== '',
    ),
  )
  // Remove header
  rows.shift()
  // validate inputs
  let validInput = true
  let errMsg = ''
  const submissions = []
  if (rows.length === 0) {
    validInput = false
    errMsg += 'ERROR: No submission found in the bulk excel file.\n'
  }

  if (type === 'wastewater') {
    // do some validation for wastewater submission\
  }
  // eslint-disable-next-line consistent-return
  return { validInput, errMsg, submissions }
}

// The output zip file is in the <project home>/output dir, and the zip file name is defined in workflowList[workflow].zip_output
const zipProjectOutputs = async proj => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const projectConf = JSON.parse(fs.readFileSync(`${projHome}/conf.json`))
  if (workflowList[projectConf.workflow.name].zip_output) {
    const zipOutputPath = `${projHome}/output/${workflowList[
      projectConf.workflow.name
    ].zip_output.replaceAll('<PROJECT>', proj.name.replace(/\s+/g, '_'))}`
    if (fs.existsSync(zipOutputPath)) {
      return zipOutputPath
    }
    const cmd = workflowList[projectConf.workflow.name].zip_output_cmd
      .replaceAll('<PROJECT_HOME>', projHome)
      .replaceAll('<ZIP_OUTPUT>', zipOutputPath)
    await execCmd(cmd)
    return zipOutputPath
  }
  return null
}

module.exports = {
  cromwellWorkflows,
  nextflowWorkflows,
  nextflowConfigs,
  workflowList,
  generateNextflowWorkflowParams,
  generateWorkflowResult,
  checkFlagFile,
  getWorkflowCommand,
  validateBulkSubmissionInput,
  zipProjectOutputs,
}
