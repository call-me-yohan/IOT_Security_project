#!/usr/bin/env bash
set -e

CONFIG="../shared/config.json"

RPC_URL=$(jq -r '.rpcUrl' $CONFIG)

# Default Anvil private key
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff94bacb478cbed5efcae784d7bf4f2ff80"

echo "Building contract..."
forge build

echo "Deploying IoTSecure contract..."

OUTPUT=$(forge create src/IoTSecure.sol:IoTSecure \
--rpc-url $RPC_URL \
--private-key $PRIVATE_KEY)

echo "$OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
echo "Failed to get contract address"
exit 1
fi

# Save to config.json
TMP=$(mktemp)
jq --arg addr "$CONTRACT_ADDRESS" '.contractAddress = $addr' $CONFIG > $TMP
mv $TMP $CONFIG

echo "Contract deployed at: $CONTRACT_ADDRESS"
echo "config.json updated"
