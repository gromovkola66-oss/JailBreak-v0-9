import { useState } from 'react';
import * as THREE from 'three';
import { CombatState } from '../game/Combat';
import { Team } from '../game/TeamSystem';
import { DoorInteractionState } from '../game/Game';
import { CameraSystemState } from '../game/CameraSystem';
import { InventoryState } from '../game/InventorySystem';

interface GameUIProps {
  fps: number;
  position: THREE.Vector3 | null;
  isLocked: boolean;
  combatState: CombatState | null;
  team: Team;
  teamName: string;
  doorState: DoorInteractionState | null;
  isWarden: boolean;
  guardMenuOpen: boolean;
  cameraState: CameraSystemState | null;
  onSelectCamera?: (index: number | null) => void;
  onOpenTerminalApp?: (app: 'cameras' | 'doors') => void;
  onBackToTerminalDesktop?: () => void;
  garageDoorLockState?: { state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null };
  onLockGarageDoors?: () => void;
  onUnlockGarageDoors?: () => void;
  onTempLockGarageDoors?: (minutes: number) => void;
  inventoryState?: InventoryState | null;
  onInventorySelect?: (index: number) => void;
  onInventoryHover?: (index: number | null) => void;
}

export const GameUI = ({ fps, position, isLocked, combatState, team, teamName, doorState, isWarden: _isWarden, guardMenuOpen, cameraState, onSelectCamera, onOpenTerminalApp, onBackToTerminalDesktop, garageDoorLockState, onLockGarageDoors, onUnlockGarageDoors, onTempLockGarageDoors, inventoryState, onInventorySelect, onInventoryHover }: GameUIProps) => {
  const [showTempLockOptions, setShowTempLockOptions] = useState(false);
  
  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      {/* Прицел */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-1 h-1 bg-white rounded-full opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6">
            <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-white/50 -translate-x-1/2"></div>
            <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-white/50 -translate-x-1/2"></div>
            <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-white/50 -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-white/50 -translate-y-1/2"></div>
          </div>
        </div>
      )}

      {/* Статистика (FPS/позиция) */}
      <div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg font-mono text-sm">
        <div className="text-green-400">FPS: {fps}</div>
        {position && (
          <div className="text-gray-300 mt-1">
            X: {position.x.toFixed(1)} Y: {position.y.toFixed(1)} Z: {position.z.toFixed(1)}
          </div>
        )}
      </div>

      {/* Меню паузы / Инструкции */}
      {!isLocked && !inventoryState?.isOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 text-red-500">
              JAILBREAK
            </h1>
            <p className="text-xl mb-2 text-gray-300">Версия 0.8</p>
            <p className={`text-lg mb-8 ${team === 'guard' ? 'text-blue-400' : 'text-orange-400'}`}>
              {teamName}
            </p>
            
            <div className="bg-gray-800/80 p-6 rounded-xl max-w-md">
              <p className="text-lg mb-4">Кликните, чтобы продолжить</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm text-left">
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">WASD</span>
                  <span className="text-gray-400 ml-2">Движение</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">Мышь</span>
                  <span className="text-gray-400 ml-2">Обзор</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">SPACE</span>
                  <span className="text-gray-400 ml-2">Прыжок</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">ЛКМ</span>
                  <span className="text-gray-400 ml-2">Атака/Стрельба</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">E</span>
                  <span className="text-gray-400 ml-2">Подобрать оружие</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">G</span>
                  <span className="text-gray-400 ml-2">Выбросить оружие</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">R</span>
                  <span className="text-gray-400 ml-2">Перезарядка</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <span className="text-yellow-400 font-bold">ESC</span>
                  <span className="text-gray-400 ml-2">Пауза</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-gray-500 text-sm">
              {team === 'guard' ? (
                <p>Вы охранник. Контролируйте заключённых.</p>
              ) : (
                <p>Вы заключённый. Выживайте или бунтуйте.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HP бар и роль */}
      {isLocked && combatState && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          {/* Роль */}
          <div className={`flex items-center px-3 py-1 rounded-lg ${
            team === 'guard' ? 'bg-blue-600/80' : 'bg-orange-600/80'
          }`}>
            <span className="text-white font-bold text-sm">{teamName}</span>
          </div>
          
          {/* Здоровье */}
          <div className="flex items-center gap-3 bg-black/60 p-3 rounded-lg">
            <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                style={{ width: `${(combatState.hp / combatState.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-white font-bold min-w-[60px]">
              {combatState.hp}/{combatState.maxHp}
            </span>
          </div>
        </div>
      )}

      {/* Подсказка M для охраны */}
      {isLocked && team === 'guard' && !guardMenuOpen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-900/60 text-blue-200 px-4 py-1 rounded-lg text-sm">
            Нажмите <span className="text-yellow-400 font-bold">M</span> — Меню охраны
          </div>
        </div>
      )}

      {/* Оружие и патроны */}
      {isLocked && combatState && (
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
          {combatState.hasWeapon ? (
            <div className="bg-black/60 p-3 rounded-lg flex items-center gap-4">
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-lg">AK-47</div>
                <div className="text-gray-400 text-sm">Автомат</div>
              </div>
              <div className="text-white">
                <span className="text-3xl font-bold">{combatState.ammo}</span>
                <span className="text-gray-400 text-lg">/{combatState.maxAmmo}</span>
              </div>
            </div>
          ) : (
            <div className="bg-black/60 p-3 rounded-lg flex items-center gap-4">
              <div className="text-right">
                <div className="text-gray-400 font-bold text-lg">Кулаки</div>
                <div className="text-gray-500 text-sm">Урон: 20</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Подсказка для подбора оружия (только для зеков) */}
      {isLocked && combatState && !combatState.hasWeapon && team === 'prisoner' && !doorState?.canInteract && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
            Найдите оружие в оружейной и нажмите <span className="text-yellow-400 font-bold">E</span> для подбора
          </div>
        </div>
      )}

      {/* Подсказка для взаимодействия с дверью */}
      {isLocked && doorState?.canInteract && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          {doorState.isGuard ? (
            <div className="bg-blue-900/80 text-white px-6 py-3 rounded-lg">
              <div className="font-bold">
                Камера #{(doorState.door?.cellIndex ?? 0) + 1}
              </div>
              <div className="text-sm text-blue-200">
                Нажмите <span className="text-yellow-400 font-bold">E</span> чтобы {doorState.door?.isOpen ? 'закрыть' : 'открыть'}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/80 text-white px-6 py-3 rounded-lg">
              <div className="font-bold">Дверь заперта</div>
              <div className="text-sm text-red-200">Только охрана может открыть</div>
            </div>
          )}
        </div>
      )}

      {/* Миникарта */}
      {isLocked && position && (
        <div className="absolute top-4 right-4 w-40 h-40 bg-black/70 rounded-lg border border-gray-600 p-2">
          <div className="relative w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Коридор */}
              <rect x="40" y="10" width="20" height="80" fill="#555" />
              
              {/* Камеры */}
              <rect x="10" y="20" width="30" height="50" fill="#444" />
              
              {/* Оружейная */}
              <rect x="60" y="35" width="25" height="25" fill="#654" />
              
              {/* Двор */}
              <rect x="20" y="0" width="40" height="15" fill="#666" stroke="#777" strokeWidth="1" />
              
              {/* Игрок */}
              <circle 
                cx={Math.max(5, Math.min(95, 50 + position.x * 1.5))} 
                cy={Math.max(5, Math.min(95, 50 - position.z * 1.5))} 
                r="3" 
                fill={team === 'guard' ? '#3b82f6' : '#f97316'} 
              />
            </svg>
            
            <div className="absolute bottom-0 left-0 text-[8px] text-gray-400">
              МИНИКАРТА
            </div>
          </div>
        </div>
      )}

      {/* Роль игрока - теперь внизу слева над HP */}

      {/* Terminal highlight hint */}
      {isLocked && cameraState?.terminalHighlighted && !cameraState.inTerminalMode && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-cyan-900/80 text-white px-6 py-3 rounded-lg">
            <div className="font-bold">Терминал камер</div>
            <div className="text-sm text-cyan-200">
              Нажмите <span className="text-yellow-400 font-bold">E</span> для просмотра камер
            </div>
          </div>
        </div>
      )}

      {/* Terminal mode overlay */}
      {cameraState?.inTerminalMode && (
        <div className="absolute inset-0 pointer-events-auto cursor-default">
          {/* Desktop view */}
          {cameraState.terminalView === 'desktop' && (
            <div className="absolute inset-0 bg-[#008080] flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
              {/* JailBreak watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none" style={{ animation: 'gentleSpin 4s ease-in-out infinite' }}>
                <span className="text-7xl font-black text-blue-400">Jail</span>
                <span className="text-7xl font-black text-orange-400">Break</span>
              </div>
              {/* Desktop icons */}
              <div className="flex-1 p-4 flex flex-col gap-4 z-10">
                <div
                  className="w-32 flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-white/20"
                  onClick={() => onOpenTerminalApp?.('cameras')}
                >
                  <span className="text-6xl">{'\u{1F4F9}'}</span>
                  <span className="text-white text-sm font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Камеры</span>
                </div>
                <div
                  className="w-32 flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-white/20"
                  onClick={() => onOpenTerminalApp?.('doors')}
                >
                  <span className="text-6xl">{'\u{1F6AA}'}</span>
                  <span className="text-white text-sm font-bold text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Двери</span>
                </div>
              </div>
              {/* Taskbar */}
              <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2">
                <button className="h-[22px] px-2 flex items-center gap-1 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white">
                  <span className="w-3 h-3 bg-green-600 inline-block"></span>
                  <span className="font-bold text-xs">{'\u041F\u0443\u0441\u043A'}</span>
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

          {/* Cameras view */}
          {cameraState.terminalView === 'cameras' && (
            <div className="absolute inset-0 bg-[#008080] flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
              <div className="flex-1 flex items-center justify-center">
                {/* Grid view */}
                {cameraState.selectedCameraIndex === null && (
                  <div className="w-[900px] max-w-[90vw] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                    {/* Title bar */}
                    <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                      <span className="text-xs">{'\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u043D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u044F'}</span>
                      <button
                        className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                        onClick={() => onBackToTerminalDesktop?.()}
                      >
                        X
                      </button>
                    </div>
                    {/* Window body */}
                    <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1">
                      {cameraState.cameras.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">{'\u041D\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D\u043D\u044B\u0445 \u043A\u0430\u043C\u0435\u0440'}</div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                          {cameraState.cameras.map((cam, idx) => (
                            <div
                              key={cam.id}
                              className="border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#c0c0c0] p-3 cursor-pointer hover:bg-[#d4d4d4] transition-colors"
                              onClick={() => onSelectCamera?.(idx)}
                            >
                              <div className="text-xs font-bold mb-1">CAM {idx + 1}</div>
                              <div className="text-xs mb-2">{cam.label}</div>
                              <div className="h-20 bg-black border border-gray-600 flex items-center justify-center overflow-hidden">
                                {cameraState.screenshots && cameraState.screenshots[idx] ? (
                                  <img src={cameraState.screenshots[idx]} alt={`Camera ${idx + 1}`} className="w-full h-full object-cover" />
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
                )}

                {/* Zoomed camera view */}
                {cameraState.selectedCameraIndex !== null && (
                  <div className="absolute inset-0 flex flex-col">
                    <div className="bg-[#c0c0c0] border-b-2 border-gray-700 px-4 py-1 flex items-center justify-between">
                      <div className="text-xs font-bold">
                        CAM {cameraState.selectedCameraIndex + 1} - {cameraState.cameras[cameraState.selectedCameraIndex]?.label}
                      </div>
                      <div className="text-red-600 text-xs font-bold animate-pulse">REC</div>
                    </div>
                    <div className="flex-1 relative pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/[0.02] to-transparent bg-[length:100%_4px] animate-pulse"></div>
                    </div>
                    <div className="bg-[#c0c0c0] border-t-2 border-white px-4 py-1 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="text-xs cursor-pointer hover:underline"
                          onClick={() => onSelectCamera?.(null)}
                        >
                          {'\u2190'} Назад к сетке
                        </div>
                        <div
                          className="text-xs cursor-pointer hover:underline"
                          onClick={() => onBackToTerminalDesktop?.()}
                        >
                          {'\u2190'} Рабочий стол
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-yellow-700 font-bold">E</span> - Выйти
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Taskbar */}
              <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2">
                <button className="h-[22px] px-2 flex items-center gap-1 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white">
                  <span className="w-3 h-3 bg-green-600 inline-block"></span>
                  <span className="font-bold text-xs">{'\u041F\u0443\u0441\u043A'}</span>
                </button>
                <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0] text-xs font-bold">
                  {'\u{1F4F9}'} Камеры
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

          {/* Doors view */}
          {cameraState.terminalView === 'doors' && (
            <div className="absolute inset-0 bg-[#008080] flex flex-col font-['Tahoma',_sans-serif] text-sm select-none">
              {/* Centered Win95 window */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-[450px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
                  {/* Title bar */}
                  <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
                    <span className="text-xs">{'\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u0432\u0435\u0440\u044F\u043C\u0438'}</span>
                    <button
                      className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                      onClick={() => onBackToTerminalDesktop?.()}
                    >
                      X
                    </button>
                  </div>
                  {/* Window body */}
                  <div className="p-4 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white m-1">
                    {/* Status indicator */}
                    <div className="mb-4 p-3 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white">
                      {garageDoorLockState?.state === 'unlocked' && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="font-bold text-green-700">{'\u0414\u0432\u0435\u0440\u0438 \u0440\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B'}</span>
                        </div>
                      )}
                      {garageDoorLockState?.state === 'locked' && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="font-bold text-red-700">{'\u0414\u0432\u0435\u0440\u0438 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B'}</span>
                        </div>
                      )}
                      {garageDoorLockState?.state === 'temp_locked' && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <div>
                            <span className="font-bold text-amber-700">{'\u0414\u0432\u0435\u0440\u0438 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E'}</span>
                            {garageDoorLockState.remainingSeconds !== null && (
                              <div className="text-xs text-amber-600 mt-0.5">
                                Осталось: {Math.floor(garageDoorLockState.remainingSeconds / 60)}:{String(garageDoorLockState.remainingSeconds % 60).padStart(2, '0')}
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
                          garageDoorLockState?.state === 'locked'
                            ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                            : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                        }`}
                        onClick={() => { onLockGarageDoors?.(); setShowTempLockOptions(false); }}
                      >
                        {'\u{1F512}'} Заблокировать двери
                      </button>
                      <button
                        className={`border-2 px-4 py-2 text-left font-bold ${
                          garageDoorLockState?.state === 'unlocked'
                            ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                            : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                        }`}
                        onClick={() => { onUnlockGarageDoors?.(); setShowTempLockOptions(false); }}
                      >
                        {'\u{1F513}'} Разблокировать двери
                      </button>
                      <button
                        className={`border-2 px-4 py-2 text-left font-bold ${
                          garageDoorLockState?.state === 'temp_locked'
                            ? 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0]'
                            : 'border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white'
                        }`}
                        onClick={() => setShowTempLockOptions(prev => !prev)}
                      >
                        {'\u23F1\uFE0F'} Временно заблокировать
                      </button>
                      {(showTempLockOptions || garageDoorLockState?.state === 'temp_locked') && (
                        <div className="flex gap-2 ml-6 mt-1">
                          <button
                            className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                            onClick={() => onTempLockGarageDoors?.(5)}
                          >
                            5 мин
                          </button>
                          <button
                            className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                            onClick={() => onTempLockGarageDoors?.(10)}
                          >
                            10 мин
                          </button>
                          <button
                            className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] px-3 py-1 text-xs font-bold hover:bg-[#d4d4d4] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                            onClick={() => onTempLockGarageDoors?.(15)}
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
              <div className="h-[30px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 gap-2">
                <button className="h-[22px] px-2 flex items-center gap-1 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white">
                  <span className="w-3 h-3 bg-green-600 inline-block"></span>
                  <span className="font-bold text-xs">{'\u041F\u0443\u0441\u043A'}</span>
                </button>
                <div className="h-[22px] px-2 flex items-center border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#a0a0a0] text-xs font-bold">
                  {'\u{1F6AA}'} Двери
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
        </div>
      )}

      {/* Inventory Wheel */}
      {inventoryState?.isOpen && (
        <div className="fixed inset-0 bg-black/60 pointer-events-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[420px] h-[420px] rounded-full border-2 border-white/20 relative bg-gradient-radial from-gray-900/80 to-transparent">
              {/* Rotating dashed ring decoration */}
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[430px] h-[430px] pointer-events-none" style={{ animation: 'ringRotate 20s linear infinite' }}>
                <circle cx="215" cy="215" r="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="10 5" />
              </svg>
              {inventoryState.slots.map((item, index) => {
                const angle = (index * Math.PI * 2) / 6 - Math.PI / 2;
                const isHighlighted = inventoryState.hoveredSlot === index || inventoryState.equippedSlot === index;
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
                    onClick={() => onInventorySelect?.(index)}
                    onMouseEnter={() => onInventoryHover?.(index)}
                    onMouseLeave={() => onInventoryHover?.(null)}
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
              {/* Center text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-white font-bold text-lg">
                  {inventoryState.slots[inventoryState.equippedSlot]?.name || 'Пусто'}
                </div>
                {inventoryState.slots[inventoryState.hoveredSlot ?? -1] && (
                  <div className="text-gray-400 text-sm mt-1">
                    {inventoryState.slots[inventoryState.hoveredSlot!]?.name}
                  </div>
                )}
              </div>
            </div>
            {/* Bottom hint */}
            <div className="text-center mt-4 text-gray-400 text-sm">
              Q - Закрыть
            </div>
          </div>
        </div>
      )}

      {/* Экран смерти */}
      {isLocked && combatState?.isDead && (
        <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-white mb-4">ВЫ ПОГИБЛИ</h2>
            <p className="text-xl text-gray-300">Ожидание следующего раунда...</p>
          </div>
        </div>
      )}
    </div>
  );
};
