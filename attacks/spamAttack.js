const { getRegisteredContext } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
  const rounds = Number(process.argv[2] || 5);
  const deviceArg = process.argv[3] || "thermometer";
  const typeArg = process.argv[4] || "temp";
  const valueArg = process.argv[5] || "30C";

  const data = buildStructured(deviceArg, typeArg, valueArg);
  const { contract, wallet } = getRegisteredContext(data.device);

  console.log("SPAM ATTACK");
  console.log("Device:", data.device);
  console.log("Payload:", data.payload);

  for (let i = 0; i < rounds; i++) {
    try {
      const nonce = await getCurrentNonce(contract, wallet);
      const outcome = await sendAndInspect(contract, data.payload, nonce);

      console.log(`[${i + 1}/${rounds}]`, outcome.status, data.payload);

      await logAttack({
        device: data.device,
        type: "spam_attack",
        severity: "medium",
        error: outcome.reason || null,
        payload: data.payload,
        timestamp: Date.now()
      });
    } catch (err) {
      console.log("Error:", getReason(err));

      await logAttack({
        device: data.device,
        type: "spam_attack",
        severity: "high",
        error: getReason(err),
        payload: data.payload,
        timestamp: Date.now()
      });
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", getReason(err));
});
