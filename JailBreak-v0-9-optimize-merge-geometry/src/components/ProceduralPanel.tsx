import { useState } from 'react';
import type { GenerationParams } from '../editor/ProceduralGenerator';

export interface ProceduralPanelProps {
  visible: boolean;
  onGenerate: (params: GenerationParams) => void;
  onFillArea: (bounds: { x: number; z: number; w: number; d: number }, objectType: string, spacing: number) => void;
}

const STYLES = [
  { id: 'prison', name: 'Тюрьма' },
  { id: 'office', name: 'Офис' },
  { id: 'warehouse', name: 'Склад' },
  { id: 'bathroom', name: 'Санузел' },
  { id: 'barracks', name: 'Казарма' },
];

export const ProceduralPanel = ({ visible, onGenerate, onFillArea }: ProceduralPanelProps) => {
  const [style, setStyle] = useState('prison');
  const [areaWidth, setAreaWidth] = useState(40);
  const [areaDepth, setAreaDepth] = useState(40);
  const [areaX, setAreaX] = useState(0);
  const [areaZ, setAreaZ] = useState(0);
  const [roomMinSize, setRoomMinSize] = useState(6);
  const [roomMaxSize, setRoomMaxSize] = useState(12);
  const [corridorWidth, setCorridorWidth] = useState(3);
  const [density, setDensity] = useState(0.7);
  const [seed, setSeed] = useState(12345);

  // Fill area state
  const [fillObjectType, setFillObjectType] = useState('floor_concrete');
  const [fillSpacing, setFillSpacing] = useState(1);
  const [fillX, setFillX] = useState(0);
  const [fillZ, setFillZ] = useState(0);
  const [fillW, setFillW] = useState(10);
  const [fillD, setFillD] = useState(10);

  const [collapsed, setCollapsed] = useState(false);

  if (!visible) return null;

  const estimatedRooms = Math.max(1, Math.floor((areaWidth * areaDepth) / (roomMaxSize * roomMaxSize)));

  const handleGenerate = () => {
    onGenerate({
      areaX,
      areaZ,
      areaWidth,
      areaDepth,
      roomMinSize,
      roomMaxSize,
      corridorWidth,
      density,
      style,
      seed,
    });
  };

  const handleFill = () => {
    onFillArea({ x: fillX, z: fillZ, w: fillW, d: fillD }, fillObjectType, fillSpacing);
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999));
  };

  return (
    <div className="absolute left-64 top-14 w-72 glass-panel rounded-lg pointer-events-auto z-20 overflow-hidden" style={{ animation: 'slideInLeft 0.2s ease' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <span className="text-white text-sm font-bold">🏗️ Процедурная генерация</span>
        <span className="text-gray-400 text-xs">{collapsed ? '▶' : '▼'}</span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto text-xs">
          {/* Style */}
          <div>
            <label className="text-gray-300 block mb-1">Стиль</label>
            <select
              value={style}
              onChange={e => setStyle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1 text-xs"
            >
              {STYLES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Area position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 block mb-1">X начала</label>
              <input type="number" value={areaX} onChange={e => setAreaX(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Z начала</label>
              <input type="number" value={areaZ} onChange={e => setAreaZ(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
          </div>

          {/* Area size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 block mb-1">Ширина: {areaWidth}</label>
              <input type="range" min={20} max={200} value={areaWidth} onChange={e => setAreaWidth(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Глубина: {areaDepth}</label>
              <input type="range" min={20} max={200} value={areaDepth} onChange={e => setAreaDepth(Number(e.target.value))}
                className="w-full" />
            </div>
          </div>

          {/* Room size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 block mb-1">Мин. комната: {roomMinSize}</label>
              <input type="range" min={4} max={20} value={roomMinSize} onChange={e => setRoomMinSize(Number(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Макс. комната: {roomMaxSize}</label>
              <input type="range" min={4} max={20} value={roomMaxSize} onChange={e => setRoomMaxSize(Number(e.target.value))}
                className="w-full" />
            </div>
          </div>

          {/* Corridor width */}
          <div>
            <label className="text-gray-300 block mb-1">Ширина коридора: {corridorWidth}</label>
            <input type="range" min={2} max={6} value={corridorWidth} onChange={e => setCorridorWidth(Number(e.target.value))}
              className="w-full" />
          </div>

          {/* Density */}
          <div>
            <label className="text-gray-300 block mb-1">Плотность: {density.toFixed(2)}</label>
            <input type="range" min={10} max={100} value={Math.round(density * 100)} onChange={e => setDensity(Number(e.target.value) / 100)}
              className="w-full" />
          </div>

          {/* Seed */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-gray-300 block mb-1">Сид</label>
              <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
            <button onClick={handleRandomSeed}
              className="mt-4 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition">
              🎲
            </button>
          </div>

          {/* Estimated rooms */}
          <div className="text-gray-400 text-[10px] bg-white/5 rounded px-2 py-1">
            Примерно комнат: ~{estimatedRooms}
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-all hover:scale-[1.02]">
            🏗️ Генерировать
          </button>

          {/* Separator */}
          <div className="border-t border-white/10 pt-3">
            <span className="text-gray-300 font-bold block mb-2">Заполнить область</span>
          </div>

          {/* Fill area - object type */}
          <div>
            <label className="text-gray-300 block mb-1">Тип объекта</label>
            <input type="text" value={fillObjectType} onChange={e => setFillObjectType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1"
              placeholder="floor_concrete" />
          </div>

          {/* Fill area - spacing */}
          <div>
            <label className="text-gray-300 block mb-1">Шаг: {fillSpacing}</label>
            <input type="range" min={1} max={5} step={0.5} value={fillSpacing} onChange={e => setFillSpacing(Number(e.target.value))}
              className="w-full" />
          </div>

          {/* Fill area - bounds */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 block mb-1">X</label>
              <input type="number" value={fillX} onChange={e => setFillX(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Z</label>
              <input type="number" value={fillZ} onChange={e => setFillZ(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Ширина</label>
              <input type="number" value={fillW} onChange={e => setFillW(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Глубина</label>
              <input type="number" value={fillD} onChange={e => setFillD(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 text-white rounded px-2 py-1" />
            </div>
          </div>

          {/* Fill button */}
          <button onClick={handleFill}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all hover:scale-[1.02]">
            📦 Заполнить
          </button>
        </div>
      )}
    </div>
  );
};
