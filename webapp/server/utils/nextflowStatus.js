const getNextflowTaskStatus = jobMetadata => {
  const latestStatuses = {}
  jobMetadata.forEach(task => {
    if (task.name && task.status) latestStatuses[task.name] = task.status
  })
  const statuses = Object.values(latestStatuses)
  if (statuses.includes('ABORTED')) return 'Aborted'
  if (statuses.some(status => status !== 'COMPLETED')) return 'Failed'
  return 'Succeeded'
}

const getRunnerJobStatus = status => {
  const statuses = {
    queued: 'Submitted',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    cancelled: 'Aborted',
  }
  return statuses[status]
}

module.exports = {
  getNextflowTaskStatus,
  getRunnerJobStatus,
}
