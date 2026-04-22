const { getUnregisteredContext } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
  const deviceArg = process.argv[2] || "motion-sensor";
  const typeArg = process.argv[3] || "motion";
  const valueArg = process.argv[4] || "DETECTED";

  const data = buildStructured(deviceArg, typeArg, valueArg);
  const { contract, wallet } = getUnregisteredContext();

  const nonce = await getCurrentNonce(contract, wallet);

  console.log("FAKE DEVICE ATTACK");
  console.log("Claimed device:", data.device);
  console.log("Payload:", data.payload);

  try {
    const outcome = await sendAndInspect(contract, data.payload, nonce);
    console.log("Outcome:", outcome);

    await logAttack({
      device: data.device,
      type: "fake_device",
      severity: outcome.status === "rejected" ? "high" : "critical",
      error: outcome.reason || null,
      payload: data.payload,
      timestamp: Date.now()
    });
  } catch (err) {
    console.log("Error:", getReason(err));

    console.log("Outcome:", outcome);
  }
}

main().catch((err) => {
  console.error("Fatal:", getReason(err));
});
