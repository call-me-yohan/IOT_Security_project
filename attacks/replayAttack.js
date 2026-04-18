const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { buildPayload, randomDevice } = require("./devices");

async function main() {
    const device = process.argv[2];
    const type = process.argv[3];
    const value = process.argv[4];

    const payload = device && type && value
        ? buildPayload(device, type, value)
        : randomDevice();

    const nonce = await getCurrentNonce(registeredContract, registeredWallet);

    console.log("REPLAY ATTACK");
    console.log("Payload:", payload);
    console.log("Nonce:", nonce.toString());

    const txHash = await sendAndWait(registeredContract, payload, nonce);
    console.log("First send accepted:", txHash);

    try {
        await registeredContract.sendMessage(payload, nonce);
        console.log("Unexpected: replay was accepted");
    } catch (err) {
        console.log("Replay rejected:", getReason(err));
    }
}

main().catch((err) => {
    console.error("Replay script error:", getReason(err));
    process.exit(1);
});