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
import { WalletState } from './game/economy/WalletSystem';
import { RentalDoor, RENTAL_OPTIONS } from './game/RentalDoorSystem';
import { RARITY_COLORS } from './game/ItemDefs';

// 10 prison-themed CSS wallpapers (simple reliable gradients)
const TERMINAL_WALLPAPERS: { background: string }[] = [
  // 1. Dark blue prison night
  { background: 'linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)' },
  // 2. Sunset over prison wall
  { background: 'linear-gradient(180deg, #ff6b35 0%, #ff8c42 30%, #4a2c2a 60%, #2d1b18 100%)' },
  // 3. Dark tunnel
  { background: 'radial-gradient(ellipse at 50% 50%, #5a4a3a 0%, #2a1a10 40%, #0a0a0a 100%)' },
  // 4. Night sky
  { background: 'linear-gradient(180deg, #0a0a2a 0%, #1a1a4a 50%, #2a2a5a 100%)' },
  // 5. Prison yard (sky and grass)
  { background: 'linear-gradient(180deg, #5b9bd5 0%, #87ceeb 35%, #556b2f 40%, #2d4a0f 100%)' },
  // 6. Concrete gray
  { background: 'linear-gradient(135deg, #4a4a4a 0%, #6b6b6b 50%, #3a3a3a 100%)' },
  // 7. Dark green night watch
  { background: 'linear-gradient(180deg, #0d1b2a 0%, #1b2838 50%, #2d4a0f 80%, #1a2e0a 100%)' },
  // 8. Steel corridor
  { background: 'linear-gradient(180deg, #3d3d3d 0%, #5a5a5a 50%, #333333 100%)' },
  // 9. Deep ocean blue
  { background: 'linear-gradient(135deg, #1a2a3a 0%, #2c3e50 50%, #1a2a3a 100%)' },
  // 10. Warm sunset escape
  { background: 'linear-gradient(180deg, #ff9a56 0%, #ff6b6b 40%, #c44569 70%, #4a2040 100%)' },
];

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

  // Terrain mode state
  const [terrainMode, setTerrainMode] = useState(false);
  const [terrainBrush, setTerrainBrush] = useState({ type: 'raise', radius: 5, strength: 0.5, paintMaterial: 0 });
  const [terrainSize, setTerrainSize] = useState(200);

  // Playtest state
  const [ptFps, setPtFps] = useState(0);
  const [ptPos, setPtPos] = useState<THREE.Vector3 | null>(null);
  const [ptCombat, setPtCombat] = useState<CombatState | null>(null);
  const [ptLocked, setPtLocked] = useState(false);
  const [ptCameraState, setPtCameraState] = useState<CameraSystemState | null>(null);
  const [ptInventory, setPtInventory] = useState<InventoryState | null>(null);
  const [ptHasDoors, setPtHasDoors] = useState(false);

  // Wallet state
  const [ptWallet, setPtWallet] = useState<WalletState | null>(null);
  const [moneyFlash, setMoneyFlash] = useState<'gain' | 'loss' | null>(null);

  // Guard menu state
  const [ptTeam, setPtTeam] = useState<'guard' | 'prisoner'>('prisoner');
  const [ptGuardMenuOpen, setPtGuardMenuOpen] = useState(false);
  const [ptIsWarden, setPtIsWarden] = useState(false);
  const [ptCellsOpen, setPtCellsOpen] = useState(false);

  // Garage door lock state
  const [ptGarageLockState, setPtGarageLockState] = useState<{ state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null }>({ state: 'unlocked', remainingSeconds: null });
  const [ptShowTempLockOptions, setPtShowTempLockOptions] = useState(false);
  const [ptDoorLockedToast, setPtDoorLockedToast] = useState(false);

  // Rental menu state
  const [ptRentalMenu, setPtRentalMenu] = useState<{ doorId: string; cellLabel: string } | null>(null);
  const [ptRentalError, setPtRentalError] = useState<string | null>(null);
  const ptRentalMenuRef = useRef(ptRentalMenu);

  // Death state
  const [ptDeathState, setPtDeathState] = useState<{ isDead: boolean; respawnCountdown: number } | null>(null);

  // Rental door nearby info
  const [ptNearbyRentalDoor, setPtNearbyRentalDoor] = useState<{ cellLabel: string; ownerId: string | null; expiresAt: number | null } | null>(null);
  const [rentalTimeLeft, setRentalTimeLeft] = useState<string | null>(null);

  // Terminal wallpaper & start menu state
  const [terminalWallpaperIdx, setTerminalWallpaperIdx] = useState(() => Math.floor(Math.random() * TERMINAL_WALLPAPERS.length));
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [terminalApp, setTerminalApp] = useState<'info' | 'map' | 'settings' | null>(null);

  // === Keep rental menu ref in sync ===
  useEffect(() => { ptRentalMenuRef.current = ptRentalMenu; }, [ptRentalMenu]);

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
    editor.onTerrainModeChanged = (mode: boolean) => setTerrainMode(mode);
    editor.onTerrainBrushChanged = (brush: { type: string; radius: number; strength: number; paintMaterial: number }) => setTerrainBrush(brush);
    editor.onTerrainResized = (size: number) => setTerrainSize(size);

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
      if (ptRentalMenuRef.current) return;
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

  // === RENTAL MENU KEYBOARD HANDLING ===
  useEffect(() => {
    if (!ptRentalMenu) return;

    const handleRentalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyE') {
        setPtRentalMenu(null);
        setPtRentalError(null);
        playtestRef.current?.closeRentalMenu();
        return;
      }
      const optMap: Record<string, string> = { 'Digit1': 'rent_1h', 'Digit2': 'rent_24h', 'Digit3': 'buy' };
      const optId = optMap[e.code];
      if (optId) {
        const success = playtestRef.current?.rentDoor(ptRentalMenu.doorId, optId);
        if (success) {
          setPtRentalMenu(null);
          setPtRentalError(null);
          playtestRef.current?.closeRentalMenu();
        } else {
          setPtRentalError('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
          setTimeout(() => setPtRentalError(null), 2000);
        }
        return;
      }
    };
    document.addEventListener('keydown', handleRentalKey);

    return () => {
      document.removeEventListener('keydown', handleRentalKey);
    };
  }, [ptRentalMenu]);

  // === RENTAL DOOR NEARBY TIMER ===
  useEffect(() => {
    if (!ptNearbyRentalDoor?.expiresAt) {
      setRentalTimeLeft(null);
      return;
    }
    const computeTime = () => {
      const remaining = Math.max(0, ptNearbyRentalDoor.expiresAt! - Date.now());
      if (remaining <= 0) {
        setRentalTimeLeft('00:00:00');
        return;
      }
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRentalTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };
    computeTime();
    const interval = setInterval(computeTime, 1000);
    return () => clearInterval(interval);
  }, [ptNearbyRentalDoor]);

  // Countdown timer updates come from GarageDoorSystem via onGarageDoorLockUpdate callback
  // (no polling needed - the system emits every second during temp_locked state)

  // Reset temp lock sub-options when lock state leaves temp_locked
  useEffect(() => {
    if (ptGarageLockState.state !== 'temp_locked') {
      setPtShowTempLockOptions(false);
    }
  }, [ptGarageLockState.state]);

  // Randomize wallpaper each time terminal mode is entered; close start menu
  useEffect(() => {
    if (ptCameraState?.inTerminalMode) {
      setTerminalWallpaperIdx(Math.floor(Math.random() * TERMINAL_WALLPAPERS.length));
      setStartMenuOpen(false);
      setTerminalApp(null);
    }
  }, [ptCameraState?.inTerminalMode]);

  const handleLockGarageDoors = useCallback(() => {
    playtestRef.current?.lockGarageDoors();
    setPtShowTempLockOptions(false);
  }, []);
  const handleUnlockGarageDoors = useCallback(() => {
    playtestRef.current?.unlockGarageDoors();
    setPtShowTempLockOptions(false);
  }, []);
  const handleTempLockGarageDoors = useCallback((minutes: number) => {
    playtestRef.current?.tempLockGarageDoors(minutes);
  }, []);

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
    setPtCombat({
      hp: 100,
      maxHp: 100,
      hasWeapon: team === 'guard',
      ammo: team === 'guard' ? 30 : 0,
      maxAmmo: team === 'guard' ? 30 : 0,
      isDead: false,
      isReloading: false
    });
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
      pt.onGarageDoorLockUpdate = (state) => {
        setPtGarageLockState({ ...state });
      };
      pt.onDoorLocked = () => {
        setPtDoorLockedToast(true);
        setTimeout(() => setPtDoorLockedToast(false), 2000);
      };

      pt.onShowRentalMenu = (door: RentalDoor) => {
        setPtRentalMenu({ doorId: door.id, cellLabel: door.cellLabel });
      };
      pt.onRentalExpired = (_door: RentalDoor) => {
        // Could show a toast, but keeping it simple
      };

      pt.onRentalDoorNearby = (info) => {
        setPtNearbyRentalDoor(info);
      };

      pt.onDeathStateChange = (state) => {
        setPtDeathState({ ...state });
      };

      pt.onWalletUpdate = (state) => {
        setPtWallet(prev => {
          if (prev && state.balance > prev.balance) {
            setMoneyFlash('gain');
            setTimeout(() => setMoneyFlash(null), 600);
          } else if (prev && state.balance < prev.balance) {
            setMoneyFlash('loss');
            setTimeout(() => setMoneyFlash(null), 600);
          }
          return { ...state };
        });
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
    setPtWallet(null);
    setPtHasDoors(false);
    setPtGuardMenuOpen(false);
    setPtIsWarden(false);
    setPtCellsOpen(false);
    setPtGarageLockState({ state: 'unlocked', remainingSeconds: null });
    setPtShowTempLockOptions(false);
    setPtDoorLockedToast(false);
    setPtRentalMenu(null);
    setPtRentalError(null);
    setPtDeathState(null);
    setMode('editing');
  }, []);

  const handleSelectCamera = useCallback((idx: number | null) => {
    playtestRef.current?.selectCamera(idx);
  }, []);

  const handleOpenTerminalApp = useCallback((app: 'cameras' | 'doors') => {
    playtestRef.current?.openTerminalApp(app);
    setStartMenuOpen(false);
  }, []);

  const handleBackToTerminalDesktop = useCallback(() => {
    playtestRef.current?.backToTerminalDesktop();
    setTerminalApp(null);
    setStartMenuOpen(false);
  }, []);

  const handleStartMenuToggle = useCallback(() => {
    setStartMenuOpen(prev => !prev);
  }, []);

  const handleStartMenuApp = useCallback((app: 'cameras' | 'doors' | 'info' | 'map' | 'settings' | 'exit') => {
    setStartMenuOpen(false);
    if (app === 'cameras' || app === 'doors') {
      handleOpenTerminalApp(app);
    } else if (app === 'exit') {
      playtestRef.current?.exitTerminal();
    } else {
      setTerminalApp(app);
    }
  }, [handleOpenTerminalApp]);

  // === Editor handlers ===
  const handleSelectType = useCallback((typeId: string | null) => { editorRef.current?.selectObjectType(typeId); }, []);
  const handleToggleGrid = useCallback(() => { editorRef.current?.toggleGrid(); }, []);
  const handleToggleMove = useCallback(() => { editorRef.current?.toggleMoveSelected(); }, []);
  const handleToggleTerrainMode = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setTerrainMode(!editor.getTerrainMode());
  }, []);
  const handleTerrainBrushChange = useCallback((brush: { type: string; radius: number; strength: number; paintMaterial: number }) => {
    editorRef.current?.setTerrainBrush(brush as { type: 'raise' | 'lower' | 'flatten' | 'smooth' | 'paint'; radius: number; strength: number; paintMaterial: number });
  }, []);
  const handleTerrainResize = useCallback((size: number) => {
    editorRef.current?.resizeTerrain(size);
  }, []);
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
          terrainMode={terrainMode}
          terrainBrush={terrainBrush}
          onToggleTerrainMode={handleToggleTerrainMode}
          onTerrainBrushChange={handleTerrainBrushChange}
          terrainSize={terrainSize}
          onTerrainResize={handleTerrainResize}
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

          {/* Wallet */}
          {ptLocked && ptWallet && (
            <div className={`absolute top-14 right-4 bg-black/60 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
              moneyFlash === 'gain' ? 'text-green-400 scale-105' : moneyFlash === 'loss' ? 'text-red-400 scale-105' : 'text-white'
            }`}>
              <span className="text-yellow-400">{'\u20bd'}</span> {ptWallet.balance} / {ptWallet.maxCarry}
            </div>
          )}

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
          {!ptLocked && !ptInventory?.isOpen && !ptCameraState?.inTerminalMode && !ptDeathState?.isDead && (
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

          {/* Death overlay */}
          {ptDeathState?.isDead && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 pointer-events-none">
              <div className="text-red-500 text-5xl font-bold mb-4">Вы погибли</div>
              <div className="text-white text-xl">Респавн через: {Math.ceil(ptDeathState.respawnCountdown)}...</div>
            </div>
          )}

          {/* Inventory Grid */}
          {ptInventory?.isOpen && (
            <div className="fixed inset-0 bg-black/60 pointer-events-auto" onClick={() => playtestRef.current?.inventoryEquipSlot(ptInventory.equippedSlot)}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px]" onClick={(e) => e.stopPropagation()}>
                {/* Category tabs */}
                <div className="flex gap-1 mb-3 justify-center">
                  {[
                    { key: null, label: '\u0412\u0441\u0435' },
                    { key: 'melee', label: '\u041e\u0440\u0443\u0436\u0438\u0435' },
                    { key: 'tool', label: '\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b' },
                    { key: 'consumable', label: '\u0420\u0430\u0441\u0445\u043e\u0434\u043d\u0438\u043a\u0438' },
                    { key: 'ammo', label: '\u0411\u043e\u0435\u043f\u0440\u0438\u043f\u0430\u0441\u044b' },
                  ].map((tab) => (
                    <button
                      key={tab.key || 'all'}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        ptInventory.activeCategory === tab.key
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => playtestRef.current?.inventorySetCategory(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 4x4 Grid */}
                <div className="grid grid-cols-4 gap-2 bg-gray-900/90 border border-gray-600/50 rounded-xl p-4">
                  {ptInventory.slots.map((item, index) => {
                    const isEquipped = ptInventory.equippedSlot === index;
                    const isDragSource = ptInventory.dragFromSlot === index;
                    const isHovered = ptInventory.hoveredSlot === index;
                    const rarityColor = item?.rarity ? RARITY_COLORS[item.rarity] || '#b0b0b0' : '#4a4a4a';
                    const categoryMatch = !ptInventory.activeCategory || !item || (item.category || item.type) === ptInventory.activeCategory;
                    const dimmed = ptInventory.activeCategory && item && !categoryMatch;

                    return (
                      <div
                        key={index}
                        className={`relative w-[110px] h-[110px] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all select-none ${
                          isEquipped
                            ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                            : ''
                        } ${isDragSource ? 'opacity-40 scale-95' : ''} ${dimmed ? 'opacity-30' : ''}`}
                        style={{ border: `2px solid ${item ? rarityColor : '#3a3a3a'}`, background: 'linear-gradient(180deg, rgba(55,55,70,0.9) 0%, rgba(30,30,40,0.95) 100%)' }}
                        onClick={() => { if (item) playtestRef.current?.inventoryEquipSlot(index); }}
                        onMouseEnter={() => playtestRef.current?.inventorySetHovered(index)}
                        onMouseLeave={() => playtestRef.current?.inventorySetHovered(null)}
                        onMouseDown={(e) => { if (e.button === 0 && item) playtestRef.current?.inventorySwapSlots(ptInventory.dragFromSlot ?? -1, -1); }}
                        onContextMenu={(e) => { e.preventDefault(); if (item && item.id !== 'fists') playtestRef.current?.inventoryDropItem(index); }}
                        draggable={!!item && item.id !== 'fists'}
                        onDragStart={() => { if (item) playtestRef.current?.inventorySwapSlots(-1, -1); }}
                      >
                        {item ? (
                          <>
                            <span className="text-3xl">{item.icon}</span>
                            <span className="text-[10px] text-gray-300 mt-1 text-center leading-tight max-w-[90px] truncate">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="absolute top-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {item.quantity}
                              </span>
                            )}
                            {isEquipped && (
                              <span className="absolute top-1 left-1 text-yellow-400 text-[10px]">E</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">{'\u041f\u0443\u0441\u0442\u043e'}</span>
                        )}

                        {/* Tooltip */}
                        {isHovered && item && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-600 rounded-lg p-3 w-48 z-50 pointer-events-none text-left">
                            <div className="text-white font-bold text-sm">{item.icon} {item.name}</div>
                            {item.description && <div className="text-gray-400 text-xs mt-1">{item.description}</div>}
                            {item.rarity && (
                              <div className="text-xs mt-1" style={{ color: RARITY_COLORS[item.rarity] || '#b0b0b0' }}>
                                {item.rarity === 'common' ? '\u041e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'uncommon' ? '\u041d\u0435\u043e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'rare' ? '\u0420\u0435\u0434\u043a\u0438\u0439' : '\u042d\u043f\u0438\u0447\u0435\u0441\u043a\u0438\u0439'}
                              </div>
                            )}
                            <div className="text-gray-500 text-xs mt-1">{item.type}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-3 text-gray-400 text-sm">
                  Q - \u0417\u0430\u043a\u0440\u044b\u0442\u044c | \u041b\u041a\u041c - \u042d\u043a\u0438\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c | \u041f\u041a\u041c - \u0411\u0440\u043e\u0441\u0438\u0442\u044c
                </div>
              </div>
            </div>
          )}

          {/* Hotbar (first 4 slots) - visible when inventory is CLOSED and pointer is locked */}
          {!ptInventory?.isOpen && ptLocked && ptInventory && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {ptInventory.slots.slice(0, 4).map((item, index) => {
                const isEquipped = ptInventory.equippedSlot === index;
                const rarityColor = item?.rarity ? RARITY_COLORS[item.rarity] || '#b0b0b0' : '#3a3a3a';
                return (
                  <div
                    key={index}
                    className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isEquipped ? 'ring-2 ring-yellow-400 scale-110' : ''
                    }`}
                    style={{ border: `2px solid ${item ? rarityColor : '#3a3a3a'}`, background: 'rgba(20,20,30,0.8)' }}
                  >
                    {item ? (
                      <>
                        <span className="text-xl">{item.icon}</span>
                        {item.quantity > 1 && (
                          <span className="text-[9px] text-white font-bold">{item.quantity}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-600">{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pickup notifications */}
          {ptInventory && ptInventory.notifications && ptInventory.notifications.length > 0 && (
            <div className="absolute top-20 right-4 flex flex-col gap-2 pointer-events-none">
              {ptInventory.notifications.map((notif, idx) => {
                const rarityColor = notif.item.rarity ? RARITY_COLORS[notif.item.rarity] || '#b0b0b0' : '#b0b0b0';
                return (
                  <div
                    key={`${notif.timestamp}-${idx}`}
                    className="bg-black/80 border rounded-lg px-4 py-2 flex items-center gap-2"
                    style={{ borderColor: rarityColor, animation: 'slotAppear 0.3s ease forwards' }}
                  >
                    <span className="text-lg">{notif.item.icon}</span>
                    <span className="text-sm font-medium" style={{ color: rarityColor }}>{notif.item.name}</span>
                  </div>
                );
              })}
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
            <div className="absolute inset-0 pointer-events-auto cursor-default">
              {/* Desktop view */}
              {ptCameraState.terminalView === 'desktop' && (
                <div className="absolute inset-0 flex flex-col font-['Tahoma',_sans-serif] text-sm select-none" onClick={() => startMenuOpen && setStartMenuOpen(false)}>
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={{ background: TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  {/* JailBreak watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none" style={{ animation: 'gentleSpin 4s ease-in-out infinite' }}>
                    <span className="text-7xl font-black text-blue-400">Jail</span>
                    <span className="text-7xl font-black text-orange-400">Break</span>
                  </div>
                  {/* Desktop icons */}
                  <div className="flex-1 p-4 flex flex-col gap-4 z-10">
                    <div
                      className="w-32 flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-white/20"
                      onClick={(e) => { e.stopPropagation(); handleOpenTerminalApp('cameras'); }}
                    >
                      <span className="text-6xl">📹</span>
                      <span className="text-white text-sm font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Камеры</span>
                    </div>
                    <div
                      className="w-32 flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-white/20"
                      onClick={(e) => { e.stopPropagation(); handleOpenTerminalApp('doors'); }}
                    >
                      <span className="text-6xl">🚪</span>
                      <span className="text-white text-sm font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Двери</span>
                    </div>
                  </div>

                  {/* Info app window */}
                  {terminalApp === 'info' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
                      <div className="w-[500px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                          <span className="text-xs">Информация о тюрьме</span>
                          <button
                            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold"
                            onClick={() => setTerminalApp(null)}
                          >X</button>
                        </div>
                        <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1 bg-white text-xs leading-relaxed max-h-[300px] overflow-y-auto">
                          <p className="font-bold text-sm mb-2">Правила учреждения:</p>
                          <p>1. Заключенным запрещено покидать камеры без разрешения.</p>
                          <p>2. Все перемещения по территории под наблюдением камер.</p>
                          <p>3. Попытка побега карается одиночной камерой.</p>
                          <p>4. Охрана имеет право применять силу.</p>
                          <p>5. Подъем в 06:00, отбой в 22:00.</p>
                          <p className="mt-3 font-bold text-sm mb-2">Расписание:</p>
                          <p>06:00 - Подъем и перекличка</p>
                          <p>07:00 - Завтрак</p>
                          <p>08:00 - Работы</p>
                          <p>12:00 - Обед</p>
                          <p>13:00 - Прогулка во дворе</p>
                          <p>15:00 - Свободное время</p>
                          <p>18:00 - Ужин</p>
                          <p>22:00 - Отбой</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Map app window */}
                  {terminalApp === 'map' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
                      <div className="w-[550px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                          <span className="text-xs">Карта территории</span>
                          <button
                            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold"
                            onClick={() => setTerminalApp(null)}
                          >X</button>
                        </div>
                        <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1 bg-white">
                          <div className="w-full h-[280px] bg-[#f0f0e0] border border-gray-300 relative flex items-center justify-center">
                            {/* Simple map representation */}
                            <svg viewBox="0 0 400 200" className="w-full h-full">
                              {/* Outer walls */}
                              <rect x="20" y="20" width="360" height="160" fill="none" stroke="#555" strokeWidth="4"/>
                              {/* Cell blocks */}
                              <rect x="40" y="40" width="80" height="60" fill="#ddd" stroke="#666" strokeWidth="2"/>
                              <text x="80" y="75" textAnchor="middle" fontSize="10" fill="#333">Блок A</text>
                              <rect x="140" y="40" width="80" height="60" fill="#ddd" stroke="#666" strokeWidth="2"/>
                              <text x="180" y="75" textAnchor="middle" fontSize="10" fill="#333">Блок B</text>
                              {/* Yard */}
                              <rect x="240" y="40" width="120" height="120" fill="#c8e6c9" stroke="#666" strokeWidth="2"/>
                              <text x="300" y="105" textAnchor="middle" fontSize="10" fill="#333">Двор</text>
                              {/* Guard tower */}
                              <circle cx="370" cy="30" r="8" fill="#ff9800" stroke="#333" strokeWidth="1"/>
                              <text x="370" y="50" textAnchor="middle" fontSize="7" fill="#333">Вышка</text>
                              {/* Gate */}
                              <rect x="170" y="170" width="60" height="10" fill="#8d6e63" stroke="#333" strokeWidth="1"/>
                              <text x="200" y="168" textAnchor="middle" fontSize="8" fill="#333">Ворота</text>
                              {/* Admin */}
                              <rect x="40" y="120" width="80" height="40" fill="#e3f2fd" stroke="#666" strokeWidth="2"/>
                              <text x="80" y="145" textAnchor="middle" fontSize="9" fill="#333">Админ</text>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings app window */}
                  {terminalApp === 'settings' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
                      <div className="w-[400px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                          <span className="text-xs">Настройки</span>
                          <button
                            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold"
                            onClick={() => setTerminalApp(null)}
                          >X</button>
                        </div>
                        <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Громкость оповещений</span>
                              <div className="w-24 h-3 bg-white border border-gray-600 relative">
                                <div className="h-full bg-[#000080] w-3/4"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Яркость экрана</span>
                              <div className="w-24 h-3 bg-white border border-gray-600 relative">
                                <div className="h-full bg-[#000080] w-full"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Язык</span>
                              <span className="text-xs border border-gray-600 px-2 py-0.5 bg-white">Русский</span>
                            </div>
                            <div className="pt-2 border-t border-gray-400 text-xs text-gray-600">
                              JailBreak Security Terminal v2.4.1
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Start Menu */}
                  {startMenuOpen && (
                    <div className="absolute bottom-[30px] left-0 z-30 w-[200px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg" onClick={(e) => e.stopPropagation()}>
                      {/* Side banner */}
                      <div className="flex">
                        <div className="w-6 bg-gradient-to-t from-[#000080] to-[#1084d0] flex items-end justify-center pb-1">
                          <span className="text-white text-[9px] font-bold [writing-mode:vertical-lr] rotate-180">JailBreak</span>
                        </div>
                        <div className="flex-1 flex flex-col py-1">
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('cameras')}
                          >
                            <span>📹</span><span className="text-xs">Камеры</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('doors')}
                          >
                            <span>🚪</span><span className="text-xs">Двери</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('info')}
                          >
                            <span>📋</span><span className="text-xs">Информация</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('map')}
                          >
                            <span>🗺️</span><span className="text-xs">Карта</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('settings')}
                          >
                            <span>⚙️</span><span className="text-xs">Настройки</span>
                          </button>
                          <div className="border-t border-gray-400 my-1"></div>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#000080] hover:text-white text-left"
                            onClick={() => handleStartMenuApp('exit')}
                          >
                            <span>🔌</span><span className="text-xs">Выйти</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Taskbar */}
                  <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2 z-20">
                    <button
                      className={`h-[22px] px-2 flex items-center gap-1 border-2 ${startMenuOpen ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#b0b0b0]' : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0]'} active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white`}
                      onClick={(e) => { e.stopPropagation(); handleStartMenuToggle(); }}
                    >
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">Пуск</span>
                    </button>
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-700 mr-2">
                      E - Выйти
                    </div>
                    <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white text-xs">
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cameras view - grid (no camera selected) */}
              {ptCameraState.terminalView === 'cameras' && ptCameraState.selectedCameraIndex === null && (
                <div className="absolute inset-0 flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={{ background: TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div className="w-[95vw] max-w-[1100px] h-[85vh] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg flex flex-col">
                      {/* Title bar */}
                      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between shrink-0">
                        <span className="text-xs">Система наблюдения</span>
                        <button
                          className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                          onClick={handleBackToTerminalDesktop}
                        >
                          X
                        </button>
                      </div>
                      {/* Window body - scrollable */}
                      <div className="flex-1 overflow-y-auto p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1">
                        {ptCameraState.cameras.length === 0 ? (
                          <div className="text-center py-8 text-gray-600">Нет подключённых камер</div>
                        ) : (
                          <div className="grid grid-cols-4 gap-3">
                            {ptCameraState.cameras.map((cam, idx) => (
                              <div
                                key={cam.id}
                                className="border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#c0c0c0] p-2 cursor-pointer hover:bg-[#d4d4d4] transition-colors"
                                onClick={() => handleSelectCamera(idx)}
                              >
                                <div className="text-xs font-bold mb-1">CAM {idx + 1}</div>
                                <div className="text-xs mb-1 truncate">{cam.label}</div>
                                <div className="h-16 bg-black border border-gray-600 flex items-center justify-center overflow-hidden">
                                  {ptCameraState.screenshots && ptCameraState.screenshots[idx] ? (
                                    <img src={ptCameraState.screenshots[idx]} alt={`Camera ${idx + 1}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 text-xs">LIVE</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Taskbar */}
                  <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2 shrink-0 relative z-10">
                    <button className="h-[22px] px-2 flex items-center gap-1 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white">
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">Пуск</span>
                    </button>
                    <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0] text-xs font-bold">
                      📹 Камеры
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-700 mr-2">
                      E - Выйти
                    </div>
                    <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white text-xs">
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cameras view - selected camera (transparent so 3D canvas shows through) */}
              {ptCameraState.terminalView === 'cameras' && ptCameraState.selectedCameraIndex !== null && (
                <div className="absolute inset-0 flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
                  {/* Top bar */}
                  <div className="bg-black/80 px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="text-green-400 font-mono text-sm">
                      CAM {ptCameraState.selectedCameraIndex + 1} - {ptCameraState.cameras[ptCameraState.selectedCameraIndex]?.label}
                    </div>
                    <div className="text-red-500 font-mono text-sm animate-pulse">● REC</div>
                  </div>
                  {/* Middle - transparent area where 3D camera view shows through */}
                  <div className="flex-1 relative pointer-events-none">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }}></div>
                    <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }}></div>
                  </div>
                  {/* Bottom bar */}
                  <div className="bg-black/80 px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div
                        className="text-gray-300 text-sm cursor-pointer hover:text-white pointer-events-auto"
                        onClick={() => handleSelectCamera(null)}
                      >
                        ← Назад к сетке
                      </div>
                      <div
                        className="text-gray-300 text-sm cursor-pointer hover:text-white pointer-events-auto"
                        onClick={handleBackToTerminalDesktop}
                      >
                        ← Рабочий стол
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      <span className="text-yellow-400 font-bold">E</span> - Выйти
                    </div>
                  </div>
                </div>
              )}

              {/* Doors view */}
              {ptCameraState.terminalView === 'doors' && (
                <div className="absolute inset-0 flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={{ background: TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  {/* Centered Win95 window */}
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="w-[450px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                      {/* Title bar */}
                      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                        <span className="text-xs">Управление дверями</span>
                        <button
                          className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                          onClick={handleBackToTerminalDesktop}
                        >
                          X
                        </button>
                      </div>
                      {/* Window body */}
                      <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1">
                        {/* Status indicator */}
                        <div className="mb-4 p-3 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white">
                          {ptGarageLockState.state === 'unlocked' && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="font-bold text-green-700">Двери разблокированы</span>
                            </div>
                          )}
                          {ptGarageLockState.state === 'locked' && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="font-bold text-red-700">Двери заблокированы</span>
                            </div>
                          )}
                          {ptGarageLockState.state === 'temp_locked' && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <div>
                                <span className="font-bold text-amber-700">Двери заблокированы временно</span>
                                {ptGarageLockState.remainingSeconds !== null && (
                                  <div className="text-xs text-amber-600 mt-0.5">
                                    Осталось: {Math.floor(ptGarageLockState.remainingSeconds / 60)}:{String(ptGarageLockState.remainingSeconds % 60).padStart(2, '0')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            className={`border-2 px-4 py-2 text-left font-bold ${
                              ptGarageLockState.state === 'locked'
                                ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                                : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                            }`}
                            onClick={handleLockGarageDoors}
                          >
                            🔒 Заблокировать двери
                          </button>
                          <button
                            className={`border-2 px-4 py-2 text-left font-bold ${
                              ptGarageLockState.state === 'unlocked'
                                ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                                : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                            }`}
                            onClick={handleUnlockGarageDoors}
                          >
                            🔓 Разблокировать двери
                          </button>
                          <button
                            className={`border-2 px-4 py-2 text-left font-bold ${
                              ptGarageLockState.state === 'temp_locked'
                                ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                                : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                            }`}
                            onClick={() => setPtShowTempLockOptions(prev => !prev)}
                          >
                            ⏱️ Временно заблокировать
                          </button>
                          {(ptShowTempLockOptions || ptGarageLockState.state === 'temp_locked') && (
                            <div className="flex gap-2 ml-6 mt-1">
                              <button
                                className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                                onClick={() => handleTempLockGarageDoors(5)}
                              >
                                5 мин
                              </button>
                              <button
                                className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                                onClick={() => handleTempLockGarageDoors(10)}
                              >
                                10 мин
                              </button>
                              <button
                                className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                                onClick={() => handleTempLockGarageDoors(15)}
                              >
                                15 мин
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Taskbar */}
                  <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2 relative z-10">
                    <button className="h-[22px] px-2 flex items-center gap-1 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white">
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">Пуск</span>
                    </button>
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-700 mr-2">
                      E - Выйти
                    </div>
                    <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white text-xs">
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Door locked toast */}
          {ptDoorLockedToast && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-800/90 text-white px-6 py-3 rounded-lg pointer-events-none">
              <span className="font-bold">🔒 Двери заблокированы</span>
            </div>
          )}

          {/* Rental door ownership info panel */}
          {ptNearbyRentalDoor && ptNearbyRentalDoor.ownerId && !ptRentalMenu && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 border border-gray-600 text-white px-5 py-3 rounded-lg pointer-events-none">
              <div className="text-center text-sm font-medium mb-1">{ptNearbyRentalDoor.cellLabel}</div>
              <div className="text-center text-xs text-gray-300">
                {ptNearbyRentalDoor.ownerId === 'player' ? '\u041a\u043e\u043c\u0443 \u043f\u0440\u0438\u043d\u0430\u0434\u043b\u0435\u0436\u0438\u0442: \u0418\u0433\u0440\u043e\u043a' : `\u041a\u043e\u043c\u0443 \u043f\u0440\u0438\u043d\u0430\u0434\u043b\u0435\u0436\u0438\u0442: ${ptNearbyRentalDoor.ownerId}`}
              </div>
              {ptNearbyRentalDoor.expiresAt ? (
                <div className="text-center text-xs text-yellow-400 mt-1">
                  {rentalTimeLeft ? `\u041e\u0441\u0442\u0430\u043b\u043e\u0441\u044c: ${rentalTimeLeft}` : '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}
                </div>
              ) : (
                <div className="text-center text-xs text-green-400 mt-1">{'\u041a\u0443\u043f\u043b\u0435\u043d'}</div>
              )}
            </div>
          )}

          {/* Rental menu */}
          {ptRentalMenu && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto">
              <div className="bg-gray-900/95 border border-gray-600 rounded-xl p-8 w-[420px] text-center" style={{ animation: 'scaleIn 0.2s ease' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-8" />
                  <h3 className="text-white font-bold text-xl">{ptRentalMenu.cellLabel}</h3>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    onClick={() => { setPtRentalMenu(null); setPtRentalError(null); playtestRef.current?.closeRentalMenu(); }}
                  >
                    &#x2715;
                  </button>
                </div>
                <div className="space-y-3">
                  {RENTAL_OPTIONS.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors"
                      onClick={() => {
                        const success = playtestRef.current?.rentDoor(ptRentalMenu.doorId, opt.id);
                        if (success) {
                          setPtRentalMenu(null);
                          setPtRentalError(null);
                          playtestRef.current?.closeRentalMenu();
                        } else {
                          setPtRentalError('\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
                          setTimeout(() => setPtRentalError(null), 2000);
                        }
                      }}
                    >
                      <div className="text-left">
                        <div className="text-white text-sm font-medium">[{idx + 1}] {opt.label}</div>
                        <div className="text-yellow-400 text-xs">{'\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c'}: {opt.cost}{'\u20bd'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {ptRentalError && (
                  <div className="mt-4 text-red-400 text-sm font-bold animate-pulse">{ptRentalError}</div>
                )}
                <div className="mt-5 text-gray-500 text-xs">[E / Esc] {'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}</div>
              </div>
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
                if (!playtestRef.current) return;
                const currentlyOpen = playtestRef.current.areCellsOpen();
                if (currentlyOpen) {
                  playtestRef.current.closeAllDoors();
                } else {
                  playtestRef.current.openAllDoors();
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
