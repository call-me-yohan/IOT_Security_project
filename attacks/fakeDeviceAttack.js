const { unregisteredContract, unregisteredWallet } = require("./connect");
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

  const nonce = await getCurrentNonce(unregisteredContract, unregisteredWallet);

  console.log("FAKE DEVICE ATTACK");
  console.log("Payload:", data.payload);

  try {
    const outcome = await sendAndInspect(unregisteredContract, data.payload, nonce);
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

    await logAttack({
      device: data.device,
      type: "fake_device",
      severity: "critical",
      error: getReason(err),
      payload: data.payload,
      timestamp: Date.now()
    });
  }
}

main().catch((err) => {
  console.error("Fatal:", getReason(err));
});
