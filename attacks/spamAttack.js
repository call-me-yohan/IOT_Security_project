const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { randomDevice } = require("./devices");
const { logAttack } = require("./apiLogger");

async function main() {
  const rounds = Number(process.argv[2] || 5);

  console.log("SPAM ATTACK");

  for (let i = 0; i < rounds; i++) {
    const data = randomDevice();
    const nonce = await getCurrentNonce(registeredContract, registeredWallet);

    try {
      const outcome = await sendAndInspect(registeredContract, data.payload, nonce);
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
