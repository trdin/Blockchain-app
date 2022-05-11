const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const Block = require("./block.js");
function gethash(block) {
    return SHA256(block.index + block.prevHash + block.timestamp + block.data + block.nonce + block.difficulty);
}
class Blockchain {
    constructor() {
        this.chain = [new Block(Date.now().toString(), "blockData", 0)];
        this.blockTime = 10000;
        this.difficulty = 1;
        this.diffAdjustInterval = 10;
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    getIndex() {
        return this.chain.length;
    }

    addBlock(block) {
        block.prevHash = this.getLastBlock().hash;
        //block.hash = block.getHash();
        //block.mine(this.difficulty);
        //prej ko ga das not preveri ce je bila veriga spremenjena

        var prevBlock = this.getLastBlock();
        if (prevBlock.hash == block.prevHash && (prevBlock.index + 1) == block.index && block.hash == gethash(block) && (Date.now() - parseInt(block.timestamp)) < 60000 && (parseInt(prevBlock.timestamp) - parseInt(block.timestamp)) < 60000) {
            this.chain.push(block);

            if (this.chain.length > this.diffAdjustInterval + 1) {

                var prevAdjustmentBlock = this.chain[this.chain.length - this.diffAdjustInterval]
                var timeExpected = this.blockTime * this.diffAdjustInterval
                var timeTaken = block.timestamp - prevAdjustmentBlock.timestamp

                if (timeTaken < (timeExpected / 2)) {
                    this.difficulty++;
                }
                else if (timeTaken > (timeExpected * 2)) {
                    if (this.difficulty > 1) {
                        this.difficulty--;
                    }

                }
            }
            return true;
        }
        return false;

    }
}

module.exports = Blockchain;