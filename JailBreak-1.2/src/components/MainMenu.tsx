import { useState, useEffect, useRef } from 'react';
import { getQuality, setQuality, type Quality } from '../game/QualitySettings';

interface MainMenuProps {
  onOpenEditor: () => void;
  onOpenServers: () => void;
}

/* ========== SETTINGS MODAL ========== */
const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [volume, setVolume] = useState(50);
  const [quality, setQualityState] = useState<Quality>(() => getQuality());

  const changeQuality = (q: Quality) => {
    setQualityState(q);
    setQuality(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, maxHeight: '85vh', borderRadius: 12,
        background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <span className="text-white font-semibold text-sm">Настройки</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition text-lg">✕</button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(85vh - 50px)' }}>
          {/* Sound */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-blue-400 mb-3 uppercase tracking-wider">Звук</h3>
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
            <h3 className="text-xs font-bold text-green-400 mb-3 uppercase tracking-wider">Графика</h3>
            <div className="bg-black/30 rounded-lg p-4">
              <span className="text-gray-300 text-sm block mb-3">Качество</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button key={q} onClick={() => changeQuality(q)}
                    className={`py-2 rounded text-sm font-medium transition-all ${quality === q
                      ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {q === 'low' ? 'Низкое' : q === 'medium' ? 'Среднее' : 'Высокое'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Controls */}
          <div>
            <h3 className="text-xs font-bold text-yellow-400 mb-3 uppercase tracking-wider">Управление</h3>
            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              {[['WASD','Движение'],['Мышь','Обзор'],['SPACE','Прыжок'],['ЛКМ','Атака / Стрельба'],['E','Взаимодействие'],['G','Выбросить оружие'],['R','Перезарядка']].map(([key, desc]) => (
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

/* ========== SCENE COMPONENTS (pure CSS art) ========== */

const ScenePrison = () => (
  <div className="scene-prison absolute inset-0 overflow-hidden">
    {/* Night sky */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4a 40%, #111833 100%)' }} />
    {/* Stars */}
    {Array.from({ length: 30 }, (_, i) => (
      <div key={i} className="star absolute rounded-full bg-white" style={{
        width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
        left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 55}%`,
        opacity: 0.4 + (i % 5) * 0.12,
        animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i % 7) * 0.5}s infinite`,
      }} />
    ))}
    {/* Moon */}
    <div className="absolute" style={{
      width: 60, height: 60, borderRadius: '50%', top: '8%', right: '12%',
      background: 'radial-gradient(circle at 40% 40%, #f5f5dc, #c8c8a0)',
      boxShadow: '0 0 30px rgba(245,245,220,0.3), 0 0 60px rgba(245,245,220,0.15)',
    }} />
    {/* Prison building */}
    <div className="absolute bottom-0 left-0 right-0" style={{ height: '40%' }}>
      <div className="absolute bottom-0 left-[10%] w-[80%] h-[85%]" style={{ background: '#0d0d1a', borderRadius: '2px 2px 0 0' }}>
        {/* Windows */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="absolute" style={{
            width: 12, height: 16,
            left: `${10 + (i % 6) * 15}%`, top: `${20 + Math.floor(i / 6) * 35}%`,
            background: i % 3 === 0 ? '#f59e0b' : '#664400',
            opacity: i % 3 === 0 ? 0.8 : 0.4,
            animation: i % 4 === 0 ? `windowBlink ${3 + i % 5}s ease-in-out ${i * 0.7}s infinite` : 'none',
            boxShadow: i % 3 === 0 ? '0 0 8px rgba(245,158,11,0.4)' : 'none',
          }} />
        ))}
      </div>
      {/* Guard tower */}
      <div className="absolute bottom-0 right-[8%]" style={{ width: 40, height: '95%', background: '#0a0a15' }}>
        <div className="absolute top-0 left-[-8px] right-[-8px] h-[20%]" style={{ background: '#0f0f20', borderRadius: '2px 2px 0 0' }} />
      </div>
    </div>
    {/* Searchlight */}
    <div className="absolute" style={{
      width: 0, height: 0, top: '15%', right: '10%',
      borderLeft: '40px solid transparent', borderRight: '40px solid transparent',
      borderTop: '200px solid rgba(255,255,200,0.06)',
      transformOrigin: 'top center',
      animation: 'searchlight 6s ease-in-out infinite',
    }} />
    {/* Ground */}
    <div className="absolute bottom-0 left-0 right-0 h-[6%]" style={{ background: '#080810' }} />
  </div>
);

const SceneEscape = () => (
  <div className="scene-escape absolute inset-0 overflow-hidden">
    {/* Dark background */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1020 50%, #0d0d1a 100%)' }} />
    {/* Fence pattern */}
    <div className="absolute inset-0" style={{
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(100,100,100,0.1) 20px, rgba(100,100,100,0.1) 21px),
        repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(100,100,100,0.1) 20px, rgba(100,100,100,0.1) 21px)`,
    }} />
    {/* Alarm text */}
    <div className="absolute top-[8%] left-0 right-0 text-center" style={{ animation: 'alarmBlink 1s step-end infinite' }}>
      <span style={{ color: '#ef4444', fontSize: 28, fontWeight: 'bold', letterSpacing: 8, textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
        ТРЕВОГА
      </span>
    </div>
    {/* Alarm lights */}
    <div className="absolute top-[5%] left-[15%] w-4 h-4 rounded-full" style={{ background: '#ef4444', animation: 'alarmPulse 1.5s ease-in-out infinite', boxShadow: '0 0 20px #ef4444' }} />
    <div className="absolute top-[5%] right-[15%] w-4 h-4 rounded-full" style={{ background: '#ef4444', animation: 'alarmPulse 1.5s ease-in-out 0.75s infinite', boxShadow: '0 0 20px #ef4444' }} />
    {/* Figure climbing */}
    <div className="absolute" style={{ left: '50%', top: '35%', animation: 'climbFigure 8s ease-in-out infinite' }}>
      {/* Head */}
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1a1a1a', margin: '0 auto 2px' }} />
      {/* Body */}
      <div style={{ width: 10, height: 24, background: '#1a1a1a', margin: '0 auto', borderRadius: 2 }} />
      {/* Arms */}
      <div style={{ position: 'absolute', top: 16, left: -8, width: 8, height: 3, background: '#1a1a1a', transform: 'rotate(-45deg)' }} />
      <div style={{ position: 'absolute', top: 16, right: -8, width: 8, height: 3, background: '#1a1a1a', transform: 'rotate(45deg)' }} />
      {/* Legs */}
      <div style={{ position: 'absolute', bottom: -10, left: 0, width: 4, height: 12, background: '#1a1a1a', transform: 'rotate(-10deg)' }} />
      <div style={{ position: 'absolute', bottom: -10, right: 0, width: 4, height: 12, background: '#1a1a1a', transform: 'rotate(10deg)' }} />
    </div>
    {/* Searchlight beams */}
    <div className="absolute" style={{
      width: 0, height: 0, top: '10%', left: '5%',
      borderLeft: '30px solid transparent', borderRight: '30px solid transparent',
      borderTop: '250px solid rgba(255,255,200,0.04)',
      transformOrigin: 'top center',
      animation: 'searchlight2 5s ease-in-out infinite',
    }} />
    <div className="absolute" style={{
      width: 0, height: 0, top: '5%', right: '20%',
      borderLeft: '25px solid transparent', borderRight: '25px solid transparent',
      borderTop: '220px solid rgba(255,255,200,0.04)',
      transformOrigin: 'top center',
      animation: 'searchlight3 7s ease-in-out 1s infinite',
    }} />
  </div>
);

const SceneChase = () => (
  <div className="scene-chase absolute inset-0 overflow-hidden">
    {/* Forest background */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #050a05 0%, #0a1a0a 40%, #0d1a10 100%)' }} />
    {/* Trees (dark vertical shapes) */}
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="absolute bottom-0" style={{
        left: `${5 + i * 12}%`, width: 18 + (i % 3) * 6, height: `${50 + (i % 4) * 10}%`,
        background: `linear-gradient(180deg, #0a150a ${30 + i * 5}%, #050a05 100%)`,
        borderRadius: '4px 4px 0 0',
        opacity: 0.7 + (i % 3) * 0.1,
      }} />
    ))}
    {/* Running figure */}
    <div className="absolute bottom-[20%]" style={{ animation: 'runFigure 12s linear infinite' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#111', margin: '0 auto 2px' }} />
      <div style={{ width: 8, height: 20, background: '#111', margin: '0 auto', borderRadius: 2 }} />
    </div>
    {/* Flashlight beams from behind */}
    <div className="absolute" style={{
      left: 0, top: '30%', width: '50%', height: 60,
      background: 'linear-gradient(90deg, rgba(255,255,200,0.08) 0%, transparent 100%)',
      transform: 'rotate(5deg)',
    }} />
    <div className="absolute" style={{
      left: 0, top: '45%', width: '45%', height: 50,
      background: 'linear-gradient(90deg, rgba(255,255,200,0.06) 0%, transparent 100%)',
      transform: 'rotate(-3deg)',
    }} />
    {/* Rain */}
    {Array.from({ length: 40 }, (_, i) => (
      <div key={i} className="absolute" style={{
        width: 1, height: 20 + (i % 3) * 8,
        left: `${(i * 2.5) % 100}%`, top: `-${(i * 13) % 30}%`,
        background: 'rgba(200,220,255,0.15)',
        animation: `rain ${0.6 + (i % 4) * 0.15}s linear ${(i % 10) * 0.1}s infinite`,
      }} />
    ))}
    {/* Fog at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-[20%]" style={{
      background: 'linear-gradient(180deg, transparent 0%, rgba(200,220,200,0.08) 100%)',
    }} />
  </div>
);

const SceneFreedom = () => (
  <div className="scene-freedom absolute inset-0 overflow-hidden">
    {/* Sunrise gradient */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a1a3a 0%, #1a2a5a 25%, #4a3a2a 55%, #f59e0b 85%, #f97316 100%)' }} />
    {/* Sun */}
    <div className="absolute" style={{
      width: 80, height: 80, borderRadius: '50%',
      bottom: '18%', left: '50%', transform: 'translateX(-50%)',
      background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 60%, transparent 100%)',
      boxShadow: '0 0 60px rgba(251,191,36,0.5), 0 0 120px rgba(245,158,11,0.3)',
      animation: 'sunPulse 4s ease-in-out infinite',
    }} />
    {/* Light rays */}
    {Array.from({ length: 7 }, (_, i) => (
      <div key={i} className="absolute" style={{
        bottom: '22%', left: '50%', width: 3, height: '35%',
        background: 'linear-gradient(0deg, rgba(251,191,36,0.15) 0%, transparent 100%)',
        transformOrigin: 'bottom center',
        transform: `translateX(-50%) rotate(${(i - 3) * 15}deg)`,
        opacity: 0.6 + (i % 3) * 0.15,
      }} />
    ))}
    {/* Hill */}
    <div className="absolute bottom-0 left-[30%] right-[30%] h-[22%]" style={{
      background: '#0a0a0a', borderRadius: '50% 50% 0 0',
    }} />
    {/* Figure on hill */}
    <div className="absolute" style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0a0a0a', margin: '0 auto 2px' }} />
      <div style={{ width: 8, height: 22, background: '#0a0a0a', margin: '0 auto', borderRadius: 2 }} />
      <div style={{ position: 'absolute', top: 14, left: -6, width: 6, height: 3, background: '#0a0a0a', transform: 'rotate(-20deg)' }} />
      <div style={{ position: 'absolute', top: 14, right: -6, width: 6, height: 3, background: '#0a0a0a', transform: 'rotate(20deg)' }} />
    </div>
    {/* Birds */}
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="absolute text-black/60" style={{
        left: `${25 + i * 12}%`, top: `${15 + (i % 3) * 8}%`,
        fontSize: 10 + i * 2,
        animation: `birdFloat ${5 + i}s ease-in-out ${i * 0.8}s infinite`,
      }}>^</div>
    ))}
  </div>
);

/* ========== MAIN MENU ========== */
export const MainMenu = ({ onOpenEditor, onOpenServers }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenes = [ScenePrison, SceneEscape, SceneChase, SceneFreedom];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveScene(prev => (prev + 1) % 4);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const buttons = [
    { icon: '\u{1F5FA}\uFE0F', label: 'Редактор карт', action: onOpenEditor },
    { icon: '\u{1F310}', label: 'Серверы', action: onOpenServers },
    { icon: '\u2699\uFE0F', label: 'Настройки', action: () => setShowSettings(true) },
    { icon: '\u{1F6AA}', label: 'Выход', action: () => window.close() },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none flex">
      {/* LEFT PANEL */}
      <div className="menu-left-panel relative z-10 flex flex-col justify-between" style={{
        width: '37%', minWidth: 320,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        padding: '40px 32px',
      }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>
            <span style={{ color: '#3b82f6', textShadow: '0 0 20px rgba(59,130,246,0.4)' }}>Jail</span>
            <span style={{ color: '#f97316', textShadow: '0 0 20px rgba(249,115,22,0.4)' }}>Break</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">v1.2</p>
        </div>

        {/* Buttons */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {buttons.map((btn) => (
            <button key={btn.label} onClick={btn.action} className="menu-btn w-full flex items-center gap-4 px-5 text-left transition-all" style={{
              height: 56, borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span className="text-xl">{btn.icon}</span>
              <span className="text-white text-base font-medium">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 text-xs">&copy; JailBreak 2024</p>
        </div>
      </div>

      {/* RIGHT PANEL - Animated Scenes */}
      <div className="relative flex-1" style={{ background: '#0a0a1a' }}>
        {scenes.map((SceneComponent, i) => (
          <div key={i} className="absolute inset-0" style={{
            opacity: activeScene === i ? 1 : 0,
            transition: 'opacity 1.5s ease',
            pointerEvents: 'none',
          }}>
            <SceneComponent />
          </div>
        ))}
      </div>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        @keyframes windowBlink {
          0%, 40%, 100% { opacity: 0.8; background: #f59e0b; }
          50%, 60% { opacity: 0.2; background: #664400; }
        }
        @keyframes searchlight {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(30deg); }
        }
        @keyframes searchlight2 {
          0%, 100% { transform: rotate(10deg); }
          50% { transform: rotate(50deg); }
        }
        @keyframes searchlight3 {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(-40deg); }
        }
        @keyframes alarmBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
        @keyframes alarmPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px #ef4444; }
          50% { transform: scale(1.3); box-shadow: 0 0 40px #ef4444, 0 0 60px rgba(239,68,68,0.4); }
        }
        @keyframes climbFigure {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes runFigure {
          0% { left: 85%; }
          100% { left: -10%; }
        }
        @keyframes rain {
          0% { transform: translateY(-100%); opacity: 0.6; }
          100% { transform: translateY(800px); opacity: 0; }
        }
        @keyframes sunPulse {
          0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 60px rgba(251,191,36,0.5), 0 0 120px rgba(245,158,11,0.3); }
          50% { transform: translateX(-50%) scale(1.05); box-shadow: 0 0 80px rgba(251,191,36,0.6), 0 0 150px rgba(245,158,11,0.4); }
        }
        @keyframes birdFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -5px); }
          50% { transform: translate(20px, 0); }
          75% { transform: translate(10px, 5px); }
        }
        .menu-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateX(4px);
        }
        .menu-btn {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
};
