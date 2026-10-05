/* eslint-disable no-undef */
const {
  getNextflowTaskStatus,
  getRunnerJobStatus,
} = require('../utils/nextflowStatus')

describe('Nextflow status mapping', () => {
  test('uses the latest task status when a task was retried', () => {
    expect(
      getNextflowTaskStatus([
        { name: 'ASSEMBLY (sample)', status: 'FAILED' },
        { name: 'ASSEMBLY (sample)', status: 'COMPLETED' },
        { name: 'REPORT', status: 'COMPLETED' },
      ]),
    ).toBe('Succeeded')
  })

  test('retains failed and aborted task outcomes', () => {
    expect(
      getNextflowTaskStatus([{ name: 'ASSEMBLY', status: 'FAILED' }]),
    ).toBe('Failed')
    expect(
      getNextflowTaskStatus([{ name: 'ASSEMBLY', status: 'ABORTED' }]),
    ).toBe('Aborted')
  })

  test('maps durable runner states to existing EDGE job states', () => {
    expect(getRunnerJobStatus('queued')).toBe('Submitted')
    expect(getRunnerJobStatus('running')).toBe('Running')
    expect(getRunnerJobStatus('succeeded')).toBe('Succeeded')
    expect(getRunnerJobStatus('failed')).toBe('Failed')
    expect(getRunnerJobStatus('cancelled')).toBe('Aborted')
  })
})
