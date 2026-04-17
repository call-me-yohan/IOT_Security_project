#!/bin/bash

CONFIG="../shared/config.json"

RPC_URL=$(jq -r '.rpcUrl' $CONFIG)
CONTRACT=$(jq -r '.contractAddress' $CONFIG)

echo "Fetching CLEAN temperature logs..."
echo "Contract: $CONTRACT"
echo "-----------------------------"

cast logs \
--address $CONTRACT \
--from-block 0 \
--to-block latest \
--rpc-url $RPC_URL | grep -o "74656d703a[0-9a-fA-F]*"
