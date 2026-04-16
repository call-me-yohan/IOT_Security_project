const { unregisteredContract, unregisteredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");

async function main() {
  const payload = process.argv[2] || "temp:99C";
  const nonce = await getCurrentNonce(unregisteredContract, unregisteredWallet);

  console.log("FAKE DEVICE ATTACK");
  console.log("Payload:", payload);
  console.log("Nonce:", nonce.toString());

  try {
    const txHash = await sendAndWait(unregisteredContract, payload, nonce);
    console.log("Unexpected: fake device was accepted:", txHash);
  } catch (err) {
    console.log("Fake device rejected:", getReason(err));
  }
}

main().catch((err) => {
  console.error("Fake device script error:", getReason(err));
  process.exit(1);
});