// config.js

const config = {
    rpcUrl: "http://127.0.0.1:8545",   // your Anvil URL
    contractAddress: "0xYOUR_CONTRACT_ADDRESS", // replace this

    abi: [
        // 🔥 PASTE YOUR CONTRACT ABI HERE
        // you get this from Foundry build output
    ]
};

module.exports = config;