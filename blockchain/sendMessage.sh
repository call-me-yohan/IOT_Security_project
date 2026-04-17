#!/bin/bash

CONFIG="../shared/config.json"

RPC_URL=$(cat $CONFIG | jq -r '.rpcUrl')
CONTRACT=$(cat $CONFIG | jq -r '.contractAddress')

PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

TEMP=$1
NONCE=$2

cast send $CONTRACT \
"sendMessage(string,uint256)" \
"temp:$TEMP" \
$NONCE \
--private-key $PRIVATE_KEY \
--rpc-url $RPC_URL
