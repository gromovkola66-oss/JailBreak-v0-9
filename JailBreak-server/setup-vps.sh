#!/bin/bash
# One-time VPS setup for JailBreak server
set -e

echo "=== Setting up JailBreak Server ==="

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Create app directory
mkdir -p /opt/jailbreak-server/maps

# Create systemd service
cat > /etc/systemd/system/jailbreak.service << EOF
[Unit]
Description=JailBreak Game Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/jailbreak-server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable jailbreak

# Open firewall port
ufw allow 3000/tcp 2>/dev/null || true

echo "=== Setup Complete ==="
echo "Upload server files and run: systemctl start jailbreak"
