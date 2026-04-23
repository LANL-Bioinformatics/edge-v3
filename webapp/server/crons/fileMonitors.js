const findRemoveSync = require('find-remove')
const logger = require('../utils/logger')
const config = require('../config')

const cleanupTempFiles = () => {
  logger.debug('Clean up temp files')
  const tempDir = config.IO.TEMP_DIR
  const ONE_HOUR = 60 * 60 * 1000
  findRemoveSync(tempDir, { age: ONE_HOUR })
}

module.exports = {
  cleanupTempFiles,
}
