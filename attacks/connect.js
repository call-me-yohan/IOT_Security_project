
const { ethers } = require("ethers");
const abi = require("./abi.json");
const {
  RPC_URL,
  CONTRACT_ADDRESS,
  DEVICE_KEYS,
  UNREGISTERED_KEY
} = require("./config");

const provider = new ethers.JsonRpcProvider(RPC_URL);

function getRegisteredContext(deviceName) {
  const privateKey = DEVICE_KEYS[deviceName];

  if (!privateKey) {
    throw new Error(`Unknown registered device: ${deviceName}`);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  return { wallet, contract };
}

function getUnregisteredContext() {
  const wallet = new ethers.Wallet(UNREGISTERED_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  return { wallet, contract };
}

module.exports = {
  provider,
  getRegisteredContext,
  getUnregisteredContext
};
