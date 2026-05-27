import { useEffect, useRef, useState, useCallback } from 'react';

import * as THREE from 'three';
import { MapEditor, MapData, PlacedObject } from './editor/MapEditor';
import { PlaytestMode } from './editor/PlaytestMode';

import { EditorUI } from './components/EditorUI';
import { GuardMenu } from './components/GuardMenu';
import { Minesweeper } from './components/Minesweeper';
import { Paint } from './components/Paint';
import { Scoreboard } from './components/Scoreboard';
import { EditorObjectType } from './editor/EditorObjects';
import { CombatState } from './game/Combat';
import { CameraSystemState } from './game/CameraSystem';
import { InventoryState } from './game/InventorySystem';
import { WalletState } from './game/economy/WalletSystem';
import { RentalDoor, RENTAL_OPTIONS } from './game/RentalDoorSystem';
import { LockerState } from './game/LockerSystem';
import { RARITY_COLORS } from './game/ItemDefs';
import { CharacterModel } from './game/CharacterModel';
import { MultiplayerClient, PlayerData } from './game/multiplayer';
import testMapData from './editor/maps/test-map.json';

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

// Terminal theme definitions
type TerminalTheme = 'win95' | 'win98' | 'linux' | 'dos';

interface ThemeConfig {
  desktopBg: string | null; // null = use wallpaper
  windowBg: string;
  titleBarStyle: string; // Tailwind classes for title bar bg
  titleBarBg?: string; // inline style override for non-gradient themes
  textColor: string;
  borders: string; // Tailwind border classes for windows
  buttonBorders: string; // Tailwind border classes for buttons
  font: string;
  taskbarBg: string;
  taskbarBorderColor: string;
  startMenuBg: string;
  startMenuHover: string;
  startMenuText: string;
  windowContentBorders: string;
  iconTextShadow: string;
  clockTextColor: string;
  contentBg: string;
  textShadow?: string;
}

const THEME_CONFIGS: Record<TerminalTheme, ThemeConfig> = {
  win95: {
    desktopBg: null,
    windowBg: '#c0c0c0',
    titleBarStyle: 'bg-gradient-to-r from-[#000080] to-[#1084d0]',
    textColor: 'black',
    borders: 'border-t-white border-l-white border-b-gray-700 border-r-gray-700',
    buttonBorders: 'border-t-white border-l-white border-b-gray-700 border-r-gray-700',
    font: "'Tahoma', sans-serif",
    taskbarBg: '#c0c0c0',
    taskbarBorderColor: 'white',
    startMenuBg: '#c0c0c0',
    startMenuHover: '#000080',
    startMenuText: 'black',
    windowContentBorders: 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white',
    iconTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    clockTextColor: '#374151',
    contentBg: 'white',
  },
  win98: {
    desktopBg: null,
    windowBg: '#d4d0c8',
    titleBarStyle: 'bg-gradient-to-r from-[#0a246a] to-[#a6caf0]',
    textColor: 'black',
    borders: 'border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040]',
    buttonBorders: 'border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040]',
    font: "'Tahoma', sans-serif",
    taskbarBg: '#d4d0c8',
    taskbarBorderColor: '#ffffff',
    startMenuBg: '#d4d0c8',
    startMenuHover: '#0a246a',
    startMenuText: 'black',
    windowContentBorders: 'border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]',
    iconTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    clockTextColor: '#374151',
    contentBg: '#ffffff',
  },
  linux: {
    desktopBg: '#000000',
    windowBg: '#0a0a0a',
    titleBarStyle: '',
    titleBarBg: '#333333',
    textColor: '#00ff00',
    borders: 'border-[#00ff00]/30',
    buttonBorders: 'border-[#00ff00]/30',
    font: "'Courier New', monospace",
    taskbarBg: '#111111',
    taskbarBorderColor: '#00ff00',
    startMenuBg: '#111111',
    startMenuHover: '#003300',
    startMenuText: '#00ff00',
    windowContentBorders: 'border-[#00ff00]/20',
    iconTextShadow: '0 0 8px rgba(0,255,0,0.6)',
    clockTextColor: '#00ff00',
    contentBg: '#0a0a0a',
    textShadow: '0 0 4px rgba(0,255,0,0.4)',
  },
  dos: {
    desktopBg: '#0a0a00',
    windowBg: '#000000',
    titleBarStyle: '',
    titleBarBg: '#2a2a00',
    textColor: '#ffb000',
    borders: 'border-[#ffb000]/40',
    buttonBorders: 'border-[#ffb000]/40',
    font: "'Courier New', monospace",
    taskbarBg: '#1a1a00',
    taskbarBorderColor: '#ffb000',
    startMenuBg: '#0a0a00',
    startMenuHover: '#2a2a00',
    startMenuText: '#ffb000',
    windowContentBorders: 'border-[#ffb000]/20',
    iconTextShadow: '0 0 6px rgba(255,176,0,0.5)',
    clockTextColor: '#ffb000',
    contentBg: '#0a0a00',
    textShadow: '0 0 3px rgba(255,176,0,0.3)',
  },
};

interface EditorAppProps {
  onBackToGame: () => void;
  multiplayerClient?: MultiplayerClient | null;
  multiplayerTeam?: 'guard' | 'prisoner';
}

type EditorMode = 'editing' | 'team_select' | 'playtesting';

export const EditorApp = ({ onBackToGame, multiplayerClient, multiplayerTeam }: EditorAppProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const playtestContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MapEditor | null>(null);
  const playtestRef = useRef<PlaytestMode | null>(null);
  const savedMapRef = useRef<MapData | null>(null);
  const characterModelRef = useRef<CharacterModel | null>(null);

  const [mode, setMode] = useState<EditorMode>(multiplayerClient ? 'playtesting' : 'editing');
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

  // Transform mode state
  const [transformMode, setTransformMode] = useState<string>('move');

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

  // Locker state
  const [ptLockerState, setPtLockerState] = useState<LockerState | null>(null);
  const ptLockerStateRef = useRef<LockerState | null>(null);
  const [ptLockerAccessDenied, setPtLockerAccessDenied] = useState(false);
  const [lockerMoneyInput, setLockerMoneyInput] = useState('');

  // Armory state
  const [ptArmoryOpen, setPtArmoryOpen] = useState(false);
  const ptArmoryOpenRef = useRef(false);

  // Drag-over slot highlight
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // Rental door nearby info
  const [ptNearbyRentalDoor, setPtNearbyRentalDoor] = useState<{ cellLabel: string; ownerId: string | null; expiresAt: number | null } | null>(null);
  const [rentalTimeLeft, setRentalTimeLeft] = useState<string | null>(null);

  // Terminal wallpaper & start menu state
  const [terminalWallpaperIdx, setTerminalWallpaperIdx] = useState(() => Math.floor(Math.random() * TERMINAL_WALLPAPERS.length));
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null);
  const [terminalTheme, setTerminalTheme] = useState<TerminalTheme>('win95');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [terminalApp, setTerminalApp] = useState<'info' | 'map' | 'settings' | 'cells' | 'eventlog' | 'personalfiles' | 'minesweeper' | 'files' | 'paint' | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  // Event log state
  const [eventLog, setEventLog] = useState<Array<{time: string; action: string; actor: string}>>([]);

  // Personal files state
  const [personalFiles, setPersonalFiles] = useState<Array<{id: string; name: string; description: string; createdAt: string}>>([]);
  const [pfView, setPfView] = useState<'list' | 'create'>('list');
  const [pfName, setPfName] = useState('');
  const [pfDescription, setPfDescription] = useState('');

  // Window drag state
  const [windowPositions, setWindowPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [dragging, setDragging] = useState<{app: string; startX: number; startY: number; origX: number; origY: number} | null>(null);

  // Minimized apps state
  const [minimizedApps, setMinimizedApps] = useState<string[]>([]);

  // Terminal hum ref
  const terminalHumStopRef = useRef<(() => void) | null>(null);

  // Camera saved screenshots
  const [savedScreenshots, setSavedScreenshots] = useState<string[]>([]);

  // Multiplayer player count state
  const [mpPlayerCount, setMpPlayerCount] = useState(0);
  // Multiplayer players map for scoreboard
  const [mpPlayers, setMpPlayers] = useState<Map<string, PlayerData>>(new Map());
  // Scoreboard visibility (hold Q)
  const [scoreboardVisible, setScoreboardVisible] = useState(false);
  // Camera rewind state
  const [rewindPlaying, setRewindPlaying] = useState(false);
  const [rewindFrame, setRewindFrame] = useState(0);
  const rewindBufferRef = useRef<string[]>([]);

  // PTZ mouse drag state
  const [ptzMouseDown, setPtzMouseDown] = useState(false);
  // Camera PTZ view ref for wheel listener
  const ptzViewRef = useRef<HTMLDivElement>(null);
  // Cell timer state
  const [cellTimerActive, setCellTimerActive] = useState(false);
  const [cellTimerAction, setCellTimerAction] = useState<'открытие' | 'закрытие'>('открытие');
  const [cellTimerRemaining, setCellTimerRemaining] = useState<string | null>(null);
  const cellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cellTimerEndRef = useRef<number | null>(null);

  // === Keep rental menu ref in sync ===
  useEffect(() => { ptRentalMenuRef.current = ptRentalMenu; }, [ptRentalMenu]);

  // === Keep locker state ref in sync ===
  useEffect(() => { ptLockerStateRef.current = ptLockerState; }, [ptLockerState]);
  useEffect(() => { ptArmoryOpenRef.current = ptArmoryOpen; }, [ptArmoryOpen]);

  // Current theme config
  const thCfg = THEME_CONFIGS[terminalTheme];

  // === AUTO-START MULTIPLAYER PLAYTEST ===
  useEffect(() => {
    if (!multiplayerClient) return;
    // When multiplayer is active, auto-start playtesting with selected team
    startPlaytest(multiplayerTeam || 'prisoner');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    editor.onTransformModeChange = (mode) => setTransformMode(mode);

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
      if (e.code === 'KeyQ' && multiplayerClient) {
        setScoreboardVisible(true);
      }
      // Close locker with Escape or E
      if ((e.code === 'Escape' || e.code === 'KeyE') && playtestRef.current && ptLockerStateRef.current) {
        e.preventDefault();
        e.stopPropagation();
        playtestRef.current.lockerClose();
        return;
      }
      // Close armory with Escape or E
      if ((e.code === 'Escape' || e.code === 'KeyE') && playtestRef.current && ptArmoryOpenRef.current) {
        e.preventDefault();
        e.stopPropagation();
        playtestRef.current.armoryClose();
        setPtArmoryOpen(false);
        return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && multiplayerClient) {
        setScoreboardVisible(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLock);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('keyup', handleKeyUp);
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
          addEventLog(`Игрок арендовал ${ptRentalMenu.cellLabel}`, 'Игрок');
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

  // Close locker panel when player dies
  useEffect(() => {
    if (ptDeathState?.isDead && ptLockerState) {
      playtestRef.current?.lockerClose();
    }
  }, [ptDeathState?.isDead]);

  // Close armory panel when player dies
  useEffect(() => {
    if (ptDeathState?.isDead && ptArmoryOpen) {
      playtestRef.current?.armoryClose();
      setPtArmoryOpen(false);
    }
  }, [ptDeathState?.isDead]);

  // CharacterModel for inventory panel - show/hide and render when inventory opens
  useEffect(() => {
    if (!ptInventory?.isOpen) {
      // Hide canvas and stop animation when inventory closes
      const container = document.getElementById('character-model-container');
      if (container && characterModelRef.current) {
        characterModelRef.current.stopAnimation();
        const canvas = characterModelRef.current.getCanvas();
        if (canvas.parentElement === container) {
          canvas.style.display = 'none';
        }
      }
      return;
    }

    // Create CharacterModel if it doesn't exist yet (first open during this playtest)
    if (!characterModelRef.current) {
      characterModelRef.current = new CharacterModel(ptTeam);
    }

    const model = characterModelRef.current;
    model.setVestVisible(ptInventory.vestEquipped);

    // Mount or show canvas
    const container = document.getElementById('character-model-container');
    if (container) {
      const canvas = model.getCanvas();
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.objectFit = 'contain';
      if (canvas.parentElement !== container) {
        container.appendChild(canvas);
      }
      model.render();
      model.startAnimation();
    }

    // Mouse drag rotation
    let isDragging = false;
    let lastX = 0;
    const onMouseDown = (e: MouseEvent) => { isDragging = true; lastX = e.clientX; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastX;
      lastX = e.clientX;
      model.rotate(deltaX);
    };
    const onMouseUp = () => { isDragging = false; };

    container?.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      container?.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [ptInventory?.isOpen, ptInventory?.vestEquipped]);

  // Randomize wallpaper each time terminal mode is entered; close start menu
  useEffect(() => {
    if (ptCameraState?.inTerminalMode) {
      setTerminalWallpaperIdx(Math.floor(Math.random() * TERMINAL_WALLPAPERS.length));
      setStartMenuOpen(false);
      setTerminalApp(null);
    }
  }, [ptCameraState?.inTerminalMode]);

  // Boot screen auto-transition to desktop after 1.5s
  useEffect(() => {
    if (ptCameraState?.terminalView === 'booting') {
      playtestRef.current?.getSoundSystem()?.playTerminalStartup();
      const timer = setTimeout(() => {
        playtestRef.current?.terminalBootComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [ptCameraState?.terminalView]);

  // BSOD auto-dismiss after 3s or on any keypress
  useEffect(() => {
    if (ptCameraState?.terminalView === 'bsod') {
      const timer = setTimeout(() => {
        playtestRef.current?.restartBoot();
      }, 3000);
      const handleKey = () => {
        clearTimeout(timer);
        playtestRef.current?.restartBoot();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [ptCameraState?.terminalView]);

  // Terminal hum ambient: start on desktop, stop on exit
  useEffect(() => {
    if (ptCameraState?.inTerminalMode && ptCameraState.terminalView === 'desktop') {
      if (!terminalHumStopRef.current) {
        const stop = playtestRef.current?.getSoundSystem()?.startTerminalHum();
        if (stop) terminalHumStopRef.current = stop;
      }
    } else {
      if (terminalHumStopRef.current) {
        terminalHumStopRef.current();
        terminalHumStopRef.current = null;
      }
    }
  }, [ptCameraState?.inTerminalMode, ptCameraState?.terminalView]);

  // Cleanup hum on unmount
  useEffect(() => {
    return () => {
      if (terminalHumStopRef.current) {
        terminalHumStopRef.current();
        terminalHumStopRef.current = null;
      }
    };
  }, []);

  // Glitch effect every 30 seconds while in terminal mode
  useEffect(() => {
    if (!ptCameraState?.inTerminalMode || ptCameraState.terminalView === 'booting' || ptCameraState.terminalView === 'shutting_down' || ptCameraState.terminalView === 'bsod') {
      return;
    }
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 30000);
    return () => clearInterval(interval);
  }, [ptCameraState?.inTerminalMode, ptCameraState?.terminalView]);

  // Terminal hotkeys
  useEffect(() => {
    if (!ptCameraState?.inTerminalMode || ptCameraState.terminalView !== 'desktop') return;
    const handleHotkey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        playtestRef.current?.openTerminalApp('cameras');
        playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
        setStartMenuOpen(false);
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        playtestRef.current?.openTerminalApp('doors');
        playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
        setStartMenuOpen(false);
      } else if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setTerminalApp('cells');
        playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
      } else if (e.key === 'Escape' && terminalApp) {
        e.preventDefault();
        playtestRef.current?.getSoundSystem()?.playTerminalWindowClose();
        setTerminalApp(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (minimizedApps.length > 0) {
          const restored = minimizedApps[0];
          setMinimizedApps(prev => prev.filter(a => a !== restored));
          setTerminalApp(restored as typeof terminalApp);
          playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
        }
      }
    };
    document.addEventListener('keydown', handleHotkey);
    return () => document.removeEventListener('keydown', handleHotkey);
  }, [ptCameraState?.inTerminalMode, ptCameraState?.terminalView, terminalApp, minimizedApps]);

  // Window drag effect
  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setWindowPositions(prev => ({
        ...prev,
        [dragging.app]: { x: dragging.origX + dx, y: dragging.origY + dy }
      }));
    };
    const handleMouseUp = () => {
      setDragging(null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  // Rewind playback effect
  useEffect(() => {
    if (!rewindPlaying) return;
    const frames = rewindBufferRef.current;
    if (frames.length === 0) {
      setRewindPlaying(false);
      return;
    }
    const interval = setInterval(() => {
      setRewindFrame(prev => {
        if (prev >= frames.length - 1) {
          setRewindPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [rewindPlaying]);

  // PTZ zoom: non-passive wheel listener to properly preventDefault
  useEffect(() => {
    const el = ptzViewRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      playtestRef.current?.ptzZoom(e.deltaY);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  });

  const addEventLog = useCallback((action: string, actor: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setEventLog(prev => {
      const updated = [...prev, { time, action, actor }];
      if (updated.length > 200) updated.shift();
      return updated;
    });
  }, []);

  const handleLockGarageDoors = useCallback(() => {
    playtestRef.current?.lockGarageDoors();
    setPtShowTempLockOptions(false);
    addEventLog('Двери заблокированы', 'Охранник');
  }, [addEventLog]);
  const handleUnlockGarageDoors = useCallback(() => {
    playtestRef.current?.unlockGarageDoors();
    setPtShowTempLockOptions(false);
    addEventLog('Двери разблокированы', 'Охранник');
  }, [addEventLog]);
  const handleTempLockGarageDoors = useCallback((minutes: number) => {
    playtestRef.current?.tempLockGarageDoors(minutes);
    addEventLog('Двери временно заблокированы', 'Охранник');
  }, [addEventLog]);

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
      weaponName: team === 'guard' ? 'AK-47' : '',
      ammo: team === 'guard' ? 30 : 0,
      maxAmmo: team === 'guard' ? 30 : 0,
      isDead: false,
      isReloading: false,
      armorHp: 0,
      maxArmorHp: 50,
      armorEquipped: false,
    });
    setMode('playtesting');

    setTimeout(() => {
      const mapData = multiplayerClient ? (testMapData as unknown as MapData) : savedMapRef.current;
      if (!playtestContainerRef.current || !mapData) {
        console.error('[EditorApp] ABORT: container=', !!playtestContainerRef.current, 'mapData=', !!mapData);
        return;
      }
      console.log('[EditorApp] Creating PlaytestMode with', mapData.objects.length, 'objects');

      const pt = new PlaytestMode(playtestContainerRef.current, mapData, team);
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

      pt.onLockerUpdate = (state) => {
        setPtLockerState(state ? { ...state } : null);
      };
      pt.onLockerAccessDenied = () => {
        setPtLockerAccessDenied(true);
        setTimeout(() => setPtLockerAccessDenied(false), 2500);
      };

      pt.onArmoryOpen = () => {
        setPtArmoryOpen(true);
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
      // Wire multiplayer if client is connected
      if (multiplayerClient && multiplayerClient.isConnected) {
        pt.setMultiplayerClient(multiplayerClient);
        pt.onMultiplayerPlayersUpdate = (count: number) => {
          setMpPlayerCount(count);
        };
        // Keep mpPlayers state in sync for scoreboard
        multiplayerClient.onPlayersUpdated = (players) => {
          setMpPlayers(new Map(players));
          setMpPlayerCount(players.size);
        };
        // Initialize with current state
        setMpPlayers(new Map(multiplayerClient.getPlayers()));
      }
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
    if (characterModelRef.current) {
      const canvas = characterModelRef.current.getCanvas();
      canvas.parentElement?.removeChild(canvas);
      characterModelRef.current.dispose();
      characterModelRef.current = null;
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
    if (cellTimerRef.current) {
      clearInterval(cellTimerRef.current);
      cellTimerRef.current = null;
    }
    cellTimerEndRef.current = null;
    setCellTimerActive(false);
    setCellTimerRemaining(null);
    setPtGarageLockState({ state: 'unlocked', remainingSeconds: null });
    setPtShowTempLockOptions(false);
    setPtDoorLockedToast(false);
    setPtRentalMenu(null);
    setPtRentalError(null);
    setPtDeathState(null);
    setPtLockerState(null);
    setPtLockerAccessDenied(false);
    setLockerMoneyInput('');
    setPtArmoryOpen(false);
    setMinimizedApps([]);
    setWindowPositions({});
    setSavedScreenshots([]);
    setRewindPlaying(false);
    setMode('editing');
  }, []);

  const handleSelectCamera = useCallback((idx: number | null) => {
    playtestRef.current?.selectCamera(idx);
  }, []);

  const handleOpenTerminalApp = useCallback((app: 'cameras' | 'doors') => {
    playtestRef.current?.openTerminalApp(app);
    playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
    setStartMenuOpen(false);
  }, []);

  const handleBackToTerminalDesktop = useCallback(() => {
    playtestRef.current?.backToTerminalDesktop();
    playtestRef.current?.getSoundSystem()?.playTerminalWindowClose();
    setTerminalApp(null);
    setStartMenuOpen(false);
  }, []);

  const handleStartMenuToggle = useCallback(() => {
    playtestRef.current?.getSoundSystem()?.playTerminalClick();
    setStartMenuOpen(prev => !prev);
  }, []);

  const cancelCellTimer = useCallback(() => {
    if (cellTimerRef.current) {
      clearInterval(cellTimerRef.current);
      cellTimerRef.current = null;
    }
    cellTimerEndRef.current = null;
    setCellTimerActive(false);
    setCellTimerRemaining(null);
  }, []);

  const handleWindowDragStart = useCallback((app: string, e: React.MouseEvent) => {
    const pos = windowPositions[app] || { x: 0, y: 0 };
    setDragging({ app, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y });
  }, [windowPositions]);

  const handleMinimizeApp = useCallback((app: string) => {
    playtestRef.current?.getSoundSystem()?.playTerminalWindowClose();
    setMinimizedApps(prev => [...prev, app]);
    setTerminalApp(null);
  }, []);

  const handleRestoreApp = useCallback((app: string) => {
    playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
    setMinimizedApps(prev => prev.filter(a => a !== app));
    setTerminalApp(app as typeof terminalApp);
  }, []);

  const handleCloseTerminalApp = useCallback(() => {
    playtestRef.current?.getSoundSystem()?.playTerminalWindowClose();
    setTerminalApp(null);
  }, []);

  const handleSaveAsWallpaper = useCallback((dataUrl: string) => {
    setCustomWallpaper(dataUrl);
  }, []);

  const startOpenTimer = useCallback(() => {
    cancelCellTimer();
    setCellTimerActive(true);
    setCellTimerAction('открытие');
    cellTimerEndRef.current = Date.now() + 10 * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, (cellTimerEndRef.current! - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        playtestRef.current?.openAllDoors();
        setCellTimerActive(false);
        setCellTimerRemaining(null);
        cellTimerRef.current = null;
      } else {
        const m = Math.floor(remaining / 60);
        const s = Math.floor(remaining % 60);
        setCellTimerRemaining(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    cellTimerRef.current = interval;
  }, [cancelCellTimer]);

  const startCloseTimer = useCallback(() => {
    cancelCellTimer();
    setCellTimerActive(true);
    setCellTimerAction('закрытие');
    cellTimerEndRef.current = Date.now() + 10 * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, (cellTimerEndRef.current! - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        playtestRef.current?.closeAllDoors();
        setCellTimerActive(false);
        setCellTimerRemaining(null);
        cellTimerRef.current = null;
      } else {
        const m = Math.floor(remaining / 60);
        const s = Math.floor(remaining % 60);
        setCellTimerRemaining(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    cellTimerRef.current = interval;
  }, [cancelCellTimer]);

  const handleStartMenuApp = useCallback((app: 'cameras' | 'doors' | 'info' | 'map' | 'settings' | 'cells' | 'eventlog' | 'personalfiles' | 'minesweeper' | 'files' | 'paint' | 'exit') => {
    setStartMenuOpen(false);
    if (app === 'cameras' || app === 'doors') {
      handleOpenTerminalApp(app);
    } else if (app === 'exit') {
      playtestRef.current?.exitTerminal();
    } else {
      playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen();
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
  const handleTransformModeChange = useCallback((mode: string) => {
    editorRef.current?.setTransformMode(mode as 'move' | 'scale' | 'rotate');
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
          transformMode={transformMode}
          onTransformModeChange={handleTransformModeChange}
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
              <span className="text-yellow-400">{'\u20bd'}</span> {ptWallet.balance}
            </div>
          )}

          {/* Multiplayer indicator */}
          {multiplayerClient && multiplayerClient.isConnected && (
            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-2 font-mono text-xs">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
              <span className="text-green-300">{mpPlayerCount} игроков</span>
            </div>
          )}

          {/* Scoreboard overlay (hold Q) */}
          {multiplayerClient && (
            <Scoreboard
              players={mpPlayers}
              visible={scoreboardVisible}
              localPlayerId={multiplayerClient.playerId}
              localTeam={ptTeam}
            />
          )}

          {/* HP */}
          {ptLocked && ptCombat && (
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl p-3" style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{'\u2764\uFE0F'}</span>
                <div className="w-40 h-3 bg-gray-800/80 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-500" style={{ width: `${(ptCombat.hp / ptCombat.maxHp) * 100}%` }} />
                </div>
                <span className="text-white text-xs font-medium w-12">{ptCombat.hp}/{ptCombat.maxHp}</span>
              </div>
              {ptCombat.armorEquipped && (
                <div className="flex items-center gap-3">
                  <span className="text-lg">{'\u{1F6E1}\uFE0F'}</span>
                  <div className="w-40 h-3 bg-gray-800/80 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500" style={{ width: `${(ptCombat.armorHp / ptCombat.maxArmorHp) * 100}%` }} />
                  </div>
                  <span className="text-white text-xs font-medium w-12">{ptCombat.armorHp}/{ptCombat.maxArmorHp}</span>
                </div>
              )}
            </div>
          )}

          {/* Weapon */}
          {ptLocked && ptCombat && (
            <div className="absolute bottom-4 right-4 bg-black/60 p-3 rounded-lg flex items-center gap-3">
              {ptCombat.hasWeapon ? (
                <>
                  <span className="text-yellow-400 font-bold">{ptCombat.weaponName || 'AK-47'}</span>
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

          {/* Inventory Grid - Variant B */}
          {ptInventory?.isOpen && (
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => playtestRef.current?.inventoryEquipSlot(ptInventory.equippedSlot)}>
              <div 
                className="absolute top-1/2 left-1/2 w-[720px] rounded-2xl border border-white/10 overflow-hidden"
                style={{ 
                  animation: 'inventorySlideIn 0.3s ease forwards',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(15, 15, 25, 0.85)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-4 p-5">
                  {/* Left panel - 3D Character Model */}
                  <div className="flex flex-col items-center w-[280px]">
                    <div
                      className="w-[280px] h-[360px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing relative"
                      id="character-model-container"
                      style={{
                        background: 'rgba(20,20,30,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)'
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const slotIdx = e.dataTransfer.getData('text/plain');
                        if (slotIdx !== '') {
                          const idx = parseInt(slotIdx, 10);
                          const item = ptInventory.slots[idx];
                          if (item && item.id === 'item_vest') {
                            playtestRef.current?.inventoryEquipVest();
                          }
                        }
                      }}
                    >
                      {ptInventory.vestEquipped && (
                        <div
                          className="absolute top-2 right-2 bg-green-600/80 text-white text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-red-600/80 transition-colors pointer-events-auto"
                          title="Click to unequip vest"
                          onClick={(e) => {
                            e.stopPropagation();
                            playtestRef.current?.inventoryUnequipVest();
                          }}
                        >
                          {'\u{1F9BA}'} Vest &times;
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-white font-bold text-sm">{ptTeam === 'guard' ? '\u041e\u0445\u0440\u0430\u043d\u043d\u0438\u043a' : '\u0417\u0430\u043a\u043b\u044e\u0447\u0435\u043d\u043d\u044b\u0439'}</div>
                      <div className={`text-xs mt-0.5 ${ptTeam === 'guard' ? 'text-blue-400' : 'text-orange-400'}`}>
                        {ptTeam === 'guard' ? '\u{1F46E} \u041e\u0445\u0440\u0430\u043d\u0430' : '\u{1F464} \u0417\u0435\u043a'}
                      </div>
                    </div>
                    {/* HP Bar */}
                    {ptCombat && (
                      <div className="w-full mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">{'\u2764\uFE0F'}</span>
                          <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-500" style={{ width: `${(ptCombat.hp / ptCombat.maxHp) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{ptCombat.hp}/{ptCombat.maxHp}</span>
                        </div>
                        {/* Armor Bar */}
                        {ptCombat.armorEquipped && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-cyan-400">{'\u{1F6E1}\uFE0F'}</span>
                            <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500" style={{ width: `${(ptCombat.armorHp / ptCombat.maxArmorHp) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{ptCombat.armorHp}/{ptCombat.maxArmorHp}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right panel - 4x2 Grid */}
                  <div className="flex-1 flex flex-col">
                    {/* Quick Slots header */}
                    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{'\u0411\u044b\u0441\u0442\u0440\u044b\u0435 \u0441\u043b\u043e\u0442\u044b'}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {ptInventory.slots.slice(0, 4).map((item, index) => {
                        const isEquipped = ptInventory.hotbarIndex === index;
                        const isDragSource = ptInventory.dragFromSlot === index;
                        const isHovered = ptInventory.hoveredSlot === index;
                        const isDragOver = dragOverSlot === index;
                        const rarityColor = item?.rarity ? RARITY_COLORS[item.rarity] || '#b0b0b0' : '#4a4a4a';

                        return (
                          <div
                            key={index}
                            className={`relative w-[85px] h-[85px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${isDragSource ? 'opacity-30 scale-90' : ''} ${isHovered ? 'scale-105' : ''}`}
                            style={{ 
                              background: 'linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                              border: `2px solid ${isDragOver ? 'rgba(250,204,21,0.8)' : (item ? rarityColor + '60' : 'rgba(255,255,255,0.08)')}`,
                              boxShadow: isDragOver ? '0 0 15px rgba(250,204,21,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' : (isHovered && item ? `0 0 15px ${rarityColor}40, inset 0 1px 0 rgba(255,255,255,0.05)` : 'inset 0 1px 0 rgba(255,255,255,0.03)'),
                              animation: isEquipped ? 'borderPulse 2s ease-in-out infinite' : undefined
                            }}
                            onClick={() => { if (item) playtestRef.current?.inventoryEquipSlot(index); }}
                            onMouseEnter={() => playtestRef.current?.inventorySetHovered(index)}
                            onMouseLeave={() => playtestRef.current?.inventorySetHovered(null)}
                            onContextMenu={(e) => { e.preventDefault(); if (item && item.id !== 'fists') playtestRef.current?.inventoryDropItem(index); }}
                            draggable={!!item && item.id !== 'fists'}
                            onDragStart={(e) => { if (item) { e.dataTransfer.setData('text/plain', String(index)); playtestRef.current?.inventoryStartDrag(index); } }}
                            onDragEnter={() => setDragOverSlot(index)}
                            onDragLeave={() => { if (dragOverSlot === index) setDragOverSlot(null); }}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); setDragOverSlot(null); const fromIdx = e.dataTransfer.getData('text/plain'); if (fromIdx !== '') { if (fromIdx.startsWith('locker:')) { const lockerSlot = parseInt(fromIdx.split(':')[1], 10); playtestRef.current?.lockerWithdraw(lockerSlot); } else { playtestRef.current?.inventorySwapSlots(parseInt(fromIdx, 10), index); } } }}
                          >
                            <span className="absolute top-1 left-1.5 text-[10px] font-medium text-white/50">{index + 1}</span>
                            {item ? (
                              <>
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-[9px] text-gray-300 mt-0.5 text-center leading-tight max-w-[80px] truncate">{item.name}</span>
                                {item.quantity > 1 && (<span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">{item.quantity}</span>)}
                                {isEquipped && (<span className="absolute top-1 right-1 text-yellow-400 text-[10px]">E</span>)}
                              </>
                            ) : (<span className="text-xs text-gray-600">{'\u041f\u0443\u0441\u0442\u043e'}</span>)}
                            {isHovered && item && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 z-50 pointer-events-none rounded-xl overflow-hidden" style={{ animation: 'tooltipFadeIn 0.2s ease forwards', background: 'rgba(10, 10, 20, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: RARITY_COLORS[item.rarity || 'common'] }} />
                                <div className="p-3 pl-4">
                                  <div className="flex items-center gap-2"><span className="text-xl">{item.icon}</span><span className="text-white font-bold text-sm">{item.name}</span></div>
                                  {item.description && <div className="text-gray-400 text-xs mt-1.5 leading-relaxed">{item.description}</div>}
                                  <div className="flex items-center gap-2 mt-2">
                                    {item.rarity && (<span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: (RARITY_COLORS[item.rarity || 'common'] || '#b0b0b0') + '20', color: RARITY_COLORS[item.rarity || 'common'] || '#b0b0b0' }}>{item.rarity === 'common' ? '\u041e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'uncommon' ? '\u041d\u0435\u043e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'rare' ? '\u0420\u0435\u0434\u043a\u0438\u0439' : '\u042d\u043f\u0438\u0447\u0435\u0441\u043a\u0438\u0439'}</span>)}
                                  </div>
                                  {item.id === 'item_vest' && (<div className="text-cyan-400 text-[10px] mt-1.5">{'\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043d\u0430 \u043c\u043e\u0434\u0435\u043b\u044c \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0434\u0435\u0442\u044c'}</div>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Storage header */}
                    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-4 mb-2">{'\u0425\u0440\u0430\u043d\u0438\u043b\u0438\u0449\u0435'}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {ptInventory.slots.slice(4, 8).map((item, i) => {
                        const index = i + 4;
                        const isEquipped = ptInventory.hotbarIndex === index;
                        const isDragSource = ptInventory.dragFromSlot === index;
                        const isHovered = ptInventory.hoveredSlot === index;
                        const isDragOver = dragOverSlot === index;
                        const rarityColor = item?.rarity ? RARITY_COLORS[item.rarity] || '#b0b0b0' : '#4a4a4a';

                        return (
                          <div
                            key={index}
                            className={`relative w-[85px] h-[85px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${isDragSource ? 'opacity-30 scale-90' : ''} ${isHovered ? 'scale-105' : ''}`}
                            style={{ 
                              background: 'linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                              border: `2px solid ${isDragOver ? 'rgba(250,204,21,0.8)' : (item ? rarityColor + '60' : 'rgba(255,255,255,0.08)')}`,
                              boxShadow: isDragOver ? '0 0 15px rgba(250,204,21,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' : (isHovered && item ? `0 0 15px ${rarityColor}40, inset 0 1px 0 rgba(255,255,255,0.05)` : 'inset 0 1px 0 rgba(255,255,255,0.03)'),
                              animation: isEquipped ? 'borderPulse 2s ease-in-out infinite' : undefined
                            }}
                            onClick={() => { if (item) playtestRef.current?.inventoryEquipSlot(index); }}
                            onMouseEnter={() => playtestRef.current?.inventorySetHovered(index)}
                            onMouseLeave={() => playtestRef.current?.inventorySetHovered(null)}
                            onContextMenu={(e) => { e.preventDefault(); if (item && item.id !== 'fists') playtestRef.current?.inventoryDropItem(index); }}
                            draggable={!!item && item.id !== 'fists'}
                            onDragStart={(e) => { if (item) { e.dataTransfer.setData('text/plain', String(index)); playtestRef.current?.inventoryStartDrag(index); } }}
                            onDragEnter={() => setDragOverSlot(index)}
                            onDragLeave={() => { if (dragOverSlot === index) setDragOverSlot(null); }}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); setDragOverSlot(null); const fromIdx = e.dataTransfer.getData('text/plain'); if (fromIdx !== '') { if (fromIdx.startsWith('locker:')) { const lockerSlot = parseInt(fromIdx.split(':')[1], 10); playtestRef.current?.lockerWithdraw(lockerSlot); } else { playtestRef.current?.inventorySwapSlots(parseInt(fromIdx, 10), index); } } }}
                          >
                            <span className="absolute top-1 left-1.5 text-[10px] font-medium text-white/50">{index + 1}</span>
                            {item ? (
                              <>
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-[9px] text-gray-300 mt-0.5 text-center leading-tight max-w-[80px] truncate">{item.name}</span>
                                {item.quantity > 1 && (<span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">{item.quantity}</span>)}
                                {isEquipped && (<span className="absolute top-1 right-1 text-yellow-400 text-[10px]">E</span>)}
                              </>
                            ) : (<span className="text-xs text-gray-600">{'\u041f\u0443\u0441\u0442\u043e'}</span>)}
                            {isHovered && item && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 z-50 pointer-events-none rounded-xl overflow-hidden" style={{ animation: 'tooltipFadeIn 0.2s ease forwards', background: 'rgba(10, 10, 20, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: RARITY_COLORS[item.rarity || 'common'] }} />
                                <div className="p-3 pl-4">
                                  <div className="flex items-center gap-2"><span className="text-xl">{item.icon}</span><span className="text-white font-bold text-sm">{item.name}</span></div>
                                  {item.description && <div className="text-gray-400 text-xs mt-1.5 leading-relaxed">{item.description}</div>}
                                  <div className="flex items-center gap-2 mt-2">
                                    {item.rarity && (<span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: (RARITY_COLORS[item.rarity || 'common'] || '#b0b0b0') + '20', color: RARITY_COLORS[item.rarity || 'common'] || '#b0b0b0' }}>{item.rarity === 'common' ? '\u041e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'uncommon' ? '\u041d\u0435\u043e\u0431\u044b\u0447\u043d\u044b\u0439' : item.rarity === 'rare' ? '\u0420\u0435\u0434\u043a\u0438\u0439' : '\u042d\u043f\u0438\u0447\u0435\u0441\u043a\u0438\u0439'}</span>)}
                                  </div>
                                  {item.id === 'item_vest' && (<div className="text-cyan-400 text-[10px] mt-1.5">{'\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043d\u0430 \u043c\u043e\u0434\u0435\u043b\u044c \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0434\u0435\u0442\u044c'}</div>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center mt-4 text-gray-400 text-sm">
                      Tab - {'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'} | {'\u041b\u041a\u041c'} - {'\u042d\u043a\u0438\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c'} | {'\u041f\u041a\u041c'} - {'\u0411\u0440\u043e\u0441\u0438\u0442\u044c'}
                    </div>
                    <div className="text-center mt-1 text-gray-500 text-xs">
                      {'\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0431\u0440\u043e\u043d\u0435\u0436\u0438\u043b\u0435\u0442 \u043d\u0430 \u043c\u043e\u0434\u0435\u043b\u044c \u0441\u043b\u0435\u0432\u0430 \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0434\u0435\u0442\u044c'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hotbar (4 quick slots) - visible when inventory is CLOSED and pointer is locked */}
          {!ptInventory?.isOpen && ptLocked && ptInventory && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-2xl" style={{ background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {ptInventory.slots.slice(0, 4).map((item, index) => {
                const isActive = ptInventory.hotbarIndex === index;
                const rarityColor = item?.rarity ? RARITY_COLORS[item.rarity] || '#b0b0b0' : '#3a3a3a';
                return (
                  <div
                    key={index}
                    className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                      isActive ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={{ 
                      background: isActive ? 'rgba(40,40,60,0.9)' : 'rgba(20,20,30,0.7)',
                      border: `2px solid ${isActive ? 'rgba(250,204,21,0.8)' : (item ? rarityColor + '40' : 'rgba(255,255,255,0.06)')}`,
                      animation: isActive ? 'borderPulse 2s ease-in-out infinite' : undefined,
                      boxShadow: isActive ? '0 0 15px rgba(250,204,21,0.3)' : 'none'
                    }}
                  >
                    <span className="absolute top-0.5 left-1.5 text-[10px] font-medium text-white/50">{index + 1}</span>
                    {item ? (
                      <>
                        <span className="text-xl">{item.icon}</span>
                        {item.quantity > 1 && (
                          <span className="absolute bottom-0.5 right-1 text-[9px] text-white font-bold bg-black/60 px-1 rounded">{item.quantity}</span>
                        )}
                      </>
                    ) : null}
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
                    className="rounded-xl px-4 py-2.5 flex items-center gap-3"
                    style={{ 
                      animation: 'notificationSlideIn 0.3s ease forwards',
                      background: 'rgba(10,10,20,0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeftColor: rarityColor,
                      borderLeftWidth: '3px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    }}
                  >
                    <span className="text-xl">{notif.item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{notif.item.name}</div>
                      <div className="text-[10px] text-gray-400">{'\u041f\u043e\u0434\u043e\u0431\u0440\u0430\u043d\u043e'}</div>
                    </div>
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
            <div className="absolute inset-0 pointer-events-auto cursor-default" style={{ borderRadius: '4px', overflow: 'hidden', filter: 'hue-rotate(-5deg) saturate(1.1) brightness(0.98)', animation: glitchActive ? 'glitchJitter 0.2s linear' : undefined }}>
              {/* CRT effects overlay */}
              <div className="absolute inset-0 pointer-events-none z-50" style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 2px)',
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)',
                animation: 'crtFlicker 3s ease-in-out infinite',
              }} />

              {/* BSOD screen */}
              {ptCameraState.terminalView === 'bsod' && (
                <div className="absolute inset-0 flex items-center justify-center z-40" style={{ backgroundColor: '#0000AA' }}>
                  <div className="text-white font-mono text-xs leading-relaxed whitespace-pre-wrap max-w-2xl px-8 text-center">
{`A problem has been detected and JailBreak OS has been
shut down to prevent damage to your terminal.

CRITICAL_PROCESS_DIED

*** STOP: 0x000000EF (0x00000001, 0x00000000, 0x00000000, 0x00000000)

Technical information:
*** jailbreak.sys - Address 0xFFFFF802 base at 0xFFFFF800

Beginning dump of physical memory...
Physical memory dump complete.

Press any key to restart...`}
                  </div>
                </div>
              )}

              {/* Boot screen */}
              {ptCameraState.terminalView === 'booting' && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40">
                  <div className="text-xl font-mono mb-8" style={{
                    color: terminalTheme === 'dos' ? '#ffb000' : '#4ade80',
                    textShadow: terminalTheme === 'dos' ? '0 0 8px rgba(255,176,0,0.5)' : '0 0 8px rgba(0,255,0,0.5)'
                  }}>
                    {terminalTheme === 'dos' ? 'C:\\>LOADING...' : terminalTheme === 'linux' ? '$ booting...' : 'Jail Break OS Loading...'}
                  </div>
                  <div className="w-64 h-4 border rounded-sm overflow-hidden" style={{ borderColor: terminalTheme === 'dos' ? 'rgba(255,176,0,0.6)' : 'rgba(74,222,128,0.6)' }}>
                    <div className="h-full" style={{ backgroundColor: terminalTheme === 'dos' ? '#ffb000' : '#4ade80', animation: 'bootProgress 1.5s ease-out forwards' }} />
                  </div>
                </div>
              )}

              {/* Shutdown animation */}
              {ptCameraState.terminalView === 'shutting_down' && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-40">
                  <div className="w-full h-full bg-white" style={{ animation: 'shutdownH 0.3s ease-in forwards' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" style={{ animation: 'shutdownDot 0.2s ease-in 0.3s forwards' }} />
                    </div>
                  </div>
                </div>
              )}
              {/* Desktop view */}
              {ptCameraState.terminalView === 'desktop' && (
                <div className="absolute inset-0 flex flex-col text-sm select-none" style={{ fontFamily: thCfg.font, color: thCfg.textColor, textShadow: thCfg.textShadow }} onClick={() => startMenuOpen && setStartMenuOpen(false)}>
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={customWallpaper ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: thCfg.desktopBg || TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  {/* JailBreak watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none" style={{ animation: 'gentleSpin 4s ease-in-out infinite' }}>
                    <span className="text-7xl font-black text-blue-400">Jail</span>
                    <span className="text-7xl font-black text-orange-400">Break</span>
                  </div>
                  {/* Desktop icons */}
                  <div className="flex-1 p-4 flex flex-wrap content-start gap-2 z-10 overflow-hidden">
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); handleOpenTerminalApp('cameras'); }}
                    >
                      <span className="text-4xl">📹</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>Камеры</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); handleOpenTerminalApp('doors'); }}
                    >
                      <span className="text-4xl">🚪</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>Двери</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('cells'); }}
                    >
                      <span className="text-4xl">🔒</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>Клетки</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('eventlog'); }}
                    >
                      <span className="text-4xl">📋</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>Журнал событий</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('personalfiles'); }}
                    >
                      <span className="text-4xl">📁</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>Личные дела</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('minesweeper'); }}
                    >
                      <span className="text-4xl">{'\u{1F4A3}'}</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>{'\u0421\u0430\u043F\u0451\u0440'}</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('files'); playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen(); }}
                    >
                      <span className="text-4xl">{'\u{1F4F7}'}</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>{'\u0424\u0430\u0439\u043B\u044B'}</span>
                    </div>
                    <div
                      className="w-20 flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded hover:bg-white/20"
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = 'iconWobble 0.4s ease-in-out'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animation = ''; }}
                      onClick={(e) => { e.stopPropagation(); setTerminalApp('paint'); playtestRef.current?.getSoundSystem()?.playTerminalWindowOpen(); }}
                    >
                      <span className="text-4xl">{'\u{1F3A8}'}</span>
                      <span className="text-[10px] font-bold text-center" style={{ color: (terminalTheme === 'linux' || terminalTheme === 'dos') ? thCfg.textColor : 'white', textShadow: thCfg.iconTextShadow }}>{'\u0420\u0438\u0441\u043E\u0432\u0430\u043B\u043A\u0430'}</span>
                    </div>
                  </div>

                  {/* Info app window */}
                  {terminalApp === 'info' && !minimizedApps.includes('info') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['info']?.x || 0)}px, ${(windowPositions['info']?.y || 0)}px)` }}>
                      <div className={`w-[500px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('info', e)}>
                          <span className="text-xs">Информация о тюрьме</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('info'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1 text-xs leading-relaxed max-h-[300px] overflow-y-auto`} style={{ backgroundColor: thCfg.contentBg, color: thCfg.textColor }}>
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
                  {terminalApp === 'map' && !minimizedApps.includes('map') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['map']?.x || 0)}px, ${(windowPositions['map']?.y || 0)}px)` }}>
                      <div className={`w-[550px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('map', e)}>
                          <span className="text-xs">Карта территории</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('map'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1`} style={{ backgroundColor: thCfg.contentBg }}>
                          <div className="w-full h-[280px] border border-gray-300 relative flex items-center justify-center" style={{ backgroundColor: terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.windowBg : '#f0f0e0' }}>
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
                  {terminalApp === 'settings' && !minimizedApps.includes('settings') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['settings']?.x || 0)}px, ${(windowPositions['settings']?.y || 0)}px)` }}>
                      <div className={`w-[400px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('settings', e)}>
                          <span className="text-xs">{terminalTheme === 'linux' ? '> Настройки' : terminalTheme === 'dos' ? 'C:\\SETTINGS' : 'Настройки'}</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('settings'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1`}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Громкость оповещений</span>
                              <div className="w-24 h-3 border border-gray-600 relative" style={{ backgroundColor: thCfg.contentBg }}>
                                <div className="h-full w-3/4" style={{ backgroundColor: terminalTheme === 'linux' ? '#00ff00' : terminalTheme === 'dos' ? '#ffb000' : '#000080' }}></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Яркость экрана</span>
                              <div className="w-24 h-3 border border-gray-600 relative" style={{ backgroundColor: thCfg.contentBg }}>
                                <div className="h-full w-full" style={{ backgroundColor: terminalTheme === 'linux' ? '#00ff00' : terminalTheme === 'dos' ? '#ffb000' : '#000080' }}></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">Язык</span>
                              <span className="text-xs border border-gray-600 px-2 py-0.5" style={{ backgroundColor: thCfg.contentBg }}>Русский</span>
                            </div>
                            {/* Theme selector */}
                            <div className="pt-2 border-t border-gray-400">
                              <span className="text-xs font-bold block mb-2">Тема оформления</span>
                              <div className="grid grid-cols-2 gap-2">
                                {([
                                  { id: 'win95' as TerminalTheme, label: 'Windows 95' },
                                  { id: 'win98' as TerminalTheme, label: 'Windows 98' },
                                  { id: 'linux' as TerminalTheme, label: 'Linux Terminal' },
                                  { id: 'dos' as TerminalTheme, label: 'Retro DOS' },
                                ]).map(t => (
                                  <button
                                    key={t.id}
                                    className={`px-2 py-1.5 text-xs border-2 font-bold ${terminalTheme === t.id ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white' : thCfg.buttonBorders}`}
                                    style={{
                                      backgroundColor: terminalTheme === t.id ? (THEME_CONFIGS[t.id].titleBarBg || '#000080') : thCfg.windowBg,
                                      color: terminalTheme === t.id ? '#ffffff' : thCfg.textColor,
                                    }}
                                    onClick={() => setTerminalTheme(t.id)}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-400 text-xs" style={{ color: terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.textColor : '#6b7280' }}>
                              JailBreak Security Terminal v2.4.1
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cells app window */}
                  {terminalApp === 'cells' && !minimizedApps.includes('cells') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['cells']?.x || 0)}px, ${(windowPositions['cells']?.y || 0)}px)` }}>
                      <div className={`w-[500px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('cells', e)}>
                          <span className="text-xs">{'\u{1F512}'} Клетки</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('cells'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1`}>
                          <div className="space-y-4">
                            {/* Status */}
                            <div className="p-3 border border-gray-600 bg-white">
                              <div className="text-xs text-gray-600 mb-1">Текущий статус:</div>
                              <div className="text-sm font-bold">
                                {ptCellsOpen ? '🟢 ОТКРЫТЫ' : '🔴 ЗАКРЫТЫ'}
                              </div>
                              {cellTimerRemaining && (
                                <div className="text-xs text-yellow-700 mt-1">
                                  ⏱ Авто-{cellTimerAction} через {cellTimerRemaining}
                                </div>
                              )}
                            </div>

                            {/* Instant actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                onClick={() => { playtestRef.current?.openAllDoors(); addEventLog('Клетки открыты', 'Охранник'); }}
                              >
                                🔓 Открыть клетки
                              </button>
                              <button
                                className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                onClick={() => { playtestRef.current?.closeAllDoors(); addEventLog('Клетки закрыты', 'Охранник'); }}
                              >
                                🔒 Закрыть клетки
                              </button>
                            </div>

                            {/* Timer actions */}
                            <div className="pt-3 border-t border-gray-400">
                              <div className="text-xs text-gray-600 mb-2">Таймер (10 минут):</div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                  onClick={startOpenTimer}
                                >
                                  ⏱ Открыть через 10 мин
                                </button>
                                <button
                                  className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                  onClick={startCloseTimer}
                                >
                                  ⏱ Закрыть через 10 мин
                                </button>
                              </div>
                              {cellTimerActive && (
                                <button
                                  className={`mt-2 w-full px-3 py-1.5 border-2 ${thCfg.borders} text-xs font-bold`}
                                  style={{ backgroundColor: thCfg.windowBg, color: terminalTheme === 'linux' ? '#ff4444' : terminalTheme === 'dos' ? '#ff6600' : '#b91c1c' }}
                                  onClick={cancelCellTimer}
                                >
                                  ✕ Отменить таймер
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Log app window */}
                  {terminalApp === 'eventlog' && !minimizedApps.includes('eventlog') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['eventlog']?.x || 0)}px, ${(windowPositions['eventlog']?.y || 0)}px)` }}>
                      <div className={`w-[500px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('eventlog', e)}>
                          <span className="text-xs">{'\u{1F4CB}'} Журнал событий</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('eventlog'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1 text-xs max-h-[300px] overflow-y-auto`} style={{ backgroundColor: thCfg.contentBg, color: thCfg.textColor }}>
                          {eventLog.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">Нет записей</div>
                          ) : (
                            <div className="space-y-1">
                              {eventLog.map((entry, idx) => (
                                <div key={idx} className="text-xs">
                                  {entry.time} - {entry.action} ({entry.actor})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Personal Files app window */}
                  {terminalApp === 'personalfiles' && !minimizedApps.includes('personalfiles') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['personalfiles']?.x || 0)}px, ${(windowPositions['personalfiles']?.y || 0)}px)` }}>
                      <div className={`w-[500px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('personalfiles', e)}>
                          <span className="text-xs">{'\u{1F4C1}'} Личные дела</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('personalfiles'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); setPfView('list'); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1 text-xs max-h-[350px] overflow-y-auto`} style={{ backgroundColor: thCfg.contentBg, color: thCfg.textColor }}>
                          {pfView === 'list' ? (
                            <div>
                              {personalFiles.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">Нет документов</div>
                              ) : (
                                <div className="space-y-2 mb-3">
                                  {personalFiles.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 border border-gray-300 bg-gray-50">
                                      <div>
                                        <div className="font-bold text-xs">{doc.name}</div>
                                        <div className="text-[10px] text-gray-500">{doc.createdAt}</div>
                                      </div>
                                      <button
                                        className="w-5 h-5 bg-red-100 border border-red-400 text-red-600 text-xs flex items-center justify-center leading-none font-bold hover:bg-red-200"
                                        onClick={() => {
                                          const docName = doc.name;
                                          setPersonalFiles(prev => prev.filter(d => d.id !== doc.id));
                                          addEventLog(`Удалён документ: ${docName}`, 'Охранник');
                                        }}
                                      >X</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button
                                className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                onClick={() => setPfView('create')}
                              >
                                + Создать документ
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-bold mb-1">Имя</label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-600 px-2 py-1 text-xs bg-white"
                                  value={pfName}
                                  onChange={(e) => setPfName(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold mb-1">Описание</label>
                                <textarea
                                  className="w-full border border-gray-600 px-2 py-1 text-xs bg-white h-20 resize-none"
                                  value={pfDescription}
                                  onChange={(e) => setPfDescription(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                  onClick={() => {
                                    if (!pfName.trim()) {
                                      playtestRef.current?.getSoundSystem()?.playTerminalError();
                                      return;
                                    }
                                    const now = new Date();
                                    const createdAt = now.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    setPersonalFiles(prev => [...prev, { id: crypto.randomUUID(), name: pfName.trim(), description: pfDescription.trim(), createdAt }]);
                                    addEventLog(`Создан документ: ${pfName.trim()}`, 'Охранник');
                                    setPfName('');
                                    setPfDescription('');
                                    setPfView('list');
                                  }}
                                >
                                  Создать
                                </button>
                                <button
                                  className={`px-3 py-2 border-2 ${thCfg.borders} text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                  onClick={() => { setPfView('list'); setPfName(''); setPfDescription(''); }}
                                >
                                  Назад
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Files (screenshots) app window */}
                  {terminalApp === 'files' && !minimizedApps.includes('files') && (
                    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={{ transform: `translate(${(windowPositions['files']?.x || 0)}px, ${(windowPositions['files']?.y || 0)}px)` }}>
                      <div className={`w-[500px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                        <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined} onMouseDown={(e) => handleWindowDragStart('files', e)}>
                          <span className="text-xs">{'\u{1F4F7}'} {'\u0424\u0430\u0439\u043B\u044B'}</span>
                          <div className="flex gap-0.5">
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleMinimizeApp('files'); }}
                            >_</button>
                            <button
                              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                              style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                              onClick={(e) => { e.stopPropagation(); handleCloseTerminalApp(); }}
                            >X</button>
                          </div>
                        </div>
                        <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1 text-xs max-h-[350px] overflow-y-auto`} style={{ backgroundColor: thCfg.contentBg, color: thCfg.textColor }}>
                          {savedScreenshots.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">{'\u041D\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0445 \u0441\u043D\u0438\u043C\u043A\u043E\u0432'}</div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {savedScreenshots.map((src, idx) => (
                                <div key={idx} className="border border-gray-400 p-1">
                                  <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-auto" />
                                  <div className="text-center text-[10px] text-gray-600 mt-0.5">CAM_{idx + 1}.jpg</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Minesweeper app window */}
                  {terminalApp === 'minesweeper' && !minimizedApps.includes('minesweeper') && (
                    <Minesweeper
                      onClose={() => handleCloseTerminalApp()}
                      onWin={() => addEventLog('\u0421\u0430\u043F\u0451\u0440: \u041F\u043E\u0431\u0435\u0434\u0430!', '\u041E\u0445\u0440\u0430\u043D\u043D\u0438\u043A')}
                      onLose={() => addEventLog('\u0421\u0430\u043F\u0451\u0440: \u041F\u0440\u043E\u0438\u0433\u0440\u044B\u0448', '\u041E\u0445\u0440\u0430\u043D\u043D\u0438\u043A')}
                      onMinimize={() => handleMinimizeApp('minesweeper')}
                      onTitleBarMouseDown={(e) => handleWindowDragStart('minesweeper', e)}
                      style={{ transform: `translate(${(windowPositions['minesweeper']?.x || 0)}px, ${(windowPositions['minesweeper']?.y || 0)}px)` }}
                    />
                  )}

                  {/* Paint app window */}
                  {terminalApp === 'paint' && !minimizedApps.includes('paint') && (
                    <Paint
                      onClose={() => handleCloseTerminalApp()}
                      onMinimize={() => handleMinimizeApp('paint')}
                      onTitleBarMouseDown={(e) => handleWindowDragStart('paint', e)}
                      style={{ transform: `translate(${(windowPositions['paint']?.x || 0)}px, ${(windowPositions['paint']?.y || 0)}px)` }}
                      onSaveAsWallpaper={handleSaveAsWallpaper}
                      themeConfig={thCfg}
                    />
                  )}

                  {/* Start Menu */}
                  {startMenuOpen && (
                    <div className={`absolute bottom-[30px] left-0 z-30 w-[200px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.startMenuBg, color: thCfg.startMenuText, fontFamily: thCfg.font }} onClick={(e) => e.stopPropagation()}>
                      {/* Side banner */}
                      <div className="flex">
                        <div className="w-6 flex items-end justify-center pb-1" style={{ background: thCfg.titleBarBg ? thCfg.titleBarBg : 'linear-gradient(to top, #000080, #1084d0)' }}>
                          <span className="text-white text-[9px] font-bold [writing-mode:vertical-lr] rotate-180">JailBreak</span>
                        </div>
                        <div className="flex-1 flex flex-col py-1">
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('cameras')}
                          >
                            <span>📹</span><span className="text-xs">Камеры</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('doors')}
                          >
                            <span>🚪</span><span className="text-xs">Двери</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('info')}
                          >
                            <span>📋</span><span className="text-xs">Информация</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('map')}
                          >
                            <span>🗺️</span><span className="text-xs">Карта</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('settings')}
                          >
                            <span>⚙️</span><span className="text-xs">Настройки</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('cells')}
                          >
                            <span>🔒</span><span className="text-xs">Клетки</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('eventlog')}
                          >
                            <span>📋</span><span className="text-xs">Журнал событий</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('personalfiles')}
                          >
                            <span>📁</span><span className="text-xs">Личные дела</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('minesweeper')}
                          >
                            <span>{'\u{1F4A3}'}</span><span className="text-xs">{'\u0421\u0430\u043F\u0451\u0440'}</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('files')}
                          >
                            <span>{'\u{1F4F7}'}</span><span className="text-xs">{'\u0424\u0430\u0439\u043B\u044B'}</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('paint')}
                          >
                            <span>{'\u{1F3A8}'}</span><span className="text-xs">{'\u0420\u0438\u0441\u043E\u0432\u0430\u043B\u043A\u0430'}</span>
                          </button>
                          <div className="border-t border-gray-400 my-1"></div>
                          <button
                            className="flex items-center gap-2 px-3 py-1.5 text-left" style={{ color: thCfg.startMenuText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = thCfg.startMenuHover; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = thCfg.startMenuText; }}
                            onClick={() => handleStartMenuApp('exit')}
                          >
                            <span>🔌</span><span className="text-xs">Выйти</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Taskbar */}
                  <div className="h-[30px] border-t-2 flex items-center px-1 gap-2 z-20" style={{ backgroundColor: thCfg.taskbarBg, borderTopColor: thCfg.taskbarBorderColor }}>
                    <button
                      className={`h-[22px] px-2 flex items-center gap-1 border-2 ${startMenuOpen ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white' : thCfg.borders}`}
                      style={{ backgroundColor: startMenuOpen ? (terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.startMenuHover : '#b0b0b0') : thCfg.taskbarBg, color: thCfg.textColor }}
                      onClick={(e) => { e.stopPropagation(); handleStartMenuToggle(); }}
                    >
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">{'\u041F\u0443\u0441\u043A'}</span>
                    </button>
                    {minimizedApps.map(app => (
                      <button
                        key={app}
                        className={`h-[22px] px-2 flex items-center border-2 ${thCfg.windowContentBorders} text-xs font-bold`}
                        style={{ backgroundColor: terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.windowBg : '#a0a0a0', color: thCfg.textColor }}
                        onClick={(e) => { e.stopPropagation(); handleRestoreApp(app); }}
                      >
                        {app}
                      </button>
                    ))}
                    <span className="text-xs font-mono" style={{ color: terminalTheme === 'linux' ? '#00ff00' : terminalTheme === 'dos' ? '#ffb000' : '#166534', animation: 'cursorBlink 1s step-end infinite' }}>_</span>
                    <div className="flex-1"></div>
                    <div className="text-xs mr-2" style={{ color: thCfg.clockTextColor }}>
                      E - Выйти
                    </div>
                    <div className={`h-[22px] px-2 flex items-center border-2 ${thCfg.windowContentBorders} text-xs`} style={{ color: thCfg.clockTextColor }}>
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cameras view - grid (no camera selected) */}
              {ptCameraState.terminalView === 'cameras' && ptCameraState.selectedCameraIndex === null && (
                <div className="absolute inset-0 flex flex-col text-sm select-none" style={{ fontFamily: thCfg.font, color: thCfg.textColor }}>
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={customWallpaper ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: thCfg.desktopBg || TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div className={`w-[95vw] max-w-[1100px] h-[85vh] border-2 ${thCfg.borders} shadow-lg flex flex-col`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                      {/* Title bar */}
                      <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between shrink-0`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined}>
                        <span className="text-xs">Система наблюдения</span>
                        <button
                          className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${thCfg.buttonBorders}`}
                          style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                          onClick={handleBackToTerminalDesktop}
                        >
                          X
                        </button>
                      </div>
                      {/* Window body - scrollable */}
                      <div className={`flex-1 overflow-y-auto p-4 border-2 ${thCfg.windowContentBorders} m-1`}>
                        {ptCameraState.cameras.length === 0 ? (
                          <div className="text-center py-8 text-gray-600">Нет подключённых камер</div>
                        ) : (
                          <div className="grid grid-cols-4 gap-3">
                            {ptCameraState.cameras.map((cam, idx) => (
                              <div
                                key={cam.id}
                                className={`border-2 ${thCfg.windowContentBorders} p-2 cursor-pointer transition-colors`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
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
                  <div className="h-[30px] border-t-2 flex items-center px-1 gap-2 shrink-0 relative z-10" style={{ backgroundColor: thCfg.taskbarBg, borderTopColor: thCfg.taskbarBorderColor }}>
                    <button className={`h-[22px] px-2 flex items-center gap-1 border-2 ${thCfg.borders}`} style={{ backgroundColor: thCfg.taskbarBg, color: thCfg.textColor }}>
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">Пуск</span>
                    </button>
                    <div className={`h-[22px] px-2 flex items-center border-2 ${thCfg.windowContentBorders} text-xs font-bold`} style={{ backgroundColor: terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.windowBg : '#a0a0a0', color: thCfg.textColor }}>
                      📹 Камеры
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-xs mr-2" style={{ color: thCfg.clockTextColor }}>
                      E - Выйти
                    </div>
                    <div className={`h-[22px] px-2 flex items-center border-2 ${thCfg.windowContentBorders} text-xs`} style={{ color: thCfg.clockTextColor }}>
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cameras view - selected camera (transparent so 3D canvas shows through) */}
              {ptCameraState.terminalView === 'cameras' && ptCameraState.selectedCameraIndex !== null && (
                <div className="absolute inset-0 flex flex-col text-sm select-none" style={{ fontFamily: thCfg.font, ...(ptCameraState.nightVision ? { filter: 'brightness(1.5) saturate(0.3) hue-rotate(80deg)' } : {}) }}>
                  {/* Top bar */}
                  <div className="bg-black/80 px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="text-green-400 font-mono text-sm">
                      CAM {ptCameraState.selectedCameraIndex + 1} - {ptCameraState.cameras[ptCameraState.selectedCameraIndex]?.label}
                    </div>
                    <div className="text-red-500 font-mono text-sm animate-pulse">{'\u25CF'} REC</div>
                  </div>
                  {/* Middle - transparent area where 3D camera view shows through - PTZ interactive */}
                  <div
                    ref={ptzViewRef}
                    className="flex-1 relative pointer-events-auto cursor-crosshair"
                    onMouseDown={() => setPtzMouseDown(true)}
                    onMouseUp={() => setPtzMouseDown(false)}
                    onMouseLeave={() => setPtzMouseDown(false)}
                    onMouseMove={(e) => { if (ptzMouseDown) playtestRef.current?.ptzPan(e.movementX, e.movementY); }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: ptCameraState.nightVision ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.05) 2px, rgba(0,255,0,0.05) 4px)' : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }}></div>
                    <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }}></div>
                    {/* Rewind overlay */}
                    {rewindPlaying && rewindBufferRef.current.length > 0 && (
                      <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
                        <img src={rewindBufferRef.current[rewindFrame] || ''} alt="rewind" className="max-w-full max-h-full object-contain" />
                        <div className="absolute top-2 right-2 text-yellow-400 font-mono text-xs">{'\u23EA'} {rewindFrame + 1}/{rewindBufferRef.current.length}</div>
                      </div>
                    )}
                  </div>
                  {/* Bottom bar */}
                  <div className="bg-black/80 px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="text-gray-300 text-sm cursor-pointer hover:text-white pointer-events-auto"
                        onClick={() => handleSelectCamera(null)}
                      >
                        {'\u2190'} Назад
                      </div>
                      <div
                        className="text-gray-300 text-sm cursor-pointer hover:text-white pointer-events-auto"
                        onClick={handleBackToTerminalDesktop}
                      >
                        {'\u2190'} Рабочий стол
                      </div>
                      <div className="border-l border-gray-600 h-4 mx-1"></div>
                      {/* PTZ Presets */}
                      {[0,1,2].map(slot => (
                        <div
                          key={slot}
                          className="text-gray-300 text-xs cursor-pointer hover:text-white pointer-events-auto border border-gray-600 px-1.5 py-0.5"
                          onClick={(e) => { if (e.shiftKey) playtestRef.current?.ptzSavePreset(slot); else playtestRef.current?.ptzLoadPreset(slot); }}
                          title="Click load, Shift+click save"
                        >
                          {slot + 1}
                        </div>
                      ))}
                      <div
                        className="text-gray-300 text-xs cursor-pointer hover:text-white pointer-events-auto border border-gray-600 px-1.5 py-0.5"
                        onClick={() => playtestRef.current?.ptzReset()}
                      >
                        Reset
                      </div>
                      <div className="border-l border-gray-600 h-4 mx-1"></div>
                      {/* Night Vision toggle */}
                      <div
                        className={`text-xs cursor-pointer pointer-events-auto border px-1.5 py-0.5 ${ptCameraState.nightVision ? 'text-green-400 border-green-400' : 'text-gray-300 border-gray-600 hover:text-white'}`}
                        onClick={() => playtestRef.current?.toggleNightVision()}
                      >
                        NV
                      </div>
                      {/* Screenshot button */}
                      <div
                        className="text-gray-300 text-xs cursor-pointer hover:text-white pointer-events-auto border border-gray-600 px-1.5 py-0.5"
                        onClick={() => {
                          const idx = ptCameraState.selectedCameraIndex;
                          if (idx !== null && ptCameraState.screenshots[idx]) {
                            setSavedScreenshots(prev => {
                              const updated = [...prev, ptCameraState.screenshots[idx]];
                              if (updated.length > 20) updated.shift();
                              return updated;
                            });
                          }
                        }}
                      >
                        {'\u{1F4F7}'}
                      </div>
                      {/* Rewind button */}
                      <div
                        className="text-gray-300 text-xs cursor-pointer hover:text-white pointer-events-auto border border-gray-600 px-1.5 py-0.5"
                        onClick={() => {
                          const buf = playtestRef.current?.getRewindBuffer() || [];
                          if (buf.length === 0) {
                            playtestRef.current?.getSoundSystem()?.playTerminalError();
                            return;
                          }
                          rewindBufferRef.current = buf;
                          setRewindFrame(0);
                          setRewindPlaying(true);
                        }}
                      >
                        {'\u23EA'} Rewind
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
                <div className="absolute inset-0 flex flex-col text-sm select-none" style={{ fontFamily: thCfg.font, color: thCfg.textColor }}>
                  {/* Wallpaper background */}
                  <div className="absolute inset-0" style={customWallpaper ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: thCfg.desktopBg || TERMINAL_WALLPAPERS[terminalWallpaperIdx].background }} />
                  {/* Centered Win95 window */}
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className={`w-[450px] border-2 ${thCfg.borders} shadow-lg`} style={{ backgroundColor: thCfg.windowBg, fontFamily: thCfg.font, color: thCfg.textColor }}>
                      {/* Title bar */}
                      <div className={`${thCfg.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between`} style={thCfg.titleBarBg ? { backgroundColor: thCfg.titleBarBg } : undefined}>
                        <span className="text-xs">Управление дверями</span>
                        <button
                          className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white ${thCfg.buttonBorders}`}
                          style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                          onClick={handleBackToTerminalDesktop}
                        >
                          X
                        </button>
                      </div>
                      {/* Window body */}
                      <div className={`p-4 border-2 ${thCfg.windowContentBorders} m-1`}>
                        {/* Status indicator */}
                        <div className={`mb-4 p-3 border-2 ${thCfg.windowContentBorders}`} style={{ backgroundColor: thCfg.contentBg }}>
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
                                ? `${thCfg.windowContentBorders}`
                                : thCfg.borders
                            }`}
                            style={{ backgroundColor: ptGarageLockState.state === 'locked' ? (terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.startMenuHover : '#a0a0a0') : thCfg.windowBg, color: thCfg.textColor }}
                            onClick={handleLockGarageDoors}
                          >
                            🔒 Заблокировать двери
                          </button>
                          <button
                            className={`border-2 px-4 py-2 text-left font-bold ${
                              ptGarageLockState.state === 'unlocked'
                                ? `${thCfg.windowContentBorders}`
                                : thCfg.borders
                            }`}
                            style={{ backgroundColor: ptGarageLockState.state === 'unlocked' ? (terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.startMenuHover : '#a0a0a0') : thCfg.windowBg, color: thCfg.textColor }}
                            onClick={handleUnlockGarageDoors}
                          >
                            🔓 Разблокировать двери
                          </button>
                          <button
                            className={`border-2 px-4 py-2 text-left font-bold ${
                              ptGarageLockState.state === 'temp_locked'
                                ? `${thCfg.windowContentBorders}`
                                : thCfg.borders
                            }`}
                            style={{ backgroundColor: ptGarageLockState.state === 'temp_locked' ? (terminalTheme === 'linux' || terminalTheme === 'dos' ? thCfg.startMenuHover : '#a0a0a0') : thCfg.windowBg, color: thCfg.textColor }}
                            onClick={() => setPtShowTempLockOptions(prev => !prev)}
                          >
                            ⏱️ Временно заблокировать
                          </button>
                          {(ptShowTempLockOptions || ptGarageLockState.state === 'temp_locked') && (
                            <div className="flex gap-2 ml-6 mt-1">
                              <button
                                className={`border-2 ${thCfg.borders} px-3 py-1 text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                onClick={() => handleTempLockGarageDoors(5)}
                              >
                                5 мин
                              </button>
                              <button
                                className={`border-2 ${thCfg.borders} px-3 py-1 text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
                                onClick={() => handleTempLockGarageDoors(10)}
                              >
                                10 мин
                              </button>
                              <button
                                className={`border-2 ${thCfg.borders} px-3 py-1 text-xs font-bold`}
                                style={{ backgroundColor: thCfg.windowBg, color: thCfg.textColor }}
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
                  <div className="h-[30px] border-t-2 flex items-center px-1 gap-2 relative z-10" style={{ backgroundColor: thCfg.taskbarBg, borderTopColor: thCfg.taskbarBorderColor }}>
                    <button className={`h-[22px] px-2 flex items-center gap-1 border-2 ${thCfg.borders}`} style={{ backgroundColor: thCfg.taskbarBg, color: thCfg.textColor }}>
                      <span className="w-3 h-3 bg-green-600 inline-block"></span>
                      <span className="font-bold text-xs">Пуск</span>
                    </button>
                    <div className="flex-1"></div>
                    <div className="text-xs mr-2" style={{ color: thCfg.clockTextColor }}>
                      E - Выйти
                    </div>
                    <div className={`h-[22px] px-2 flex items-center border-2 ${thCfg.windowContentBorders} text-xs`} style={{ color: thCfg.clockTextColor }}>
                      {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Locker access denied toast */}
          {ptLockerAccessDenied && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-800/90 text-white px-6 py-3 rounded-lg pointer-events-none z-50">
              <span className="font-bold">{'\uD83D\uDD12'} {'\u0412\u0430\u043c \u043d\u0443\u0436\u043d\u043e \u0430\u0440\u0435\u043d\u0434\u043e\u0432\u0430\u0442\u044c \u043a\u0430\u043c\u0435\u0440\u0443 \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0448\u043a\u0430\u0444'}</span>
            </div>
          )}

          {/* Locker UI */}
          {ptLockerState && ptLockerState.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto z-40"
              onClick={() => playtestRef.current?.lockerClose()}>
              <div
                className="w-[900px] max-w-[95vw] max-h-[85vh] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                style={{
                  animation: 'lockerFadeIn 0.2s ease',
                  background: 'rgba(15, 15, 25, 0.9)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{'\uD83D\uDDC4'}</span>
                    <div>
                      <div className="text-white font-bold">{'\u0428\u043a\u0430\u0444 \u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f'}</div>
                      <div className="text-gray-400 text-xs">{ptLockerState.linkedGroupId > 0 ? `ID: ${ptLockerState.linkedGroupId}` : '\u041e\u0431\u0449\u0438\u0439'}</div>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    onClick={() => playtestRef.current?.lockerClose()}
                  >
                    &#x2715;
                  </button>
                </div>

                {/* Money section */}
                {ptTeam !== 'guard' && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-300">{'\u0414\u0435\u043d\u044c\u0433\u0438 \u0432 \u0448\u043a\u0430\u0444\u0443'}:</div>
                    <div className="text-yellow-400 font-bold">{'\u20bd'} {ptLockerState.storedMoney}</div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-yellow-400"
                      placeholder={'\u0421\u0443\u043c\u043c\u0430'}
                      value={lockerMoneyInput}
                      onChange={(e) => setLockerMoneyInput(e.target.value)}
                    />
                    <button
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors cursor-pointer"
                      onClick={() => {
                        const amount = parseInt(lockerMoneyInput, 10);
                        if (!isNaN(amount) && amount > 0) {
                          playtestRef.current?.lockerDepositMoney(amount);
                          setLockerMoneyInput('');
                        }
                      }}
                    >
                      {'\u0412\u043d\u0435\u0441\u0442\u0438'}
                    </button>
                    <button
                      className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white text-sm rounded transition-colors cursor-pointer"
                      onClick={() => {
                        const amount = parseInt(lockerMoneyInput, 10);
                        if (!isNaN(amount) && amount > 0) {
                          playtestRef.current?.lockerWithdrawMoney(amount);
                          setLockerMoneyInput('');
                        }
                      }}
                    >
                      {'\u0417\u0430\u0431\u0440\u0430\u0442\u044c'}
                    </button>
                  </div>
                </div>
                )}

                {/* Split layout: Player inventory + Locker slots */}
                <div className="p-4 overflow-y-auto flex-1 flex gap-4">
                  {/* Player inventory (left side) */}
                  <div className="flex-shrink-0">
                    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{'\u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c'}</div>
                    {ptTeam === 'guard' && (
                      <div className="text-xs text-yellow-400 mb-2">{'\u041a\u043e\u043d\u0444\u0438\u0441\u043a\u0430\u0446\u0438\u044f \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432'}</div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {(ptInventory?.slots ?? Array(8).fill(null)).slice(0, 8).map((item, index) => (
                        <div
                          key={`inv-${index}`}
                          className="relative w-[75px] h-[75px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                            border: `2px solid ${item ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                          }}
                          draggable={!!item && ptTeam !== 'guard'}
                          onDragStart={(e) => { if (item) { e.dataTransfer.setData('text/plain', String(index)); } }}
                          onClick={() => {
                            if (item && ptTeam !== 'guard') {
                              playtestRef.current?.lockerDeposit(index);
                            }
                          }}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIdx = e.dataTransfer.getData('text/plain');
                            if (fromIdx.startsWith('locker:')) {
                              playtestRef.current?.lockerWithdraw(parseInt(fromIdx.split(':')[1], 10));
                            }
                          }}
                        >
                          {item ? (
                            <>
                              <span className="text-xl">{item.icon}</span>
                              <span className="text-[8px] text-gray-300 mt-0.5 text-center leading-tight max-w-[70px] truncate">{item.name}</span>
                              {item.quantity > 1 && (
                                <span className="absolute bottom-0.5 right-1 bg-black/80 text-white text-[8px] font-bold px-1 rounded-full">{item.quantity}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] text-gray-600">{'\u041f\u0443\u0441\u0442\u043e'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Locker slots (right side) */}
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{'\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u044b'} ({ptLockerState.slots.filter(s => s !== null).length}/30)</div>
                    <div className="grid grid-cols-6 gap-2">
                      {ptLockerState.slots.map((item, index) => (
                        <div
                          key={index}
                          className="relative w-[75px] h-[75px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                            border: `2px solid ${item ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                          }}
                          draggable={!!item}
                          onDragStart={(e) => { if (item) { e.dataTransfer.setData('text/plain', `locker:${index}`); } }}
                          onClick={() => {
                            if (item) {
                              playtestRef.current?.lockerWithdraw(index);
                            }
                          }}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIdx = e.dataTransfer.getData('text/plain');
                            if (fromIdx !== '' && !fromIdx.startsWith('locker:') && ptTeam !== 'guard') {
                              playtestRef.current?.lockerDeposit(parseInt(fromIdx, 10));
                            }
                          }}
                        >
                          {item ? (
                            <>
                              <span className="text-xl">{item.icon}</span>
                              <span className="text-[8px] text-gray-300 mt-0.5 text-center leading-tight max-w-[70px] truncate">{item.name}</span>
                              {item.quantity > 1 && (
                                <span className="absolute bottom-0.5 right-1 bg-black/80 text-white text-[8px] font-bold px-1 rounded-full">{item.quantity}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] text-gray-600">{'\u041f\u0443\u0441\u0442\u043e'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer hints */}
                <div className="p-3 border-t border-white/10 text-center text-gray-500 text-xs">
                  {'\u041b\u041a\u041c'} - {'\u0437\u0430\u0431\u0440\u0430\u0442\u044c'} | {'\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0438\u0437 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044f'} | Esc/E - {'\u0437\u0430\u043a\u0440\u044b\u0442\u044c'}
                </div>
              </div>
            </div>
          )}

          {/* Armory UI */}
          {ptArmoryOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto z-40"
              onClick={() => { playtestRef.current?.armoryClose(); setPtArmoryOpen(false); }}>
              <div
                className="w-[700px] max-w-[95vw] max-h-[85vh] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                style={{
                  animation: 'lockerFadeIn 0.2s ease',
                  background: 'rgba(15, 15, 25, 0.9)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{'\uD83D\uDD2B'}</span>
                    <div>
                      <div className="text-white font-bold">{'\u041e\u0440\u0443\u0436\u0435\u0439\u043d\u044b\u0439 \u0448\u043a\u0430\u0444'}</div>
                      <div className="text-gray-400 text-xs">{'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442'}</div>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    onClick={() => { playtestRef.current?.armoryClose(); setPtArmoryOpen(false); }}
                  >
                    &#x2715;
                  </button>
                </div>

                {/* Items grid */}
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'weapon_ak47', name: 'AK-47', icon: '\uD83D\uDD2B' },
                      { id: 'weapon_shotgun', name: 'SPAS-12', icon: '\uD83D\uDD2B' },
                      { id: 'weapon_pistol', name: 'Makarov PM', icon: '\uD83D\uDD2B' },
                      { id: 'weapon_taser', name: 'Taser', icon: '\u26A1' },
                      { id: 'item_baton', name: '\u0414\u0443\u0431\u0438\u043d\u043a\u0430', icon: '\uD83C\uDFCF' },
                      { id: 'item_shiv', name: '\u0417\u0430\u0442\u043e\u0447\u043a\u0430', icon: '\uD83D\uDDE1\uFE0F' },
                      { id: 'item_shield', name: '\u0429\u0438\u0442', icon: '\uD83D\uDEE1\uFE0F' },
                      { id: 'item_vest', name: '\u0411\u0440\u043e\u043d\u0435\u0436\u0438\u043b\u0435\u0442', icon: '\uD83E\uDDBA' },
                      { id: 'item_medkit', name: '\u0410\u043f\u0442\u0435\u0447\u043a\u0430', icon: '\uD83D\uDC8A' },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          background: 'linear-gradient(180deg, rgba(40,40,55,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                          border: '2px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{item.name}</div>
                        </div>
                        <button
                          className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          onClick={() => { playtestRef.current?.armoryTakeItem(item.id); }}
                        >
                          {'\u0412\u0437\u044f\u0442\u044c'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer hints */}
                <div className="p-3 border-t border-white/10 text-center text-gray-500 text-xs">
                  Esc/E - {'\u0437\u0430\u043a\u0440\u044b\u0442\u044c'}
                </div>
              </div>
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
                          addEventLog(`Игрок арендовал ${ptRentalMenu.cellLabel}`, 'Игрок');
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
