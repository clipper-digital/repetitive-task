const Logger = require('./logger')

class RepetitiveTask {
  constructor (interval) {
    this.interval = interval
    this.isRunning = false
    this.isProcessing = false
    this.logger = this._createLogger(this.constructor.name)
  }

  start () {
    this.logger.info({ interval: this.interval }, 'repetitive task started')
    this.isRunning = true
    this.__process()
  }

  stop () {
    if (!this.isRunning) {
      return Promise.resolve()
    }

    this.isRunning = false

    return new Promise((resolve) => {
      // If we're between tasks, we just need to clear the timeout for the next task
      if (this.timer) {
        clearTimeout(this.timer)
        delete this.timer
        return resolve()
      }

      // We're in the middle of a task, so we need to wait for it to finish
      const waitInterval = setInterval(() => {
        if (!this.isProcessing) {
          clearInterval(waitInterval)
          resolve()
        }
      }, RepetitiveTask._stopWaitInterval)
    })
  }

  _createLogger (name) {
    return new Logger(name)
  }

  _getLogData (task) {
    return {}
  }

  _getTask () {
    return Promise.resolve(true)
  }

  __process () {
    this.isProcessing = this._getTask()
      .then((task) => {
        if (!task) {
          this.logger.info('No pending tasks')
          return
        }

        this.logger.info(this._getLogData(task), 'processing task')
        return this._process(task)
      })
      .catch((error) => {
        this.logger.error({ stack: error.stack }, 'Error processing task')
      })
      .then(() => {
        this.isProcessing = false
        this._queue()
      })
  }

  _queue () {
    if (!this.isRunning) {
      return
    }

    this.timer = setTimeout(() => {
      delete this.timer
      this.__process()
    }, this.interval * 1000)
  }
}

RepetitiveTask._stopWaitInterval = 100

module.exports = RepetitiveTask
