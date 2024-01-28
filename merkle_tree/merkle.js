const crypto = require("crypto");

class MerkleTree {
    // Constructor initializes the MerkleTree object with transactions and builds the tree
    constructor(transactions) {
        this.treeData = []; // Holds the levels of the Merkle tree
        this.transactions = transactions; // List of transactions
        this.tree = this.buildTree(); // Build the Merkle tree
        this.root = this.tree.length > 0 ? this.tree[0] : null; // Root of the Merkle tree
    }

    // Build a level of the Merkle tree based on the given nodes
    buildLevel(nodes) {
        let level = [];
        for (let i = 0; i < nodes.length; i += 2) {
            let left = nodes[i];
            let right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
            let hash = this.hash(left + right); // Concatenate and hash left and right nodes
            level.push(hash);
        }
        return level;
    }

    // Build the entire Merkle tree from the list of transactions
    buildTree() {
        let level = this.transactions.map((transaction) => this.hash(transaction)); // Convert transactions to hash values
        if (level.length % 2 === 1) {
            level.push(level[level.length - 1]); // Duplicate the last hash if the number of transactions is odd
        }
        while (level.length > 1) {
            this.treeData.push(level.slice()); // Store the current level in treeData
            level = this.buildLevel(level); // Build the next level
        }
        return level; // Return the final level, which is the root of the Merkle tree
    }

    // Hash data using the SHA-256 algorithm
    hash(data) {
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    // Get the root of the Merkle tree
    getRoot() {
        return this.root;
    }

    // Calculate the index for a given pair of indices x and y
    findIndex(x, y) {
        let z = x <= y ? x : y;
        return z / 2;
    }

    // Find neighbors of a given hash position in a specific level of the tree
    findNeighbors(saveHash, z, i) {
        let p = -1;
        if (z % 2 === 0 && z === this.treeData[i].length - 1) {
            saveHash = this.hash(saveHash + saveHash);
            p = z;
        } else if (z % 2 === 0) {
            saveHash = this.hash(saveHash + this.treeData[i][z + 1]);
            p = z + 1;
        } else {
            saveHash = this.hash(this.treeData[i][z - 1] + saveHash);
            p = z - 1;
        }
        return { saveHash, p };
    }

    // Validate a transaction in the Merkle tree
    validateTransaction(transaction) {
        let saveHash = this.hash(transaction);
        let z = -1, p = -1;

        // Search for the transaction in the first level of the tree
        for (let j = 0; j < this.treeData[0].length; j++) {
            if (this.treeData[0][j] == saveHash) {
                z = j;
                break;
            }
        }

        if (z == -1) {
            return "TRANSACTION not found";
        }

        const obj = this.findNeighbors(saveHash, z, 0);

        saveHash = obj.saveHash;
        p = obj.p;

        let index = this.findIndex(z, p);

        // Iterate through the remaining levels of the tree to validate the transaction
        for (let i = 1; i < this.treeData.length; i++) {
            let newHashIndex = -1, neighborIndex = -1;

            if (this.treeData[i][index] === saveHash) {
                newHashIndex = index;
            }

            if (newHashIndex == -1) {
                return "TRANSACTION not found";
            }

            const obj2 = this.findNeighbors(saveHash, newHashIndex, i);

            saveHash = obj2.saveHash;
            neighborIndex = obj2.p;

            index = this.findIndex(newHashIndex, neighborIndex);
        }

        // Return true if the calculated hash matches the root of the Merkle tree
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

let t1 = performance.now();
console.log(`${transaction1} - ${merkleTree.validateTransaction(transaction1)}`);
let t2 = performance.now();
console.log(`Time taken for ${transaction1}: ${t2 - t1} ms`);
console.log(`${transaction2} - ${merkleTree.validateTransaction(transaction2)}`);
t2 = performance.now();
console.log(`Time taken for ${transaction2}: ${t2 - t1} ms`);
