const Logger = require('../lib/logger')
const RepetitiveTask = require('../lib/repetitive-task')
const sinon = require('sinon')

exports.RepetitiveTask = {
  setUp (done) {
    sinon.stub(Logger.prototype, '_message')
    this.task = new RepetitiveTask(1)
    done()
  },

  tearDown (done) {
    Logger.prototype._message.restore()
    done()
  },

  ['__process success'] (test) {
    const task = {}

    let _resolve
    this.task._process = sinon.stub().returns(new Promise((resolve) => {
      _resolve = resolve
    }))
    sinon.stub(this.task, '_getTask').returns(Promise.resolve(task))
    sinon.stub(this.task, '_queue')

    this.task.__process()

    test.equal(!!this.task.isProcessing, true, 'isProcessing while processing')
    test.equal(this.task._queue.callCount, 0, '_queue() not called while processing')

    _resolve()
    setTimeout(() => {
      test.equal(this.task.isProcessing, false, 'isProcessing after processing')
      test.equal(this.task._process.callCount, 1, '_process() callCount')
      test.deepEqual(this.task._process.args[0], [task], '_process arguments')
      test.equal(this.task._queue.callCount, 1, '_queue() called after processing')

      test.done()
    })
  },

  ['__process - _getTask() error'] (test) {
    this.task._process = sinon.stub()
    sinon.stub(this.task, '_getTask').returns(Promise.reject(new Error()))
    sinon.stub(this.task, '_queue')

    this.task.__process()

    test.equal(!!this.task.isProcessing, true, 'isProcessing while processing')
    test.equal(this.task._queue.callCount, 0, '_queue() not called while processing')

    setTimeout(() => {
      test.equal(this.task.isProcessing, false, 'isProcessing after processing')
      test.equal(this.task._process.callCount, 0, '_process() callCount')
      test.equal(this.task._queue.callCount, 1, '_queue() called after processing')

      test.done()
    })
  },

  ['__process - _process() error'] (test) {
    const task = {}

    let _reject
    this.task._process = sinon.stub().returns(new Promise((resolve, reject) => {
      _reject = reject
    }))
    sinon.stub(this.task, '_getTask').returns(Promise.resolve(task))
    sinon.stub(this.task, '_queue')

    this.task.__process()

    test.equal(!!this.task.isProcessing, true, 'isProcessing while processing')
    test.equal(this.task._queue.callCount, 0, '_queue() not called while processing')

    _reject(new Error())
    setTimeout(() => {
      test.equal(this.task.isProcessing, false, 'isProcessing after processing')
      test.equal(this.task._process.callCount, 1, '_process() callCount')
      test.deepEqual(this.task._process.args[0], [task], '_process arguments')
      test.equal(this.task._queue.callCount, 1, '-queue() called after processing')

      test.done()
    })
  },

  ['queue while not running'] (test) {
    const setTimeoutStub = sinon.stub(global, 'setTimeout')

    this.task._queue()

    test.equal(setTimeoutStub.callCount, 0, 'setTimeout() callCount')

    setTimeoutStub.restore()
    test.done()
  },

  ['queue while running'] (test) {
    const realSetTimeout = setTimeout
    const clock = sinon.useFakeTimers()
    sinon.stub(this.task, '__process')

    this.task.isRunning = true

    this.task._queue()

    test.equal(!!this.task.timer, true, 'timer set')
    realSetTimeout(() => {
      clock.tick(500)
      test.equal(this.task.__process.callCount, 0, '__process() not called at 500')
      realSetTimeout(() => {
        clock.tick(500)
        test.equal(this.task.timer, undefined, 'timer cleared')
        test.equal(this.task.__process.callCount, 1, '__process() called at 1000')

        clock.restore()
        test.done()
      })
    })
  },

  start (test) {
    sinon.stub(this.task, '__process')

    test.equal(this.task.isRunning, false, 'not running before start')

    this.task.start()

    test.equal(this.task.isRunning, true, 'running after start')
    test.equal(this.task.__process.callCount, 1, '__process() callCount')

    test.done()
  },

  ['stop while not running'] (test) {
    const stopPromise = this.task.stop()

    test.equal(this.task.isRunning, false, 'not running after stop')
    stopPromise.then(() => {
      test.done()
    })
  },

  ['stop while not processing'] (test) {
    const clearTimeoutStub = sinon.stub(global, 'clearTimeout')

    this.task.isRunning = true
    this.task.timer = 25

    const stopPromise = this.task.stop()

    test.equal(this.task.isRunning, false, 'not running after stop')
    stopPromise.then(() => {
      test.equal(clearTimeoutStub.callCount, 1, 'clearTimeout() callCount')
      test.deepEqual(clearTimeoutStub.args[0], [25], 'clearTimeout() arguments')
      test.equal(this.task.timer, undefined, 'timer cleared')

      clearTimeoutStub.restore()
      test.done()
    })
  },

  ['stop while processing'] (test) {
    const realSetTimeout = setTimeout
    const clock = sinon.useFakeTimers()

    this.task.isRunning = true
    this.task.isProcessing = new Promise(() => {})
    const stopPromise = this.task.stop()

    test.equal(this.task.isRunning, false, 'not running after stop')

    stopPromise.then(() => {
      test.equal(ticks, 3, 'stopped after isProcessing is set to false')
      test.equal(this.task.timer, undefined, 'timer cleared')

      clock.restore()
      test.done()
    })

    let ticks = 0
    clock.tick(RepetitiveTask._stopWaitInterval)
    ticks++
    realSetTimeout(() => {
      clock.tick(RepetitiveTask._stopWaitInterval)
      ticks++
      realSetTimeout(() => {
        this.task.isProcessing = false
        clock.tick(RepetitiveTask._stopWaitInterval)
        ticks++
        realSetTimeout(() => {
          clock.tick(RepetitiveTask._stopWaitInterval)
          ticks++
        })
      })
    })
  }
}
