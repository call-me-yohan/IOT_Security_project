function getReason(err) {
  return (
    err?.shortMessage ||
    err?.reason ||
    err?.info?.error?.message ||
    err?.error?.message ||
    err?.message ||
    "Unknown error"
  );
}

async function getCurrentNonce(contract, wallet) {
  const address = await wallet.getAddress();
  return await contract.nonces(address);
}

async function sendAndWait(contract, payload, nonce) {
  const tx = await contract.sendMessage(payload, nonce);
  await tx.wait();
  return tx.hash;
}

module.exports = {
  getReason,
  getCurrentNonce,
  sendAndWait
};