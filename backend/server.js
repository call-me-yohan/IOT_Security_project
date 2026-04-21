const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const config = require("./config");

const {
    startListening,
    getLogs,
    getAttacks,
    getDeviceStates,
    storeLog,
    storeAttack
} = require("./listener");

const deviceKeys = {
  thermometer: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "Air-Conditioner": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "motion-sensor": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  camera: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "alarm-system": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
};

// Convert private keys to wallet addresses, then map address -> device name
const addressToDevice = {};

for (const [deviceName, privateKey] of Object.entries(deviceKeys)) {
    const wallet = new ethers.Wallet(privateKey);
    addressToDevice[wallet.address.toLowerCase()] = deviceName;
}

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider(config.rpcUrl);

const contract = new ethers.Contract(
    config.contractAddress,
    config.abi,
    provider
);

function classifyAttackError(err) {
    const msg = (err?.reason || err?.shortMessage || err?.message || "").toLowerCase();

    if (msg.includes("insufficient funds")) {
        return {
            type: "invalid_sender",
            error: "Sender wallet has no funds or is unauthorized"
        };
    }

    if (msg.includes("nonce")) {
        return {
            type: "replay_attack",
            error: "Invalid or reused nonce"
        };
    }

    if (msg.includes("device not registered")) {
        return {
            type: "unauthorized_device",
            error: "Device not registered"
        };
    }

    if (msg.includes("payload format not allowed")) {
        return {
            type: "invalid_payload",
            error: "Payload format not allowed"
        };
    }

    if (msg.includes("revert")) {
        return {
            type: "contract_rejection",
            error: err.reason || "Transaction rejected by smart contract"
        };
    }

    return {
        type: "unknown_attack",
        error: err.reason || err.shortMessage || "Unknown blockchain error"
    };
}

// start system
startListening();

function isValidPayload(payload) {
    if (typeof payload !== "string") return false;

    return (
        /^temp:(\d|[1-4]\d|50)C$/.test(payload) ||
        /^state:(ON|OFF)$/.test(payload)
    );
}

function isValidPayloadForDevice(device, payload) {
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

// helper to replace address with device name
function resolveDeviceName(device) {
    if (!device) return "unknown";
    return addressToDevice[device.toLowerCase()] || device;
}

// ROUTES
app.get("/", (req, res) => {
    res.send("API is running...");
});

app.get("/logs", (req, res) => {
    const logs = getLogs()
        .filter(log => log && log.timestamp && log.data)
        .map(log => ({
            ...log,
            device: resolveDeviceName(log.device)
        }));

    res.json(logs);
});

app.get("/attacks", (req, res) => {
    const attacks = getAttacks()
        .filter(attack => attack && attack.timestamp)
        .map(attack => ({
            ...attack,
            device: resolveDeviceName(attack.device)
        }));

    res.json(attacks);
});

// OPTIONAL: allow manual testing
app.post("/logs", (req, res) => {
    const log = {
        ...req.body,
        device: resolveDeviceName(req.body.device)
    };

    storeLog(log);
    res.json({ message: "Log stored", log });
});

app.post("/attacks", (req, res) => {
    const attack = {
        ...req.body,
        device: resolveDeviceName(req.body.device)
    };

    storeAttack(attack);
    res.json({ message: "Attack stored", attack });
});

app.get("/devices", (req, res) => {
    res.json(getDeviceStates());
});

app.post("/send", async (req, res) => {
    const { privateKey, payload } = req.body;

    let wallet;

    if (!isValidPayload(payload)) {
    let senderAddress = "unknown";

    try {
        const tempWallet = new ethers.Wallet(privateKey);
        senderAddress = tempWallet.address;
    } catch (_) {}

    const attack = {
        type: "invalid_payload",
        device: resolveDeviceName(senderAddress),
        payload,
        error: "Payload format not allowed",
        timestamp: Date.now()
    };

    storeAttack(attack);
    return res.status(400).json({ error: "Payload format not allowed" });
}

    try {
        wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        const nonce = await contract.nonces(wallet.address);

        const tx = await contractWithSigner.sendMessage(payload, nonce);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });

    } catch (err) {
    let senderAddress = "unknown";

    try {
        if (privateKey) {
            const tempWallet = new ethers.Wallet(privateKey);
            senderAddress = tempWallet.address;
        }
    } catch (_) {}

    const classified = classifyAttackError(err);

    const attack = {
        type: classified.type,
        device: resolveDeviceName(senderAddress),
        payload,
        error: classified.error,
        timestamp: Date.now()
    };

    storeAttack(attack);
    res.status(500).json({ error: classified.error });
}
});

app.post("/send-by-device", async (req, res) => {
    const { device, payload } = req.body;

    if (!deviceKeys[device]) {
        const attack = {
            type: "invalid_device",
            device,
            payload,
            error: "Unsupported device",
            timestamp: Date.now()
        };

        storeAttack(attack);
        return res.status(400).json({ error: "Unsupported device" });
    }

    if (!isValidPayloadForDevice(device, payload)) {
        const attack = {
            type: "invalid_payload",
            device,
            payload,
            error: `Invalid payload for ${device}`,
            timestamp: Date.now()
        };

        storeAttack(attack);
        return res.status(400).json({ error: `Invalid payload for ${device}` });
    }

    try {
        const privateKey = deviceKeys[device];
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        const nonce = await contract.nonces(wallet.address);

        const tx = await contractWithSigner.sendMessage(payload, nonce);
        await tx.wait();

        res.json({
            success: true,
            txHash: tx.hash,
            device,
            payload
        });
    } catch (err) {
        const attack = {
            type: "send_error",
            device,
            payload,
            error: err.reason || err.shortMessage || err.message,
            timestamp: Date.now()
        };

        storeAttack(attack);
        res.status(500).json({ error: attack.error });
    }
});

app.post("/register", async (req, res) => {
    const { privateKey, device } = req.body;

    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        const tx = await contractWithSigner.registerDevice(device);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
