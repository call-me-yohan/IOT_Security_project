const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { randomDevice } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
    const rounds = Number(process.argv[2] || 5);

    console.log("SPAM ATTACK");

    for (let i = 0; i < rounds; i++) {
        const data = randomDevice();

        const nonce = await getCurrentNonce(registeredContract, registeredWallet);

        try {
            await sendAndWait(registeredContract, data.payload, nonce);

            await logAttack({
                device: data.device,
                type: "DDoS",
                severity: "high",
                timestamp: Date.now()
        });

        console.log("Sent:", data.payload);

        } catch (err) {
            console.log("Error:", getReason(err));
        }
    }
}

main();