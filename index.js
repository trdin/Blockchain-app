
const { Worker } = require('worker_threads')
//BlockChain
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");

const Block = require("./block.js");
const Blockchain = require("./blockchain.js")
//var worker;
var blockchain = new Blockchain();
console.log(blockchain);

function calculateDifficulty(chain) {
    var value = 0;
    chain.forEach(block => {
        value += Math.pow(2, block.difficulty);
    });
    return value;
}

function compareChains(chainHome, chainComing) {
    var valueHome = calculateDifficulty(chainHome);
    var valueComing = calculateDifficulty(chainComing);

    if (valueHome < valueComing) {
        console.log("chain COMING");
        return true;
    } else {
        console.log("chain HOME");
        return false;
    }
}

//argumenti s 
var args = process.argv.slice(2);
console.log(args);
const port = args[0];
const p2p_port = args[1];

//P2P server 
var s_p2p_server = require('http').createServer();
var s_p2p_io = require('socket.io')(s_p2p_server);
var s_p2p = require('socket.io-p2p-server').Server;
s_p2p_io.use(s_p2p);
s_p2p_server.listen(p2p_port);


//P2P client 
var P2P = require('socket.io-p2p');
var c_p2p_io = require('socket.io-client');
//tracking p2p clients secrets
var p2p_secrets = new Map();
//Server
const express = require('express');
const app = express(); // ustvarimo express aplikacijo za usmerjanje http zahtev 
const http = require('http').Server(app);
const io = require('socket.io')(http);

//vzpostavimo spletno stran, ob requestu HTTP GET
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/socket.io.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

app.get('/socket.io-file-client.js', (req, res, next) => {
    return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});


//server povezave
io.on('connection', (socket) => {
    try {
        socket.on("mine", async (msg) => {
            //socket.emit("message", "lol");
            var blockTime = blockchain.blockTime;
            const worker = new Worker('./mine.js', { workerData: blockTime });
            worker.postMessage({
                block: blockchain.getLastBlock(),
                difficulty: blockchain.difficulty
            });
            worker.on("message", async (data) => {

                var block = data.block;
                if (blockchain.addBlock(block)) {
                    //blockchain.difficulty = data.difficulty;
                    io.emit("message", "New block added: " + JSON.stringify(block))
                    io.emit("blockchain", blockchain);
                } else {
                    io.emit("e-message", "new block rejected: " + JSON.stringify(block));
                    //worker.postMessage(JSON.stringify(blockchain.chain));
                }
                worker.postMessage({
                    block: blockchain.getLastBlock(),
                    difficulty: blockchain.difficulty
                });

            });

            worker.on('error', (msg) => { console.log(msg) });
            worker.on('exit', (code) => {
                if (code !== 0)
                    console.log(code);
            })
            //console.log(JSON.stringify(blockchain.chain));

        });
        //p2p
        socket.on("p2p", async (msg) => {
            console.log("p2p --------------------------");
            console.log("message-> " + msg);
            //izpostavi se povezava
            var c_p2p_socket = c_p2p_io("http://localhost:" + msg);
            var c_p2p = new P2P(c_p2p_socket);


            c_p2p.emit("message", "hello");

            c_p2p.on('chain', function (update) {
                //console.log(update);
                console.log("New blockchain arrived");
                io.emit("message", "New blockchain arrived");
                if (compareChains(blockchain.chain, update)) {
                    blockchain.chain = update;
                    blockchain.difficulty = blockchain.getLastBlock().difficulty;
                    //worker.postMessage(JSON.stringify(update));
                    io.emit("blockchain", blockchain);
                    io.emit("message", "New blockchain accepted");
                } else {
                    io.emit("message", "New blockchain NOT accepted");
                }
                /*console.log("after update ------------");
                console.log(blockchain.chain);*/
            });

            socket.on('disconnect', function () { // ko se user disonecta iz nasega serverja
                io.emit('message', 'A user disconnected');
                c_p2p_socket.disconnect();
                c_p2p.disconnect();
            });
            socket.on('disconnect_p2p', function () {
                socket.emit('message', 'A user disconnected');
                c_p2p_socket.disconnect();
                c_p2p.disconnect();
            })
        })

        //p2p server-----------------------------------------
        s_p2p_io.on('connection', (p2p_socket) => {
            //trackanje id-jevi map
            //var secret;
            try {
                io.emit("message", "P2P connceted");
                console.log("P2P connceted");

                var interval_worker = new Worker('./interval.js');
                interval_worker.on('message', async () => {
                    console.log("chain sent");
                    p2p_socket.emit('reply', "Connection succesful");
                    io.emit("message", "P2P connceted");
                    p2p_socket.emit('chain', blockchain.chain);
                    //console.log(blockchain.chain);
                });

                p2p_socket.on("message", async (msg) => {
                    io.emit('message', msg);
                    p2p_socket.emit('reply', "Connection succesful");
                    //p2p_socket.emit('chain', blockchain.chain);
                });

            } catch (e) {
                console.log(e);
            }
        });

        console.log("a user connected")
        socket.on('disconnect', function () { // ko se user disonecta iz nasega serverja
            console.log('A user disconnected');
            io.emit('message', 'A user disconnected');

        });
    } catch (error) {
        console.log(error);
    }

});

http.listen(port, () => { // funkcija  listening server caka na povezavo 
    console.log('listening on: ' + port);
});


