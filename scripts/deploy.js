const {ethers} = require("hardhat");


async function main(){
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account: " + deployer.address);
  const SimpleCounter = await ethers.getContractFactory("Counter");
  const simpleCounter = await SimpleCounter.deploy();
  console.log("Deploying contract address: " + await simpleCounter.getAddress());
}

main()
.then(() => {process.exit(0);})
.catch(() => {
  console.error(e);
  process.exit(1);
});