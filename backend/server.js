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
    "sensor-1": "0x59c6995e99...",
    "sensor-2": "0xabc123..."
};


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

// ROUTES

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.get("/logs", (req, res) => {
    res.json(getLogs());
});

app.get("/attacks", (req, res) => {
    res.json(getAttacks());
});


// OPTIONAL: allow manual testing (no hardcoded data)
app.post("/logs", (req, res) => {
    const log = req.body;
    storeLog(log);
    res.json({ message: "Log stored", log });
});

app.post("/attacks", (req, res) => {
    const attack = req.body;
    storeAttack(attack);
    res.json({ message: "Attack stored", attack });
});

app.post("/send", async (req, res) => {
    const {  privateKey, payload } = req.body;

    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        const nonce = await contract.nonces(wallet.address);

        const tx = await contractWithSigner.sendMessage(payload, nonce);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });

    } catch (err) {
         const attack = {
        type: "offchain_error",
        error: err.message,
        timestamp: Date.now()
    };

    storeAttack(attack);
	res.status(500).json({ error: err.message });
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
