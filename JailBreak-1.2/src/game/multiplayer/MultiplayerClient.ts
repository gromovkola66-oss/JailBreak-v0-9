import { SERVER_URL } from './MultiplayerConstants';

export interface PlayerData {
  id: string;
  nickname: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  team?: 'guard' | 'prisoner' | null;
  ping?: number;
}

export interface ServerInfo {
  name: string;
  map: string;
  players: number;
  maxPlayers: number;
  ping: number;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private _playerId: string | null = null;
  private _players: Map<string, PlayerData> = new Map();
  private _isConnected = false;

  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onPlayerJoined?: (player: PlayerData) => void;
  public onPlayerLeft?: (id: string) => void;
  public onPlayersUpdated?: (players: Map<string, PlayerData>) => void;
  public onChatMessage?: (nickname: string, text: string) => void;
  public onWelcome?: (data: { id: string; players: PlayerData[] }) => void;
  public onMapData?: (map: any) => void;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get playerId(): string | null {
    return this._playerId;
  }

  getPlayers(): Map<string, PlayerData> {
    return this._players;
  }

  connect(nickname: string, serverUrl?: string): void {
    const url = serverUrl || SERVER_URL;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ type: 'join', nickname }));
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this._isConnected = false;
      this._players.clear();
      this.onDisconnected?.();
    };

    this.ws.onerror = () => {
      this._isConnected = false;
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
    this._players.clear();
  }

  sendPosition(position: { x: number; y: number; z: number }, rotation: { x: number; y: number }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'move', position, rotation }));
    }
  }

  sendChat(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text }));
    }
  }

  sendTeamSelection(team: 'guard' | 'prisoner'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'select_team', team }));
    }
  }

  requestMap(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'map_request' }));
    }
  }

  static pingServer(url: string): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error('Server ping timed out'));
        }
      }, 5000);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'server_info' }));
      };

      ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'server_info' && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          const ping = Date.now() - startTime;
          ws.close();
          resolve({
            name: msg.name as string,
            map: msg.map as string,
            players: msg.players as number,
            maxPlayers: msg.maxPlayers as number,
            ping
          });
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error('Failed to connect to server'));
        }
      };

      ws.onclose = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error('Connection closed before response'));
        }
      };
    });
  }

  private handleMessage(msg: Record<string, unknown>): void {
    switch (msg.type) {
      case 'welcome': {
        this._playerId = msg.id as string;
        this._isConnected = true;
        const players = msg.players as PlayerData[];
        this.onWelcome?.({ id: msg.id as string, players });
        this.onConnected?.();
        break;
      }

      case 'player_joined': {
        const player = msg.player as PlayerData;
        this._players.set(player.id, player);
        this.onPlayerJoined?.(player);
        break;
      }

      case 'player_left': {
        const id = msg.id as string;
        this._players.delete(id);
        this.onPlayerLeft?.(id);
        break;
      }

      case 'state': {
        const players = msg.players as PlayerData[];
        const newPlayers = new Map<string, PlayerData>();
        for (const p of players) {
          if (p.id !== this._playerId) {
            newPlayers.set(p.id, p);
          }
        }
        // Notify about players that are no longer present
        for (const id of this._players.keys()) {
          if (!newPlayers.has(id)) {
            this.onPlayerLeft?.(id);
          }
        }
        this._players = newPlayers;
        this.onPlayersUpdated?.(this._players);
        break;
      }

      case 'chat': {
        const nickname = msg.nickname as string;
        const text = msg.text as string;
        this.onChatMessage?.(nickname, text);
        break;
      }

      case 'ping_check': {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong_check', timestamp: msg.timestamp }));
        }
        break;
      }

      case 'player_team_changed': {
        const id = msg.id as string;
        const team = msg.team as 'guard' | 'prisoner';
        const player = this._players.get(id);
        if (player) {
          player.team = team;
          this.onPlayersUpdated?.(this._players);
        }
        break;
      }

      case 'map_data': {
        this.onMapData?.(msg.map);
        break;
      }
    }
  }
}
