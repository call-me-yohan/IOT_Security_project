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
  "Air-Conditioner": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "motion-sensor": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  camera: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "alarm-system": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
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
  "Air-Conditioner": "state:OFF",
  "motion-sensor": "motion:IDLE",
  camera: "mode:OFF",
  "alarm-system": "state:DISARMED"
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
  if (log.device === "thermometer") {
    deviceStates.thermometer = log.data;

    const match = log.data.match(/^temp:(\d{1,3})C$/);
    if (match) {
      const temp = parseInt(match[1], 10);

      if (temp >= 28) {
        deviceStates["Air-Conditioner"] = "state:ON";
        storeLog({
          device: "Air-Conditioner",
          data: "state:ON",
          status: "accepted",
          source: "automation",
          reason: `Triggered by ${log.data}`,
          timestamp: Date.now()
        });
      }

      if (temp <= 24) {
        deviceStates["Air-Conditioner"] = "state:OFF";
        storeLog({
          device: "Air-Conditioner",
          data: "state:OFF",
          status: "accepted",
          source: "automation",
          reason: `Triggered by ${log.data}`,
          timestamp: Date.now()
        });
      }
    }
  }

  if (log.device === "motion-sensor") {
    deviceStates["motion-sensor"] = log.data;

    if (
      log.data === "motion:DETECTED" &&
      deviceStates["alarm-system"] === "state:ARMED"
    ) {
      deviceStates.camera = "mode:RECORDING";
      deviceStates["alarm-system"] = "state:TRIGGERED";

      storeLog({
        device: "camera",
        data: "mode:RECORDING",
        status: "accepted",
        source: "automation",
        reason: "Triggered by motion while alarm was armed",
        timestamp: Date.now()
      });

      storeLog({
        device: "alarm-system",
        data: "state:TRIGGERED",
        status: "accepted",
        source: "automation",
        reason: "Triggered by motion while alarm was armed",
        timestamp: Date.now()
      });
    }
  }

  if (log.device === "camera") {
    deviceStates.camera = log.data;
  }

  if (log.device === "alarm-system") {
    deviceStates["alarm-system"] = log.data;
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
