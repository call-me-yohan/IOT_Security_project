const { ethers } = require("ethers");
const config = require("./config");

const {
    readLogs,
    readAttacks,
    saveLogs,
    saveAttacks
} = require("./fileStorage");

// device private keys
const deviceKeys = {
    thermometer: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "Air-Conditioner": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
};

// build address -> device name map
const addressToDevice = {};
for (const [deviceName, privateKey] of Object.entries(deviceKeys)) {
    const wallet = new ethers.Wallet(privateKey);
    addressToDevice[wallet.address.toLowerCase()] = deviceName;
}

let logs = readLogs();
let attacks = readAttacks();

const provider = new ethers.JsonRpcProvider(config.rpcUrl);

const contract = new ethers.Contract(
    config.contractAddress,
    config.abi,
    provider
);

function resolveDeviceName(device) {
    if (!device) return "unknown";
    return addressToDevice[device.toLowerCase()] || device;
}

function storeLog(log) {
    logs.push(log);
    if (logs.length > 1000) logs.shift();
    saveLogs(logs);
}

function storeAttack(attack) {
    attacks.push(attack);
    if (attacks.length > 1000) attacks.shift();
    saveAttacks(attacks);
}

function startListening() {
    console.log("🎧 Listening to blockchain events...");

    contract.on("MessageAccepted", (device, payload) => {
        const log = {
            device: resolveDeviceName(device), // store name, not address
            data: payload,
            status: "accepted",
            timestamp: Date.now()
        };

        storeLog(log);
        console.log("✅ Accepted:", log);
    });

    contract.on("MessageRejected", (device) => {
        const attack = {
            device: resolveDeviceName(device), // store name, not address
            status: "rejected",
            timestamp: Date.now()
        };

        storeAttack(attack);
        console.log("❌ Rejected:", attack);
    });
}

module.exports = {
    startListening,
    getLogs: () => logs,
    getAttacks: () => attacks,
    storeLog,
    storeAttack
};