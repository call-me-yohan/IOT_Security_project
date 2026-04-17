const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "logs.json");
const ATTACK_FILE = path.join(__dirname, "attacks.json");

// READ LOGS
function readLogs() {
    if (!fs.existsSync(LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
}

// READ ATTACKS
function readAttacks() {
    if (!fs.existsSync(ATTACK_FILE)) return [];
    return JSON.parse(fs.readFileSync(ATTACK_FILE, "utf-8"));
}

// SAVE LOGS
function saveLogs(logs) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

// SAVE ATTACKS
function saveAttacks(attacks) {
    fs.writeFileSync(ATTACK_FILE, JSON.stringify(attacks, null, 2), "utf-8");
}

module.exports = {
    readLogs,
    readAttacks,
    saveLogs,
    saveAttacks
};