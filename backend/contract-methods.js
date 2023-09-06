require('dotenv').config()

const mintTokens = async (wallet, provider, contract, amount, fromAddress, nonce) => {
  try {
    console.log("[+] mintTokens");
    // Estimate gas limit for the mint transaction
    const gasLimit = await contract.estimateGas.mint(fromAddress, amount);
    const mintTransaction = await contract.populateTransaction.mint(fromAddress, amount);

    // Get gas price from wallet
    const gasPrice = await wallet.getGasPrice();

    console.debug(" [x] nonce:", nonce);
    console.debug(" [x] gasLimit:", gasLimit);
    console.debug(" [x] gasPrice:", gasPrice);

    // Build the transaction object
    const tx = {
      ...mintTransaction,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    };

    // Send the transaction
    const response = await wallet.sendTransaction(tx);

    console.log(' [I] mintTokens transaction hash:', response.hash);
    console.log(' [I] Visit to block explorer: %s%s', process.env.SECONDARY_EXPLORER, response.hash);

    return true
    
  } catch (err) {
    console.error(' [E] in mintTokens >', err)
    return false
  }
}

// Function to transfer tokens back to the user's wallet
const transferToBackWallet = async (wallet, provider, contract, amount, address, nonce) => {
  try {
    console.log("[+] transferToBackWallet");
    // Estimate gas limit for the transfer transaction
    const gasLimit = await contract.estimateGas.transfer(address, amount);
    const mintTransaction = await contract.populateTransaction.transfer(address, amount);

    // Get gas price from wallet
    const gasPrice = await wallet.getGasPrice();

    console.debug(" [x] nonce:", nonce);
    console.debug(" [x] gasLimit:", gasLimit);
    console.debug(" [x] gasPrice:", gasPrice);

    // Build the transaction object
    const tx = {
      ...mintTransaction,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    };

    // Send the transaction
    const response = await wallet.sendTransaction(tx);
    console.log(' [I] transferToBackWallet transaction hash:', response.hash);
    console.log(' [I] Visit to block explorer: %s%s', process.env.PRIMARY_EXPLORER, response.hash);

    return true
  } catch (err) {
    console.error(' [E] in transferToBackWallet >', err)
    return false
  }
}

// Function to approve tokens for burning
const approveForBurn = async (wallet, provider, contract, amount, nonce) => {
  try {

    console.log("[+] approveForBurn");
    
    const BRIDGE_WALLET = process.env.BRIDGE_WALLET_ADDRESS

    // Estimate gas limit for the approve transaction
    const gasLimit = await contract.estimateGas.approve(BRIDGE_WALLET, amount);
    const mintTransaction = await contract.populateTransaction.approve(BRIDGE_WALLET, amount);
    // Get gas price from wallet
    const gasPrice = await wallet.getGasPrice();

    console.debug(" [x] nonce:", nonce);
    console.debug(" [x] gasLimit:", gasLimit);
    console.debug(" [x] gasPrice:", gasPrice);

    // Build the transaction object
    const tx = {
      ...mintTransaction,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    };

    // Send the transaction
    const response = await wallet.sendTransaction(tx);
    console.log(' [I] approveForBurn transaction hash:', response.hash);
    console.log(' [I] Visit to block explorer: %s%s', process.env.SECONDARY_EXPLORER, response.hash);

    return true
  } catch (err) {
    console.error(' [E] in approveForBurn >', err)
    return false
  }
}

// Function to burn tokens on the secondary network
const burnTokens = async (wallet, provider, contract, amount, nonce) => {
  try {
    console.log("[+] burnTokens");

    const BRIDGE_WALLET = process.env.BRIDGE_WALLET_ADDRESS
    
    // Estimate gas limit for the burn transaction
    const gasLimit = await contract.estimateGas.burnFrom(BRIDGE_WALLET, amount);
    const mintTransaction = await contract.populateTransaction.burnFrom(BRIDGE_WALLET, amount);
    // Get gas price from wallet
    const gasPrice = await wallet.getGasPrice();

    console.debug(" [x] nonce:", nonce);
    console.debug(" [x] gasLimit:", gasLimit);
    console.debug(" [x] gasPrice:", gasPrice);

    // Build the transaction object
    const tx = {
      ...mintTransaction,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    };

    // Send the transaction
    const response = await wallet.sendTransaction(tx);
    console.log(' [I] burnTokens transaction hash:', response.hash);
    console.log(' [I] Visit to block explorer: %s%s', process.env.SECONDARY_EXPLORER, response.hash);

    return true
  } catch (err) {
    console.error(' [E] in burnTokens >', err)
    return false
  }
}

// Export the functions to be used in other modules
module.exports = {
  mintTokens,
  approveForBurn,
  burnTokens,
  transferToBackWallet,
}
