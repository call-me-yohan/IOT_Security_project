const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { buildStructured, randomDevice } = require("./devices");

async function main() {
    const deviceArg = process.argv[2];
    const typeArg = process.argv[3];
    const valueArg = process.argv[4];

    const data = deviceArg && typeArg && valueArg
        ? buildStructured(deviceArg, typeArg, valueArg)
        : randomDevice();

    const nonce = await getCurrentNonce(registeredContract, registeredWallet);

    const txHash = await sendAndWait(registeredContract, data.payload, nonce);

    console.log("NORMAL DEVICE");
    console.log(data);
    console.log("TX:", txHash);
}

main().catch(err => {
    console.error("Error:", getReason(err));
});