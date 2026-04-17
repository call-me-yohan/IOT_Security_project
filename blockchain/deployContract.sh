#!/usr/bin/env bash
set -e

SCRIPT_DIR=$(dirname "$0")
CONFIG="$SCRIPT_DIR/../shared/config.json"

RPC_URL=$(jq -r '.rpcUrl' "$CONFIG")

if [ -z "$RPC_URL" ] || [ "$RPC_URL" == "null" ]; then
  echo "❌ RPC URL missing in config.json"
  exit 1
fi

PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "📦 Building..."
forge build

echo "🧪 Testing..."
forge test

echo "🚀 Deploying IoTSecure..."

OUTPUT=$(forge create src/IoTSecure.sol:IoTSecure \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast)

echo "$OUTPUT"

CONTRACT_ADDRESS=$(echo "$OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Failed to extract contract address"
  exit 1
fi

echo "📌 Contract deployed at: $CONTRACT_ADDRESS"

TMP=$(mktemp)
jq --arg addr "$CONTRACT_ADDRESS" '.contractAddress = $addr' "$CONFIG" > "$TMP"
mv "$TMP" "$CONFIG"

echo "✅ config.json updated"
