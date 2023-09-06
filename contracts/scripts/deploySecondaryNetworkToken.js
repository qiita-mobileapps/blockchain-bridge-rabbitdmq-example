require('dotenv').config(); // Load environment variables from a .env file.

const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy a contract named 'SecondaryNetworkToken' with the provided wallet address and a value of 5.
  const contract = await hre.ethers.deployContract('SecondaryNetworkToken', [process.env.PARAM_BRIDGE_WALLET_ADDRESS]);
  await contract.waitForDeployment();

  // Print the deployment information, including the endpoint and contract address.
  console.log("Deployed to:", process.env.PARAM_RPC_SECONDARY_ENDPOINT);
  console.log("SecondaryNetworkToken address:", contract.target);
};

main()
  .then(() => process.exit(0)) // Exit with a status code of 0 on success.
  .catch((error) => {
    console.error(error); // Print any errors that occur during execution.
    process.exit(1); // Exit with a status code of 1 on failure.
  });
