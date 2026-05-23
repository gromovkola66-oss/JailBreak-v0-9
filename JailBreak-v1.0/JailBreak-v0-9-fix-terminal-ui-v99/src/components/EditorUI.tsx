import { useState } from 'react';
import { EditorObjectType } from '../editor/EditorObjects';
import { PlacedObject } from '../editor/MapEditor';

interface EditorUIProps {
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
}

export const EditorUI = ({
  objectTypes, selectedType, selectedObject, objectCount,
  gridEnabled, moveModeEnabled, placementY,
  canUndo, canRedo, multiSelectCount,
  onSelectType, onToggleGrid, onToggleMove,
  onExport, onImport, onClear, onDelete, onRotate, onDuplicate,
  onUndo, onRedo, onBackToGame, onPlaytest,
  onUpdateGroupId, onUpdateLabel,
}: EditorUIProps) => {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('walls');
  const [showHelp, setShowHelp] = useState(false);

  const categories = [
    { id: 'walls', name: 'Стены', icon: '🧱', color: 'from-gray-600 to-gray-700' },
    { id: 'items', name: 'Предметы', icon: '🪑', color: 'from-amber-700 to-amber-800' },
    { id: 'building', name: 'Стройка', icon: '🏗️', color: 'from-cyan-700 to-cyan-800' },
    { id: 'lighting', name: 'Свет', icon: '💡', color: 'from-yellow-600 to-yellow-700' },
    { id: 'scripts', name: 'Скрипты', icon: '⚡', color: 'from-purple-700 to-purple-800' },
    { id: 'things', name: 'Вещи', icon: '🎒', color: 'from-red-700 to-red-800' },
  ];

  const filteredObjects = objectTypes.filter(o => o.category === activeCategory);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* === TOP BAR === */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gray-900/95 border-b border-gray-700 flex items-center px-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button onClick={onBackToGame} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition">← Меню</button>
          <div className="h-6 w-px bg-gray-600" />
          <span className="text-white font-bold text-sm">🗺️ Редактор</span>
          <div className="h-6 w-px bg-gray-600" />
          <span className="text-gray-400 text-xs">Объектов: <span className="text-white font-bold">{objectCount}</span></span>
          {multiSelectCount > 1 && <span className="text-blue-400 text-xs">| Выделено: {multiSelectCount}</span>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <button onClick={onUndo} disabled={!canUndo} className={`px-2 py-1.5 rounded text-sm transition ${canUndo ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`} title="Отменить (Ctrl+Z)">↩</button>
          <button onClick={onRedo} disabled={!canRedo} className={`px-2 py-1.5 rounded text-sm transition ${canRedo ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`} title="Повторить (Ctrl+Y)">↪</button>
          <div className="h-6 w-px bg-gray-600 mx-1" />
          {/* Playtest */}
          <button onClick={onPlaytest} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-bold transition-all hover:scale-105">🧪 Тест</button>
          <div className="h-6 w-px bg-gray-600 mx-1" />
          {/* Grid */}
          <button onClick={onToggleGrid} className={`px-2.5 py-1.5 rounded text-xs transition ${gridEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
            {gridEnabled ? '▦ ON' : '▦ OFF'}
          </button>
          {/* Height */}
          <div className="bg-gray-800 rounded px-2 py-1 text-xs text-gray-300 flex items-center gap-1" title="Высота (PgUp/PgDown)">
            Y: <span className="text-yellow-300 font-mono font-bold">{placementY.toFixed(1)}</span>
          </div>
          <div className="h-6 w-px bg-gray-600 mx-1" />
          <button onClick={onClear} className="px-2.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition">🗑️</button>
          <button onClick={() => setShowImport(true)} className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition">📂</button>
          <button onClick={onExport} className="px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs transition">💾</button>
          <button onClick={() => setShowHelp(true)} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition font-bold">❓</button>
        </div>
      </div>

      {/* === LEFT PANEL === */}
      <div className="absolute left-0 top-12 bottom-0 w-64 bg-gray-900/95 border-r border-gray-700 pointer-events-auto overflow-hidden flex flex-col">
        <div className="grid grid-cols-6 gap-0.5 p-1.5 bg-gray-950">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`py-2 rounded-md text-center text-xs font-medium transition-all duration-200 flex flex-col items-center gap-0.5 ${activeCategory === cat.id ? `bg-gradient-to-b ${cat.color} text-white shadow-lg scale-[1.02]` : 'bg-gray-800/60 text-gray-500 hover:bg-gray-700 hover:text-gray-300'}`}>
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button onClick={() => onSelectType(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${!selectedType ? 'bg-gray-600 text-white' : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700'}`}>
            <span>🖱️</span><span>Выбор объектов</span>
          </button>
          {filteredObjects.map((obj, idx) => (
            <button key={obj.id} onClick={() => onSelectType(obj.id)}
              style={{ animationDelay: `${idx * 30}ms` }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 animate-[fadeIn_0.2s_ease_forwards] opacity-0 ${selectedType?.id === obj.id ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/40 scale-[1.02]' : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/90 hover:translate-x-1'}`}>
              <span className="text-xl w-8 h-8 flex items-center justify-center bg-black/20 rounded">{obj.icon}</span>
              <span className="font-medium flex-1">{obj.name}</span>
              <span className="text-gray-500 text-xs">{idx + 1 <= 9 ? idx + 1 : ''}</span>
            </button>
          ))}
        </div>

        <div className="p-2.5 border-t border-gray-700 bg-gray-800/50 text-[10px] text-gray-500 leading-relaxed">
          <span className="text-yellow-400">ЛКМ</span> ставить <span className="text-yellow-400">Shift+ЛКМ</span> мульти
          <br/><span className="text-yellow-400">ПКМ+мышь</span> камера <span className="text-yellow-400">WASD/QE</span> лететь
          <br/><span className="text-yellow-400">R</span> поворот <span className="text-yellow-400">M</span> двигать <span className="text-yellow-400">G</span> сетка
          <br/><span className="text-yellow-400">Ctrl+D</span> дубль <span className="text-yellow-400">Ctrl+Z/Y</span> undo/redo
          <br/><span className="text-yellow-400">PgUp/Dn</span> высота <span className="text-yellow-400">1-9</span> быстровыбор
        </div>
      </div>

      {/* === RIGHT PANEL (selection) === */}
      {selectedObject && (
        <div className="absolute right-4 top-16 w-64 pointer-events-auto" style={{ animation: 'scaleIn 0.2s ease' }}>
          <div className="bg-gradient-to-b from-gray-800/95 to-gray-900/95 border border-gray-600/50 rounded-xl p-4 backdrop-blur-sm shadow-2xl">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 bg-blue-600/30 rounded-lg flex items-center justify-center">📦</span>
              <span>{multiSelectCount > 1 ? `Выделено: ${multiSelectCount}` : 'Выбранный объект'}</span>
            </h3>
            <div className="space-y-1.5 text-sm bg-black/20 rounded-lg p-3">
              <div className="flex justify-between"><span className="text-gray-500">Тип</span><span className="text-blue-300 font-medium">{selectedObject.type}</span></div>
              <div className="h-px bg-gray-700/50" />
              <div className="flex justify-between"><span className="text-gray-500">X</span><span className="text-white font-mono">{selectedObject.position.x.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Y</span><span className="text-white font-mono">{selectedObject.position.y.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Z</span><span className="text-white font-mono">{selectedObject.position.z.toFixed(2)}</span></div>
              <div className="h-px bg-gray-700/50" />
              <div className="flex justify-between"><span className="text-gray-500">Поворот</span><span className="text-yellow-300 font-mono">{selectedObject.rotation}°</span></div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              <button onClick={onRotate} className="py-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Повернуть (R)">🔄</button>
              <button onClick={onToggleMove} className={`py-2 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 ${moveModeEnabled ? 'bg-emerald-500 text-white' : 'bg-yellow-600/80 text-white'}`} title="Двигать (M)">↔️</button>
              <button onClick={onDuplicate} className="py-2 bg-violet-600/80 hover:bg-violet-500 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Дублировать (Ctrl+D)">📋</button>
              <button onClick={onDelete} className="py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-xs transition-all hover:scale-105 active:scale-95" title="Удалить (Del)">🗑️</button>
            </div>
            {(selectedObject.type === 'terminal' || selectedObject.type === 'camera') && (
              <div className="mt-3 space-y-2 bg-black/20 rounded-lg p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">ID Терминала</span>
                    <input
                      type="number"
                      value={selectedObject.groupId ?? 1}
                      onChange={(e) => onUpdateGroupId?.(parseInt(e.target.value) || 1)}
                      className="w-20 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedObject.type === 'terminal'
                      ? 'Камеры с таким же ID будут подключены'
                      : 'К какому терминалу подключить (можно несколько камер с одним ID)'}
                  </p>
                </div>
                {selectedObject.type === 'camera' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Название камеры</span>
                      <input
                        type="text"
                        value={selectedObject.label ?? ''}
                        onChange={(e) => onUpdateLabel?.(e.target.value)}
                        className="w-32 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="Камера 1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {moveModeEnabled && (
              <div className="mt-2 text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-700/40 rounded-lg p-2 animate-pulse">↔️ Двигай мышью → ЛКМ фиксация</div>
            )}
          </div>
        </div>
      )}

      {/* === BOTTOM HINT === */}
      {selectedType && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-600 rounded-lg px-6 py-3 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedType.icon}</span>
            <div>
              <div className="text-white font-bold">{selectedType.name}</div>
              <div className="text-gray-400 text-sm">ЛКМ — поставить | R — повернуть | PgUp/Dn — высота Y:{placementY.toFixed(1)} | ESC — отмена</div>
            </div>
          </div>
        </div>
      )}
      {!selectedType && !selectedObject && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/85 border border-gray-700 rounded-lg px-5 py-2 pointer-events-none text-sm text-gray-300">
          Выбери объект слева или кликни по размещённому. <span className="text-yellow-400">❓</span> — справка.
        </div>
      )}

      {/* === IMPORT MODAL === */}
      {showImport && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto z-50">
          <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 w-[500px]" style={{ animation: 'scaleIn 0.2s ease' }}>
            <h3 className="text-white font-bold text-lg mb-4">📂 Импорт карты</h3>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Вставьте JSON..."
              className="w-full h-64 bg-gray-800 text-white border border-gray-600 rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowImport(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition">Отмена</button>
              <button onClick={() => { if (importText.trim()) { onImport(importText); setShowImport(false); setImportText(''); } }} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">Импорт</button>
            </div>
          </div>
        </div>
      )}

      {/* === HELP MODAL === */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-2xl p-8 w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.25s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">❓</span>
                Справка по редактору
              </h2>
              <button onClick={() => setShowHelp(false)} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
            </div>

            <div className="space-y-6">
              {/* Camera */}
              <Section title="📷 Камера" color="blue">
                <Key k="ПКМ + мышь" d="Вращение камеры" />
                <Key k="WASD" d="Перемещение камеры" />
                <Key k="Q / E" d="Вниз / вверх" />
                <Key k="Колёсико" d="Зум (приближение/отдаление)" />
                <Key k="Shift" d="Ускорение движения камеры" />
              </Section>

              {/* Placing */}
              <Section title="🏗️ Размещение объектов" color="green">
                <Key k="ЛКМ" d="Поставить выбранный объект" />
                <Key k="R" d="Повернуть на 90° перед установкой" />
                <Key k="PgUp / PgDown" d="Изменить высоту размещения (ось Y)" />
                <Key k="G" d="Включить/выключить привязку к сетке" />
                <Key k="1-9" d="Быстрый выбор объекта из текущей категории" />
                <Key k="ESC" d="Отменить выбор объекта" />
              </Section>

              {/* Selection */}
              <Section title="🖱️ Выделение и редактирование" color="yellow">
                <Key k="ЛКМ" d="Выделить объект (в режиме курсора)" />
                <Key k="Shift + ЛКМ" d="Мультивыделение (добавить/убрать)" />
                <Key k="M" d="Режим перемещения выделенного → ЛКМ для фиксации" />
                <Key k="R" d="Повернуть выделенный объект" />
                <Key k="Ctrl + D" d="Дублировать выделенные объекты" />
                <Key k="Del / Backspace" d="Удалить выделенные объекты" />
              </Section>

              {/* History */}
              <Section title="↩ История" color="purple">
                <Key k="Ctrl + Z" d="Отменить последнее действие (Undo)" />
                <Key k="Ctrl + Y" d="Повторить отменённое действие (Redo)" />
              </Section>

              {/* IO */}
              <Section title="💾 Сохранение" color="emerald">
                <Key k="💾 Экспорт" d="Копирует JSON карты в буфер обмена" />
                <Key k="📂 Импорт" d="Загружает карту из вставленного JSON" />
                <Key k="🗑️ Очистить" d="Удаляет все объекты с карты" />
              </Section>

              {/* Playtest */}
              <Section title="🧪 Тестирование" color="pink">
                <Key k="🧪 Тест" d="Запуск плейтеста — выбор команды и игра от первого лица" />
                <Key k="F9" d="Выход из плейтеста обратно в редактор" />
              </Section>

              {/* Tips */}
              <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4">
                <h3 className="text-indigo-300 font-bold mb-2">💡 Советы</h3>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li>• Расставь <span className="text-orange-400">спавн-поинты</span> из раздела Скрипты перед тестированием</li>
                  <li>• Используй <span className="text-yellow-400">PgUp/PgDown</span> чтобы размещать лампы на потолке и окна на стенах</li>
                  <li>• <span className="text-blue-400">Ctrl+D</span> для быстрого копирования — дубли появляются со сдвигом</li>
                  <li>• <span className="text-green-400">Shift+клик</span> для выделения нескольких объектов, потом удалить/дублировать все</li>
                  <li>• Включи <span className="text-emerald-400">сетку (G)</span> для ровного размещения стен и полов</li>
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
const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <div className={`border border-${color}-700/30 rounded-xl overflow-hidden`}>
    <div className={`bg-${color}-900/40 px-4 py-2`}>
      <h3 className={`text-${color}-300 font-bold text-sm`}>{title}</h3>
    </div>
    <div className="px-4 py-2 space-y-1">{children}</div>
  </div>
);

const Key = ({ k, d }: { k: string; d: string }) => (
  <div className="flex items-center gap-3 py-1">
    <kbd className="bg-gray-700 text-yellow-300 px-2 py-0.5 rounded text-xs font-mono min-w-[100px] text-center">{k}</kbd>
    <span className="text-gray-300 text-sm">{d}</span>
  </div>
);
