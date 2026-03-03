#!/bin/bash
VAULT_PATH="/Users/liuqingqing05/work/Obsidian-Vault/.obsidian/plugins/obsidian-tts"

while true; do
  if [ -f main.js ]; then
    cp main.js "$VAULT_PATH/"
    echo "[$(date '+%H:%M:%S')] Synced main.js to vault"
  fi
  sleep 2
done
