const { registeredContract, registeredWallet } = require("./connect");
const { getReason, getCurrentNonce, sendAndInspect } = require("./helpers");
const { buildStructured, randomDevice } = require("./devices");

async function main() {
  const deviceArg = process.argv[2];
  const typeArg = process.argv[3];
  const valueArg = process.argv[4];

  const data =
    deviceArg && typeArg && valueArg
      ? buildStructured(deviceArg, typeArg, valueArg)
      : randomDevice();

  const nonce = await getCurrentNonce(registeredContract, registeredWallet);
  const outcome = await sendAndInspect(registeredContract, data.payload, nonce);

  console.log("NORMAL DEVICE");
  console.log("Data:", data);
  console.log("Outcome:", outcome);
}

main().catch((err) => {
  console.error("Error:", getReason(err));
});
