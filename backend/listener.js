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

let logs = readLogs() || [];
let attacks = readAttacks() || [];
let listening = false;

// live simulated device states
let deviceStates = {
    thermometer: "temp:--",
    "Air-Conditioner": "state:OFF"
};

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

function extractTemperature(payload) {
    if (typeof payload !== "string") return null;

    const match = payload.match(/^temp:(\d{1,3})C$/);
    if (!match) return null;

    return parseInt(match[1], 10);
}

function applyAutomationRules(log) {
    // update current device state from accepted message
    if (log.device === "thermometer") {
        deviceStates.thermometer = log.data;

        const temp = extractTemperature(log.data);
        if (temp === null) return;

        if (temp >= 28 && deviceStates["Air-Conditioner"] !== "state:ON") {
            deviceStates["Air-Conditioner"] = "state:ON";

            const autoLog = {
                device: "Air-Conditioner",
                data: "state:ON",
                status: "accepted",
                source: "automation",
                reason: `Triggered by thermometer reading ${log.data}`,
                timestamp: Date.now()
            };

            storeLog(autoLog);
            console.log("🤖 Automation:", autoLog);
        }

        if (temp <= 24 && deviceStates["Air-Conditioner"] !== "state:OFF") {
            deviceStates["Air-Conditioner"] = "state:OFF";

            const autoLog = {
                device: "Air-Conditioner",
                data: "state:OFF",
                status: "accepted",
                source: "automation",
                reason: `Triggered by thermometer reading ${log.data}`,
                timestamp: Date.now()
            };

            storeLog(autoLog);
            console.log("🤖 Automation:", autoLog);
        }
    }

    if (log.device === "Air-Conditioner") {
        deviceStates["Air-Conditioner"] = log.data;
    }
}

function startListening() {
    if (listening) {
        console.log("⚠️ Listener already started");
        return;
    }

    listening = true;
    console.log("🎧 Listening to blockchain events...");

    contract.removeAllListeners("MessageAccepted");
    contract.removeAllListeners("MessageRejected");

    contract.on("MessageAccepted", (device, payload) => {
        const log = {
            device: resolveDeviceName(device),
            data: payload,
            status: "accepted",
            timestamp: Date.now()
        };

        storeLog(log);
        applyAutomationRules(log);

        console.log("✅ Accepted:", log);
    });

    contract.on("MessageRejected", (device, reason) => {
        const attack = {
            device: resolveDeviceName(device),
            type: "contract_rejection",
            error: reason || "Rejected by smart contract",
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
    getDeviceStates: () => deviceStates,
    storeLog,
    storeAttack
};
