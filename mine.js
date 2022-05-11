
const { parentPort, workerData } = require('worker_threads')
const Block = require("./block.js");
const Blockchain = require("./blockchain.js")

var blockTime = workerData;
var rand = Math.floor(Math.random() * 100) + 1;



//parentPort.postMessage("mine");
parentPort.on('message', (data) => {
    var prevblock = data.block;
    var difficulty = data.difficulty;
    //console.log(data);


    var block = new Block(Date.now().toString(), "blockData" + rand, prevblock.index + 1);

    block.prevHash = prevblock.hash;
    //console.log(block);
    block.mine(difficulty);

    var returnData = {
        block: block,
        //difficulty: difficulty
    }
    parentPort.postMessage(returnData);
});



