#!/bin/bash
# Deploy JailBreak server to VPS
SERVER="root@77.222.53.144"

echo "=== Deploying JailBreak Server ==="

# Upload server files
scp -r package.json server.js maps $SERVER:/opt/jailbreak-server/

# Install dependencies and restart
ssh $SERVER "cd /opt/jailbreak-server && npm install --production && systemctl restart jailbreak"

echo "=== Deploy Complete ==="
echo "Server running at ws://77.222.53.144:3000"
