const fs = require('fs')
const { randomUUID } = require('crypto')
const ejs = require('ejs')
const Papa = require('papaparse')
const Job = require('../edge-api/models/job')
const {
  nextflowConfigs,
  workflowList,
  generateNextflowWorkflowParams,
  generateWorkflowResult,
  zipProjectOutputs,
} = require('../workflow/util')
const { write2log } = require('./common')
const { JobRunnerClient } = require('./jobRunnerClient')
const {
  getNextflowTaskStatus,
  getRunnerJobStatus,
} = require('./nextflowStatus')
const logger = require('./logger')
const config = require('../config')

const runnerClient = new JobRunnerClient({
  baseUrl: config.NEXTFLOW.RUNNER.API_BASE_URL,
  token: config.NEXTFLOW.RUNNER.API_TOKEN,
  tokenFile: config.NEXTFLOW.RUNNER.API_TOKEN_FILE,
  timeoutMs: config.NEXTFLOW.RUNNER.API_TIMEOUT_MS,
})

const generateInputs = async (projHome, projectConf, proj) => {
  const workflowSettings = workflowList[projectConf.workflow.name]
  const template = String(fs.readFileSync(workflowSettings.config_tmpl))
  const nfWorkDir = config.NEXTFLOW.WORK_DIR
    ? `${config.NEXTFLOW.WORK_DIR}/${proj.code}/work`
    : `${projHome}/nextflow/work`

  const params = {
    ...projectConf.workflow.input,
    ...projectConf.rawReads,
    project: proj.name,
    projOutdir: `${projHome}/${workflowSettings.outdir}`,
    nextflowWorkDir: nfWorkDir,
    nextflowOutDir: `${projHome}/nextflow`,
    workflow: projectConf.workflow.name,
    profiles: nextflowConfigs.profiles,
    nfReports: nextflowConfigs.nf_reports,
  }
  // get workflow specific params
  const workflowParams = await generateNextflowWorkflowParams(
    projHome,
    projectConf,
    proj,
  )
  // render input template and write to nextflow_params.json
  const inputs = ejs.render(template, { ...params, ...workflowParams })
  await fs.promises.writeFile(`${projHome}/nextflow.config`, inputs)
  return true
}

const getHttpStatus = error => error.response && error.response.status

const isPermanentClientError = error => {
  const status = getHttpStatus(error)
  return status >= 400 && status < 500 && ![408, 429].includes(status)
}

const getErrorMessage = error => {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error
  }
  return error.message || String(error)
}

const getJobMetadata = async proj => {
  const traceFile = `${config.IO.PROJECT_BASE_DIR}/${proj.code}/nextflow/trace.txt`
  if (!fs.existsSync(traceFile)) {
    return []
  }
  // get job metadata in trace.txt, convert tab delimiter file to json
  const jobMetadata = Papa.parse(fs.readFileSync(traceFile).toString(), {
    delimiter: '\t',
    header: true,
    skipEmptyLines: true,
  }).data
  return jobMetadata
}

const generateRunStats = async project => {
  const stats = await getJobMetadata(project)
  fs.writeFileSync(
    `${config.IO.PROJECT_BASE_DIR}/${project.code}/run_stats.json`,
    JSON.stringify({ stats }),
  )
}

const getRunnerInput = (proj, projectConf, jobId) => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const nfWorkDir = config.NEXTFLOW.WORK_DIR
    ? `${config.NEXTFLOW.WORK_DIR}/${proj.code}/work`
    : `${projHome}/nextflow/work`
  const nfOutDir = `${projHome}/nextflow`
  const workflowSettings = workflowList[projectConf.workflow.name]
  const input = {
    configPath: `${projHome}/nextflow.config`,
    workflowPath: workflowSettings.nextflow_main,
    workDir: nfWorkDir,
    nextflowLogPath: `${nfOutDir}/.nextflow.log`,
    logPath: `${nfOutDir}/job-runner.log`,
    donePath: `${nfOutDir}/.job-runner.done`,
    runName: jobId,
    executor: config.NEXTFLOW.EXECUTOR,
  }
  if (workflowSettings.nextflow_profile) {
    input.profile = workflowSettings.nextflow_profile
  }
  return input
}

const submitRunnerJob = (job, proj, projectConf) =>
  runnerClient.submit({
    jobId: job.id,
    projectId: proj.code,
    input: getRunnerInput(proj, projectConf, job.id),
  })

const applySubmittedStatus = async (job, proj, runnerJob) => {
  const status = getRunnerJobStatus(runnerJob.status)
  if (!status) {
    throw new Error(`Unknown Nextflow runner status '${runnerJob.status}'`)
  }
  if (status === 'Running') {
    job.status = status
    proj.status = 'running'
  } else if (status === 'Submitted') {
    job.status = status
    proj.status = 'submitted'
  }
  // Keep a very fast terminal response pollable by the normal monitor, which
  // also performs trace validation and result generation.
  await Promise.all([job.save(), proj.save()])
}

// Persist a job handle before submission so an interrupted HTTP request can be
// retried safely with the same idempotency key.
const submitWorkflow = async (proj, projectConf, inputsize) => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  const nfWorkDir = config.NEXTFLOW.WORK_DIR
    ? `${config.NEXTFLOW.WORK_DIR}/${proj.code}/work`
    : `${projHome}/nextflow/work`
  fs.mkdirSync(nfWorkDir, { recursive: true })
  fs.chmodSync(nfWorkDir, '777')
  if (!fs.existsSync(nfWorkDir)) {
    logger.error(`Error creating directory ${nfWorkDir}:`)
    proj.status = 'failed'
    await proj.save()
    return
  }
  const nfOutDir = `${projHome}/nextflow`
  fs.mkdirSync(nfOutDir, { recursive: true })
  fs.chmodSync(nfOutDir, '777')
  if (!fs.existsSync(nfOutDir)) {
    logger.error(`Error creating directory ${nfOutDir}:`)
    proj.status = 'failed'
    await proj.save()
    return
  }

  const jobId = `edge-${randomUUID()}`
  const newJob = new Job({
    id: jobId,
    project: proj.code,
    type: proj.type,
    inputSize: inputsize,
    queue: 'nextflow',
    status: 'Submitted',
  })
  await newJob.save()
  proj.status = 'submitted'
  await proj.save()

  try {
    const runnerJob = await submitRunnerJob(newJob, proj, projectConf)
    await applySubmittedStatus(newJob, proj, runnerJob)
  } catch (error) {
    const message = getErrorMessage(error)
    write2log(`${projHome}/log.txt`, `Nextflow submission pending: ${message}`)
    logger.error(`Nextflow runner submission failed: ${message}`)
    // A definite client error cannot become successful on retry. Timeouts,
    // rate limits, and server/network failures remain Submitted for recovery.
    if (isPermanentClientError(error)) {
      newJob.status = 'Failed'
      proj.status = 'failed'
      await Promise.all([newJob.save(), proj.save()])
    }
  }
}

const updateJobStatus = async (job, proj) => {
  const projHome = `${config.IO.PROJECT_BASE_DIR}/${proj.code}`
  let runnerJob
  try {
    runnerJob = await runnerClient.get(job.id)
  } catch (error) {
    if (getHttpStatus(error) === 404 && job.status === 'Submitted') {
      const projectConf = JSON.parse(
        fs.readFileSync(`${projHome}/conf.json`, 'utf8'),
      )
      try {
        runnerJob = await submitRunnerJob(job, proj, projectConf)
      } catch (submissionError) {
        if (isPermanentClientError(submissionError)) {
          const message = getErrorMessage(submissionError)
          job.status = 'Failed'
          proj.status = 'failed'
          write2log(
            `${projHome}/log.txt`,
            `Nextflow submission failed: ${message}`,
          )
          await Promise.all([job.save(), proj.save()])
          return
        }
        throw submissionError
      }
    } else {
      throw error
    }
  }

  let newStatus = getRunnerJobStatus(runnerJob.status)
  if (!newStatus) {
    throw new Error(`Unknown Nextflow runner status '${runnerJob.status}'`)
  }
  if (newStatus === 'Succeeded') {
    newStatus = getNextflowTaskStatus(await getJobMetadata(proj))
  }

  const statusChanged = job.status !== newStatus
  const previousProjectStatus = proj.status
  if (statusChanged) {
    if (newStatus === 'Submitted') {
      proj.status = 'submitted'
    } else if (newStatus === 'Running') {
      proj.status = 'running'
    } else if (newStatus === 'Succeeded') {
      logger.info('generate workflow result.json')
      try {
        generateWorkflowResult(proj)
        await zipProjectOutputs(proj)
        proj.status = 'complete'
      } catch (error) {
        newStatus = 'Failed'
        proj.status = 'failed'
        write2log(`${projHome}/log.txt`, `Result generation failed: ${error}`)
      }
    } else {
      proj.status = 'failed'
    }
    const detail = runnerJob.error ? `: ${runnerJob.error}` : ''
    write2log(
      `${projHome}/log.txt`,
      `Nextflow job status: ${newStatus}${detail}`,
    )
  }
  job.status = newStatus
  // Recover the project-side state if the cron process stopped after storing
  // the handle but before updating the Project document.
  if (newStatus === 'Submitted') proj.status = 'submitted'
  if (newStatus === 'Running') proj.status = 'running'
  await job.save()
  if (proj.status !== previousProjectStatus) await proj.save()
}

const abortJob = async (proj, existingJob) => {
  const job = existingJob || (await Job.findOne({ project: proj.code }))
  if (!job) return
  try {
    await runnerClient.cancel(job.id)
    job.status = 'Aborted'
    await job.save()
    write2log(
      `${config.IO.PROJECT_BASE_DIR}/${proj.code}/log.txt`,
      'Nextflow job aborted.',
    )
  } catch (error) {
    if (getHttpStatus(error) === 404) {
      job.status = 'Aborted'
      await job.save()
      return
    }
    throw error
  }
}

module.exports = {
  generateInputs,
  submitWorkflow,
  generateRunStats,
  abortJob,
  getJobMetadata,
  updateJobStatus,
}
