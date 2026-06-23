import React from 'react';
import { Activity, Map, Info, ShieldAlert, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../ThemeContext';

interface TopBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  year: number;
}

export function TopBar({ activeView, onViewChange, year }: TopBarProps) {
  const { isDark, toggle } = useTheme();
  const tabs = [
    { id: 'map', label: 'Map Dashboard', icon: Map },
    { id: 'models', label: 'Model Explorer', icon: Activity },
    { id: 'notes', label: 'Data & Notes', icon: Info },
  ];

  return (
    <header className="h-14 bg-[#111114] border-b border-white/10 shadow-lg flex items-center justify-between px-6 z-50 relative shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500">
          <ShieldAlert size={18} />
        </div>
        <div>
          <h1 className="font-sans text-sm font-bold tracking-widest uppercase text-white/90">
            POVERTY MAPPING DASHBOARD
          </h1>
          <p className="font-mono text-[10px] text-white/30 mt-0.5">
            Jawa Timur · {year}
          </p>
        </div>
      </div>

      <div className="flex bg-black/40 rounded p-1 border border-white/10 text-[11px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={twMerge(
              clsx(
                "flex items-center gap-2 px-3 py-1 rounded font-medium transition-colors",
                activeView === tab.id
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-white/60 hover:text-white/80 hover:bg-white/5"
              )
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
