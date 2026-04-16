const { ethers } = require("ethers");
const abi = require("./abi.json");
const {
  RPC_URL,
  CONTRACT_ADDRESS,
  REGISTERED_KEY,
  UNREGISTERED_KEY
} = require("./config");

const provider = new ethers.JsonRpcProvider(RPC_URL);

const registeredWallet = new ethers.Wallet(REGISTERED_KEY, provider);
const unregisteredWallet = new ethers.Wallet(UNREGISTERED_KEY, provider);

const registeredContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  abi,
  registeredWallet
);

const unregisteredContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  abi,
  unregisteredWallet
);

module.exports = {
  provider,
  registeredWallet,
  unregisteredWallet,
  registeredContract,
  unregisteredContract
};