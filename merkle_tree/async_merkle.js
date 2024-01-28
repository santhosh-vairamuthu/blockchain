const crypto = require("crypto");

class MerkleTree {
    constructor(transactions) {
        this.treeData = [];
        this.transactions = transactions;
        this.tree = this.buildTree();
        this.root = this.tree.length > 0 ? this.tree[0] : null;
    }

    buildLevel(nodes) {
        let level = [];
        for (let i = 0; i < nodes.length; i += 2) {
            let left = nodes[i];
            let right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];

            let hash = this.hash(left + right);
            level.push(hash);
        }
        return level;
    }

    buildTree() {
        let level = this.transactions.map((transaction) => this.hash(transaction));
        if (level.length % 2 === 1) {
            level.push(level[level.length - 1]);
        }
        while (level.length > 1) {
            this.treeData.push(level.slice());
            level = this.buildLevel(level);
        }

        return level;
    }

    hash(data) {
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    getRoot() {
        return this.root;
    }

    findIndex(x,y){
        let z = x <= y ? x : y;
        return z/2;
    }

    findNeighbors(saveHash, z , i){
        let p = -1;
        if (z%2 == 0 && z == this.treeData[i].length -1) {
            saveHash = this.hash(saveHash + saveHash);
            p=z;
        }else if (z % 2 == 0) {
            saveHash = this.hash(saveHash + this.treeData[i][z + 1]);
            p = z+1;
        } else {
            saveHash = this.hash(this.treeData[i][z - 1] + saveHash);
            p = z-1;
        }
        return {saveHash,p};
    }

    async validateTransaction(transaction) {
        return new Promise((resolve, reject) => {
            let saveHash = this.hash(transaction);
            let z = -1, p = -1;

            for (let j = 0; j < this.treeData[0].length; j++) {
                if (this.treeData[0][j] == saveHash) {
                    z = j;
                    break;
                }
            }

            if (z == -1) {
                reject("TRANSACTION not found");
                return;
            }
            const obj = this.findNeighbors(saveHash,z,0);
        
            saveHash = obj.saveHash;
            p = obj.p;


            const validateAsync = async (i, saveHash, z) => {
                let index = this.findIndex(z, p);

                for (; i < this.treeData.length; i++) {
                    let newHashIndex = -1, neighborIndex = -1;

                    if (this.treeData[i][index] === saveHash) {
                        newHashIndex = index;
                    }

                    if (newHashIndex == -1) {
                        reject("TRANSACTION not found");
                        return;
                    }

                    const obj2 = this.findNeighbors(saveHash, newHashIndex, i);
                    saveHash = obj2.saveHash;
                    neighborIndex = obj2.p;

                    index = this.findIndex(newHashIndex, neighborIndex);
                }

                resolve(saveHash == this.root);
            };

            validateAsync(1, saveHash, z);
        });
    }
}

// Example usage
const transactions = ["Tx1", "Tx2", "Tx3", "Tx4", "Tx5", "Tx6", "Tx7", "Tx8", "Tx9", "Tx10", "Tx11"];
const merkleTree = new MerkleTree(transactions);

console.log("Merkle Root:", merkleTree.getRoot());

// Validate a transaction asynchronously
const transaction1 = "Tx1";
const transaction2 = "TxInvalid";

let t1 = performance.now();
merkleTree.validateTransaction(transaction1)
    .then(result => {
        console.log(`${transaction1} - ${result}`);
        let t2 = performance.now();
        console.log(`Time taken for ${transaction1}: ${t2 - t1} ms`);
    })
    .catch(error => console.error(error));

merkleTree.validateTransaction(transaction2)
    .then(result => {
        console.log(`${transaction2} - ${result}`);
        let t2 = performance.now();
        console.log(`Time taken for ${transaction2}: ${t2 - t1} ms`);
    })
    .catch(error => {
        console.log(`${transaction2} - ${error}`);
        let t2 = performance.now();
        console.log(`Time taken for ${transaction2}: ${t2 - t1} ms`);
    });