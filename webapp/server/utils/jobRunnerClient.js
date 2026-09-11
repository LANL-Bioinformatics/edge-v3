const fs = require('fs')
const axios = require('axios')

const readSecret = (value, file) => {
  if (value && value.trim()) {
    return value.trim()
  }
  if (file && file.trim()) {
    return fs.readFileSync(file.trim(), 'utf8').trim()
  }
  return ''
}

class JobRunnerClient {
  constructor({ baseUrl, token, tokenFile, timeoutMs, httpClient = axios }) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = readSecret(token, tokenFile)
    this.timeoutMs = timeoutMs
    this.httpClient = httpClient
  }

  headers(extra = {}) {
    const headers = { ...extra }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  async submit(job) {
    const response = await this.httpClient.post(`${this.baseUrl}/jobs`, job, {
      headers: this.headers({ 'Idempotency-Key': job.jobId }),
      timeout: this.timeoutMs,
    })
    return response.data
  }

  async get(jobId) {
    const response = await this.httpClient.get(
      `${this.baseUrl}/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: this.headers(),
        timeout: this.timeoutMs,
      },
    )
    return response.data
  }

  async cancel(jobId) {
    const response = await this.httpClient.delete(
      `${this.baseUrl}/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: this.headers(),
        timeout: this.timeoutMs,
      },
    )
    return response.data
  }
}

module.exports = {
  JobRunnerClient,
  readSecret,
}
