import { useRef, useCallback } from 'react';
import { AnimationTrack } from '../editor/AnimationSystem';

export interface TimelineBarProps {
  tracks: AnimationTrack[];
  currentTime: number;
  duration: number;
  playing: boolean;
  selectedObjectId: string | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onScrub: (time: number) => void;
  onAddKeyframe: () => void;
  onRemoveKeyframe: (objectId: string, keyframeIndex: number) => void;
}

export const TimelineBar = (props: TimelineBarProps) => {
  const {
    tracks, currentTime, duration, playing, selectedObjectId,
    onPlay, onPause, onStop, onScrub, onAddKeyframe, onRemoveKeyframe,
  } = props;

  const rulerRef = useRef<HTMLDivElement>(null);

  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const rect = ruler.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = ratio * Math.max(duration, 5);
    onScrub(Math.max(0, time));
  }, [duration, onScrub]);

  const effectiveDuration = Math.max(duration, 5);
  const tickCount = Math.ceil(effectiveDuration);
  const playheadPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-64 right-0 glass-panel rounded-none pointer-events-auto z-30 border-t border-white/10">
      {/* Controls row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
        <button onClick={playing ? onPause : onPlay}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition">
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={onStop}
          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition">
          ⏹
        </button>
        <div className="h-4 w-px bg-white/10" />
        <button onClick={onAddKeyframe} disabled={!selectedObjectId}
          className={`px-3 py-1 rounded text-xs font-bold transition ${selectedObjectId ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
          + Ключ
        </button>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-gray-400 text-xs font-mono">
          {currentTime.toFixed(1)}s / {effectiveDuration.toFixed(1)}s
        </span>
        <div className="flex-1" />
        <span className="text-gray-500 text-[10px]">Треков: {tracks.length}</span>
      </div>

      {/* Timeline ruler + tracks */}
      <div className="relative">
        {/* Ruler */}
        <div ref={rulerRef} onClick={handleRulerClick}
          className="relative h-6 bg-black/30 cursor-pointer select-none border-b border-white/5">
          {/* Tick marks */}
          {Array.from({ length: tickCount + 1 }, (_, i) => {
            const pct = (i / effectiveDuration) * 100;
            return (
              <div key={i} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${pct}%` }}>
                <div className="w-px h-3 bg-white/20" />
                <span className="text-[8px] text-gray-500 mt-0.5">{i}s</span>
              </div>
            );
          })}
          {/* Playhead */}
          <div className="absolute top-0 h-full w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${playheadPercent}%` }}>
            <div className="absolute -top-0.5 -left-1.5 w-3.5 h-2 bg-red-500 rounded-sm" />
          </div>
        </div>

        {/* Track rows */}
        <div className="max-h-24 overflow-y-auto">
          {tracks.length === 0 && (
            <div className="py-2 text-center text-gray-600 text-[10px]">Нет анимационных треков</div>
          )}
          {tracks.map(track => (
            <div key={track.objectId} className="flex items-center h-7 border-b border-white/5">
              <div className="w-28 px-2 text-[10px] text-gray-400 truncate border-r border-white/5">
                {track.objectId.slice(0, 12)}
              </div>
              <div className="flex-1 relative h-full">
                {/* Keyframe dots */}
                {track.keyframes.map((kf, idx) => {
                  const pct = effectiveDuration > 0 ? (kf.time / effectiveDuration) * 100 : 0;
                  return (
                    <div key={idx}
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-sm rotate-45 cursor-pointer hover:bg-yellow-300 transition"
                      style={{ left: `${pct}%`, marginLeft: '-6px' }}
                      title={`${kf.time.toFixed(1)}s`}
                      onClick={(e) => { e.stopPropagation(); onRemoveKeyframe(track.objectId, idx); }}
                    />
                  );
                })}
                {/* Playhead line for track */}
                <div className="absolute top-0 h-full w-px bg-red-500/30 pointer-events-none"
                  style={{ left: `${playheadPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
