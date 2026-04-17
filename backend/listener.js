const {
    readLogs,
    readAttacks,
    saveLogs,
    saveAttacks
} = require("./fileStorage");

// Load from file (persistence)
let logs = readLogs();
let attacks = readAttacks();

// STORE LOG
function storeLog(log) {
    logs.push(log);

    if (logs.length > 1000) {
        logs.shift();
    }

    saveLogs(logs);
}

// STORE ATTACK
function storeAttack(attack) {
    attacks.push(attack);

    if (attacks.length > 1000) {
        attacks.shift();
    }

    saveAttacks(attacks);
}

// START LISTENER (no fake data, no blockchain yet)
function startListening() {
    console.log("Listener initialized (waiting for real events)...");
}

// EXPORTS
module.exports = {
    startListening,
    getLogs: () => logs,
    getAttacks: () => attacks,
    storeLog,        // keep for manual/API use
    storeAttack
};