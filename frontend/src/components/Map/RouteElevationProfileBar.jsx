import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mountain, TrendingUp } from 'lucide-react';

export default function RouteElevationProfileBar({ 
  routeData, 
  onHoverPoint, 
  onLeavePoint,
  onJumpToStep,
  forceCollapse = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);

  if (!routeData || !routeData.route || routeData.route.length === 0) return null;

  const effectiveExpanded = forceCollapse ? false : isExpanded;

  const route = routeData.route;
  const elevs = route.map(r => r.elevation_m);
  const minElev = Math.min(...elevs);
  const maxElev = Math.max(...elevs);
  const range = maxElev - minElev || 1;

  const width = 640;
  const height = 90;
  const paddingX = 24;
  const paddingY = 16;
  const graphWidth = width - 2 * paddingX;
  const graphHeight = height - 2 * paddingY;

  // Build SVG points
  const points = route.map((pt, i) => {
    const x = paddingX + (i / (route.length - 1)) * graphWidth;
    const y = height - paddingY - ((pt.elevation_m - minElev) / range) * graphHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const firstX = paddingX;
  const lastX = paddingX + graphWidth;
  const bottomY = height - paddingY;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clampedX = Math.max(paddingX, Math.min(width - paddingX, mouseX));
    const ratio = (clampedX - paddingX) / graphWidth;
    const index = Math.round(ratio * (route.length - 1));
    const pt = route[index];
    if (pt) {
      const distFromStart = ((index / (route.length - 1)) * routeData.distance_km).toFixed(2);
      setHoverInfo({
        x: clampedX,
        y: height - paddingY - ((pt.elevation_m - minElev) / range) * graphHeight,
        elevation: pt.elevation_m,
        slope: pt.slope_deg,
        dist: distFromStart,
        lat: pt.lat,
        lng: pt.lng
      });
      if (onHoverPoint) {
        onHoverPoint({ lat: pt.lat, lng: pt.lng, elevation: pt.elevation_m, slope: pt.slope_deg });
      }
    }
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clampedX = Math.max(paddingX, Math.min(width - paddingX, mouseX));
    const ratio = (clampedX - paddingX) / graphWidth;
    const index = Math.round(ratio * (route.length - 1));
    if (onJumpToStep) {
      onJumpToStep(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    if (onLeavePoint) onLeavePoint();
  };

  return (
    <div className="absolute bottom-11 left-3 right-3 sm:left-4 sm:right-auto z-[1000] pointer-events-auto">
      <div className="bg-[#121418]/80 backdrop-blur-md border border-[#33363D]/80 rounded-lg shadow-2xl overflow-hidden font-mono text-xs w-full sm:w-[500px] md:w-[560px]">
        {/* Toggle Header Bar */}
        <div 
          onClick={() => setIsExpanded(!effectiveExpanded)}
          className="p-2 px-3 flex items-center justify-between cursor-pointer hover:bg-[#22252c] border-b border-[#33363D]/60 transition-colors select-none"
        >
          <div className="flex items-center space-x-2">
            <Mountain className="w-3.5 h-3.5 text-[#D97745]" />
            <span className="font-bold text-[#F3F3F3]">TERRAIN ELEVATION PROFILE</span>
            <span className="text-[10px] text-[#A6A8AD]">
              ({routeData.distance_km} km • Ascent +{routeData.elevation_gain_m}m / Descent −{routeData.elevation_loss_m || 0}m)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-[#A6A8AD]">
            <span>{effectiveExpanded ? 'Minimize' : 'Inspect Cross-Section'}</span>
            {effectiveExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Collapsible Graph Area */}
        {effectiveExpanded && (
          <div className="p-2 space-y-1">
            <div className="relative">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-24 overflow-visible cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <defs>
                  <linearGradient id="mapElevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#D97745" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#101114" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#33363D" strokeDasharray="3,3" opacity="0.6" />
                <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#33363D" strokeDasharray="3,3" opacity="0.4" />
                <line x1={paddingX} y1={bottomY} x2={width - paddingX} y2={bottomY} stroke="#33363D" />

                {/* Shaded Area */}
                <polygon points={areaPoints} fill="url(#mapElevGrad)" />

                {/* Profile Line */}
                <polyline fill="none" stroke="#38BDF8" strokeWidth="2.5" points={points} />

                {/* Start & End endpoints */}
                <circle cx={firstX} cy={height - paddingY - ((elevs[0] - minElev) / range) * graphHeight} r="4" fill="#10B981" />
                <circle cx={lastX} cy={height - paddingY - ((elevs[elevs.length - 1] - minElev) / range) * graphHeight} r="4" fill="#D97745" />

                {/* Hover Scrubber Reticle */}
                {hoverInfo && (
                  <>
                    <line 
                      x1={hoverInfo.x} 
                      y1={paddingY} 
                      x2={hoverInfo.x} 
                      y2={bottomY} 
                      stroke="#F3F3F3" 
                      strokeWidth="1.5" 
                      strokeDasharray="2,2" 
                    />
                    <circle 
                      cx={hoverInfo.x} 
                      cy={hoverInfo.y} 
                      r="5" 
                      fill="#D97745" 
                      stroke="#FFF" 
                      strokeWidth="2" 
                    />
                  </>
                )}
              </svg>

              {/* Float badge when hovering */}
              {hoverInfo && (
                <div 
                  className="absolute top-0 px-2 py-1 rounded bg-[#101114]/90 border border-[#D97745] text-[10px] text-[#F3F3F3] shadow-lg pointer-events-none transform -translate-y-2"
                  style={{ left: `${Math.min(hoverInfo.x - 40, width - 140)}px` }}
                >
                  <span className="text-[#38BDF8] font-bold">{hoverInfo.dist} km</span> | 
                  <span className="text-white font-bold ml-1">{hoverInfo.elevation.toFixed(0)}m</span> | 
                  <span className={`ml-1 font-bold ${hoverInfo.slope > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {hoverInfo.slope.toFixed(1)}°
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] text-[#A6A8AD] px-2 font-mono">
              <span className="text-emerald-400">Origin: {elevs[0]?.toFixed(0)}m</span>
              <span>Min: {minElev.toFixed(0)}m / Max: {maxElev.toFixed(0)}m</span>
              <span className="text-[#D97745]">Dest: {elevs[elevs.length - 1]?.toFixed(0)}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

