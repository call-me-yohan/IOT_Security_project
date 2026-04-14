// server.js

const express = require("express");
const cors = require("cors");

const { startListening, logs, attacks } = require("./listener");

const app = express();
app.use(cors());

// start blockchain listener
startListening();


// ROUTES

// GET all logs
app.get("/logs", (req, res) => {
    res.json(logs);
});

// GET all attacks
app.get("/attacks", (req, res) => {
    res.json(attacks);
});

// health check
app.get("/", (req, res) => {
    res.send("API is running...");
});

// start server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});