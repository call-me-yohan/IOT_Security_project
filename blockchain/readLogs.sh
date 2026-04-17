#!/bin/bash

CONFIG="../shared/config.json"

RPC_URL=$(cat $CONFIG | jq -r '.rpcUrl')
CONTRACT=$(cat $CONFIG | jq -r '.contractAddress')

echo "Fetching logs from contract: $CONTRACT"

cast logs \
--address $CONTRACT \
--from-block 0 \
--to-block latest \
--rpc-url $RPC_URL
