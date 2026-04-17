#!/bin/bash

CONFIG="../shared/config.json"

RPC_URL=$(cat $CONFIG | jq -r '.rpcUrl')
CONTRACT=$(cat $CONFIG | jq -r '.contractAddress')

PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

DEVICE_ADDRESS=$1

cast send $CONTRACT \
"registerDevice(address)" \
$DEVICE_ADDRESS \
--private-key $PRIVATE_KEY \
--rpc-url $RPC_URL
