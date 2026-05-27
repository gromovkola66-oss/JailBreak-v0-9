import { useState, useEffect, useCallback, useRef } from 'react';
import { getQuality, setQuality, type Quality } from '../game/QualitySettings';

interface MainMenuProps {
  onOpenEditor: () => void;
}

// === CUTSCENE FRAMES ===
const cutsceneFrames = [
  { title: 'Глава 1: Прибытие', text: 'Автобус останавливается у ворот тюрьмы строгого режима...' },
  { title: 'Регистрация', text: 'Отпечатки пальцев, фото, оранжевая роба...' },
  { title: 'Камера №47', text: 'Холодные стены, жёсткая койка, тусклый свет...' },
  { title: 'Первая ночь', text: 'Крики в коридоре, лязг замков, бессонница...' },
  { title: 'Знакомства', text: 'На прогулке подходит человек: \"Хочешь выбраться?\"' },
  { title: 'План', text: 'Каждую ночь, по кирпичику... Свобода ждёт.' },
];

// === CUTSCENE VIEWER ===
const CutsceneViewer = ({ onClose }: { onClose: () => void }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      timeoutRef.current = setTimeout(() => {
        setFrameIndex(prev => (prev + 1) % cutsceneFrames.length);
        setOpacity(1);
      }, 500);
    }, 4000);
    return () => {
      clearInterval(interval);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const goToPrev = () => {
    setOpacity(0);
    timeoutRef.current = setTimeout(() => {
      setFrameIndex(p => (p - 1 + cutsceneFrames.length) % cutsceneFrames.length);
      setOpacity(1);
    }, 300);
  };

  const goToNext = () => {
    setOpacity(0);
    timeoutRef.current = setTimeout(() => {
      setFrameIndex(p => (p + 1) % cutsceneFrames.length);
      setOpacity(1);
    }, 300);
  };

  const frame = cutsceneFrames[frameIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)' }}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition text-xl z-10">
        ✕
      </button>
      <div className="flex items-center gap-4 absolute bottom-8">
        <button onClick={goToPrev}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded transition text-sm">
          ← Назад
        </button>
        <span className="text-white/40 text-sm">{frameIndex + 1} / {cutsceneFrames.length}</span>
        <button onClick={goToNext}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded transition text-sm">
          Далее →
        </button>
      </div>
      <div className="text-center px-8 max-w-2xl" style={{ opacity, transition: 'opacity 0.5s ease' }}>
        <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '0 0 20px rgba(100,150,255,0.4)' }}>
          {frame.title}
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed italic">
          {frame.text}
        </p>
      </div>
    </div>
  );
};

// === SETTINGS PANEL (Win7 Window) ===
const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const [volume, setVolume] = useState(50);
  const [quality, setQualityState] = useState<Quality>(() => getQuality());

  const changeQuality = (q: Quality) => {
    setQualityState(q);
    setQuality(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div onClick={e => e.stopPropagation()}
        style={{
          animation: 'windowOpen 0.2s ease forwards',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          width: 550,
          maxHeight: '85vh',
        }}>
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(80,130,200,0.85) 0%, rgba(40,80,140,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          <span className="text-white text-sm font-medium">Панель управления - Настройки</span>
          <div className="flex gap-1">
            <button className="w-6 h-5 flex items-center justify-center text-white/70 hover:bg-white/20 rounded-sm text-xs">─</button>
            <button className="w-6 h-5 flex items-center justify-center text-white/70 hover:bg-white/20 rounded-sm text-xs">□</button>
            <button onClick={onClose} className="w-6 h-5 flex items-center justify-center text-white hover:bg-red-500 rounded-sm text-xs">✕</button>
          </div>
        </div>
        {/* Body */}
        <div style={{ background: 'rgba(20,20,35,0.92)', backdropFilter: 'blur(10px)', padding: 24, overflowY: 'auto', maxHeight: 'calc(85vh - 40px)' }}>
          {/* Sound */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-blue-300 mb-3 uppercase tracking-wider">Звук</h3>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">Громкость</span>
                <span className="text-white font-mono text-sm">{volume}%</span>
              </div>
              <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>

          {/* Graphics */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-green-300 mb-3 uppercase tracking-wider">Графика</h3>
            <div className="bg-black/30 rounded-lg p-4">
              <span className="text-gray-300 text-sm block mb-3">Качество</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button key={q} onClick={() => changeQuality(q)}
                    className={`py-2 rounded text-sm font-medium transition-all ${quality === q
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {q === 'low' ? 'Низкое' : q === 'medium' ? 'Среднее' : 'Высокое'}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                {quality === 'low' && 'Для слабых ноутбуков: тени отключены, без сглаживания.'}
                {quality === 'medium' && 'Сбалансированный режим: тени 1024, умеренная плотность.'}
                {quality === 'high' && 'Максимум: тени 2048, ретина-плотность.'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-yellow-300 mb-3 uppercase tracking-wider">Управление</h3>
            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              {[
                ['WASD', 'Движение'], ['Мышь', 'Обзор'], ['SPACE', 'Прыжок'],
                ['ЛКМ', 'Атака / Стрельба'], ['E', 'Подобрать / Взаимодействие'],
                ['G', 'Выбросить оружие'], ['R', 'Перезарядка'], ['M', 'Меню охраны'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-gray-700/50 last:border-0">
                  <kbd className="bg-gray-700 text-yellow-300 px-2 py-0.5 rounded text-xs font-mono">{key}</kbd>
                  <span className="text-gray-300 text-sm">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === SERVERS PANEL (Win7 Window) ===
const ServersPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40" />
    <div onClick={e => e.stopPropagation()}
      style={{
        animation: 'windowOpen 0.2s ease forwards',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        width: 480,
      }}>
      {/* Title bar */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(80,130,200,0.85) 0%, rgba(40,80,140,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}>
        <span className="text-white text-sm font-medium">Серверы - JailBreak Online</span>
        <div className="flex gap-1">
          <button className="w-6 h-5 flex items-center justify-center text-white/70 hover:bg-white/20 rounded-sm text-xs">─</button>
          <button className="w-6 h-5 flex items-center justify-center text-white/70 hover:bg-white/20 rounded-sm text-xs">□</button>
          <button onClick={onClose} className="w-6 h-5 flex items-center justify-center text-white hover:bg-red-500 rounded-sm text-xs">✕</button>
        </div>
      </div>
      {/* Body */}
      <div style={{ background: 'rgba(20,20,35,0.92)', backdropFilter: 'blur(10px)', padding: 32, textAlign: 'center' }}>
        <div className="text-4xl mb-4">🌐</div>
        <h2 className="text-xl font-bold text-white mb-2">Мультиплеер</h2>
        <p className="text-gray-400 mb-6 text-sm">Находится в разработке</p>
        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <p className="text-gray-500 text-sm">Список серверов появится здесь в будущих обновлениях.</p>
        </div>
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition">
          Закрыть
        </button>
      </div>
    </div>
  </div>
);

// === START MENU ===
const StartMenu = ({ onClose, onOpenEditor, onOpenServers, onOpenSettings }: {
  onClose: () => void;
  onOpenEditor: () => void;
  onOpenServers: () => void;
  onOpenSettings: () => void;
}) => {
  const items = [
    { icon: '📁', label: 'Редактор карт', action: onOpenEditor },
    { icon: '🌐', label: 'Серверы', action: onOpenServers },
    { icon: '⚙️', label: 'Настройки', action: onOpenSettings },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50" style={{
        bottom: 52,
        left: 4,
        width: 380,
        animation: 'startMenuOpen 0.2s ease forwards',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header with user */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(50,100,180,0.9) 0%, rgba(30,70,140,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl">👤</div>
          <div>
            <div className="text-white text-sm font-medium">Заключённый</div>
            <div className="text-white/50 text-xs">JailBreak v1.2</div>
          </div>
        </div>
        {/* Two columns */}
        <div style={{ background: 'rgba(15,15,30,0.92)', backdropFilter: 'blur(20px)', display: 'flex' }}>
          {/* Left column */}
          <div style={{ flex: 1, padding: '8px 4px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            {items.map(item => (
              <button key={item.label} onClick={() => { item.action(); onClose(); }}
                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-blue-600/40 rounded transition text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className="text-white/90">{item.label}</span>
              </button>
            ))}
            <div className="border-t border-gray-700/50 my-2 mx-3" />
            <button onClick={() => window.close()}
              className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-red-600/40 rounded transition text-sm">
              <span className="text-lg">🚪</span>
              <span className="text-red-300">Выход</span>
            </button>
          </div>
          {/* Right column */}
          <div style={{ width: 160, padding: '8px 4px', background: 'rgba(0,0,0,0.2)' }}>
            <button className="w-full text-left px-3 py-2 hover:bg-white/5 rounded transition text-sm text-white/60">
              Все программы →
            </button>
            <div className="border-t border-gray-700/50 my-2 mx-3" />
            <div className="px-3 py-1">
              <div className="text-xs text-gray-500">Система</div>
              <div className="text-xs text-gray-400 mt-1">React + Vite</div>
              <div className="text-xs text-gray-400">TypeScript</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// === MAIN MENU ===
export const MainMenu = ({ onOpenEditor }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleStartMenu = useCallback(() => {
    setShowStartMenu(prev => !prev);
  }, []);

  const desktopIcons = [
    { icon: '📁', label: 'Редактор карт', action: onOpenEditor },
    { icon: '🌐', label: 'Серверы', action: () => setShowServers(true) },
    { icon: '⚙️', label: 'Настройки', action: () => setShowSettings(true) },
    { icon: '🎬', label: 'JailBreak Story', action: () => setShowCutscene(true) },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none" style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d4e3a 25%, #2d5016 50%, #1a3a6b 75%, #0a1628 100%)',
    }}>
      {/* Aurora glow patches */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', width: '60%', height: '50%', top: '10%', left: '20%',
          background: 'radial-gradient(ellipse, rgba(30,120,80,0.3) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '40%', height: '40%', bottom: '20%', left: '5%',
          background: 'radial-gradient(ellipse, rgba(20,60,140,0.25) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '35%', height: '35%', top: '5%', right: '10%',
          background: 'radial-gradient(ellipse, rgba(60,140,60,0.2) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '50%', height: '30%', bottom: '30%', right: '15%',
          background: 'radial-gradient(ellipse, rgba(40,80,160,0.15) 0%, transparent 70%)',
        }} />
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 z-10 grid gap-2" style={{ gridTemplateColumns: '1fr', paddingTop: 8 }}>
        {desktopIcons.map(item => (
          <button key={item.label} onClick={item.action}
            className="desktop-icon flex flex-col items-center w-20 py-2 px-1 rounded hover:bg-blue-500/30 transition group cursor-pointer">
            <span className="text-5xl mb-1 drop-shadow-lg group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-white text-xs text-center leading-tight drop-shadow-md">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30" style={{
        height: 48,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
      }}>
        {/* Start button */}
        <button onClick={toggleStartMenu}
          className="start-button relative flex items-center justify-center transition-all"
          style={{
            width: 48,
            height: 38,
            borderRadius: 20,
            background: showStartMenu
              ? 'linear-gradient(180deg, #3a8add 0%, #1a5a9d 100%)'
              : 'linear-gradient(180deg, #2a6abb 0%, #164a8d 50%, #1a5a9d 100%)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: showStartMenu
              ? '0 0 12px rgba(60,140,255,0.6), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 0 8px rgba(60,140,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>
          <span className="text-white text-sm font-bold">&#9781;</span>
        </button>

        {/* Center area (pinned items indicator) */}
        <div className="flex items-center gap-1">
          {desktopIcons.map(item => (
            <div key={item.label} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition text-base cursor-pointer"
              title={item.label} onClick={item.action}>
              {item.icon}
            </div>
          ))}
        </div>

        {/* Right side: volume + clock */}
        <div className="flex items-center gap-3 pr-2">
          <span className="text-white/70 text-sm cursor-default" title="Звук">🔊</span>
          <span className="text-white/90 text-sm font-mono tracking-wide">{currentTime}</span>
        </div>
      </div>

      {/* Start Menu */}
      {showStartMenu && (
        <StartMenu
          onClose={() => setShowStartMenu(false)}
          onOpenEditor={onOpenEditor}
          onOpenServers={() => setShowServers(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Panels */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showServers && <ServersPanel onClose={() => setShowServers(false)} />}
      {showCutscene && <CutsceneViewer onClose={() => setShowCutscene(false)} />}

      {/* Animation styles */}
      <style>{`
        @keyframes windowOpen {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes startMenuOpen {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .desktop-icon {
          border: 1px solid transparent;
        }
        .desktop-icon:hover {
          border: 1px solid rgba(100,160,255,0.4);
        }
        .start-button:hover {
          box-shadow: 0 0 16px rgba(60,140,255,0.7), inset 0 1px 0 rgba(255,255,255,0.4) !important;
        }
      `}</style>
    </div>
  );
};
