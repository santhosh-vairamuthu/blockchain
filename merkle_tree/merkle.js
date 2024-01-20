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
        let leaves = this.transactions.map((tx) => this.hash(tx));
        if (leaves.length % 2 === 1) {
            leaves.push(leaves[leaves.length - 1]);
        }
        let tree = leaves.slice();

        while (tree.length > 1) {
            this.treeData.push(tree.slice());
            tree = this.buildLevel(tree);
        }

        return tree;
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

    validateTransaction(transaction) {
        let saveHash = this.hash(transaction);
        let z = -1,p=-1;

        for (let j = 0; j < this.treeData[0].length; j++) {
            if (this.treeData[0][j] == saveHash) {
                z = j;
                break;
            }
        }

        if (z == -1) {
            return "TRANSACTION not found";
        }

        const obj = this.findNeighbors(saveHash,z,0);
        
        saveHash = obj.saveHash;
        p = obj.p;

        let index = this.findIndex(z,p);


        for (let i = 1; i < this.treeData.length; i++) {

            let newHashIndex = -1,neighborIndex = -1;

            if (this.treeData[i][index] === saveHash) {
                newHashIndex = index;
            } 

            if (newHashIndex == -1) {
                return "TRANSACTION not found";
            }
            
            const obj2 = this.findNeighbors(saveHash, newHashIndex,i);
            
            saveHash = obj2.saveHash;
            neighborIndex = obj2.p;

            index = this.findIndex(newHashIndex, neighborIndex);
        }

        return saveHash == this.root;
    }
}

// Example usage
const transactions = ["Tx1", "Tx2", "Tx3", "Tx4", "Tx5", "Tx6", "Tx7", "Tx8"];
const merkleTree = new MerkleTree(transactions);

console.log("Merkle Root:", merkleTree.getRoot());

// Validate a transaction
const transaction1 = "Tx1";
const transaction2 = "TxInvalid";

console.log(`${transaction1} - ${merkleTree.validateTransaction(transaction1)}`);
console.log(`${transaction2} - ${merkleTree.validateTransaction(transaction2)}`);

// for(let i = 0; i <merkleTree.treeData.length; i++){
//     console.log(merkleTree.treeData[i]);
// }