require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

module.exports = {
  solidity: '0.8.19',
  paths: {
    sources: './contracts',
    artifacts: '../frontend/src/artifacts',
  },
  networks: {
    primary: {
      url: process.env.PARAM_RPC_PRIMARY_ENDPOINT,
      chainId:  parseInt(process.env.PARAM_RPC_PRIMARY_ENDPOINT_CHAINID,10),
      accounts: [process.env.PARAM_DEPLOY_PRIVATE_KEY],
    },
    secondary: {
      url: process.env.PARAM_RPC_SECONDARY_ENDPOINT,
      chainId: parseInt(process.env.PARAM_RPC_SECONDARY_ENDPOIN_CHAINID, 10),
      accounts: [process.env.PARAM_DEPLOY_PRIVATE_KEY],
    },
  },
}
