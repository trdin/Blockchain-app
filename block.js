const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");

class Block {
    constructor(timestamp = "", data = "", index) {
        this.index = index
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = ""; // previous block's hash
        this.nonce = 0;
        this.difficulty = 1;
    }

    // Our hash function.
    getHash() {
        return SHA256(this.index + this.prevHash + this.timestamp + this.data + this.nonce + this.difficulty);
    }
    mine(difficulty) {
        // Basically, it loops until our hash starts with 
        // the string 0...000 with length of <difficulty>.
        this.difficulty = difficulty;
        while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
            // We increases our nonce so that we can get a whole different hash.
            this.nonce++;
            // Update our new hash with the new nonce value.
            this.hash = this.getHash();
            // console.log(this.hash);
        }

        //console.log("Block Has been mined");
    }
}
module.exports = Block;