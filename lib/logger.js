class Logger {
  constructor (name) {
    this.name = name
  }

  error (data, message) {
    this._message({ level: 'error', data, message })
  }

  info (data, message) {
    this._message({ level: 'info', data, message })
  }

  _message ({ data, message, level }) {
    if (typeof data === 'string') {
      message = data
      data = {}
    }

    const log = Object.assign({}, data, {
      level,
      message,
      name: this.name,
      time: new Date()
    })
    console.log(JSON.stringify(log))
  }
}

module.exports = Logger
