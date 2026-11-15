import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  Mountain, 
  Navigation as RouteIcon, 
  Sparkles, 
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'explore', label: 'Explore Mars', icon: Compass, badge: 'Live' },
  { id: 'terrain', label: 'Terrain Analysis', icon: Mountain, badge: 'DEM' },
  { id: 'route', label: 'Route Planner', icon: RouteIcon, badge: 'A*' },
  { id: 'insights', label: 'Scientific Insights', icon: Sparkles, badge: 'USGS' },
  { id: 'about', label: 'About Project', icon: Info, badge: null },
];

export default function Navigation({ activeTab, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${isCollapsed ? 'w-14' : 'w-52'} bg-[#14161a] border-r border-[#33363D] flex flex-col justify-between select-none transition-all duration-200 z-[1100]`}>
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-2 text-[10px] uppercase font-mono tracking-wider text-[#A6A8AD]">
          {!isCollapsed && <span>Navigation</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Navigation' : 'Collapse Sidebar'}
            className="p-1 rounded hover:bg-[#22252c] text-[#A6A8AD] hover:text-white transition-colors ml-auto"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'} rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#22252c] text-[#F3F3F3] border-l-2 border-[#D97745]'
                  : 'text-[#A6A8AD] hover:bg-[#22252c]/50 hover:text-[#F3F3F3]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#D97745]' : 'text-[#A6A8AD]'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-[#D97745]/20 text-[#D97745]' : 'bg-[#101114] text-[#A6A8AD]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!isCollapsed ? (
        <div className="p-3 border-t border-[#33363D] text-[11px] text-[#A6A8AD] space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span>Area:</span>
            <span className="text-[#F3F3F3]">Jezero Delta</span>
          </div>
          <div className="flex justify-between">
            <span>CRS:</span>
            <span className="text-[#F3F3F3]">IAU 2000</span>
          </div>
          <div className="pt-1 text-[9px] text-[#A6A8AD]/70 text-center">
            Astro-nah • Space Apps 2026
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-[#33363D] flex justify-center">
          <span className="text-[9px] font-mono text-[#A6A8AD]">v1.0</span>
        </div>
      )}
    </aside>
  );
}

