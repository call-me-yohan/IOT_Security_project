#!/bin/bash

./readMessage.sh | while read hex; do
  echo -e "$(echo $hex | xxd -r -p)\n"
done
