import React from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface BottomSliderProps {
  year: number;
  setYear: React.Dispatch<React.SetStateAction<number>>;
}

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export function BottomSlider({ year, setYear }: BottomSliderProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setYear((y) => (y >= 2026 ? 2018 : y + 1));
    }, 1500);
    return () => clearInterval(t);
  }, [isPlaying, setYear]);

  return (
    <div className="h-16 bg-[#111114]/80 backdrop-blur-md border-t border-white/10 flex flex-col justify-center px-4 md:px-10 z-50 relative shrink-0">
      <div className="flex items-center gap-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/5 rounded border border-white/10 text-white/60 hover:text-white transition-colors" onClick={() => setYear(Math.max(2018, year - 1))}>
            <SkipBack size={16} />
          </button>
          <button
            className="p-2 bg-white/5 rounded border border-white/10 text-white/60 hover:text-white transition-colors"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="p-2 bg-white/5 rounded border border-white/10 text-white/60 hover:text-white transition-colors" onClick={() => setYear(Math.min(2026, year + 1))}>
            <SkipForward size={16} />
          </button>
        </div>

        <div className="text-xs font-mono tabular-nums bg-white/5 px-3 py-2 rounded border border-white/10 w-20 text-center">
          {year}
        </div>

        <div className="flex-1 px-4 flex items-center relative gap-2">
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full" />
          <input
            type="range"
            min={2018}
            max={2026}
            step={1}
            value={year}
            onChange={(e) => {
              setIsPlaying(false);
              setYear(parseInt(e.target.value));
            }}
            className="w-full relative z-10 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-red-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,0,0,0.5)] focus:outline-none"
          />
          <div className="absolute inset-x-4 top-[100%] h-4 pointer-events-none mt-1">
            {YEARS.map((y, i) => (
              <span
                key={y}
                className="absolute text-[10px] font-mono text-white/30 text-center w-8 -ml-4"
                style={{ left: `calc(8px + (100% - 16px) * (${i} / ${YEARS.length - 1}))` }}
              >
                {y}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
