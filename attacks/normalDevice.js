const { getRegisteredContext } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured } = require("./devices");

async function main() {
  const deviceArg = process.argv[2] || "thermometer";
  const typeArg = process.argv[3] || "temp";
  const valueArg = process.argv[4] || "25C";

  const data = buildStructured(deviceArg, typeArg, valueArg);
  const { contract, wallet } = getRegisteredContext(data.device);

  const nonce = await getCurrentNonce(contract, wallet);
  const outcome = await sendAndInspect(contract, data.payload, nonce);

  console.log("NORMAL DEVICE");
  console.log("Data:", data);
  console.log("Outcome:", outcome);
}

main().catch((err) => {
  console.error("Error:", getReason(err));
});
