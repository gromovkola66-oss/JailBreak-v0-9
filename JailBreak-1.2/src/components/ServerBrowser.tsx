import { useState, useEffect, useCallback } from 'react';
import { MultiplayerClient, ServerInfo, SERVER_LIST } from '../game/multiplayer';

interface ServerBrowserProps {
  onConnected: (client: MultiplayerClient) => void;
  onBack: () => void;
}

interface ServerEntry {
  url: string;
  name: string;
  map: string;
  players: string;
  ping: number | null;
  error: boolean;
  loading: boolean;
}

export const ServerBrowser = ({ onConnected, onBack }: ServerBrowserProps) => {
  const [servers, setServers] = useState<ServerEntry[]>(() =>
    SERVER_LIST.map(s => ({ url: s.url, name: s.name, map: '---', players: '---', ping: null, error: false, loading: true }))
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [nickname, setNickname] = useState(() => localStorage.getItem('jb_nickname') || '');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');

  const pingServers = useCallback(() => {
    setServers(prev => prev.map(s => ({ ...s, loading: true, error: false })));
    SERVER_LIST.forEach((entry, idx) => {
      MultiplayerClient.pingServer(entry.url)
        .then((info: ServerInfo) => {
          setServers(prev => {
            const copy = [...prev];
            copy[idx] = {
              url: entry.url,
              name: info.name,
              map: info.map,
              players: `${info.players}/${info.maxPlayers}`,
              ping: info.ping,
              error: false,
              loading: false,
            };
            return copy;
          });
        })
        .catch(() => {
          setServers(prev => {
            const copy = [...prev];
            copy[idx] = {
              url: entry.url,
              name: entry.name,
              map: '---',
              players: '---',
              ping: null,
              error: true,
              loading: false,
            };
            return copy;
          });
        });
    });
  }, []);

  useEffect(() => {
    pingServers();
  }, [pingServers]);

  const handleConnect = () => {
    if (selectedIdx === null || !nickname.trim()) return;
    const server = servers[selectedIdx];
    const trimmedNickname = nickname.trim();
    localStorage.setItem('jb_nickname', trimmedNickname);

    setStatus('connecting');
    const client = new MultiplayerClient();

    client.onWelcome = () => {
      setStatus('idle');
      onConnected(client);
    };

    client.onDisconnected = () => {
      setStatus('error');
    };

    client.connect(trimmedNickname, server.url);
  };

  const getPingColor = (ping: number | null) => {
    if (ping === null) return '#6b7280';
    if (ping < 50) return '#4ade80';
    if (ping < 100) return '#facc15';
    return '#ef4444';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        width: 700,
        maxHeight: '80vh',
        borderRadius: 8,
        background: 'rgba(15,15,30,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <span className="text-white font-bold text-base">Серверы</span>
        </div>

        {/* Server table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* Table header */}
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
            <div style={{ flex: 3 }}>Сервер</div>
            <div style={{ flex: 2 }}>Карта</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Игроки</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Пинг</div>
          </div>

          {/* Server rows */}
          {servers.map((server, idx) => (
            <div
              key={idx}
              className="flex items-center px-3 py-2.5 cursor-pointer transition-all rounded"
              style={{
                background: selectedIdx === idx ? 'rgba(59,130,246,0.2)' : 'transparent',
                border: selectedIdx === idx ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              }}
              onClick={() => setSelectedIdx(idx)}
            >
              <div style={{ flex: 3 }} className="text-sm text-white font-medium truncate">
                {server.loading ? (
                  <span className="text-gray-500 animate-pulse">Загрузка...</span>
                ) : (
                  server.name
                )}
              </div>
              <div style={{ flex: 2 }} className="text-sm text-gray-300 truncate">
                {server.loading ? '...' : server.map}
              </div>
              <div style={{ flex: 1, textAlign: 'center' }} className="text-sm text-gray-300">
                {server.loading ? '...' : server.players}
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {server.loading ? (
                  <span className="text-gray-500 text-sm">...</span>
                ) : server.error ? (
                  <span className="text-red-400 text-sm">---</span>
                ) : (
                  <span className="text-sm font-mono" style={{ color: getPingColor(server.ping) }}>
                    {server.ping}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom area */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Никнейм..."
            maxLength={20}
            className="px-3 py-2 bg-black/40 border border-white/10 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
            style={{ width: 160 }}
          />
          <button
            onClick={handleConnect}
            disabled={selectedIdx === null || !nickname.trim() || status === 'connecting'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm font-medium transition"
          >
            {status === 'connecting' ? 'Подключение...' : 'Подключиться'}
          </button>
          <button
            onClick={pingServers}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition"
          >
            Обновить
          </button>
          <div style={{ flex: 1 }} />
          {status === 'error' && (
            <span className="text-red-400 text-xs">Ошибка подключения</span>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};
