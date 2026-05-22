import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MapEditor, MapData, PlacedObject } from './editor/MapEditor';
import { PlaytestMode } from './editor/PlaytestMode';

import { EditorUI } from './components/EditorUI';
import { GuardMenu } from './components/GuardMenu';
import { EditorObjectType } from './editor/EditorObjects';
import { CombatState } from './game/Combat';
import { CameraSystemState } from './game/CameraSystem';
import { InventoryState } from './game/InventorySystem';

interface EditorAppProps {
  onBackToGame: () => void;
}

type EditorMode = 'editing' | 'team_select' | 'playtesting';

export const EditorApp = ({ onBackToGame }: EditorAppProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const playtestContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MapEditor | null>(null);
  const playtestRef = useRef<PlaytestMode | null>(null);
  const savedMapRef = useRef<MapData | null>(null);

  const [mode, setMode] = useState<EditorMode>('editing');
  const [objectTypes, setObjectTypes] = useState<EditorObjectType[]>([]);
  const [selectedType, setSelectedType] = useState<EditorObjectType | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);
  const [objectCount, setObjectCount] = useState(0);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [moveModeEnabled, setMoveModeEnabled] = useState(false);
  const [placementY, setPlacementY] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [multiSelectCount, setMultiSelectCount] = useState(0);

  // Playtest state
  const [ptFps, setPtFps] = useState(0);
  const [ptPos, setPtPos] = useState<THREE.Vector3 | null>(null);
  const [ptCombat, setPtCombat] = useState<CombatState | null>(null);
  const [ptLocked, setPtLocked] = useState(false);
  const [ptCameraState, setPtCameraState] = useState<CameraSystemState | null>(null);
  const [ptInventory, setPtInventory] = useState<InventoryState | null>(null);
  const [ptHasDoors, setPtHasDoors] = useState(false);

  // Guard menu state
  const [ptTeam, setPtTeam] = useState<'guard' | 'prisoner'>('prisoner');
  const [ptGuardMenuOpen, setPtGuardMenuOpen] = useState(false);
  const [ptIsWarden, setPtIsWarden] = useState(false);
  const [ptCellsOpen, setPtCellsOpen] = useState(false);

  // === EDITOR ===
  useEffect(() => {
    if (mode !== 'editing') return;
    if (!editorContainerRef.current) return;

    const editor = new MapEditor(editorContainerRef.current);
    editorRef.current = editor;

    setObjectTypes(editor.getObjectTypes());
    setGridEnabled(editor.isGridActive());
    setMoveModeEnabled(editor.isMoveModeActive());

    editor.onObjectSelected = (type) => setSelectedType(type);
    editor.onObjectPlaced = (count) => setObjectCount(count);
    editor.onSelectionChanged = (obj) => setSelectedObject(obj);
    editor.onGridChanged = (enabled) => setGridEnabled(enabled);
    editor.onMoveModeChanged = (moving) => setMoveModeEnabled(moving);
    editor.onHeightChanged = (y) => setPlacementY(y);
    editor.onHistoryChanged = (u, r) => { setCanUndo(u); setCanRedo(r); };
    editor.onMultiSelectChanged = (c) => setMultiSelectCount(c);

    // Восстанавливаем карту если есть сохранение
    if (savedMapRef.current) {
      editor.importMap(savedMapRef.current);
    }

    editor.start();

    return () => {
      // Сохраняем перед уничтожением
      if (editorRef.current) {
        savedMapRef.current = editorRef.current.exportMap();
      }
      editor.stop();
      editor.dispose();
      editorRef.current = null;
    };
  }, [mode]);

  // === PLAYTEST ===
  useEffect(() => {
    if (mode !== 'playtesting') return;

    const handlePointerLock = () => setPtLocked(document.pointerLockElement !== null);
    document.addEventListener('pointerlockchange', handlePointerLock);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'F9') {
        e.preventDefault();
        stopPlaytest();
      }
      if (e.code === 'KeyM' && ptTeam === 'guard') {
        setPtGuardMenuOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLock);
      document.removeEventListener('keydown', handleKey);
      if (playtestRef.current) {
        playtestRef.current.dispose();
        playtestRef.current = null;
      }
    };
  }, [mode, ptTeam]);

  const openTeamSelect = useCallback(() => {
    if (!editorRef.current) return;
    savedMapRef.current = editorRef.current.exportMap();
    
    // Проверяем наличие спавнов
    const objs = savedMapRef.current.objects;
    const hasGuardSpawn = objs.some(o => o.type === 'spawn_guard');
    const hasPrisonerSpawn = objs.some(o => o.type === 'spawn_prisoner');
    
    if (!hasGuardSpawn && !hasPrisonerSpawn) {
      alert('Ошибка: на карте нет спавнов. Добавьте спавн охраны и/или заключённых из раздела Скрипты.');
      return;
    }
    if (!hasGuardSpawn) {
      alert('Внимание: на карте нет спавна охраны. Добавьте из раздела Скрипты.');
      return;
    }
    if (!hasPrisonerSpawn) {
      alert('Внимание: на карте нет спавна заключённых. Добавьте из раздела Скрипты.');
      return;
    }
    
    setMode('team_select');
  }, []);

  const startPlaytest = useCallback((team: 'guard' | 'prisoner') => {
    setPtTeam(team);
    setPtGuardMenuOpen(false);
    setPtIsWarden(false);
    setPtCellsOpen(false);
    setMode('playtesting');

    setTimeout(() => {
      if (!playtestContainerRef.current || !savedMapRef.current) {
        console.error('[EditorApp] ABORT: container=', !!playtestContainerRef.current, 'mapData=', !!savedMapRef.current);
        return;
      }
      console.log('[EditorApp] Creating PlaytestMode with', savedMapRef.current.objects.length, 'objects');

      const pt = new PlaytestMode(playtestContainerRef.current, savedMapRef.current, team);
      playtestRef.current = pt;

      pt.onStatsUpdate = (fps, pos) => {
        setPtFps(fps);
        setPtPos(pos.clone());
      };
      pt.onCombatUpdate = (state) => {
        setPtCombat({ ...state });
      };
      pt.onCameraSystemUpdate = (state) => {
        setPtCameraState({ ...state });
      };
      pt.onInventoryUpdate = (state) => {
        setPtInventory({ ...state });
      };
      pt.onDoorStateUpdate = (cellsOpen) => {
        setPtCellsOpen(cellsOpen);
      };

      pt.start();
      // Whether any cell-doors were placed on this map (controls availability
      // of the warden "open cells" command).
      setPtHasDoors(pt.hasDoors());
    }, 100);
  }, []);

  const stopPlaytest = useCallback(() => {
    if (playtestRef.current) {
      playtestRef.current.dispose();
      playtestRef.current = null;
    }
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setPtCameraState(null);
    setPtInventory(null);
    setPtCombat(null);
    setPtHasDoors(false);
    setPtGuardMenuOpen(false);
    setPtIsWarden(false);
    setPtCellsOpen(false);
    setMode('editing');
  }, []);

  const handleSelectCamera = useCallback((idx: number | null) => {
    playtestRef.current?.selectCamera(idx);
  }, []);

  // === Editor handlers ===
  const handleSelectType = useCallback((typeId: string | null) => { editorRef.current?.selectObjectType(typeId); }, []);
  const handleToggleGrid = useCallback(() => { editorRef.current?.toggleGrid(); }, []);
  const handleToggleMove = useCallback(() => { editorRef.current?.toggleMoveSelected(); }, []);
  const handleDuplicate = useCallback(() => { editorRef.current?.duplicateSelected(); }, []);
  const handleUndo = useCallback(() => { editorRef.current?.undo(); }, []);
  const handleRedo = useCallback(() => { editorRef.current?.redo(); }, []);
  const handleExport = useCallback(() => {
    if (!editorRef.current) return;
    const json = editorRef.current.exportJSON();
    navigator.clipboard.writeText(json).then(() => alert('JSON скопирован.')).catch(() => {
      console.log(json);
      alert('JSON в консоли (F12).');
    });
  }, []);
  const handleImport = useCallback((json: string) => {
    if (!editorRef.current?.importJSON(json)) alert('Ошибка импорта!');
  }, []);
  const handleClear = useCallback(() => {
    if (confirm('Очистить карту?')) editorRef.current?.clearMap();
  }, []);

  const handleDelete = useCallback(() => { editorRef.current?.deleteSelected(); }, []);
  const handleRotate = useCallback(() => { editorRef.current?.rotateSelected(); }, []);
  const handleUpdateGroupId = useCallback((id: number) => { editorRef.current?.updateSelectedGroupId(id); }, []);
  const handleUpdateLabel = useCallback((label: string) => { editorRef.current?.updateSelectedLabel(label); }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {/* Контейнер редактора */}
      {mode === 'editing' && (
        <div ref={editorContainerRef} className="w-full h-full" />
      )}

      {/* Контейнер плейтеста */}
      {mode === 'playtesting' && (
        <div ref={playtestContainerRef} className="w-full h-full" />
      )}

      {/* Редактор UI */}
      {mode === 'editing' && (
        <EditorUI
          objectTypes={objectTypes}
          selectedType={selectedType}
          selectedObject={selectedObject}
          objectCount={objectCount}
          gridEnabled={gridEnabled}
          moveModeEnabled={moveModeEnabled}
          placementY={placementY}
          canUndo={canUndo}
          canRedo={canRedo}
          multiSelectCount={multiSelectCount}
          onSelectType={handleSelectType}
          onToggleGrid={handleToggleGrid}
          onToggleMove={handleToggleMove}
          onExport={handleExport}
          onImport={handleImport}
          onClear={handleClear}
          onDelete={handleDelete}
          onRotate={handleRotate}
          onDuplicate={handleDuplicate}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBackToGame={onBackToGame}
          onPlaytest={openTeamSelect}
          onUpdateGroupId={handleUpdateGroupId}
          onUpdateLabel={handleUpdateLabel}
        />
      )}

      {/* Выбор команды */}
      {mode === 'team_select' && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center z-50">
          <div className="text-center" style={{ animation: 'scaleIn 0.2s ease' }}>
            <h2 className="text-3xl font-bold text-white mb-2">🧪 Тестирование карты</h2>
            <p className="text-gray-400 mb-8">Выберите команду для спавна</p>

            <div className="flex gap-6">
              <button
                onClick={() => startPlaytest('guard')}
                className="w-56 bg-gradient-to-b from-blue-700 to-blue-900 border-2 border-blue-500/50 rounded-xl p-6
                           hover:border-blue-400 hover:scale-105 transition-all cursor-pointer"
              >
                <div className="text-5xl mb-3">👮</div>
                <div className="text-xl font-bold text-blue-300">Охрана</div>
                <div className="text-sm text-gray-400 mt-1">Спавн с AK-47</div>
              </button>

              <button
                onClick={() => startPlaytest('prisoner')}
                className="w-56 bg-gradient-to-b from-orange-700 to-orange-900 border-2 border-orange-500/50 rounded-xl p-6
                           hover:border-orange-400 hover:scale-105 transition-all cursor-pointer"
              >
                <div className="text-5xl mb-3">👤</div>
                <div className="text-xl font-bold text-orange-300">Заключённый</div>
                <div className="text-sm text-gray-400 mt-1">Только кулаки</div>
              </button>
            </div>

            <button
              onClick={() => setMode('editing')}
              className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Назад к редактору
            </button>
          </div>
        </div>
      )}

      {/* Playtest UI */}
      {mode === 'playtesting' && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Прицел */}
          {ptLocked && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-white rounded-full opacity-70" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
                <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-white/50 -translate-x-1/2" />
                <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-white/50 -translate-x-1/2" />
                <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-white/50 -translate-y-1/2" />
                <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-white/50 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="absolute top-4 left-4 bg-black/60 text-white p-3 rounded-lg font-mono text-sm">
            <div className={ptFps < 30 ? 'text-red-400' : ptFps < 50 ? 'text-yellow-400' : 'text-green-400'}>FPS: {ptFps}</div>
            {ptPos && <div className="text-gray-300 mt-1">X: {ptPos.x.toFixed(1)} Y: {ptPos.y.toFixed(1)} Z: {ptPos.z.toFixed(1)}</div>}
            {ptFps > 0 && ptFps < 30 && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-yellow-300 text-xs leading-snug max-w-[220px]">
                Низкий FPS. Попробуйте снизить качество в настройках главного меню.
              </div>
            )}
          </div>

          {/* Badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600/90 text-white px-6 py-2 rounded-lg flex items-center gap-3">
            <span>🧪</span>
            <span className="font-bold">ТЕСТИРОВАНИЕ</span>
            <span className="text-purple-200 text-sm">F9 — выход</span>
          </div>

          {/* HP */}
          {ptLocked && ptCombat && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/60 p-3 rounded-lg">
              <span className="text-2xl">❤️</span>
              <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${(ptCombat.hp / ptCombat.maxHp) * 100}%` }} />
              </div>
              <span className="text-white font-bold">{ptCombat.hp}/{ptCombat.maxHp}</span>
            </div>
          )}

          {/* Weapon */}
          {ptLocked && ptCombat && (
            <div className="absolute bottom-4 right-4 bg-black/60 p-3 rounded-lg flex items-center gap-3">
              {ptCombat.hasWeapon ? (
                <>
                  <span className="text-yellow-400 font-bold">AK-47</span>
                  <span className="text-white text-2xl font-bold">{ptCombat.ammo}</span>
                  <span className="text-gray-400">/{ptCombat.maxAmmo}</span>
                  <span className="text-2xl">🔫</span>
                </>
              ) : (
                <>
                  <span className="text-gray-400 font-bold">Кулаки</span>
                  <span className="text-2xl">👊</span>
                </>
              )}
            </div>
          )}

          {/* Click to start */}
          {!ptLocked && !ptInventory?.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">🧪 Тестирование карты</h2>
                <p className="text-xl mb-6 text-gray-300">Кликните чтобы начать</p>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-sm">
                  <div className="bg-gray-700/50 p-2 rounded"><span className="text-yellow-400">WASD</span> Движение</div>
                  <div className="bg-gray-700/50 p-2 rounded"><span className="text-yellow-400">ЛКМ</span> Атака</div>
                  <div className="bg-gray-700/50 p-2 rounded"><span className="text-yellow-400">E</span> Подобрать</div>
                  <div className="bg-gray-700/50 p-2 rounded"><span className="text-yellow-400">G</span> Бросить</div>
                </div>
                <button
                  onClick={stopPlaytest}
                  className="mt-8 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition pointer-events-auto"
                >
                  ← Вернуться в редактор (F9)
                </button>
              </div>
            </div>
          )}

          {/* Inventory Wheel */}
          {ptInventory?.isOpen && (
            <div className="fixed inset-0 bg-black/60 pointer-events-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-[420px] h-[420px] rounded-full border-2 border-white/20 relative bg-gradient-radial from-gray-900/80 to-transparent">
                  {/* Rotating dashed ring decoration */}
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[430px] h-[430px] pointer-events-none" style={{ animation: 'ringRotate 20s linear infinite' }}>
                    <circle cx="215" cy="215" r="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="10 5" />
                  </svg>
                  {ptInventory.slots.map((item, index) => {
                    const angle = (index * Math.PI * 2) / 6 - Math.PI / 2;
                    const isHighlighted = ptInventory.hoveredSlot === index || ptInventory.equippedSlot === index;
                    return (
                      <div
                        key={index}
                        className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isHighlighted
                            ? 'border-2 border-yellow-400 bg-gradient-to-b from-gray-700/90 to-gray-900/90 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                            : 'border-2 border-gray-600/50 bg-gradient-to-b from-gray-700/90 to-gray-900/90 hover:border-gray-400'
                        }`}
                        style={{
                          top: `calc(50% + ${Math.sin(angle) * 170}px)`,
                          left: `calc(50% + ${Math.cos(angle) * 170}px)`,
                          animation: 'slotAppear 0.3s ease forwards',
                          animationDelay: `${index * 0.05}s`,
                          opacity: 0,
                          ...(isHighlighted ? { animation: 'slotAppear 0.3s ease forwards, pulseGlow 1.5s ease-in-out infinite' } : {}),
                        }}
                        onClick={() => playtestRef.current?.inventoryEquipSlot(index)}
                        onMouseEnter={() => playtestRef.current?.inventorySetHovered(index)}
                        onMouseLeave={() => playtestRef.current?.inventorySetHovered(null)}
                      >
                        {item ? (
                          <>
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-xs text-white mt-0.5">{item.name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">Пусто</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-white font-bold text-lg">
                      {ptInventory.slots[ptInventory.equippedSlot]?.name || 'Пусто'}
                    </div>
                    {ptInventory.slots[ptInventory.hoveredSlot ?? -1] && (
                      <div className="text-gray-400 text-sm mt-1">
                        {ptInventory.slots[ptInventory.hoveredSlot!]?.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center mt-4 text-gray-400 text-sm">
                  Q - Закрыть
                </div>
              </div>
            </div>
          )}

          {/* Terminal highlight hint */}
          {ptLocked && ptCameraState?.terminalHighlighted && !ptCameraState.inTerminalMode && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <div className="bg-cyan-900/80 text-white px-6 py-3 rounded-lg">
                <div className="font-bold">Терминал камер</div>
                <div className="text-sm text-cyan-200">
                  Нажмите <span className="text-yellow-400 font-bold">E</span> для просмотра камер
                </div>
              </div>
            </div>
          )}

          {/* Terminal mode overlay */}
          {ptCameraState?.inTerminalMode && (
            <div className="absolute inset-0 pointer-events-auto">
              {/* Grid view */}
              {ptCameraState.selectedCameraIndex === null && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                  <div className="text-green-400 text-2xl font-bold mb-6 font-mono">СИСТЕМА НАБЛЮДЕНИЯ</div>
                  {ptCameraState.cameras.length === 0 ? (
                    <div className="text-gray-400 text-lg font-mono">Нет подключённых камер</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 w-[600px] max-w-[80vw]">
                      {ptCameraState.cameras.map((cam, idx) => (
                        <div
                          key={cam.id}
                          className="bg-gray-900 border border-green-600/50 rounded-lg p-4 cursor-pointer hover:border-green-400 hover:bg-gray-800 transition-colors"
                          onClick={() => handleSelectCamera(idx)}
                        >
                          <div className="text-green-400 font-mono text-sm mb-1">CAM {idx + 1}</div>
                          <div className="text-gray-300 text-lg">{cam.label}</div>
                          <div className="mt-2 h-24 bg-gray-950 rounded flex items-center justify-center border border-gray-700 overflow-hidden">
                            {ptCameraState.screenshots && ptCameraState.screenshots[idx] ? (
                              <img src={ptCameraState.screenshots[idx]} alt={`Camera ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-500 text-sm font-mono">LIVE</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 text-gray-400 text-sm">
                    Нажмите <span className="text-yellow-400 font-bold">E</span> - Выйти
                  </div>
                </div>
              )}

              {/* Zoomed camera view */}
              {ptCameraState.selectedCameraIndex !== null && (
                <div className="absolute inset-0 flex flex-col">
                  <div className="bg-black/70 px-4 py-2 flex items-center justify-between">
                    <div className="text-green-400 font-mono text-sm">
                      CAM {ptCameraState.selectedCameraIndex + 1} - {ptCameraState.cameras[ptCameraState.selectedCameraIndex]?.label}
                    </div>
                    <div className="text-green-400 font-mono text-sm animate-pulse">REC</div>
                  </div>
                  <div className="flex-1 relative pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/[0.02] to-transparent bg-[length:100%_4px] animate-pulse"></div>
                  </div>
                  <div className="bg-black/70 px-4 py-2 flex items-center justify-between">
                    <div
                      className="text-gray-300 text-sm cursor-pointer hover:text-white pointer-events-auto"
                      onClick={() => handleSelectCamera(null)}
                    >
                      ← Назад к сетке
                    </div>
                    <div className="text-gray-400 text-sm">
                      <span className="text-yellow-400 font-bold">E</span> - Выйти
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guard Menu */}
          {ptTeam === 'guard' && ptLocked && (
            <GuardMenu
              isOpen={ptGuardMenuOpen}
              isWarden={ptIsWarden}
              wardenTaken={false}
              cellsOpen={ptCellsOpen}
              hasDoors={ptHasDoors}
              onBecomeWarden={() => { setPtIsWarden(true); }}
              onToggleCells={() => {
                if (ptCellsOpen) {
                  playtestRef.current?.closeAllDoors();
                  setPtCellsOpen(false);
                } else {
                  playtestRef.current?.openAllDoors();
                  setPtCellsOpen(true);
                }
              }}
            />
          )}

          {/* Guard M key hint */}
          {ptLocked && ptTeam === 'guard' && !ptGuardMenuOpen && !ptCameraState?.inTerminalMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-black/50 text-gray-300 px-4 py-2 rounded-lg text-sm">
                <span className="text-yellow-400 font-bold">M</span> - Меню охраны
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
