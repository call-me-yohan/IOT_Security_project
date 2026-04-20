const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { buildStructured, randomDevice } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
    const data = randomDevice();

    const nonce = await getCurrentNonce(registeredContract, registeredWallet);

    console.log("REPLAY ATTACK");

    await sendAndWait(registeredContract, data.payload, nonce);

    try {
        await registeredContract.sendMessage(data.payload, nonce);

        console.log("Replay accepted");

    } catch (err) {
        console.log("Replay rejected:", getReason(err));

        await logAttack({
            device: data.device,
            type: "replay_attack",
            severity: "high",
            timestamp: Date.now()
        });
    }
}

main();