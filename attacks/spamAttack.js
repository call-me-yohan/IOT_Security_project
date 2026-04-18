const { registeredContract } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");
const { randomDevice } = require("./devices");

async function main() {
    const rounds = Number(process.argv[2] || 5);

    console.log("SPAM ATTACK");
    console.log("Rounds:", rounds);

    for (let i = 0; i < rounds; i++) {
        const nonce = await getCurrentNonce(registeredContract);
        const payload = randomDevice();

        try {
            const txHash = await sendAndWait(registeredContract, payload, nonce);
            console.log(`Accepted ${i}: payload=${payload}, tx=${txHash}`);
        } catch (err) {
            console.log(`Failed ${i}:`, getReason(err));
            continue;
        }

        try {
            await registeredContract.sendMessage(payload, nonce);
            console.log(`Unexpected duplicate accepted`);
        } catch (err) {
            console.log(`Duplicate rejected:`, getReason(err));
        }
    }
}

main().catch((err) => {
    console.error("Spam script error:", getReason(err));
    process.exit(1);
});