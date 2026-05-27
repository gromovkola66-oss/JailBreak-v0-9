import { useState, useEffect } from 'react';
import { MultiplayerClient, PlayerData } from '../game/multiplayer';

interface TeamSelectProps {
  multiplayerClient: MultiplayerClient;
  onTeamSelected: (team: 'guard' | 'prisoner') => void;
  onDisconnect: () => void;
}

export const TeamSelect = ({ multiplayerClient, onTeamSelected, onDisconnect }: TeamSelectProps) => {
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map(multiplayerClient.getPlayers()));

  useEffect(() => {
    const prev = multiplayerClient.onPlayersUpdated;
    multiplayerClient.onPlayersUpdated = (updatedPlayers) => {
      setPlayers(new Map(updatedPlayers));
      prev?.(updatedPlayers);
    };
    return () => {
      multiplayerClient.onPlayersUpdated = prev;
    };
  }, [multiplayerClient]);

  const guards = Array.from(players.values()).filter(p => p.team === 'guard');
  const prisoners = Array.from(players.values()).filter(p => p.team === 'prisoner');

  const handleSelect = (team: 'guard' | 'prisoner') => {
    multiplayerClient.sendTeamSelection(team);
    onTeamSelected(team);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(12px)',
    }}>
      <h2 className="text-white text-2xl font-bold mb-8">Выберите команду</h2>

      <div className="flex gap-8">
        {/* Guard panel */}
        <div
          className="cursor-pointer transition-all hover:scale-105"
          style={{
            width: 280,
            minHeight: 320,
            borderRadius: 12,
            background: 'rgba(30,60,120,0.3)',
            border: '2px solid rgba(59,130,246,0.4)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          onClick={() => handleSelect('guard')}
        >
          <div className="text-5xl mb-3">🛡️</div>
          <div className="text-xl font-bold text-blue-300 mb-1">Охрана</div>
          <div className="text-gray-400 text-sm mb-4">{guards.length} игрока</div>
          <div className="w-full flex-1 overflow-y-auto" style={{ maxHeight: 160 }}>
            {guards.length === 0 ? (
              <div className="text-gray-600 text-sm text-center">Нет игроков</div>
            ) : (
              guards.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1 border-b border-blue-900/30 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-gray-200 text-sm truncate">{p.nickname}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prisoner panel */}
        <div
          className="cursor-pointer transition-all hover:scale-105"
          style={{
            width: 280,
            minHeight: 320,
            borderRadius: 12,
            background: 'rgba(120,60,20,0.3)',
            border: '2px solid rgba(249,115,22,0.4)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          onClick={() => handleSelect('prisoner')}
        >
          <div className="text-5xl mb-3">⛓️</div>
          <div className="text-xl font-bold text-orange-300 mb-1">Заключённый</div>
          <div className="text-gray-400 text-sm mb-4">{prisoners.length} игрока</div>
          <div className="w-full flex-1 overflow-y-auto" style={{ maxHeight: 160 }}>
            {prisoners.length === 0 ? (
              <div className="text-gray-600 text-sm text-center">Нет игроков</div>
            ) : (
              prisoners.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1 border-b border-orange-900/30 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-gray-200 text-sm truncate">{p.nickname}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onDisconnect}
        className="mt-8 px-6 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition"
      >
        Отключиться
      </button>
    </div>
  );
};
