import { useState, useEffect, useCallback, useRef } from 'react';

interface MineCell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type GameState = 'playing' | 'won' | 'lost';

interface MinesweeperProps {
  onClose: () => void;
  onWin: () => void;
  onLose: () => void;
}

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000ff',
  2: '#008000',
  3: '#ff0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
};

function initGrid(): MineCell[][] {
  const grid: MineCell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: MineCell[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push({ isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 });
    }
    grid.push(row);
  }
  return grid;
}

function placeMines(grid: MineCell[][], excludeRow: number, excludeCol: number): MineCell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (r === excludeRow && c === excludeCol) continue;
    if (newGrid[r][c].isMine) continue;
    newGrid[r][c].isMine = true;
    placed++;
  }
  // Compute adjacent mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newGrid[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
            count++;
          }
        }
      }
      newGrid[r][c].adjacentMines = count;
    }
  }
  return newGrid;
}

function revealCell(grid: MineCell[][], row: number, col: number): MineCell[][] {
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) continue;
    newGrid[r][c].isRevealed = true;
    if (newGrid[r][c].adjacentMines === 0 && !newGrid[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }
  return newGrid;
}

function revealAllMines(grid: MineCell[][]): MineCell[][] {
  return grid.map(row => row.map(cell => cell.isMine ? { ...cell, isRevealed: true } : { ...cell }));
}

function checkWin(grid: MineCell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].isMine && !grid[r][c].isRevealed) return false;
    }
  }
  return true;
}

export const Minesweeper = ({ onClose, onWin, onLose }: MinesweeperProps) => {
  const [grid, setGrid] = useState<MineCell[][]>(initGrid);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || firstClick) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer(prev => Math.min(prev + 1, 999));
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, firstClick]);

  const resetGame = useCallback(() => {
    setGrid(initGrid());
    setGameState('playing');
    setFlagCount(0);
    setTimer(0);
    setFirstClick(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;
    const cell = grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    let currentGrid = grid;
    if (firstClick) {
      currentGrid = placeMines(currentGrid, row, col);
      setFirstClick(false);
    }

    if (currentGrid[row][col].isMine) {
      const revealed = revealAllMines(currentGrid);
      setGrid(revealed);
      setGameState('lost');
      onLose();
      return;
    }

    const newGrid = revealCell(currentGrid, row, col);
    setGrid(newGrid);
    if (checkWin(newGrid)) {
      setGameState('won');
      onWin();
    }
  }, [grid, gameState, firstClick, onWin, onLose]);

  const handleCellRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const cell = grid[row][col];
    if (cell.isRevealed) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    setGrid(newGrid);
    setFlagCount(prev => newGrid[row][col].isFlagged ? prev + 1 : prev - 1);
  }, [grid, gameState]);

  const getSmiley = () => {
    if (gameState === 'lost') return '\u{1F635}';
    if (gameState === 'won') return '\u{1F60E}';
    return '\u{1F600}';
  };

  const formatNumber = (n: number): string => {
    return String(Math.max(0, n)).padStart(3, '0');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
      <div className="border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] shadow-lg">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-2 py-1 flex items-center justify-between">
          <span className="text-xs">{'\u{1F4A3}'} {'\u0421\u0430\u043F\u0451\u0440'}</span>
          <button
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-xs flex items-center justify-center leading-none font-bold"
            onClick={onClose}
          >X</button>
        </div>

        {/* Content area */}
        <div className="p-2">
          {/* Header with counter, smiley, timer */}
          <div className="flex items-center justify-between border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#c0c0c0] p-1 mb-2">
            {/* Mine counter */}
            <div className="bg-black text-red-500 font-mono font-bold text-sm px-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white min-w-[40px] text-center">
              {formatNumber(MINE_COUNT - flagCount)}
            </div>
            {/* Smiley reset button */}
            <button
              className="w-7 h-7 border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] flex items-center justify-center text-base leading-none active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
              onClick={resetGame}
            >
              {getSmiley()}
            </button>
            {/* Timer */}
            <div className="bg-black text-red-500 font-mono font-bold text-sm px-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white min-w-[40px] text-center">
              {formatNumber(timer)}
            </div>
          </div>

          {/* Grid */}
          <div className="border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white inline-block">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => {
                  const isRevealed = cell.isRevealed;
                  const cellClasses = isRevealed
                    ? 'border border-gray-400 bg-[#c0c0c0]'
                    : 'border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#c0c0c0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white';

                  let content = '';
                  let textColor = '';

                  if (cell.isFlagged && !isRevealed) {
                    content = '\u{1F6A9}';
                  } else if (isRevealed && cell.isMine) {
                    content = '\u{1F4A3}';
                  } else if (isRevealed && cell.adjacentMines > 0) {
                    content = String(cell.adjacentMines);
                    textColor = NUMBER_COLORS[cell.adjacentMines] || '#000';
                  }

                  return (
                    <div
                      key={c}
                      className={`w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer select-none ${cellClasses}`}
                      style={{ fontSize: '11px', color: textColor || undefined }}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleCellRightClick(e, r, c)}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
