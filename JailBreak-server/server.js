const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TICK_RATE = 20; // 20 ticks per second
const TICK_INTERVAL = 1000 / TICK_RATE; // 50ms

// Connected players: id -> { id, nickname, position, rotation, ws }
const players = new Map();

// Map data
const MAP_PATH = path.join(__dirname, 'maps', 'current.json');
let currentMap = loadMap();

function loadMap() {
  try {
    const data = fs.readFileSync(MAP_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.log('No map file found, using default');
    return { objects: [], terrain: { size: 1000 } };
  }
}

function saveMap(mapData) {
  try {
    fs.writeFileSync(MAP_PATH, JSON.stringify(mapData, null, 2));
    console.log('Map saved to', MAP_PATH);
  } catch (err) {
    console.error('Failed to save map:', err.message);
  }
}

// Broadcast a message to all connected players
function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);
  for (const [id, player] of players) {
    if (id !== excludeId && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  }
}

// Send message to a specific player
function sendTo(ws, message) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(message));
  }
}

// Get player list (without ws references)
function getPlayerList() {
  const list = [];
  for (const [id, player] of players) {
    list.push({
      id: player.id,
      nickname: player.nickname,
      position: player.position,
      rotation: player.rotation
    });
  }
  return list;
}

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`JailBreak Server v0.9.0`);
console.log(`WebSocket server listening on port ${PORT}`);
console.log(`Tick rate: ${TICK_RATE} Hz`);

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`New connection from ${ip}`);

  let playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      console.error('Malformed message received, ignoring');
      return;
    }

    try {
      handleMessage(ws, msg);
    } catch (err) {
      console.error('Error handling message:', err.message);
    }
  });

  function handleMessage(ws, msg) {
    switch (msg.type) {
      case 'join': {
        playerId = uuidv4();
        const player = {
          id: playerId,
          nickname: msg.nickname || 'Player',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0 },
          ws: ws
        };
        players.set(playerId, player);

        // Send welcome message with assigned ID
        sendTo(ws, {
          type: 'welcome',
          id: playerId,
          players: getPlayerList()
        });

        // Broadcast new player to others
        broadcast({
          type: 'player_joined',
          player: {
            id: player.id,
            nickname: player.nickname,
            position: player.position,
            rotation: player.rotation
          }
        }, playerId);

        console.log(`Player joined: ${player.nickname} (${playerId}) | Total: ${players.size}`);
        break;
      }

      case 'move': {
        if (!playerId || !players.has(playerId)) return;
        const player = players.get(playerId);
        if (msg.position) {
          player.position = {
            x: msg.position.x || 0,
            y: msg.position.y || 0,
            z: msg.position.z || 0
          };
        }
        if (msg.rotation) {
          player.rotation = {
            x: msg.rotation.x || 0,
            y: msg.rotation.y || 0
          };
        }
        break;
      }

      case 'chat': {
        if (!playerId || !players.has(playerId)) return;
        const player = players.get(playerId);
        const text = (msg.text || '').slice(0, 200); // Limit chat message length
        broadcast({
          type: 'chat',
          id: playerId,
          nickname: player.nickname,
          text: text
        });
        console.log(`[Chat] ${player.nickname}: ${text}`);
        break;
      }

      case 'map_request': {
        sendTo(ws, {
          type: 'map_data',
          map: currentMap
        });
        break;
      }

      case 'map_upload': {
        if (msg.map && typeof msg.map === 'object') {
          currentMap = msg.map;
          saveMap(currentMap);
          sendTo(ws, { type: 'map_upload_ok' });
          console.log('Map updated by', playerId);
        }
        break;
      }

      case 'player_list': {
        sendTo(ws, {
          type: 'player_list',
          players: getPlayerList()
        });
        break;
      }

      default:
        break;
    }
  }

  ws.on('close', () => {
    if (playerId && players.has(playerId)) {
      const player = players.get(playerId);
      console.log(`Player disconnected: ${player.nickname} (${playerId}) | Total: ${players.size - 1}`);
      players.delete(playerId);

      // Broadcast disconnect to all others
      broadcast({
        type: 'player_left',
        id: playerId
      });
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Broadcast game state at fixed tick rate
const tickInterval = setInterval(() => {
  if (players.size === 0) return;

  const state = {
    type: 'state',
    players: getPlayerList()
  };

  broadcast(state);
}, TICK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  clearInterval(tickInterval);
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  clearInterval(tickInterval);
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
