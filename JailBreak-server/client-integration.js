// Example client-side WebSocket connection
// This will be integrated into the game's multiplayer module

const SERVER_URL = 'ws://77.222.53.144:3000';

class MultiplayerClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.players = new Map();
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onPlayerMove = null;
    this.onChat = null;
    this.onMapReceived = null;
  }

  connect(nickname) {
    this.ws = new WebSocket(SERVER_URL);
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ type: 'join', nickname }));
    };
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleMessage(msg);
    };
    this.ws.onclose = () => {
      console.log('Disconnected from server');
    };
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'welcome':
        this.playerId = msg.id;
        break;
      case 'player_joined':
        this.players.set(msg.player.id, msg.player);
        if (this.onPlayerJoin) this.onPlayerJoin(msg.player);
        break;
      case 'player_left':
        this.players.delete(msg.id);
        if (this.onPlayerLeave) this.onPlayerLeave(msg.id);
        break;
      case 'state':
        // Batch position update for all players
        for (const p of msg.players) {
          if (p.id !== this.playerId) {
            this.players.set(p.id, p);
            if (this.onPlayerMove) this.onPlayerMove(p);
          }
        }
        break;
      case 'chat':
        if (this.onChat) this.onChat(msg.nickname, msg.text);
        break;
      case 'map_data':
        if (this.onMapReceived) this.onMapReceived(msg.map);
        break;
    }
  }

  sendPosition(position, rotation) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'move', position, rotation }));
    }
  }

  sendChat(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text }));
    }
  }

  requestMap() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'map_request' }));
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}
