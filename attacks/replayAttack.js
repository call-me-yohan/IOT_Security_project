const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured, randomDevice } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
  const deviceArg = process.argv[2];
  const typeArg = process.argv[3];
  const valueArg = process.argv[4];

  const data =
    deviceArg && typeArg && valueArg
      ? buildStructured(deviceArg, typeArg, valueArg)
      : randomDevice();

  const nonce = await getCurrentNonce(registeredContract, registeredWallet);

  console.log("REPLAY ATTACK");
  console.log("Payload:", data.payload);
  console.log("Nonce:", nonce.toString());

  const first = await sendAndInspect(registeredContract, data.payload, nonce);
  console.log("First outcome:", first);

  const replay = await sendAndInspect(registeredContract, data.payload, nonce);
  console.log("Replay outcome:", replay);

  await logAttack({
    device: data.device,
    type: "replay_attack",
    severity: replay.status === "rejected" ? "high" : "critical",
    error: replay.reason || null,
    payload: data.payload,
    timestamp: Date.now()
  });
}

main().catch((err) => {
  console.error("Fatal:", getReason(err));
});
