const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const config = require("./config");

const {
    startListening,
    getLogs,
    getAttacks,
    storeLog,
    storeAttack
} = require("./listener");

const deviceKeys = {
    thermometer: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "Air-Conditioner": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
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

// start system
startListening();

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

app.post("/send", async (req, res) => {
    const { privateKey, payload } = req.body;

    let wallet;

    try {
        wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        const nonce = await contract.nonces(wallet.address);

        const tx = await contractWithSigner.sendMessage(payload, nonce);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });

    } catch (err) {
        const senderAddress = wallet ? wallet.address : "invalid-wallet";

        const attack = {
            type: "offchain_error",
            device: senderAddress,
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