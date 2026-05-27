import { SERVER_URL } from './MultiplayerConstants';

export interface PlayerData {
  id: string;
  nickname: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
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

  get isConnected(): boolean {
    return this._isConnected;
  }

  get playerId(): string | null {
    return this._playerId;
  }

  getPlayers(): Map<string, PlayerData> {
    return this._players;
  }

  connect(nickname: string): void {
    this.ws = new WebSocket(SERVER_URL);

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

  private handleMessage(msg: Record<string, unknown>): void {
    switch (msg.type) {
      case 'welcome':
        this._playerId = msg.id as string;
        this._isConnected = true;
        this.onConnected?.();
        break;

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
        for (const p of players) {
          if (p.id !== this._playerId) {
            this._players.set(p.id, p);
          }
        }
        this.onPlayersUpdated?.(this._players);
        break;
      }

      case 'chat': {
        const nickname = msg.nickname as string;
        const text = msg.text as string;
        this.onChatMessage?.(nickname, text);
        break;
      }
    }
  }
}
