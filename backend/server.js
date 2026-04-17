const express = require("express");
const cors = require("cors");

const {
    startListening,
    getLogs,
    getAttacks,
    storeLog,
    storeAttack
} = require("./listener");

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});