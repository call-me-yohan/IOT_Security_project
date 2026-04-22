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

// address -> device name
const addressToDevice = {};
for (const [deviceName, privateKey] of Object.entries(deviceKeys)) {
  const wallet = new ethers.Wallet(privateKey);
  addressToDevice[wallet.address.toLowerCase()] = deviceName;
}

let logs = (readLogs() || []).filter(Boolean);
let attacks = (readAttacks() || []).filter(Boolean);
let listening = false;

// live device states
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

function isValidDevicePayload(device, payload) {
  if (typeof payload !== "string") return false;

  if (device === "thermometer") {
    return /^temp:(\d|[1-4]\d|50)C$/.test(payload);
  }

  if (device === "Air-Conditioner") {
    return /^state:(ON|OFF)$/.test(payload);
  }

  if (device === "motion-sensor") {
    return /^motion:(DETECTED|IDLE)$/.test(payload);
  }

  if (device === "camera") {
    return /^mode:(ON|OFF|RECORDING)$/.test(payload);
  }

  if (device === "alarm-system") {
    return /^state:(ARMED|DISARMED|TRIGGERED)$/.test(payload);
  }

  return false;
}

function extractTemperature(payload) {
  const match = payload.match(/^temp:(\d{1,3})C$/);
  return match ? parseInt(match[1], 10) : null;
}

function addAutomationLog(device, data, reason) {
  const autoLog = {
    device,
    data,
    status: "accepted",
    source: "automation",
    reason,
    timestamp: Date.now()
  };

  storeLog(autoLog);
  console.log("🤖 Automation:", autoLog);
}

function applyAutomationRules(log) {
  // direct state updates from valid accepted messages
  if (log.device === "thermometer") {
    deviceStates.thermometer = log.data;

    const temp = extractTemperature(log.data);
    if (temp === null) return;

    // thermometer -> air-conditioner
    if (temp >= 28 && deviceStates["Air-Conditioner"] !== "state:ON") {
      deviceStates["Air-Conditioner"] = "state:ON";
      addAutomationLog(
        "Air-Conditioner",
        "state:ON",
        `Triggered by thermometer reading ${log.data}`
      );
    }

    if (temp <= 24 && deviceStates["Air-Conditioner"] !== "state:OFF") {
      deviceStates["Air-Conditioner"] = "state:OFF";
      addAutomationLog(
        "Air-Conditioner",
        "state:OFF",
        `Triggered by thermometer reading ${log.data}`
      );
    }

    return;
  }

  if (log.device === "Air-Conditioner") {
    deviceStates["Air-Conditioner"] = log.data;
    return;
  }

  if (log.device === "motion-sensor") {
    deviceStates["motion-sensor"] = log.data;

    // motion + armed alarm => recording + triggered alarm
    if (
      log.data === "motion:DETECTED" &&
      deviceStates["alarm-system"] === "state:ARMED"
    ) {
      if (deviceStates.camera !== "mode:RECORDING") {
        deviceStates.camera = "mode:RECORDING";
        addAutomationLog(
          "camera",
          "mode:RECORDING",
          "Triggered by motion while alarm-system was ARMED"
        );
      }

      if (deviceStates["alarm-system"] !== "state:TRIGGERED") {
        deviceStates["alarm-system"] = "state:TRIGGERED";
        addAutomationLog(
          "alarm-system",
          "state:TRIGGERED",
          "Triggered by motion while alarm-system was ARMED"
        );
      }
    }

    return;
  }

  if (log.device === "camera") {
    deviceStates.camera = log.data;
    return;
  }

  if (log.device === "alarm-system") {
    deviceStates["alarm-system"] = log.data;
    return;
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
    const resolvedDevice = resolveDeviceName(device);

    const log = {
      device: resolvedDevice,
      data: payload,
      status: "accepted",
      timestamp: Date.now()
    };

    storeLog(log);

    if (!isValidDevicePayload(resolvedDevice, payload)) {
      const attack = {
        device: resolvedDevice,
        type: "invalid_device_payload",
        error: `Invalid payload "${payload}" for ${resolvedDevice}`,
        status: "rejected",
        timestamp: Date.now()
      };

      storeAttack(attack);
      console.log("⚠️ Invalid payload mapping:", attack);
      return;
    }

    applyAutomationRules(log);
    console.log("✅ Accepted:", log);
  });

  // works whether your ABI currently exposes reason or not
  contract.on("MessageRejected", (...args) => {
    const device = args[0];
    const reason = args[1] || "Rejected by smart contract";

    const attack = {
      device: resolveDeviceName(device),
      type: "contract_rejection",
      error: reason,
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
