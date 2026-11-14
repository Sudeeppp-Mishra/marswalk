import React from 'react';
import { Compass, Radio, ShieldAlert, Cpu } from 'lucide-react';

export default function Header({ backendStatus, activeTab }) {
  const isOnline = backendStatus && backendStatus.status === 'ok';

  return (
    <header className="h-14 border-b border-[#33363D] bg-[#191b20] px-4 flex items-center justify-between select-none z-20">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-[#D97745]/20 border border-[#D97745] flex items-center justify-center text-[#D97745]">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-wider text-base text-[#F3F3F3]">ASTRO-NAH</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#22252c] text-[#D97745] border border-[#33363D]">
              Jezero Crater Delta
            </span>
          </div>
          <p className="text-[11px] text-[#A6A8AD] leading-none">Martian Surface Exploration & Navigation</p>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-xs font-mono">
        <div className="hidden sm:flex items-center space-x-2 text-[#A6A8AD]">
          <span>TARGET:</span>
          <span className="text-[#F3F3F3]">18.38° N, 77.58° E</span>
        </div>

        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#22252c] border border-[#33363D]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-[#A6A8AD]">BACKEND:</span>
          <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnline ? 'CONNECTED' : 'STANDBY'}
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5 text-[#A6A8AD]">
          <Radio className="w-3.5 h-3.5 text-[#D97745]" />
          <span>NASA SPACE APPS 2026</span>
        </div>
      </div>
    </header>
  );
}

