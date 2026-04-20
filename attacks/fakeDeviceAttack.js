const { unregisteredContract, unregisteredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { buildStructured, randomDevice } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
    const deviceArg = process.argv[2];
    const typeArg = process.argv[3];
    const valueArg = process.argv[4];

    const data = deviceArg && typeArg && valueArg
        ? buildStructured(deviceArg, typeArg, valueArg)
        : randomDevice();

    const nonce = await getCurrentNonce(unregisteredContract, unregisteredWallet);

    console.log("FAKE DEVICE ATTACK");
    console.log("Payload:", data.payload);

    try {
        await sendAndWait(unregisteredContract, data.payload, nonce);

        console.log("Unexpected: accepted");

        await logAttack({
            device: data.device,
            type: "fake_device",
            severity: "critical",
            timestamp: Date.now()
        });

    } catch (err) {
        console.log("Rejected:", getReason(err));

        await logAttack({
            device: data.device,
            type: "fake_device",
            severity: "high",
            timestamp: Date.now()
        });
    }
}

main();