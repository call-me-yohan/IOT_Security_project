const axios = require("axios");

const API = "http://localhost:5000";

async function logAttack(attack) {
    try {
        await axios.post(`${API}/attacks`, attack);
    } catch (err) {
        console.error("Failed to log attack:", err.message);
    }
}

module.exports = { logAttack };