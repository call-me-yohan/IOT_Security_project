#!/bin/bash

PROJECT_ROOT="/iot-project"

SESSION="iot-demo"

# kill old session if it exists
tmux kill-session -t $SESSION 2>/dev/null

# create new session with first window: blockchain
tmux new-session -d -s $SESSION -n blockchain "cd $PROJECT_ROOT/blockchain && anvil"

# second window: backend
tmux new-window -t $SESSION -n backend "cd $PROJECT_ROOT/backend && node server.js"

# third window: deploy
tmux new-window -t $SESSION -n deploy "cd $PROJECT_ROOT/blockchain && ./deployContract.sh; bash"

# wait a bit before registration
sleep 5

# fourth window: register devices
tmux new-window -t $SESSION -n register "cd $PROJECT_ROOT/backend && node registerDevices.js; bash"

# fifth window: frontend
tmux new-window -t $SESSION -n frontend "cd $PROJECT_ROOT/frontend && npm start"

# attach to session
tmux attach-session -t $SESSION