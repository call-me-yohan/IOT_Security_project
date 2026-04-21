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

async function sendAndInspect(contract, payload, nonce) {
  const tx = await contract.sendMessage(payload, nonce);
  const receipt = await tx.wait();

  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);

      if (parsed.name === "MessageAccepted") {
        return {
          txHash: tx.hash,
          status: "accepted",
          device: parsed.args.device,
          payload: parsed.args.payload
        };
      }

      if (parsed.name === "MessageRejected") {
        return {
          txHash: tx.hash,
          status: "rejected",
          device: parsed.args.device,
          reason: parsed.args.reason
        };
      }
    } catch (_) {
      // ignore unrelated logs
    }
  }

  return {
    txHash: tx.hash,
    status: "unknown"
  };
}

module.exports = {
  getReason,
  getCurrentNonce,
  sendAndInspect
};
