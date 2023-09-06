/*
    Send a queue to RabbitMQ.
    Monitor transaction events on the blockchain and send messages to a RabbitMQ queue based on the events.
*/

// Import required libraries and modules
const ethers = require('ethers');
const amqp = require('amqplib/callback_api');
require('dotenv').config()

// Import contract methods from another file
const {
    mintTokens,
    approveForBurn,
    burnTokens,
    transferToBackWallet,
} = require('./contract-methods.js')

// Get contract addresses and wallet information from environment variables
const PRIMARY_TOKEN_CONTRACT_ADDRESS = process.env.PRIMARY_TOKEN_CONTRACT_ADDRESS
const SECONDARY_TOKEN_CONTRACT_ADDRESS = process.env.SECONDARY_TOKEN_CONTRACT_ADDRESS
const BRIDGE_WALLET = process.env.BRIDGE_WALLET_ADDRESS
const BRIDGE_WALLET_KEY = process.env.BRIDGE_WALLET_PRIVATE_KEY
const PRIMARY_QUEUE = process.env.PRIMARY_QUEUE_STRING
const SECONDARY_QUEUE = process.env.SECONDARY_QUEUE_STRING
const NONE_ADDR_WALLET = process.env.NONE_ADDR_WALLET
const PRIMARY_HTTPS_ENDPOINT= process.env.PRIMARY_HTTPS_ENDPOINT;
const SECONDARY_HTTPS_ENDPOINT = process.env.SECONDARY_HTTPS_ENDPOINT;

// Import contract ABIs (Application Binary Interfaces)
// This will be edited to match your Chain Code name.
const PRIMARY_ABI = require('./abi/PrimaryNetworkToken.json')
const SECONDARY_ABI = require('./abi/SecondaryNetworkToken.json')

function sleep(ms, random = 0) {
    return new Promise(resolve => setTimeout(resolve, ms + Math.random() * random));
}

// Function to handle events from the primary token contract
const handlePrimaryEvent = async(from, to, value) => {
    console.log("[+] handlePrimaryEvent");
    // Check if the transfer is a bridge back transaction
    if (from == BRIDGE_WALLET) {
        console.log(' [I] Transfer is a bridge back tx')
        return
    }
    // Check if the transfer is to the bridge and not from the bridge
    if (to == BRIDGE_WALLET && to != from) {

        console.log(' [I] The transfer.')

        console.log(" [x] from:", from);
        console.log(" [x] to:", to);
        console.log(" [x] value:", value);

        try {

            amqp.connect('amqp://localhost', function(connectErr, connection) {
                if (connectErr) {
                    throw connectErr;
                }
                connection.createConfirmChannel(async function(createConfirmErr, channel) {
                    if (createConfirmErr) {
                        throw createConfirmErr;
                    }
            
                    var queue = PRIMARY_QUEUE;
                    var msg = from + '|' +  to + '|' + value;

                    channel.sendToQueue(queue, Buffer.from(msg), { persistent: true }, function (err) {
                        // debug
                        console.log(" [x] Response: events-consumer >> ", err ? "NACK" : "ACK", err);
                    });

                    console.log(" [x] sendToQueue %s", msg);
                    console.log('[I] SUCCESS: Successfully executed the handlePrimaryEvent Queueing.');
                    await sleep(1500, 1000);

                });

            });
            
            return
            
        } catch (err) {
            console.error(' [E] processing transaction', err)
        }

    } else {
        console.log(' [W] Another transfer')
    }
}

// Function to handle events from the secondary token contract
const handleSecondaryEvent = async(from, to, value) => {
    console.log("[+] handleSecondaryEvent");
    // Check if the tokens were minted
    if (from === NONE_ADDR_WALLET) {
        console.log(' [I] Tokens minted')
        return
    }
    // Check if the transfer is from the bridge to the user
    if (to === BRIDGE_WALLET && to != from) {
        console.log(' [I] to back from bridge.')
        try {

            console.log(" [x] from:", from);
            console.log(" [x] to:", to);
            console.log(" [x] value:", value);
    
            amqp.connect('amqp://localhost', function(connectErr, connection) {
                if (connectErr) {
                    throw connectErr;
                }
                connection.createConfirmChannel(async function(createConfirmErr, channel) {
                    if (createConfirmErr) {
                        throw createConfirmErr;
                    }

                    var queue = SECONDARY_QUEUE;
                    var msg = from + '|' +  to + '|' + value;
    
                    channel.sendToQueue(queue, Buffer.from(msg), { persistent: true }, function (err) {
                        // debug
                        console.log(" [x] Response: events-consumer >> ", err ? "NACK" : "ACK", err);
                    });
        
                    console.log(" [x] sendToQueue %s", msg);
                    console.log('[I] SUCCESS: Successfully executed the handleSecondaryEvent Queueing.');
                    await sleep(1500, 1000);

                });

            });

            return

        } catch (err) {
            console.error('[E] processing transaction', err)
        }
    } else {
        console.log('[W] Something else triggered Transfer event')
    }
}

// Main function
const main = async() => {
    // Create JSON RPC providers for primary and secondary networks
    const primaryRpcProvider = new ethers.providers.JsonRpcProvider(PRIMARY_HTTPS_ENDPOINT);
    const secondaryRpcProvider = new ethers.providers.JsonRpcProvider(SECONDARY_HTTPS_ENDPOINT);

    // Create wallets for the bridge on primary and secondary networks
    const primaryWallet = new ethers.Wallet(String(BRIDGE_WALLET_KEY), primaryRpcProvider);
    const secondaryWallet = new ethers.Wallet(String(BRIDGE_WALLET_KEY), secondaryRpcProvider);

    // Create contract instances for the primary and secondary token contracts
    const primaryTokenContract = new ethers.Contract(PRIMARY_TOKEN_CONTRACT_ADDRESS, PRIMARY_ABI.abi, primaryWallet);
    const secondaryTokenContract = new ethers.Contract(SECONDARY_TOKEN_CONTRACT_ADDRESS, SECONDARY_ABI.abi, secondaryWallet);

    // Listen for "Transfer" events on both token contracts and call corresponding event handlers
    primaryTokenContract.on("Transfer", async(from, to, value) => {
        await handlePrimaryEvent(from, to, value);
    });
    secondaryTokenContract.on("Transfer", async(from, to, value) => {
        await handleSecondaryEvent(from, to, value);
    });

    console.log("[*] Waiting for events. To exit press CTRL+C");
}

// Call the main function to start listening for events
main()
