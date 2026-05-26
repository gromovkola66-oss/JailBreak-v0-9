import { useState, useRef, useCallback, useEffect } from 'react';

interface PaintThemeConfig {
  windowBg: string;
  titleBarStyle: string;
  titleBarBg?: string;
  textColor: string;
  borders: string;
  buttonBorders: string;
  font: string;
  windowContentBorders: string;
  contentBg: string;
}

interface PaintProps {
  onClose: () => void;
  onMinimize?: () => void;
  onTitleBarMouseDown?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  onSaveAsWallpaper: (dataUrl: string) => void;
  themeConfig?: PaintThemeConfig;
}

type PaintTool = 'brush' | 'eraser';
type BrushSize = 'small' | 'medium' | 'large';

const BRUSH_SIZES: Record<BrushSize, number> = {
  small: 2,
  medium: 6,
  large: 12,
};

const COLOR_PALETTE = [
  '#000000', // black
  '#ffffff', // white
  '#ff0000', // red
  '#0000ff', // blue
  '#008000', // green
  '#ffff00', // yellow
  '#ff8c00', // orange
  '#800080', // purple
  '#8b4513', // brown
  '#ff69b4', // pink
];

// Default Win95 theme config for backwards compatibility
const DEFAULT_THEME: PaintThemeConfig = {
  windowBg: '#c0c0c0',
  titleBarStyle: 'bg-gradient-to-r from-[#000080] to-[#1084d0]',
  textColor: 'black',
  borders: 'border-t-white border-l-white border-b-gray-700 border-r-gray-700',
  buttonBorders: 'border-t-white border-l-white border-b-gray-700 border-r-gray-700',
  font: "'Tahoma', sans-serif",
  windowContentBorders: 'border-t-gray-700 border-l-gray-700 border-b-white border-r-white',
  contentBg: 'white',
};

export const Paint = ({ onClose, onMinimize, onTitleBarMouseDown, style, onSaveAsWallpaper, themeConfig }: PaintProps) => {
  const th = themeConfig || DEFAULT_THEME;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<PaintTool>('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH_SIZES[brushSize];
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
  }, [getCanvasCoords, brushSize, tool, color]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleSaveWallpaper = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    onSaveAsWallpaper(dataUrl);
  }, [onSaveAsWallpaper]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()} style={style}>
      <div className={`border-2 ${th.borders} shadow-lg`} style={{ backgroundColor: th.windowBg, fontFamily: th.font, color: th.textColor }}>
        {/* Title bar */}
        <div className={`${th.titleBarStyle} text-white font-bold px-2 py-1 flex items-center justify-between cursor-move`} style={th.titleBarBg ? { backgroundColor: th.titleBarBg } : undefined} onMouseDown={onTitleBarMouseDown}>
          <span className="text-xs">{'\u{1F3A8}'} {'\u0420\u0438\u0441\u043E\u0432\u0430\u043B\u043A\u0430'}</span>
          <div className="flex gap-0.5">
            {onMinimize && (
              <button
                className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg, color: th.textColor }}
                onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              >_</button>
            )}
            <button
              className={`w-4 h-4 border text-xs flex items-center justify-center leading-none font-bold ${th.buttonBorders}`}
              style={{ backgroundColor: th.windowBg, color: th.textColor }}
              onClick={onClose}
            >X</button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-2">
          {/* Canvas */}
          <div className={`border-2 ${th.windowContentBorders} mb-2`}>
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="block cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-1.5">
            {/* Tools row */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold mr-1">{'\u0418\u043D\u0441\u0442\u0440.:'}</span>
              <button
                className={`w-7 h-7 border-2 flex items-center justify-center text-sm ${tool === 'brush' ? th.windowContentBorders : th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg }}
                onClick={() => setTool('brush')}
                title="Кисть"
              >{'\u{270F}\u{FE0F}'}</button>
              <button
                className={`w-7 h-7 border-2 flex items-center justify-center text-sm ${tool === 'eraser' ? th.windowContentBorders : th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg }}
                onClick={() => setTool('eraser')}
                title="Ластик"
              >{'\u{1F9F9}'}</button>

              {/* Brush sizes */}
              <span className="text-[10px] font-bold ml-2 mr-1">{'\u0420\u0430\u0437\u043C\u0435\u0440:'}</span>
              <button
                className={`w-6 h-6 border-2 flex items-center justify-center ${brushSize === 'small' ? th.windowContentBorders : th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg }}
                onClick={() => setBrushSize('small')}
              >
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: th.textColor }}></div>
              </button>
              <button
                className={`w-6 h-6 border-2 flex items-center justify-center ${brushSize === 'medium' ? th.windowContentBorders : th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg }}
                onClick={() => setBrushSize('medium')}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: th.textColor }}></div>
              </button>
              <button
                className={`w-6 h-6 border-2 flex items-center justify-center ${brushSize === 'large' ? th.windowContentBorders : th.buttonBorders}`}
                style={{ backgroundColor: th.windowBg }}
                onClick={() => setBrushSize('large')}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: th.textColor }}></div>
              </button>
            </div>

            {/* Color palette row */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold mr-1">{'\u0426\u0432\u0435\u0442:'}</span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 border-2 ${color === c && tool === 'brush' ? th.windowContentBorders : th.buttonBorders}`}
                  style={{ backgroundColor: c }}
                  onClick={() => { setColor(c); setTool('brush'); }}
                  title={c}
                />
              ))}
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 mt-1">
              <button
                className={`px-2 py-0.5 border-2 ${th.buttonBorders} text-[10px] font-bold`}
                style={{ backgroundColor: th.windowBg, color: th.textColor }}
                onClick={handleClear}
              >{'\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C'}</button>
              <button
                className={`px-2 py-0.5 border-2 ${th.buttonBorders} text-[10px] font-bold`}
                style={{ backgroundColor: th.windowBg, color: th.textColor }}
                onClick={handleSaveWallpaper}
              >{'\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043A\u0430\u043A \u043E\u0431\u043E\u0438'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
