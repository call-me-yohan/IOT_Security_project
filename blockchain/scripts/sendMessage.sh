#!/bin/bash

CONFIG="../shared/config.json"

RPC_URL=$(cat $CONFIG | jq -r '.rpcUrl')
CONTRACT=$(cat $CONFIG | jq -r '.contractAddress')

PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

TEMP=$1
NONCE=$2

cast send $CONTRACT \
"sendMessage(string,uint256)" \
"temp:$TEMP" \
$NONCE \
--private-key $PRIVATE_KEY \
--rpc-url $RPC_URL
