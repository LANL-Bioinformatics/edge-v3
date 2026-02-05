const fs = require('fs')
const xlsx = require('node-xlsx').default
const Papa = require('papaparse')
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
]
const nextflowConfigs = {
  executor_config: {
    slurm: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/configsslurm.config`,
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
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  assembly: {
    outdir: 'output/Assembly',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  annotation: {
    outdir: 'output/Annotation',
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
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  taxonomy: {
    outdir: 'output/Taxonomy',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  phylogeny: {
    outdir: 'output/Phylogeny',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  refBased: {
    outdir: 'output/RefBased',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
  geneFamily: {
    outdir: 'output/GeneFamily',
    nextflow_main: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/nextflow/main.nf`,
    config_tmpl: `${config.NEXTFLOW.WORKFLOW_DIR}/metagenomics/templates/workflow_config.tmpl`,
  },
}

// eslint-disable-next-line no-unused-vars
const generateNextflowWorkflowParams = async (projHome, projectConf, proj) => {
  const params = {}
  if (projectConf.workflow.name === 'sra2fastq') {
    // download sra data to shared directory
    params.sraOutdir = config.IO.SRA_BASE_DIR
  }
  return params
}

const generateWorkflowResult = proj => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const resultJson = `${projHome}/result.json`

  if (!fs.existsSync(resultJson)) {
    const result = {}
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
      const statsJsonFile = `${outdir}/QC.stats.json`
      if (fs.existsSync(statsJsonFile)) {
        result.stats = JSON.parse(fs.readFileSync(statsJsonFile))
      }
      const summaryPlotsFile = `${outdir}/QC_summary_plots.html`
      if (fs.existsSync(summaryPlotsFile)) {
        result.summaryPlots = `${workflowList[projectConf.workflow.name].outdir}/QC_summary_plots.html`
      }
      const reportFile = `${outdir}/QC_final_report.html`
      if (fs.existsSync(reportFile)) {
        result.report = `${workflowList[projectConf.workflow.name].outdir}/QC_final_report.html`
      }
      const reportLongReadsFile = `${outdir}/NanoPlot-report.html`
      if (fs.existsSync(reportLongReadsFile)) {
        result.report = `${workflowList[projectConf.workflow.name].outdir}/NanoPlot-report.html`
      }
    } else if (projectConf.workflow.name === 'assembly') {
      const statsFile = `${outdir}/contigs_stats.txt`
      if (fs.existsSync(statsFile)) {
        result.stats = Papa.parse(fs.readFileSync(statsFile).toString(), {
          delimiter: '\t',
          header: true,
          skipEmptyLines: true,
        }).data
      }
      const reportFile = `${outdir}/final_report.pdf`
      if (fs.existsSync(reportFile)) {
        result.report = `${workflowList[projectConf.workflow.name].outdir}/final_report.pdf`
      }
    } else if (projectConf.workflow.name === 'phylogeny') {
      const treeAllHtml = `${outdir}/SNPphyloTree.all.html`
      if (fs.existsSync(treeAllHtml)) {
        result.treeAllHtml = `${workflowList[projectConf.workflow.name].outdir}/SNPphyloTree.all.html`
      }
      const treeCdsHtml = `${outdir}/SNPphyloTree.cds.html`
      if (fs.existsSync(treeCdsHtml)) {
        result.treeCdsHtml = `${workflowList[projectConf.workflow.name].outdir}/SNPphyloTree.cds.html`
      }
    } else if (projectConf.workflow.name === 'antiSmash') {
      // antiSMASH HTML output
      const antiSmashHtml = `${outdir}/output/index.html`
      if (fs.existsSync(antiSmashHtml)) {
        result.antiSmashHtml = `${workflowList[projectConf.workflow.name].outdir}/output/index.html`
      }
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
}
