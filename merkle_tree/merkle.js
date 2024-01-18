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

    validateTransaction(transaction) {
        let saveHash = this.hash(transaction);
        for (let i = 0; i < this.treeData.length; i++) {
            let z = -1;
            for (let j = 0; j < this.treeData[i].length; j++) {
                if (this.treeData[i][j] == saveHash) {
                    saveHash = this.treeData[i][j];
                    z = j;
                    break;
                }
            }
            if (z == -1) {
                return "TRANSACTION not found";
            }

            if (z%2 == 0 && z == this.treeData[i].length -1) {
                saveHash = this.hash(saveHash + saveHash);
            }else if (z % 2 == 0) {
                saveHash = this.hash(saveHash + this.treeData[i][z + 1]);
            } else {
                saveHash = this.hash(this.treeData[i][z - 1] + saveHash);
            }
        }
        return saveHash == this.root;
    }
}

// Example usage
const transactions = ["Tx1", "Tx2", "Tx3", "Tx4", "Tx5"];
const merkleTree = new MerkleTree(transactions);

console.log("Merkle Root:", merkleTree.getRoot());

// Validate a transaction
const transaction1 = "Tx5";
const transaction2 = "TxInvalid";

console.log(`${transaction1} - ${merkleTree.validateTransaction(transaction1)}`);
console.log(`${transaction2} - ${merkleTree.validateTransaction(transaction2)}`);
