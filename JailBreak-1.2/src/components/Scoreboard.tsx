import { PlayerData } from '../game/multiplayer';

interface ScoreboardProps {
  players: Map<string, PlayerData>;
  visible: boolean;
  localPlayerId: string | null;
  localTeam: 'guard' | 'prisoner';
}

export const Scoreboard = ({ players, visible, localPlayerId, localTeam }: ScoreboardProps) => {
  if (!visible) return null;

  const allPlayers = Array.from(players.values());
  const guards = allPlayers.filter(p => p.team === 'guard');
  const prisoners = allPlayers.filter(p => p.team === 'prisoner');

  // Add local player to appropriate team list
  const localNickname = localStorage.getItem('jb_nickname') || 'You';
  const localEntry: PlayerData = {
    id: localPlayerId || '__local__',
    nickname: localNickname,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0 },
    team: localTeam,
    ping: 0,
  };

  if (localTeam === 'guard') {
    guards.unshift(localEntry);
  } else {
    prisoners.unshift(localEntry);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div style={{
        width: '80%',
        maxWidth: 800,
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
        padding: 16,
      }}>
        <div className="flex gap-4">
          {/* Guards column */}
          <div className="flex-1">
            <div className="text-center mb-3 pb-2 border-b border-blue-800/50">
              <span className="text-blue-400 font-bold text-sm">Охрана</span>
              <span className="text-gray-500 text-xs ml-2">({guards.length})</span>
            </div>
            <div className="space-y-1">
              {guards.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded"
                  style={{
                    background: p.id === (localPlayerId || '__local__') ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: p.id === (localPlayerId || '__local__') ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  }}
                >
                  <span className="text-gray-200 text-sm truncate">{p.nickname}</span>
                  <span className="text-gray-500 text-xs font-mono">{p.ping != null ? `${p.ping}ms` : '---'}</span>
                </div>
              ))}
              {guards.length === 0 && (
                <div className="text-gray-600 text-sm text-center py-2">Нет игроков</div>
              )}
            </div>
          </div>

          {/* Prisoners column */}
          <div className="flex-1">
            <div className="text-center mb-3 pb-2 border-b border-orange-800/50">
              <span className="text-orange-400 font-bold text-sm">Заключённые</span>
              <span className="text-gray-500 text-xs ml-2">({prisoners.length})</span>
            </div>
            <div className="space-y-1">
              {prisoners.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded"
                  style={{
                    background: p.id === (localPlayerId || '__local__') ? 'rgba(249,115,22,0.15)' : 'transparent',
                    border: p.id === (localPlayerId || '__local__') ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
                  }}
                >
                  <span className="text-gray-200 text-sm truncate">{p.nickname}</span>
                  <span className="text-gray-500 text-xs font-mono">{p.ping != null ? `${p.ping}ms` : '---'}</span>
                </div>
              ))}
              {prisoners.length === 0 && (
                <div className="text-gray-600 text-sm text-center py-2">Нет игроков</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
