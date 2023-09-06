/*
    Receive a queue from RabbitMQ.
*/

// Import required libraries and modules
const ethers = require('ethers');
var amqp = require('amqplib/callback_api');
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

let currentSecondaryNonce = 0;
let currentPrimaryNonce = 0;

// Import contract ABIs (Application Binary Interfaces)
const PRIMARY_ABI = require('./abi/PrimaryNetworkToken.json')
const SECONDARY_ABI = require('./abi/SecondaryNetworkToken.json')

function sleep(ms, random = 0) {
    return new Promise(resolve => setTimeout(resolve, ms + Math.random() * random));
}

// Function to handle events from the primary token contract
const consumePrimaryEvent = async(secondaryWallet, from, to, value, secondaryRpcProvider, secondaryTokenContract) => {
    console.log("[+] consumePrimaryEvent");
    
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
            currentSecondaryNonce = await secondaryRpcProvider.getTransactionCount(secondaryWallet.address, 'latest');
            // Mint tokens on the secondary network
            const tokensMinted = await mintTokens(secondaryWallet, secondaryRpcProvider, secondaryTokenContract, value, from, currentSecondaryNonce)
            if (!tokensMinted) return
            console.log('[I] SUCCESS: Successfully executed the transfer through the bridge.');

            return true;

        } catch (err) {
            console.error('[E] processing transaction', err);
            return false;
        }

    } else {
        console.log('[W] Another transfer')
        return true;
    }

}

// Function to handle events from the secondary token contract
const consumeSecondaryEvent = async(from, to, value, primaryRpcProvider, primaryTokenContract, primaryWallet, secondaryRpcProvider, secondaryTokenContract, secondaryWallet) => {

    console.log("[+] consumeSecondaryEvent");
    // Check if the tokens were minted
    if (from === NONE_ADDR_WALLET) {
        console.log(' [I] Tokens minted')
        return true;
    }
    // Check if the transfer is from the bridge to the user
    if (to === BRIDGE_WALLET && to != from) {
        console.log(' [I] to back from bridge.')
        
        console.log(" [x] from:", from);
        console.log(" [x] to:", to);
        console.log(" [x] value:", value);

        try {
            // Approve tokens for burning
            currentSecondaryNonce = await secondaryRpcProvider.getTransactionCount(secondaryWallet.address, 'latest');
            const tokenBurnApproved = await approveForBurn(secondaryWallet, secondaryRpcProvider, secondaryTokenContract, value, currentSecondaryNonce)
            if (!tokenBurnApproved) return
            // Burn tokens on the secondary network
            currentSecondaryNonce = await secondaryRpcProvider.getTransactionCount(secondaryWallet.address, 'latest');
            const tokensBurnt = await burnTokens(secondaryWallet, secondaryRpcProvider, secondaryTokenContract, value, currentSecondaryNonce)
            if (!tokensBurnt) return
            // Transfer tokens back to the user's wallet
            currentPrimaryNonce = await primaryRpcProvider.getTransactionCount(primaryWallet.address, 'latest');
            const transferBack = await transferToBackWallet(primaryWallet, primaryRpcProvider, primaryTokenContract, value, from, currentPrimaryNonce)
            if (!transferBack) return
            console.log('[I] SUCCESS: Successfully completed the token return procedure.');

            return true;

        } catch (err) {
            console.error('[E] processing transaction', err);
            return false;
        }
    } else {
        console.log('[W] Something else triggered Transfer event');
        return true;;
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

    currentPrimaryNonce = await primaryRpcProvider.getTransactionCount(primaryWallet.address, 'latest');
    currentSecondaryNonce = await secondaryRpcProvider.getTransactionCount(secondaryWallet.address, 'latest');

    var count = 0;

    amqp.connect('amqp://localhost', async function(connectErr, connection) {
        if (connectErr) {
            throw connectErr;
        }
        connection.createChannel(async function(createChannelErr, channel) {
            if (createChannelErr) {
                throw createChannelErr;
            }
    
            var queuePrimaryEvent = PRIMARY_QUEUE;
            var queueSecondaryEvent = SECONDARY_QUEUE;
    
            channel.assertQueue(queuePrimaryEvent, {
                durable: false
            });

            channel.prefetch(1);

            channel.consume(queuePrimaryEvent,  async function(msg) {

                console.log("[+] queuePrimaryEvent");

                // You will check and configure the state of the chain you have chosen.
                if (Math.random() > 0.7) {

                    let ret = false;
                    count+=1;
                    console.log(" [x] %s Received %s : count %d .", queuePrimaryEvent, msg.content.toString(), count );
                    const words = msg.content.toString().split('|');
                    if ( words.length === 3 ) {
                        console.log(" [x] Call consumePrimaryEvent");
                        // The approach to parsing the string depends on the format of the string in the producer's queue.
                        let from = words[0];
                        let to = words[1];
                        let value = words[2];
                        
                        ret = await consumePrimaryEvent(secondaryWallet, from, to, value, secondaryRpcProvider, secondaryTokenContract)
                    }
                    if (!(ret)) {
                        console.log(" [W] Result consumePrimaryEvent >> ", "NACK");
                        channel.nack(msg);
                    } else {
                        console.log(" [x] Result consumePrimaryEvent >> ", "ACK");
                        channel.ack(msg);
                    }

                } else {
                    console.log(" [I] Result consumePrimaryEvent >> ", "NACK");
                    channel.nack(msg);
                }

                // You will check and configure the state of the chain you have chosen.
                await sleep(1000, 1000);

            });
    
            channel.assertQueue(queueSecondaryEvent, {
                durable: false
            });
            
            channel.consume(queueSecondaryEvent, async function(msg) {
                
                console.log("[+] queueSecondaryEvent");

                // You will check and configure the state of the chain you have chosen.
                if (Math.random() > 0.7) {

                    let ret = false;
                    count+=1;
                    console.log(" [x] %s Received %s : count %d .", queueSecondaryEvent, msg.content.toString(), count );
                    const words = msg.content.toString().split('|');
                    if ( words.length === 3 ) {
                        console.log(" [x] Call consumeSecondaryEvent");
                        // The approach to parsing the string depends on the format of the string in the producer's queue.
                        let from = words[0];
                        let to = words[1];
                        let value = words[2];

                        ret = await consumeSecondaryEvent(from, to, value, primaryRpcProvider, primaryTokenContract, primaryWallet, secondaryRpcProvider, secondaryTokenContract, secondaryWallet)
                    }
                    if (!(ret)) {
                        console.log(" [W] Result consumeSecondaryEvent >> ", "NACK");
                        channel.nack(msg);
                    } else {
                        console.log(" [x] Result consumeSecondaryEvent >> ", "ACK");
                        channel.ack(msg);
                    }

                } else {
                    console.log(" [I] Result consumeSecondaryEvent >> ", "NACK");
                    channel.nack(msg);
                }

                // You will check and configure the state of the chain you have chosen.
                await sleep(1000, 1000);

            });

            console.log("[*] Waiting for messages in %s and %s. To exit press CTRL+C", queuePrimaryEvent, queueSecondaryEvent);

        });
    });

}

// Call the main function to start listening for events
main()
