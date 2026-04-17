// config.js

const config = {
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",

    //  ADD ABI HERE
    abi: [
        {
            "anonymous": false,
            "inputs": [
                { "indexed": false, "name": "device", "type": "address" },
                { "indexed": false, "name": "payload", "type": "string" }
            ],
            "name": "MessageAccepted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": false, "name": "device", "type": "address" },
                { "indexed": false, "name": "payload", "type": "string" }
            ],
            "name": "MessageRejected",
            "type": "event"
        }
    ]
};

module.exports = config;