import { useEffect } from 'react';
import { soundSystem } from '../game/SoundSystem';

interface GuardMenuProps {
  isOpen: boolean;
  isWarden: boolean;
  wardenTaken: boolean;
  cellsOpen: boolean;
  /**
   * Whether the current map has any cell-doors registered.
   * Defaults to true for the regular game (PrisonMapDetailed always
   * creates doors). The map editor's playtest sets this from
   * PlaytestMode.hasDoors() so the warden command is informative
   * when the playtested map has no `bars_door` objects placed.
   */
  hasDoors?: boolean;
  onBecomeWarden: () => void;
  onToggleCells: () => void;
}

export const GuardMenu = ({
  isOpen,
  isWarden,
  wardenTaken,
  cellsOpen,
  hasDoors = true,
  onBecomeWarden,
  onToggleCells
}: GuardMenuProps) => {

  // Горячие клавиши
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Digit1':
          if (!isWarden && !wardenTaken) {
            soundSystem.playClick();
            onBecomeWarden();
          } else if (isWarden && hasDoors) {
            soundSystem.playClick();
            onToggleCells();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, isWarden, wardenTaken, hasDoors, onBecomeWarden, onToggleCells]);

  if (!isOpen) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
      <div className="bg-gray-900/95 border border-blue-500/50 rounded-xl p-4 w-72 shadow-2xl">
        {/* Заголовок */}
        <div className="mb-4 pb-3 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Меню охраны</h2>
          <p className="text-gray-400 text-xs">Нажмите M чтобы закрыть</p>
        </div>

        {/* Статус начальника */}
        {isWarden && (
          <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <div className="text-yellow-400 font-bold">Начальник охраны</div>
            <div className="text-yellow-200/60 text-xs">Вы командуете</div>
          </div>
        )}

        {/* Команды */}
        <div className="space-y-2">
          {/* Стать начальником */}
          {!isWarden && (
            <button
              onClick={() => { soundSystem.playClick(); onBecomeWarden(); }}
              disabled={wardenTaken}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all
                ${wardenTaken 
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-900/50 hover:bg-blue-800/70 text-white cursor-pointer border border-blue-500/30 hover:border-blue-400/60'
                }`}
            >
              <span className="bg-yellow-500/20 text-yellow-400 font-bold w-7 h-7 rounded flex items-center justify-center text-sm">1</span>
              <div>
                <div className="font-bold">Взять начальника охраны</div>
                <div className="text-xs opacity-60">
                  {wardenTaken 
                    ? 'Начальник уже назначен в этом раунде' 
                    : 'Командуйте заключёнными'
                  }
                </div>
              </div>
            </button>
          )}

          {/* Команды начальника */}
          {isWarden && hasDoors && (
            <button
              onClick={() => { soundSystem.playClick(); onToggleCells(); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer border
                ${cellsOpen 
                  ? 'bg-red-900/50 hover:bg-red-800/70 text-white border-red-500/30 hover:border-red-400/60' 
                  : 'bg-green-900/50 hover:bg-green-800/70 text-white border-green-500/30 hover:border-green-400/60'
                }`}
            >
              <span className={`font-bold w-7 h-7 rounded flex items-center justify-center text-sm
                ${cellsOpen ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
              >1</span>
              <div>
                <div className="font-bold">
                  {cellsOpen ? 'Закрыть все камеры' : 'Открыть все камеры'}
                </div>
                <div className="text-xs opacity-60">
                  {cellsOpen ? 'Запереть заключённых' : 'Выпустить всех заключённых'}
                </div>
              </div>
            </button>
          )}

          {/* No doors on this map (editor playtest with no bars_door objects) */}
          {isWarden && !hasDoors && (
            <div className="bg-gray-800/60 border border-gray-600/50 rounded-lg p-3">
              <div className="text-gray-300 font-bold text-sm mb-1">Нет дверей-решёток</div>
              <div className="text-gray-500 text-xs">
                На этой карте не размещены объекты <span className="font-mono text-gray-400">bars_door</span>.
                Добавьте их в редакторе, чтобы управлять камерами.
              </div>
            </div>
          )}
        </div>

        {/* Подсказка */}
        {!isWarden && !wardenTaken && (
          <div className="mt-4 pt-3 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-xs">
              Начальник охраны управляет заключёнными и проводит игры
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
