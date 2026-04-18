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

    const txHash = await sendAndWait(registeredContract, payload, nonce);

    console.log("NORMAL DEVICE");
    console.log("Payload:", payload);
    console.log("Nonce:", nonce.toString());
    console.log("Accepted tx:", txHash);
}

main().catch((err) => {
    console.error("Normal device error:", getReason(err));
    process.exit(1);
});