const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");

async function main() {
  const payload = process.argv[2] || "temp:25C";
  const nonce = await getCurrentNonce(registeredContract, registeredWallet);

  console.log("REPLAY ATTACK");
  console.log("Using payload:", payload);
  console.log("Using nonce:", nonce.toString());

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