import { useState, useRef, useEffect } from 'react';
import { EditorObjectType } from '../editor/EditorObjects';
import { PlacedObject } from '../editor/MapEditor';
import { Layer } from '../editor/LayerSystem';
import { Prefab } from '../editor/PrefabSystem';
import { LightProperties } from '../editor/LightingSystem';
import { VegetationPreset } from '../editor/VegetationBrush';

export interface EditorUIProps {
  objectTypes: EditorObjectType[];
  selectedType: EditorObjectType | null;
  selectedObject: PlacedObject | null;
  objectCount: number;
  gridEnabled: boolean;
  moveModeEnabled: boolean;
  placementY: number;
  canUndo: boolean;
  canRedo: boolean;
  multiSelectCount: number;
  terrainMode: boolean;
  terrainBrush: { type: string; radius: number; strength: number; paintMaterial: number };
  onSelectType: (typeId: string | null) => void;
  onToggleGrid: () => void;
  onToggleMove: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBackToGame: () => void;
  onPlaytest: () => void;
  onUpdateGroupId?: (id: number) => void;
  onUpdateLabel?: (label: string) => void;
  onToggleTerrainMode: () => void;
  onTerrainBrushChange: (brush: { type: string; radius: number; strength: number; paintMaterial: number }) => void;
  // Layer system props
  layers: Layer[];
  activeLayer: string;
  isolationLayerId: string | null;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerIsolation: (layerId: string | null) => void;
  onActiveLayerChange: (layerId: string) => void;
  onAssignLayer?: (layerId: string) => void;
  // Prefab system props
  prefabs: Prefab[];
  onSavePrefab: (name: string) => void;
  onDeletePrefab: (id: string) => void;
  onPlacePrefab: (id: string) => void;
  // MiniMap
  miniMapCanvas: HTMLCanvasElement | null;
  // Position editing
  onPositionChange?: (axis: 'x' | 'y' | 'z', value: number) => void;
  // Lighting system props
  lightProperties: LightProperties | null;
  godRaysEnabled: boolean;
  shadowsEnabled: boolean;
  onLightPropertyChange: (property: string, value: string | number | boolean) => void;
  onToggleGodRays: () => void;
  onToggleShadows: () => void;
  // Advanced terrain props
  onHeightmapImport: (file: File) => void;
  onTerrainAutoPaint: () => void;
  // Vegetation brush props
  vegetationPreset: VegetationPreset;
  onVegetationPaint: () => void;
  onVegetationClear: () => void;
  onVegetationPresetChange: (preset: VegetationPreset) => void;
  // Timeline / Node editor props
  timelineVisible?: boolean;
  nodeEditorVisible?: boolean;
  animPlaying?: boolean;
  onToggleTimeline?: () => void;
  onToggleNodeEditor?: () => void;
  // Procedural generation props
  proceduralPanelVisible?: boolean;
  onToggleProcedural?: () => void;
}

export const EditorUI = (props: EditorUIProps) => {
  const {
    objectTypes, selectedType, selectedObject, objectCount,
    gridEnabled, moveModeEnabled, placementY,
    canUndo, canRedo, multiSelectCount,
    terrainMode, terrainBrush,
    onSelectType, onToggleGrid, onToggleMove,
    onExport, onImport, onClear, onDelete, onRotate, onDuplicate,
    onUndo, onRedo, onBackToGame, onPlaytest,
    onUpdateGroupId, onUpdateLabel,
    onToggleTerrainMode, onTerrainBrushChange,
    layers, activeLayer, isolationLayerId,
    onLayerToggleVisibility, onLayerToggleLock, onLayerIsolation, onActiveLayerChange, onAssignLayer,
    prefabs, onSavePrefab, onDeletePrefab, onPlacePrefab,
    miniMapCanvas, onPositionChange,
    lightProperties, godRaysEnabled, shadowsEnabled,
    onLightPropertyChange, onToggleGodRays, onToggleShadows,
    onHeightmapImport, onTerrainAutoPaint,
    vegetationPreset, onVegetationPaint, onVegetationClear, onVegetationPresetChange,
    timelineVisible, nodeEditorVisible, animPlaying,
    onToggleTimeline, onToggleNodeEditor,
    proceduralPanelVisible, onToggleProcedural,
  } = props;

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('walls');
  const [showHelp, setShowHelp] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [prefabsCollapsed, setPrefabsCollapsed] = useState(true);
  const [prefabName, setPrefabName] = useState('');
  const miniMapRef = useRef<HTMLDivElement>(null);
  const heightmapInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (miniMapCanvas && miniMapRef.current) {
      miniMapRef.current.innerHTML = '';
      miniMapRef.current.appendChild(miniMapCanvas);
    }
  }, [miniMapCanvas]);

  const categories = [
    { id: 'walls', name: 'Стены', icon: '🧱' },
    { id: 'items', name: 'Предметы', icon: '🪑' },
    { id: 'building', name: 'Стройка', icon: '🏗️' },
    { id: 'lighting', name: 'Свет', icon: '💡' },
    { id: 'scripts', name: 'Скрипты', icon: '⚡' },
    { id: 'things', name: 'Вещи', icon: '🎒' },
    { id: 'terrain', name: 'Рельеф', icon: '🌍' },
  ];

  const filteredObjects = objectTypes.filter(o => o.category === activeCategory);

  const toolButtons = [
    { id: 'select', icon: '🖱️', label: 'Выбор', hotkey: 'Esc', action: () => onSelectType(null) },
    { id: 'move', icon: '↔️', label: 'Двигать', hotkey: 'M', action: onToggleMove },
    { id: 'rotate', icon: '🔄', label: 'Поворот', hotkey: 'R', action: onRotate },
    { id: 'scale', icon: '📐', label: 'Масштаб', hotkey: '+/-', action: () => {} },
    { id: 'procedural', icon: '🏗️', label: 'Генерация', hotkey: '', action: () => onToggleProcedural?.() },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* === TOP BAR === */}
      <div className="absolute top-0 left-0 right-0 h-12 glass-panel rounded-none flex items-center px-4 pointer-events-auto z-20" style={{ animation: 'slideDown 0.3s ease' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBackToGame} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition">← Меню</button>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-white font-bold text-sm">🗺️ Редактор</span>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-gray-400 text-xs">Объектов: <span className="text-white font-bold">{objectCount}</span></span>
          {multiSelectCount > 1 && <span className="text-blue-400 text-xs">| Выделено: {multiSelectCount}</span>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <button onClick={onUndo} disabled={!canUndo} className={`px-2 py-1.5 rounded text-sm transition ${canUndo ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`} title="Отменить (Ctrl+Z)">↩</button>
          <button onClick={onRedo} disabled={!canRedo} className={`px-2 py-1.5 rounded text-sm transition ${canRedo ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`} title="Повторить (Ctrl+Y)">↪</button>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <button onClick={onPlaytest} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-bold transition-all hover:scale-105">🧪 Тест</button>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <button onClick={onToggleGrid} className={`px-2.5 py-1.5 rounded text-xs transition ${gridEnabled ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-300'}`}>
            {gridEnabled ? '▦ ON' : '▦ OFF'}
          </button>
          <button onClick={onToggleGodRays} className={`px-2.5 py-1.5 rounded text-xs transition ${godRaysEnabled ? 'bg-yellow-600 text-white' : 'bg-white/10 text-gray-300'}`} title="Лучи света">
            {godRaysEnabled ? '☀️ ON' : '☀️'}
          </button>
          <button onClick={onToggleShadows} className={`px-2.5 py-1.5 rounded text-xs transition ${shadowsEnabled ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300'}`} title="Тени">
            {shadowsEnabled ? '🌑 ON' : '🌑'}
          </button>
          <button onClick={onToggleTimeline} className={`px-2.5 py-1.5 rounded text-xs transition ${timelineVisible ? 'bg-orange-600 text-white' : 'bg-white/10 text-gray-300'}`} title="Таймлайн">
            {timelineVisible ? '🎬 ON' : '🎬'}
          </button>
          <button onClick={onToggleNodeEditor} className={`px-2.5 py-1.5 rounded text-xs transition ${nodeEditorVisible ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-300'}`} title="Скрипты">
            {nodeEditorVisible ? '🔗 ON' : '🔗'}
          </button>
          <div className="bg-white/5 rounded px-2 py-1 text-xs text-gray-300 flex items-center gap-1">
            Y: <span className="text-yellow-300 font-mono font-bold">{placementY.toFixed(1)}</span>
          </div>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <button onClick={onClear} className="px-2.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition">🗑️</button>
          <button onClick={() => setShowImport(true)} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition">📂</button>
          <button onClick={onExport} className="px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs transition">💾</button>
          <button onClick={() => setShowHelp(true)} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition font-bold">❓</button>
        </div>
      </div>

      {/* === LEFT SIDEBAR === */}
      <div className="absolute left-0 top-12 bottom-0 w-64 glass-panel rounded-none pointer-events-auto overflow-hidden flex flex-col z-10" style={{ animation: 'slideInLeft 0.3s ease' }}>
        {/* Tool Buttons */}
        <div className="grid grid-cols-5 gap-1 p-2 border-b border-white/10">
          {toolButtons.map(btn => (
            <button key={btn.id} onClick={btn.action}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs transition-all ${
                (btn.id === 'select' && !selectedType) || (btn.id === 'move' && moveModeEnabled) || (btn.id === 'procedural' && proceduralPanelVisible)
                  ? 'bg-blue-600/60 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-lg">{btn.icon}</span>
              <span className="text-[10px]">{btn.label}</span>
              {btn.hotkey && <span className="text-[9px] bg-white/10 px-1 rounded">{btn.hotkey}</span>}
            </button>
          ))}
        </div>

        {/* Layer Panel */}
        <div className="border-b border-white/10">
          <button onClick={() => setLayersCollapsed(!layersCollapsed)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition">
            <span className="font-bold">📑 Слои</span>
            <span className={`transition-transform duration-200 ${layersCollapsed ? '' : 'rotate-90'}`}>▶</span>
          </button>
          <div className={`collapse-animation ${layersCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="px-2 pb-2 space-y-1">
              {layers.map(layer => (
                <div key={layer.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${activeLayer === layer.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                  <span className={`flex-1 cursor-pointer truncate ${activeLayer === layer.id ? 'text-white font-bold' : 'text-gray-400'}`}
                    onClick={() => onActiveLayerChange(layer.id)}>{layer.name}</span>
                  <button onClick={() => onLayerToggleVisibility(layer.id)} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition ${layer.visible ? 'text-white' : 'text-gray-600'}`}
                    title={layer.visible ? 'Скрыть' : 'Показать'}>👁</button>
                  <button onClick={() => onLayerToggleLock(layer.id)} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition ${layer.locked ? 'text-red-400' : 'text-gray-500'}`}
                    title={layer.locked ? 'Разблокировать' : 'Заблокировать'}>{layer.locked ? '🔒' : '🔓'}</button>
                </div>
              ))}
              <button onClick={() => onLayerIsolation(isolationLayerId ? null : activeLayer)}
                className={`w-full text-[10px] py-1 rounded transition ${isolationLayerId ? 'bg-yellow-600/40 text-yellow-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                {isolationLayerId ? '⚡ Изоляция ВКЛ' : '⚡ Изоляция'}
              </button>
            </div>
          </div>
        </div>

        {/* Prefab Panel */}
        <div className="border-b border-white/10">
          <button onClick={() => setPrefabsCollapsed(!prefabsCollapsed)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition">
            <span className="font-bold">📦 Префабы</span>
            <span className={`transition-transform duration-200 ${prefabsCollapsed ? '' : 'rotate-90'}`}>▶</span>
          </button>
          <div className={`collapse-animation ${prefabsCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="px-2 pb-2 space-y-1">
              {multiSelectCount > 1 && (
                <div className="flex gap-1">
                  <input type="text" value={prefabName} onChange={e => setPrefabName(e.target.value)}
                    placeholder="Имя префаба" className="flex-1 bg-white/5 text-white text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-blue-500" />
                  <button onClick={() => { if (prefabName.trim()) { onSavePrefab(prefabName.trim()); setPrefabName(''); } }}
                    className="px-2 py-1 bg-green-600/60 hover:bg-green-500/60 text-white text-xs rounded transition">+</button>
                </div>
              )}
              {prefabs.length === 0 && <div className="text-gray-500 text-[10px] text-center py-2">Нет сохраненных префабов</div>}
              {prefabs.map(p => (
                <div key={p.id} className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs">
                  <span className="flex-1 text-gray-300 truncate">{p.name}</span>
                  <span className="text-gray-500 text-[10px]">{p.objects.length}</span>
                  <button onClick={() => onPlacePrefab(p.id)} className="text-blue-400 hover:text-blue-300 text-[10px] transition" title="Разместить">📌</button>
                  <button onClick={() => onDeletePrefab(p.id)} className="text-red-400 hover:text-red-300 text-[10px] transition" title="Удалить">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Object List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeCategory === 'terrain' && (
            <div className="p-2 border-b border-white/10 mb-2">
              <button onClick={onToggleTerrainMode}
                className={`w-full py-2 rounded-lg text-sm font-bold transition ${terrainMode ? 'bg-green-600 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
                {terrainMode ? '🖌️ Кисть рельефа ВКЛ' : '🖌️ Кисть рельефа'}
              </button>
              {terrainMode && (
                <div className="mt-2 space-y-2 bg-white/5 rounded-lg p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'raise', label: '⬆️', title: 'Поднять' },
                      { id: 'lower', label: '⬇️', title: 'Опустить' },
                      { id: 'flatten', label: '⏹️', title: 'Выровнять' },
                      { id: 'smooth', label: '〰️', title: 'Сгладить' },
                      { id: 'paint', label: '🎨', title: 'Красить' },
                    ].map(b => (
                      <button key={b.id} onClick={() => onTerrainBrushChange({...terrainBrush, type: b.id})}
                        className={`py-1.5 rounded text-xs text-center transition ${terrainBrush.type === b.id ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}
                        title={b.title}>{b.label}</button>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400"><span>Радиус</span><span className="text-white">{terrainBrush.radius}m</span></div>
                    <input type="range" min="1" max="20" value={terrainBrush.radius}
                      onChange={e => onTerrainBrushChange({...terrainBrush, radius: +e.target.value})}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400"><span>Сила</span><span className="text-white">{terrainBrush.strength.toFixed(1)}</span></div>
                    <input type="range" min="1" max="20" step="1" value={terrainBrush.strength * 10}
                      onChange={e => onTerrainBrushChange({...terrainBrush, strength: +e.target.value / 10})}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  {terrainBrush.type === 'paint' && (
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1">Материал</div>
                      <div className="flex gap-2">
                        {[
                          { idx: 0, color: '#4a7a2a', name: 'Трава' },
                          { idx: 1, color: '#8b6914', name: 'Грунт' },
                          { idx: 2, color: '#d4a574', name: 'Песок' },
                          { idx: 3, color: '#7a7a7a', name: 'Камень' },
                        ].map(m => (
                          <button key={m.idx} onClick={() => onTerrainBrushChange({...terrainBrush, paintMaterial: m.idx})}
                            className={`w-7 h-7 rounded-full border-2 transition ${terrainBrush.paintMaterial === m.idx ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'}`}
                            style={{ backgroundColor: m.color }} title={m.name} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Advanced terrain tools */}
              <div className="mt-2 space-y-1">
                <input ref={heightmapInputRef} type="file" accept="image/png" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) onHeightmapImport(file); e.target.value = ''; }} />
                <button onClick={() => heightmapInputRef.current?.click()}
                  className="w-full py-1.5 rounded text-xs bg-white/10 text-gray-300 hover:bg-white/15 transition">
                  🗺️ Импорт Heightmap (PNG)
                </button>
                <button onClick={onTerrainAutoPaint}
                  className="w-full py-1.5 rounded text-xs bg-white/10 text-gray-300 hover:bg-white/15 transition">
                  🎨 Авто-покраска
                </button>
              </div>
              {/* Vegetation brush */}
              <div className="mt-3 border-t border-white/10 pt-2">
                <div className="text-[10px] text-gray-400 font-bold mb-1">🌿 Растительность</div>
                <div className="flex gap-1 mb-1">
                  {(['tree', 'grass', 'bush'] as const).map(t => (
                    <button key={t} onClick={() => onVegetationPresetChange({ ...vegetationPreset, type: t })}
                      className={`flex-1 py-1 rounded text-[10px] transition ${vegetationPreset.type === t ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
                      {t === 'tree' ? '🌲' : t === 'grass' ? '🌾' : '🌳'} {t === 'tree' ? 'Дерево' : t === 'grass' ? 'Трава' : 'Куст'}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400"><span>Плотность</span><span className="text-white">{vegetationPreset.density}</span></div>
                  <input type="range" min="1" max="20" value={vegetationPreset.density}
                    onChange={e => onVegetationPresetChange({ ...vegetationPreset, density: +e.target.value })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={onVegetationPaint}
                    className="flex-1 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition">
                    🖌️ Разместить
                  </button>
                  <button onClick={onVegetationClear}
                    className="flex-1 py-1.5 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition">
                    🗑️ Очистить
                  </button>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => onSelectType(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${!selectedType ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
            <span>🖱️</span><span>Выбор объектов</span>
            <span className="ml-auto text-[9px] bg-white/10 px-1 rounded">Esc</span>
          </button>
          {filteredObjects.map((obj, idx) => (
            <button key={obj.id} onClick={() => onSelectType(obj.id)}
              style={{ animationDelay: `${idx * 30}ms` }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 animate-[fadeIn_0.2s_ease_forwards] opacity-0 ${
                selectedType?.id === obj.id ? 'bg-blue-600/40 text-white border border-blue-500/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:translate-x-1'
              }`}>
              <span className="text-xl w-8 h-8 flex items-center justify-center bg-black/20 rounded">{obj.icon}</span>
              <span className="font-medium flex-1">{obj.name}</span>
              {idx < 9 && <span className="text-[9px] bg-white/10 px-1 rounded text-gray-500">{idx + 1}</span>}
            </button>
          ))}
        </div>

        <div className="p-2.5 border-t border-white/10 text-[10px] text-gray-500 leading-relaxed">
          <span className="text-yellow-400">ЛКМ</span> ставить <span className="text-yellow-400">Shift+ЛКМ</span> мульти
          <br/><span className="text-yellow-400">ПКМ+мышь</span> камера <span className="text-yellow-400">WASD/QE</span> лететь
          <br/><span className="text-yellow-400">R</span> поворот <span className="text-yellow-400">M</span> двигать <span className="text-yellow-400">G</span> сетка
        </div>
      </div>

      {/* === RIGHT PANEL (selection) === */}
      {selectedObject && (
        <div className="absolute right-4 top-16 w-64 pointer-events-auto z-10" style={{ animation: 'slideInRight 0.2s ease' }}>
          <div className="glass-panel rounded-xl p-4 shadow-2xl">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 bg-blue-600/30 rounded-lg flex items-center justify-center">📦</span>
              <span>{multiSelectCount > 1 ? `Выделено: ${multiSelectCount}` : 'Свойства'}</span>
              {animPlaying && <span className="ml-auto text-orange-400 text-[10px] animate-pulse">🎬</span>}
            </h3>
            <div className="space-y-1.5 text-sm bg-black/20 rounded-lg p-3">
              <div className="flex justify-between"><span className="text-gray-500">Тип</span><span className="text-blue-300 font-medium">{selectedObject.type}</span></div>
              <div className="h-px bg-white/5" />
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis} className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase">{axis}</span>
                  <input type="number" step="0.5" value={selectedObject.position[axis].toFixed(2)}
                    onChange={e => onPositionChange?.(axis, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white/5 text-white text-xs font-mono rounded px-2 py-0.5 border border-white/10 focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div className="h-px bg-white/5" />
              <div className="flex justify-between"><span className="text-gray-500">Поворот</span><span className="text-yellow-300 font-mono">{selectedObject.rotation}°</span></div>
              {selectedObject.scale !== undefined && (
                <div className="flex justify-between"><span className="text-gray-500">Масштаб</span><span className="text-green-300 font-mono">{selectedObject.scale}</span></div>
              )}
              {/* Layer assignment */}
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Слой</span>
                <select onChange={e => onAssignLayer?.(e.target.value)} value={activeLayer}
                  className="bg-white/5 text-white text-xs rounded px-1 py-0.5 border border-white/10 focus:outline-none">
                  {layers.map(l => <option key={l.id} value={l.id} className="bg-gray-900">{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              <button onClick={onRotate} className="py-2 bg-blue-600/40 hover:bg-blue-500/60 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Повернуть (R)">🔄</button>
              <button onClick={onToggleMove} className={`py-2 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 ${moveModeEnabled ? 'bg-emerald-500/60 text-white' : 'bg-yellow-600/40 text-white'}`} title="Двигать (M)">↔️</button>
              <button onClick={onDuplicate} className="py-2 bg-violet-600/40 hover:bg-violet-500/60 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Дублировать (Ctrl+D)">📋</button>
              <button onClick={onDelete} className="py-2 bg-red-600/40 hover:bg-red-500/60 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Удалить (Del)">🗑️</button>
            </div>
            {(selectedObject.type === 'terminal' || selectedObject.type === 'camera' || selectedObject.type === 'bars_door_rental') && (
              <div className="mt-3 space-y-2 bg-black/20 rounded-lg p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">ID</span>
                    <input type="number" value={selectedObject.groupId ?? 1}
                      onChange={(e) => onUpdateGroupId?.(parseInt(e.target.value) || 1)}
                      className="w-16 bg-white/5 text-white text-xs rounded px-2 py-0.5 border border-white/10 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                {(selectedObject.type === 'camera' || selectedObject.type === 'bars_door_rental') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Метка</span>
                      <input type="text" value={selectedObject.label ?? ''}
                        onChange={(e) => onUpdateLabel?.(e.target.value)}
                        className="w-24 bg-white/5 text-white text-xs rounded px-2 py-0.5 border border-white/10 focus:outline-none focus:border-blue-500"
                        placeholder="Камера 1" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {moveModeEnabled && (
              <div className="mt-2 text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-700/40 rounded-lg p-2 animate-pulse">↔️ Двигай мышью - ЛКМ фиксация</div>
            )}
            {/* Light properties sub-panel */}
            {lightProperties && (
              <div className="mt-3 space-y-2 bg-black/20 rounded-lg p-3">
                <div className="text-xs text-yellow-300 font-bold mb-1">💡 Свойства света</div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Цвет</span>
                  <input type="color" value={lightProperties.color}
                    onChange={(e) => onLightPropertyChange('color', e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border border-white/10" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400"><span>Яркость</span><span className="text-white">{lightProperties.intensity.toFixed(1)}</span></div>
                  <input type="range" min="0" max="10" step="0.1" value={lightProperties.intensity}
                    onChange={(e) => onLightPropertyChange('intensity', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400"><span>Радиус</span><span className="text-white">{lightProperties.radius.toFixed(0)}</span></div>
                  <input type="range" min="1" max="50" step="1" value={lightProperties.radius}
                    onChange={(e) => onLightPropertyChange('radius', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Тени</span>
                  <input type="checkbox" checked={lightProperties.shadows}
                    onChange={(e) => onLightPropertyChange('shadows', e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === BOTTOM PANEL (object catalog) === */}
      <div className="absolute bottom-0 left-64 right-0 glass-panel rounded-none pointer-events-auto z-10" style={{ animation: 'slideInBottom 0.3s ease' }}>
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/10 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs whitespace-nowrap transition ${
                activeCategory === cat.id ? 'bg-white/15 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 p-2 overflow-x-auto">
          {filteredObjects.slice(0, 12).map(obj => (
            <button key={obj.id} onClick={() => onSelectType(obj.id)}
              className={`flex flex-col items-center gap-1 min-w-[60px] px-2 py-2 rounded-lg text-xs transition-all ${
                selectedType?.id === obj.id ? 'bg-blue-600/40 text-white border border-blue-500/30' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}>
              <span className="text-xl">{obj.icon}</span>
              <span className="text-[10px] truncate max-w-[56px]">{obj.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === MINI-MAP (bottom right) === */}
      <div className="absolute bottom-16 right-4 pointer-events-auto z-10" style={{ animation: 'panelFadeIn 0.5s ease' }}>
        <div className="glass-panel rounded-lg p-1.5" style={{ animation: 'miniMapPulse 3s ease-in-out infinite' }}>
          <div ref={miniMapRef} className="w-[180px] h-[180px] rounded-lg overflow-hidden" />
        </div>
      </div>

      {/* === BOTTOM HINTS === */}
      {terrainMode && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-6 py-3 pointer-events-none border border-green-600/30 z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖌️</span>
            <div>
              <div className="text-green-300 font-bold text-sm">Режим рельефа</div>
              <div className="text-gray-400 text-xs">ЛКМ - рисовать | ESC - выход</div>
            </div>
          </div>
        </div>
      )}
      {!terrainMode && selectedType && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-6 py-3 pointer-events-none z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedType.icon}</span>
            <div>
              <div className="text-white font-bold text-sm">{selectedType.name}</div>
              <div className="text-gray-400 text-xs">ЛКМ - поставить | R - повернуть | PgUp/Dn - высота Y:{placementY.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      {/* === IMPORT MODAL === */}
      {showImport && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto z-50">
          <div className="glass-panel rounded-xl p-6 w-[500px]" style={{ animation: 'scaleIn 0.2s ease' }}>
            <h3 className="text-white font-bold text-lg mb-4">📂 Импорт карты</h3>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Вставьте JSON..."
              className="w-full h-64 bg-white/5 text-white border border-white/10 rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowImport(false)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition">Отмена</button>
              <button onClick={() => { if (importText.trim()) { onImport(importText); setShowImport(false); setImportText(''); } }} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Импорт</button>
            </div>
          </div>
        </div>
      )}

      {/* === HELP MODAL === */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50" onClick={() => setShowHelp(false)}>
          <div className="glass-panel rounded-2xl p-8 w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.25s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">❓</span>
                Справка по редактору
              </h2>
              <button onClick={() => setShowHelp(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
            </div>
            <div className="space-y-6">
              <HelpSection title="📷 Камера">
                <HelpKey k="ПКМ + мышь" d="Вращение камеры" />
                <HelpKey k="WASD" d="Перемещение камеры" />
                <HelpKey k="Q / E" d="Вниз / вверх" />
                <HelpKey k="Колёсико" d="Зум" />
                <HelpKey k="Shift" d="Ускорение" />
              </HelpSection>
              <HelpSection title="🏗️ Размещение">
                <HelpKey k="ЛКМ" d="Поставить выбранный объект" />
                <HelpKey k="R" d="Повернуть на 90°" />
                <HelpKey k="PgUp / PgDown" d="Изменить высоту (Y)" />
                <HelpKey k="G" d="Сетка вкл/выкл" />
                <HelpKey k="1-9" d="Быстрый выбор" />
                <HelpKey k="ESC" d="Отменить выбор" />
              </HelpSection>
              <HelpSection title="🖱️ Выделение">
                <HelpKey k="ЛКМ" d="Выделить объект" />
                <HelpKey k="Shift + ЛКМ" d="Мультивыделение" />
                <HelpKey k="M" d="Режим перемещения" />
                <HelpKey k="Ctrl + D" d="Дублировать" />
                <HelpKey k="Del" d="Удалить" />
              </HelpSection>
              <HelpSection title="↩ История">
                <HelpKey k="Ctrl + Z" d="Отменить" />
                <HelpKey k="Ctrl + Y" d="Повторить" />
              </HelpSection>
              <HelpSection title="📑 Слои">
                <HelpKey k="Панель слоев" d="Скрыть/показать/заблокировать слои" />
                <HelpKey k="Изоляция" d="Показать только текущий слой" />
              </HelpSection>
              <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4">
                <h3 className="text-indigo-300 font-bold mb-2">💡 Советы</h3>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li>• Расставь <span className="text-orange-400">спавн-поинты</span> из раздела Скрипты перед тестированием</li>
                  <li>• Используй <span className="text-yellow-400">PgUp/PgDown</span> для размещения ламп на потолке</li>
                  <li>• <span className="text-blue-400">Ctrl+D</span> для быстрого копирования</li>
                  <li>• <span className="text-green-400">Shift+клик</span> для мультивыделения</li>
                  <li>• Включи <span className="text-emerald-400">сетку (G)</span> для ровного размещения</li>
                  <li>• <span className="text-purple-400">Префабы</span>: выдели группу, сохрани, размещай одним кликом</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02]">Понятно! 👍</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const HelpSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-white/10 rounded-xl overflow-hidden">
    <div className="bg-white/5 px-4 py-2">
      <h3 className="text-gray-200 font-bold text-sm">{title}</h3>
    </div>
    <div className="px-4 py-2 space-y-1">{children}</div>
  </div>
);

const HelpKey = ({ k, d }: { k: string; d: string }) => (
  <div className="flex items-center gap-3 py-1">
    <kbd className="bg-white/10 text-yellow-300 px-2 py-0.5 rounded text-xs font-mono min-w-[100px] text-center">{k}</kbd>
    <span className="text-gray-300 text-sm">{d}</span>
  </div>
);
