// listener.js

const { ethers } = require("ethers");
const config = require("./config");

// 🧠 In-memory storage (no DB needed)
let logs = [];
let attacks = [];

// connect to blockchain
const provider = new ethers.JsonRpcProvider(config.rpcUrl);

// connect to contract
const contract = new ethers.Contract(
    config.contractAddress,
    config.abi,
    provider
);

// 🎧 LISTEN TO EVENTS

function startListening() {

    console.log("Listening to blockchain events...");

    // ✅ Accepted messages
    contract.on("MessageAccepted", (device, payload, event) => {

        const log = {
            device: device,
            data: payload,
            status: "accepted",
            timestamp: Date.now()
        };

        logs.push(log);

        console.log("✅ Accepted:", log);
    });

    // ❌ Rejected messages
    contract.on("MessageRejected", (device, payload, event) => {

        const attack = {
            device: device,
            data: payload,
            status: "rejected",
            timestamp: Date.now()
        };

        attacks.push(attack);

        console.log("❌ Rejected:", attack);
    });
}

// export data + function
module.exports = {
    startListening,
    logs,
    attacks
};