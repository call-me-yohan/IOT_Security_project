const { getRegisteredContext } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
  const deviceArg = process.argv[2];
  const typeArg = process.argv[3];
  const valueArg = process.argv[4];

  const data =
    deviceArg && typeArg && valueArg
      ? buildStructured(deviceArg, typeArg, valueArg)
      : buildStructured("thermometer", "temp", "30C");

  const { contract, wallet } = getRegisteredContext(data.device);
  const nonce = await getCurrentNonce(contract, wallet);

  console.log("REPLAY ATTACK");
  console.log("Device:", data.device);
  console.log("Payload:", data.payload);
  console.log("Nonce:", nonce.toString());

  const first = await sendAndInspect(contract, data.payload, nonce);
  console.log("First outcome:", first);

  const replay = await sendAndInspect(contract, data.payload, nonce);
  console.log("Replay outcome:", replay);

  await logAttack({
    device: data.device,
    type: "replay_attack",
    severity: "high",
    error: replay.reason || null,
    payload: data.payload,
    timestamp: Date.now()
  });
}

main().catch(async (err) => {
  console.error("Fatal:", getReason(err));

  try {
    await logAttack({
      device: "Replay device",
      type: "replay_attack",
      severity: "critical",
      error: getReason(err),
      payload: null,
      timestamp: Date.now()
    });
  } catch (logErr) {
    console.error("Failed to save replay attack:", getReason(logErr));
  }

  process.exit(1);
});
