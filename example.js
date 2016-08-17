const irrigation = require('./irrigation')
const RepetitiveTask = require('repetitive-task')

class Gardener extends RepetitiveTask {
  _getTask () {
    return irrigation.getSoilMoisture()
      .then((moistureLevel) => {
        // Only water the garden if the moisture level is below 20%
        if (moistureLevel < 20) {
          return moistureLevel
        }

        return null
      })
  }

  _process (moistureLevel) {
    return irrigation.turnOnWater()
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 5 * 60 * 1000)
        })
      })
      .then(() => irrigation.turnOffWater())
  }
}

const monitor = new Gardener(12 * 60 * 60 * 1000)
monitor.start()
