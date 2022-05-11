
const { parentPort } = require('worker_threads')
const interval = setInterval(function () {
    parentPort.postMessage("now");
}, 20000);