import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Game, DoorInteractionState } from './game/Game';
import { GameUI } from './components/GameUI';
import { TeamSelect } from './components/TeamSelect';
import { RoundUI } from './components/RoundUI';
import { GuardMenu } from './components/GuardMenu';
import { MainMenu } from './components/MainMenu';
import { CombatState } from './game/Combat';
import { Team } from './game/TeamSystem';
import { RoundState } from './game/RoundSystem';
import { CameraSystemState } from './game/CameraSystem';
import { InventoryState } from './game/InventorySystem';
import { soundSystem } from './game/SoundSystem';
import { EditorApp } from './EditorApp';

type AppMode = 'menu' | 'game' | 'editor';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('menu');

  if (appMode === 'editor') {
    return <EditorApp onBackToGame={() => setAppMode('menu')} />;
  }

  if (appMode === 'menu') {
    return <MainMenu onStartGame={() => setAppMode('game')} onOpenEditor={() => setAppMode('editor')} />;
  }

  return <GameApp onBackToMenu={() => setAppMode('menu')} />;
}

// === ИГРА ===
interface GameAppProps {
  onBackToMenu: () => void;
}

const GameApp = ({ onBackToMenu }: GameAppProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  
  const [fps, setFps] = useState(0);
  const [position, setPosition] = useState<THREE.Vector3 | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [doorState, setDoorState] = useState<DoorInteractionState | null>(null);
  const [cameraState, setCameraState] = useState<CameraSystemState | null>(null);
  const [inventoryState, setInventoryState] = useState<InventoryState | null>(null);
  
  const [teamSelected, setTeamSelected] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team>('none');
  const [teamName, setTeamName] = useState('');
  
  const [guardMenuOpen, setGuardMenuOpen] = useState(false);
  const [isWarden, setIsWarden] = useState(false);
  const [wardenTaken, setWardenTaken] = useState(false);
  const [cellsOpen, setCellsOpen] = useState(false);
  
  const [guardCount, setGuardCount] = useState(1);
  const [prisonerCount, setPrisonerCount] = useState(4);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyM' && currentTeam === 'guard') {
      setGuardMenuOpen(prev => !prev);
    }
    if (e.code === 'Escape' && !teamSelected) {
      onBackToMenu();
    }
  }, [currentTeam, teamSelected, onBackToMenu]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (roundState?.phase === 'starting') {
      setIsWarden(false);
      setWardenTaken(false);
      setCellsOpen(false);
    }
  }, [roundState?.phase]);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Game(containerRef.current);
    gameRef.current = game;

    // Отключаем захват курсора пока не выбрана команда
    game.setPointerLockEnabled(false);

    game.setOnStatsUpdate((newFps, newPos) => {
      setFps(newFps);
      setPosition(newPos.clone());
    });

    game.setOnCombatUpdate((state) => {
      setCombatState({ ...state });
    });

    game.setOnRoundUpdate((state) => {
      setRoundState({ ...state });
    });

    game.setOnDoorInteraction((state) => {
      setDoorState(state);
    });

    game.setOnCameraSystemUpdate((state) => {
      setCameraState(state);
    });

    game.setOnInventoryUpdate((state) => {
      setInventoryState({ ...state });
    });

    const handlePointerLockChange = () => {
      setIsLocked(document.pointerLockElement !== null);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    game.start();

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      game.dispose();
      // Clear container in case dispose didn't remove canvas
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleSelectTeam = (team: 'guard' | 'prisoner') => {
    if (!gameRef.current) return;
    
    // Включаем захват курсора после выбора команды
    gameRef.current.setPointerLockEnabled(true);
    
    soundSystem.playClick();
    
    if (team === 'guard') {
      setGuardCount(prev => prev + 1);
    } else {
      setPrisonerCount(prev => prev + 1);
    }
    
    gameRef.current.teamSystem.selectTeam(team);
    setTeamSelected(true);
    setCurrentTeam(team);
    setTeamName(gameRef.current.getTeamName());

    const guards = team === 'guard' ? guardCount + 1 : guardCount;
    const prisoners = team === 'prisoner' ? prisonerCount + 1 : prisonerCount;
    gameRef.current.startRounds(guards, prisoners);
  };

  const handleBecomeWarden = () => {
    if (wardenTaken) return;
    setIsWarden(true);
    setWardenTaken(true);
    setTeamName('Начальник охраны');
  };

  const handleToggleCells = () => {
    if (!gameRef.current) return;
    if (cellsOpen) {
      gameRef.current.closeAllDoors();
      soundSystem.playDoor(false);
    } else {
      gameRef.current.openAllDoors();
      soundSystem.playDoor(true);
    }
    setCellsOpen(!cellsOpen);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {!teamSelected && (
        <TeamSelect 
          onSelectTeam={handleSelectTeam}
          guardCount={guardCount}
          prisonerCount={prisonerCount}
        />
      )}
      
      {teamSelected && (
        <RoundUI roundState={roundState} />
      )}
      
      {teamSelected && currentTeam === 'guard' && (
        <GuardMenu
          isOpen={guardMenuOpen}
          isWarden={isWarden}
          wardenTaken={wardenTaken}
          cellsOpen={cellsOpen}
          onBecomeWarden={handleBecomeWarden}
          onToggleCells={handleToggleCells}
        />
      )}
      
      {teamSelected && (
        <GameUI 
          fps={fps} 
          position={position} 
          isLocked={isLocked} 
          combatState={combatState}
          team={currentTeam}
          teamName={teamName}
          doorState={doorState}
          isWarden={isWarden}
          guardMenuOpen={guardMenuOpen}
          cameraState={cameraState}
          onSelectCamera={(index) => gameRef.current?.selectSecurityCamera(index)}
          inventoryState={inventoryState}
          onInventorySelect={(idx) => gameRef.current?.inventoryEquipSlot(idx)}
          onInventoryHover={(idx) => gameRef.current?.inventorySetHovered(idx)}
        />
      )}
    </div>
  );
};

export default App;
