import React from 'react';
import { 
  Activity, 
  Database, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode2,
  Compass
} from 'lucide-react';

export default function StatusPanel({ 
  activeTab, 
  backendStatus, 
  datasets, 
  cursorCoords, 
  startPoint, 
  destinationPoint,
  activeLayer,
  routeData
}) {
  return (
    <aside className="w-80 bg-[#191b20] border-l border-[#33363D] flex flex-col justify-between overflow-y-auto select-none p-4 space-y-4">
      {/* Target Mission Information */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <span className="text-xs font-mono uppercase text-[#A6A8AD]">Mission Target</span>
          <span className="text-xs font-mono text-[#D97745] font-semibold">JEZERO CRATER</span>
        </div>

        <div className="bg-[#22252c] rounded-lg p-3 border border-[#33363D] space-y-2 text-xs">
          <div className="flex justify-between font-mono">
            <span className="text-[#A6A8AD]">Latitude:</span>
            <span className="text-[#F3F3F3]">18.38° N</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#A6A8AD]">Longitude:</span>
            <span className="text-[#F3F3F3]">77.58° E</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#A6A8AD]">Feature Type:</span>
            <span className="text-[#F3F3F3]">Ancient River Delta</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#A6A8AD]">Primary Rover:</span>
            <span className="text-[#F3F3F3]">Mars 2020 Perseverance</span>
          </div>
        </div>
      </div>

      {/* Dataset Verification Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <span className="text-xs font-mono uppercase text-[#A6A8AD]">Dataset Registry</span>
          <Database className="w-3.5 h-3.5 text-[#D97745]" />
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">MRO CTX Mosaic</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Candidate
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">~6m/px regional surface imagery</p>
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">CTX DEM / DTM</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                Pending Phase 2
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">~20m/px digital elevation model</p>
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">MRO HiRISE Ortho</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#101114] text-[#A6A8AD] font-mono">
                Phase 5 Target
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">25cm/px high-resolution sample</p>
          </div>
        </div>
      </div>

      {/* Waypoints & Route Coordinates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <span className="text-xs font-mono uppercase text-[#A6A8AD]">Pathfinding Waypoints</span>
          <Navigation className="w-3.5 h-3.5 text-[#D97745]" />
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D]">
            <div className="text-[#A6A8AD] text-[10px] uppercase">Origin Point (Start)</div>
            <div className="text-[#F3F3F3] mt-0.5">
              {startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : 'Not selected (click map)'}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D]">
            <div className="text-[#A6A8AD] text-[10px] uppercase">Destination Point</div>
            <div className="text-[#F3F3F3] mt-0.5">
              {destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : 'Not selected (click map)'}
            </div>
          </div>

          {routeData && (
            <div className="p-2.5 rounded bg-[#101114] border border-[#D97745]/40 space-y-1 text-[11px]">
              <div className="text-sky-400 font-bold uppercase text-[10px]">A* Computed Trajectory</div>
              <div className="flex justify-between text-[#A6A8AD]">
                <span>Distance:</span>
                <span className="text-[#F3F3F3] font-bold">{routeData.distance_km} km</span>
              </div>
              <div className="flex justify-between text-[#A6A8AD]">
                <span>Difficulty:</span>
                <span className="text-emerald-400 font-semibold">{routeData.estimated_difficulty}</span>
              </div>
              <div className="flex justify-between text-[#A6A8AD]">
                <span>Elev Gain:</span>
                <span className="text-[#F3F3F3]">+{routeData.elevation_gain_m} m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status / Health Card */}
      <div className="pt-2 border-t border-[#33363D]">
        <div className="p-3 rounded-lg bg-[#22252c] border border-[#33363D] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#A6A8AD] font-mono">Engine:</span>
            <span className="font-mono text-[#F3F3F3]">FastAPI + React</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#A6A8AD] font-mono">Backend Status:</span>
            <span className={`font-mono font-semibold ${
              backendStatus?.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {backendStatus?.status === 'ok' ? 'HEALTHY' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

