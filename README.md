# RepetitiveTask [![Build Status](https://travis-ci.org/clipper-digital/repetitive-task.svg?branch=master)](https://travis-ci.org/clipper-digital/repetitive-task)

RepetitiveTask provides a base layer for building time-based repetitive tasks, such as background jobs that run forever.





## Example

Simple task that always runs

```js
const RepetitiveTask = require('repetitive-task')

class CpuMonitor extends RepetitiveTask {
  _process (task) {
    console.log(process.cpuUsage())
  }
}

const monitor = new CpuMonitor(60)
monitor.start()
```

Condition based task

```js
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

const gardener = new Gardener(12 * 60 * 60)
gardener.start()
```




## API - Usage

### `new RepetitiveTask(interval)`

Creates a new `RepetitiveTask` instance.

* `interval` (Number): The interval (in seconds) for the repetitive task.

_NOTE: Tasks don't run on a strict interval. The specified interval is actually the amount of time between the end of one run and the beginning of the next run. This ensures that a long running task will never result in multiple tasks running simultaneously._



### `RepetitiveTask#start()`

Starts the repetitive task.

### `RepetitiveTask#stop() Returns: Promise`

Stops the repetitive task. Stopping the task may be asynchronous since a task may be running at the time of the call. The promise will resolve when the task has completed.





## API - Extending

In order for RepetitiveTask to be useful, you must extend it with your actual task. The following methods are available to customize the behavior of the task.



### `RepetitiveTask#_createLogger(name) Returns: Object`

Creates a logger for the repetitive task.

The built-in logger writes JSON messages to stdout, but can be replaced with any logger that supports the following API:

* `info([data], message)`
* `error([data], message)`

The optional `data` parameter is an object with additional properties to include in the log.



### `RepetitiveTask#_getTask() Returns: Promise`

Gets a task to work on. Depending on the type of task being performed, you may need to determine if there is a task to run at any given time. For example, you may need to pull an item off of a queue and process it. In this case, `_getTask()` should read from the queue and return the item, if any.

Returning a falsy value indicates that there is no task to perform right now.



### `RepetitiveTask#_getLogData(task) Returns: Object`

Gets additional data to log about the task. The object returned from `_getLogData()` will be passed to the logger for the "processing task" message.

* `task` (Mixed): The task object returned from `_getTask()`.



### `RepetitiveTask#_process(task) Returns: Promise`

Processes the task. This is the main function for the repetitive task and is the only method that must be implemented for the task to run.

* `task` (Mixed): The task object returned from `_getTask()`.





## License

Copyright RepetitiveTask contributors.
Released under the terms of the ISC license.
