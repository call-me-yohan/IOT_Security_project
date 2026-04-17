const { ethers } = require("ethers");
const config = require("./config");

const {
    readLogs,
    readAttacks,
    saveLogs,
    saveAttacks
} = require("./fileStorage");

// ✅ Load existing data from file
let logs = readLogs();
let attacks = readAttacks();

// connect to blockchain
const provider = new ethers.JsonRpcProvider(config.rpcUrl);

const contract = new ethers.Contract(
    config.contractAddress,
    config.abi,
    provider
);

// 🔐 STORE LOG (memory + file)
function storeLog(log) {
    logs.push(log);

    if (logs.length > 1000) logs.shift();

    saveLogs(logs); // 💾 persist to file
}

// 🔐 STORE ATTACK
function storeAttack(attack) {
    attacks.push(attack);

    if (attacks.length > 1000) attacks.shift();

    saveAttacks(attacks); // 💾 persist to file
}

// 🎧 LISTEN TO EVENTS
function startListening() {
    console.log("🎧 Listening to blockchain events...");

    // ✅ Accepted
    contract.on("MessageAccepted", (device, payload) => {
        const log = {
            device,
            data: payload,
            status: "accepted",
            timestamp: Date.now()
        };

        storeLog(log); // 🔥 unified storage

        console.log("✅ Accepted:", log);
    });

    // ❌ Rejected
    contract.on("MessageRejected", (device) => {
        const attack = {
            device,
            status: "rejected",
            timestamp: Date.now()
        };

        storeAttack(attack); // 🔥 unified storage

        console.log("❌ Rejected:", attack);
    });
}

// EXPORTS
module.exports = {
    startListening,
    getLogs: () => logs,
    getAttacks: () => attacks,
    storeLog,
    storeAttack
};
