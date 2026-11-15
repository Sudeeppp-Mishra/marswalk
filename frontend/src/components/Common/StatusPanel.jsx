import React from 'react';
import { 
  Activity, 
  Database, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode2,
  Compass,
  Clock,
  TrendingUp,
  Download
} from 'lucide-react';
import { exportRouteAsGeoJSON, exportRouteAsCSV } from '../../utils/exportRoute';

export default function StatusPanel({ 
  backendStatus, 
  startPoint, 
  destinationPoint,
  routeData
}) {
  const roverHours = routeData ? (routeData.distance_km / 0.12).toFixed(1) : null;
  const evaHours = routeData ? ((routeData.distance_km / 1.1) * (1 + routeData.elevation_gain_m / 400)).toFixed(1) : null;

  // Difficulty color aligned with Terrain Analysis tiers (Green low, Amber moderate, Red severe)
  const getDifficultyColor = (diff) => {
    if (!diff) return 'text-emerald-400';
    if (diff.includes('Moderate')) return 'text-amber-400';
    if (diff.includes('Challenging')) return 'text-orange-400';
    if (diff.includes('Extreme') || diff.includes('Severe')) return 'text-rose-400';
    return 'text-emerald-400';
  };

  const meanSlopeVal = routeData ? (
    routeData.mean_slope_deg !== undefined && routeData.mean_slope_deg !== null
      ? routeData.mean_slope_deg
      : (routeData.route?.length > 0
          ? (routeData.route.reduce((acc, p) => acc + (p.slope_deg || 0), 0) / routeData.route.length).toFixed(1)
          : '0.0')
  ) : null;

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
            <span className="text-[#D97745]">Mars 2020 Perseverance</span>
          </div>
        </div>
      </div>

      {/* Dataset Verification Panel - Honest & Hackathon-Ready */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <span className="text-xs font-mono uppercase text-[#A6A8AD]">Dataset Registry</span>
          <Database className="w-3.5 h-3.5 text-[#D97745]" />
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">MRO CTX Mosaic</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                Active (Local)
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">~6m/px Jezero regional surface imagery</p>
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">USGS Jezero CTX DTM</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                Active (Local 20m)
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">20m/px Jezero TRN digital elevation &amp; slope model</p>
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">USGS Geology</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-bold">
                Schematic (SIM 3464)
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">Schematic units after USGS SIM 3464 (approx. boundaries)</p>
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-purple-500/30 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-medium text-[#F3F3F3]">MRO HiRISE (25cm)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                Active (Local 9.1GB)
              </span>
            </div>
            <p className="text-[11px] text-[#A6A8AD]">85.6k × 85.9k px • 25cm sub-meter GeoTIFF</p>
          </div>
        </div>
      </div>

      {/* Pathfinding Waypoints & Trajectory Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <span className="text-xs font-mono uppercase text-[#A6A8AD]">Pathfinding Telemetry</span>
          <Navigation className="w-3.5 h-3.5 text-[#D97745]" />
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D]">
            <div className="flex items-center justify-between text-[#A6A8AD]">
              <span>START POINT:</span>
              <span className="text-emerald-400 font-semibold">
                {startPoint ? 'SET' : 'CLICK MAP'}
              </span>
            </div>
            {startPoint && (
              <div className="text-[#F3F3F3] text-[11px] mt-0.5">
                {startPoint.lat}° N, {startPoint.lng}° E
              </div>
            )}
          </div>

          <div className="p-2.5 rounded bg-[#22252c] border border-[#33363D]">
            <div className="flex items-center justify-between text-[#A6A8AD]">
              <span>DEST POINT:</span>
              <span className="text-[#D97745] font-semibold">
                {destinationPoint ? 'SET' : 'CLICK MAP'}
              </span>
            </div>
            {destinationPoint && (
              <div className="text-[#F3F3F3] text-[11px] mt-0.5">
                {destinationPoint.lat}° N, {destinationPoint.lng}° E
              </div>
            )}
          </div>

          {/* Active Route Summary with Real Rover vs Astronaut Duration */}
          {routeData && (
            <div className="p-2.5 rounded bg-[#101114] border border-sky-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-bold text-[11px]">TRAVERSE METRICS</span>
                <span className={`text-[10px] font-bold ${getDifficultyColor(routeData.estimated_difficulty)}`}>
                  {routeData.estimated_difficulty}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#A6A8AD]">
                <div>Distance: <strong className="text-white">{routeData.distance_km} km</strong></div>
                <div>Max Slope: <strong className="text-[#D97745]">{routeData.max_slope_deg}°</strong></div>
                <div>Ascent: <strong className="text-emerald-400">+{routeData.elevation_gain_m}m</strong></div>
                <div>Descent: <strong className="text-sky-400">−{routeData.elevation_loss_m ?? 0}m</strong></div>
                <div>Mean Slope: <strong className="text-white">{meanSlopeVal}°</strong></div>
                <div>&lt;15° Slope: <strong className="text-emerald-400">{routeData.under_15_deg_pct != null ? `${routeData.under_15_deg_pct}%` : 'N/A'}</strong></div>
              </div>

              {/* Rover Safety Verdict */}
              <div className="text-[10px] p-1.5 rounded bg-[#191b20] border border-[#33363D] leading-tight">
                {routeData.max_slope_deg <= 20.0 ? (
                  <span className="text-emerald-400 font-mono">
                    ✔ Safe for Perseverance: Max slope {routeData.max_slope_deg}° is within the 20.0° rover tilt threshold.
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono">
                    ⚠ Warning for Perseverance: Max slope {routeData.max_slope_deg}° exceeds 20.0° limit (slip risk).
                  </span>
                )}
              </div>

              {/* Compare Routes: Safest A* vs Direct Line */}
              <div className="p-1.5 rounded bg-[#191b20] border border-[#33363D] space-y-1 text-[9px] font-mono">
                <div className="text-[#A6A8AD] uppercase font-bold text-[8px] tracking-wider">A* vs Direct Traversal</div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Cost-Optimized A*:</span>
                  <span className="text-white">{routeData.distance_km} km (Max {routeData.max_slope_deg}°)</span>
                </div>
                <div className="flex justify-between text-[#A6A8AD]">
                  <span>Direct Straight Line:</span>
                  <span>{routeData.direct_distance_km ?? 'N/A'} km (Max {routeData.direct_max_slope_deg != null ? `${routeData.direct_max_slope_deg}°` : 'N/A'})</span>
                </div>
              </div>

              {/* Traverse Time Comparisons */}
              <div className="border-t border-[#33363D] pt-1.5 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#A6A8AD]">Perseverance Rover (~0.12 km/h):</span>
                  <span className="text-amber-300 font-bold">~{roverHours} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A6A8AD]">Astronaut EVA (~1.1 km/h):</span>
                  <span className="text-sky-300 font-bold">~{evaHours} hrs</span>
                </div>
              </div>

              {/* Quick Export Buttons */}
              <div className="flex space-x-1.5 pt-1 border-t border-[#33363D]">
                <button
                  onClick={() => exportRouteAsGeoJSON(routeData, startPoint, destinationPoint)}
                  className="flex-1 py-1 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[10px] text-[#F3F3F3] border border-[#33363D] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3 text-sky-400" />
                  <span>GeoJSON</span>
                </button>
                <button
                  onClick={() => exportRouteAsCSV(routeData)}
                  className="flex-1 py-1 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[10px] text-[#F3F3F3] border border-[#33363D] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3 text-[#D97745]" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backend Status & Disclaimers */}
      <div className="p-2.5 rounded bg-[#101114] border border-[#33363D] space-y-1 text-[10px] font-mono text-[#A6A8AD]">
        <div className={`flex items-center space-x-1.5 ${backendStatus?.status === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {backendStatus?.status === 'ok' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          <span>{backendStatus?.status === 'ok' ? 'A* NAVIGATION READY' : 'BACKEND OFFLINE'}</span>
        </div>
        <p className="leading-tight">
          20m CTX DTM resolution. Slopes &gt;20° classified impassable.
        </p>
      </div>
    </aside>
  );
}
