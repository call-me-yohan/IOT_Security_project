const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndWait } = require("./helpers");

async function main() {
  const payload = process.argv[2] || "temp:25C";
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