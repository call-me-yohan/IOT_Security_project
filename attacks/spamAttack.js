const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");

async function main() {
  const rounds = Number(process.argv[2] || 5);

  console.log("SPAM ATTACK");
  console.log("Rounds:", rounds);

  for (let i = 0; i < rounds; i++) {
    const nonce = await getCurrentNonce(registeredContract, registeredWallet);
    const payload = `spam:${i}`;

    try {
      const txHash = await sendAndWait(registeredContract, payload, nonce);
      console.log(`Accepted ${i}: payload=${payload}, nonce=${nonce.toString()}, tx=${txHash}`);
    } catch (err) {
      console.log(`Accepted-path failed ${i}:`, getReason(err));
      continue;
    }

    try {
      await registeredContract.sendMessage(`${payload}:duplicate`, nonce);
      console.log(`Unexpected: duplicate spam ${i} was accepted`);
    } catch (err) {
      console.log(`Rejected duplicate ${i}:`, getReason(err));
    }
  }
}

main().catch((err) => {
  console.error("Spam script error:", getReason(err));
  process.exit(1);
});