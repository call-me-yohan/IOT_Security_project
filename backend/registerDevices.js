const axios = require("axios");

const API = "http://localhost:5000";

const devices = [
  {
    name: "thermometer",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    name: "Air-Conditioner",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
];

async function registerDevice(device) {
  try {
    const res = await axios.post(`${API}/register`, {
      privateKey: device.privateKey,
      device: device.address
    });

    console.log(`✅ Registered ${device.name}`);
    console.log(`   Address: ${device.address}`);
    console.log(`   Tx Hash: ${res.data.txHash}`);
    console.log("");
  } catch (err) {
    console.error(`❌ Failed to register ${device.name}`);
    console.error(`   Address: ${device.address}`);
    console.error(
      `   Error: ${err.response?.data?.error || err.message}`
    );
    console.log("");
  }
}

async function main() {
  console.log("=== REGISTERING DEVICES ===\n");

  for (const device of devices) {
    await registerDevice(device);
  }

  console.log("=== DONE ===");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
