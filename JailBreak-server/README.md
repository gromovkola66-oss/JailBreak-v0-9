# JailBreak Multiplayer Server

WebSocket game server for JailBreak v0.9 multiplayer.

## Server Details

- **VPS**: Ubuntu, IP `77.222.53.144`
- **Port**: 3000 (WebSocket)
- **Protocol**: JSON messages over WebSocket

## First-Time VPS Setup

1. SSH into the server:
   ```bash
   ssh root@77.222.53.144
   ```

2. Upload and run the setup script:
   ```bash
   bash setup-vps.sh
   ```

   This installs Node.js 22, creates the app directory, and configures the systemd service.

## Deployment

From your local machine, in the `JailBreak-server/` directory:

```bash
bash deploy.sh
```

This uploads `package.json`, `server.js`, and the `maps/` directory to the VPS, installs dependencies, and restarts the service.

## Local Development

```bash
npm install
npm run dev
```

The server starts on `ws://localhost:3000` (or the port specified by the `PORT` environment variable).

## Message Protocol

All messages are JSON with a `type` field.

### Client to Server

| Type | Fields | Description |
|------|--------|-------------|
| `join` | `nickname` | Join the game |
| `move` | `position: {x,y,z}`, `rotation: {x,y}` | Update position |
| `chat` | `text` | Send chat message |
| `map_request` | - | Request current map |
| `map_upload` | `map` | Upload a new map (admin) |
| `player_list` | - | Request connected players |

### Server to Client

| Type | Fields | Description |
|------|--------|-------------|
| `welcome` | `id`, `players` | Sent on join with assigned player ID |
| `player_joined` | `player: {id, nickname, position, rotation}` | New player connected |
| `player_left` | `id` | Player disconnected |
| `state` | `players` | Position update broadcast (20 Hz) |
| `chat` | `id`, `nickname`, `text` | Chat message |
| `map_data` | `map` | Map data response |
| `map_upload_ok` | - | Map upload confirmation |
| `player_list` | `players` | List of connected players |

## Service Management

On the VPS:

```bash
systemctl status jailbreak    # Check status
systemctl restart jailbreak   # Restart
systemctl stop jailbreak      # Stop
journalctl -u jailbreak -f    # View logs
```
