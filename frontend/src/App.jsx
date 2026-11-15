import React, { useState, useEffect } from 'react';
import Header from './components/Common/Header';
import Navigation from './components/Sidebar/Navigation';
import MarsMap from './components/Map/MarsMap';
import StatusPanel from './components/Common/StatusPanel';
import BottomBar from './components/Common/BottomBar';
import { checkBackendHealth, getDatasets } from './services/api';
import { 
  Compass, 
  Mountain, 
  Sparkles, 
  Navigation as RouteIcon, 
  Info, 
  ShieldCheck, 
  Sliders,
  TrendingUp,
  MapPin,
  ArrowRight,
  Eye
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [backendStatus, setBackendStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [cursorCoords, setCursorCoords] = useState({ lat: null, lng: null });
  const [startPoint, setStartPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [activeLayer, setActiveLayer] = useState('ctx');
  const [routeData, setRouteData] = useState(null);
  const [maxSlope, setMaxSlope] = useState(20.0);

  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health);
      const data = await getDatasets();
      if (data && data.datasets) {
        setDatasets(data.datasets);
      }
    }
    init();

    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setBackendStatus(health);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectPoint = (type, coords) => {
    if (type === 'start') {
      setStartPoint(coords);
    } else {
      setDestinationPoint(coords);
    }
  };

  // Difficulty color aligned with Terrain Analysis tiers (Green low, Amber moderate, Red severe)
  const getDifficultyColor = (diff) => {
    if (!diff) return 'text-emerald-400';
    if (diff.includes('Moderate')) return 'text-amber-400';
    if (diff.includes('Challenging')) return 'text-orange-400';
    if (diff.includes('Extreme') || diff.includes('Severe')) return 'text-rose-400';
    return 'text-emerald-400';
  };

  // Helper to generate SVG path for Elevation Cross-Section Profile
  const renderElevationProfileSVG = () => {
    if (!routeData || !routeData.route || routeData.route.length < 2) return null;
    const pts = routeData.route;
    const elevs = pts.map(p => p.elevation_m);
    const minElev = Math.min(...elevs);
    const maxElev = Math.max(...elevs);
    const range = Math.max(10.0, maxElev - minElev);

    const width = 600;
    const height = 140;
    const padding = 20;

    const points = pts.map((p, idx) => {
      const x = padding + (idx / (pts.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.elevation_m - minElev) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

    return (
      <div className="bg-[#101114] p-4 rounded-lg border border-[#33363D] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#A6A8AD] uppercase font-semibold">Traverse Elevation Profile</span>
          <span className="text-sky-400">
            Ascent +{routeData.elevation_gain_m}m • Descent −{routeData.elevation_loss_m ?? 0}m (Range: {minElev.toFixed(0)}m to {maxElev.toFixed(0)}m)
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Horizontal gridlines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#33363D" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#33363D" strokeDasharray="3 3" />
          <line x1={padding} y1={bottomY} x2={width - padding} y2={bottomY} stroke="#33363D" />

          {/* Shaded Area */}
          <polygon points={areaPoints} fill="url(#elevGrad)" />

          {/* Elevation Line */}
          <polyline fill="none" stroke="#38BDF8" strokeWidth="2.5" points={points} />

          {/* Start marker dot */}
          <circle cx={firstX} cy={height - padding - ((elevs[0] - minElev) / range) * (height - 2 * padding)} r="4" fill="#10B981" />
          {/* End marker dot */}
          <circle cx={lastX} cy={height - padding - ((elevs[elevs.length - 1] - minElev) / range) * (height - 2 * padding)} r="4" fill="#D97745" />
        </svg>
        <div className="flex justify-between text-[10px] font-mono text-[#A6A8AD]">
          <span>Origin (0 km): {elevs[0].toFixed(0)}m</span>
          <span>Midpoint</span>
          <span>Destination ({routeData.distance_km} km): {elevs[elevs.length - 1].toFixed(0)}m</span>
        </div>
      </div>
    );
  };

  // Helper to generate SVG path for Slope vs Distance Profile
  const renderSlopeProfileSVG = () => {
    if (!routeData || !routeData.route || routeData.route.length < 2) return null;
    const pts = routeData.route;
    const slopes = pts.map(p => p.slope_deg);
    const maxSlopeVal = Math.max(25.0, ...slopes);

    const width = 600;
    const height = 120;
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Find steepest point index
    let maxIdx = 0;
    let maxS = slopes[0];
    slopes.forEach((s, i) => {
      if (s > maxS) {
        maxS = s;
        maxIdx = i;
      }
    });
    const steepestKm = ((maxIdx / (pts.length - 1)) * routeData.distance_km).toFixed(2);

    const points = pts.map((p, idx) => {
      const x = padding + (idx / (pts.length - 1)) * graphWidth;
      const y = height - padding - (p.slope_deg / maxSlopeVal) * graphHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

    // Guideline Y positions
    const y10 = height - padding - (10.0 / maxSlopeVal) * graphHeight;
    const y20 = height - padding - (20.0 / maxSlopeVal) * graphHeight;

    const steepestX = padding + (maxIdx / (pts.length - 1)) * graphWidth;
    const steepestY = height - padding - (maxS / maxSlopeVal) * graphHeight;

    return (
      <div className="bg-[#101114] p-4 rounded-lg border border-[#33363D] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#A6A8AD] uppercase font-semibold">Traverse Slope Gradient Profile</span>
          <span className="text-[#D97745] font-bold">
            Steepest Section: {maxS}° @ km {steepestKm} {maxS <= 20.0 ? '(Within 20° Vehicle Limit)' : '(Warning: Exceeds 20°!)'}
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <defs>
            <linearGradient id="slopeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97745" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* 20° Impassable Guideline */}
          <line x1={padding} y1={y20} x2={width - padding} y2={y20} stroke="#EF4444" strokeDasharray="3 3" opacity="0.6" />
          <text x={width - padding - 8} y={y20 - 4} fill="#EF4444" fontSize="9" textAnchor="end" fontFamily="monospace">20° Limit</text>

          {/* 10° Moderate Guideline */}
          <line x1={padding} y1={y10} x2={width - padding} y2={y10} stroke="#F59E0B" strokeDasharray="3 3" opacity="0.5" />
          <text x={width - padding - 8} y={y10 - 4} fill="#F59E0B" fontSize="9" textAnchor="end" fontFamily="monospace">10° Caution</text>

          <line x1={padding} y1={bottomY} x2={width - padding} y2={bottomY} stroke="#33363D" />

          {/* Shaded Area */}
          <polygon points={areaPoints} fill="url(#slopeGrad)" />

          {/* Slope Line */}
          <polyline fill="none" stroke="#F59E0B" strokeWidth="2" points={points} />

          {/* Steepest Point Marker */}
          <circle cx={steepestX} cy={steepestY} r="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
        <div className="flex justify-between text-[10px] font-mono text-[#A6A8AD]">
          <span>Origin: {slopes[0]}°</span>
          <span className="text-emerald-400 font-semibold">{routeData.under_15_deg_pct != null ? `${routeData.under_15_deg_pct}%` : '—'} under 15°</span>
          <span>Destination: {slopes[slopes.length - 1]}°</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#101114] text-[#F3F3F3] overflow-hidden select-none">
      <Header backendStatus={backendStatus} activeTab={activeTab} />

      <div className="flex flex-1 overflow-hidden">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#101114]">
          {activeTab === 'explore' && (
            <MarsMap
              cursorCoords={cursorCoords}
              onCursorChange={setCursorCoords}
              startPoint={startPoint}
              destinationPoint={destinationPoint}
              onSelectPoint={handleSelectPoint}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
              routeData={routeData}
              setRouteData={setRouteData}
              maxSlope={maxSlope}
              setMaxSlope={setMaxSlope}
            />
          )}

          {activeTab === 'terrain' && (
            <div className="p-8 max-w-4xl mx-auto overflow-y-auto space-y-6">
              <div className="border-b border-[#33363D] pb-4">
                <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                  <Mountain className="w-4 h-4" />
                  <span>Terrain Analysis Engine</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">Jezero Delta Slope & Elevation Modeling</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Derives physical slope gradients from authentic Mars Reconnaissance Orbiter (MRO) Digital Elevation Models.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-2">
                  <h3 className="font-semibold text-sm text-[#F3F3F3]">Slope Formula Specification</h3>
                  <div className="p-3 bg-[#101114] rounded border border-[#33363D] font-mono text-xs text-[#D97745]">
                    Slope = arctan(√((dz/dx)² + (dz/dy)²)) × (180/π)
                  </div>
                  <p className="text-xs text-[#A6A8AD] leading-relaxed">
                    Calculated using true 20.0 m/pixel ground spacing from the USGS TRN CTX DTM mosaic in ESRI:103885 Mars Equidistant Cylindrical CRS.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-2">
                  <h3 className="font-semibold text-sm text-[#F3F3F3]">Hazard Classification Tiers</h3>
                  <ul className="text-xs space-y-1.5 font-mono text-[#A6A8AD]">
                    <li className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>0° – 10°: Nominal Traversal (Low Risk)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>10° – 20°: Moderate Incline (Caution)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>&gt; 20°: Severe Slope (Impassable Zone)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-3">
                <h3 className="font-semibold text-sm text-[#F3F3F3]">Jezero Regional Elevation (USGS 20m DTM)</h3>
                <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
                  <div className="bg-[#101114] p-3 rounded border border-[#33363D]">
                    <span className="text-[#A6A8AD] block text-[10px]">MIN ELEVATION</span>
                    <span className="text-sky-400 font-bold text-sm">-2,710.7 m</span>
                  </div>
                  <div className="bg-[#101114] p-3 rounded border border-[#33363D]">
                    <span className="text-[#A6A8AD] block text-[10px]">MEAN ELEVATION</span>
                    <span className="text-[#F3F3F3] font-bold text-sm">-2,356.9 m</span>
                  </div>
                  <div className="bg-[#101114] p-3 rounded border border-[#33363D]">
                    <span className="text-[#A6A8AD] block text-[10px]">MAX ELEVATION</span>
                    <span className="text-[#D97745] font-bold text-sm">-1,515.5 m</span>
                  </div>
                </div>
              </div>

              {/* Slope Distribution Histogram & Terrain Risk Breakdown */}
              <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[#F3F3F3]">Regional Slope Distribution (Area %)</h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">95.2% Accessible &lt; 20°</span>
                </div>

                {/* Multi-segment distribution bar */}
                <div className="h-4 w-full bg-[#101114] rounded-full overflow-hidden flex border border-[#33363D]">
                  <div style={{ width: '78.4%' }} className="bg-emerald-500 hover:opacity-90 transition-all" title="Nominal: 78.4%" />
                  <div style={{ width: '16.8%' }} className="bg-amber-500 hover:opacity-90 transition-all" title="Moderate Incline: 16.8%" />
                  <div style={{ width: '4.8%' }} className="bg-rose-600 hover:opacity-90 transition-all" title="Severe Scarp: 4.8%" />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-[#101114] rounded border border-[#33363D]">
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold">78.4%</span>
                    </div>
                    <span className="text-[10px] text-[#A6A8AD] block mt-0.5">Nominal Slope (&lt; 10°)</span>
                  </div>
                  <div className="p-2.5 bg-[#101114] rounded border border-[#33363D]">
                    <div className="flex items-center space-x-1.5 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="font-bold">16.8%</span>
                    </div>
                    <span className="text-[10px] text-[#A6A8AD] block mt-0.5">Moderate Incline (10°–20°)</span>
                  </div>
                  <div className="p-2.5 bg-[#101114] rounded border border-[#33363D]">
                    <div className="flex items-center space-x-1.5 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="font-bold">4.8%</span>
                    </div>
                    <span className="text-[10px] text-[#A6A8AD] block mt-0.5">Impassable Scarps (&gt; 20°)</span>
                  </div>
                </div>

                {/* Regional Slope Key Statistics */}
                <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center border-t border-[#33363D] pt-3">
                  <div>
                    <span className="text-[10px] text-[#A6A8AD] block">MEAN SLOPE</span>
                    <span className="text-white font-bold">6.8°</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A6A8AD] block">MEDIAN SLOPE</span>
                    <span className="text-white font-bold">5.2°</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A6A8AD] block">MAX SCARP ANGLE</span>
                    <span className="text-rose-400 font-bold">34.6°</span>
                  </div>
                </div>
              </div>

              {/* Rover Articulation & Wheel Slip Limits */}
              <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-2">
                <h3 className="font-semibold text-sm text-[#F3F3F3]">Perseverance Rover Articulation Limits</h3>
                <p className="text-xs text-[#A6A8AD] leading-relaxed">
                  Perseverance features a rocker-bogie suspension capable of maintaining body stability across tilts up to 30°, but NASA autonomous driving flight rules limit nominal traverse paths to <strong className="text-white">≤ 15°</strong> to prevent wheel slippage on martian regolith and ensure drill arm docking stability. Slopes between <strong className="text-amber-300">15°–20°</strong> require ground operator verification, and slopes <strong className="text-rose-400">&gt; 20°</strong> are classified as no-go zones.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="p-8 max-w-4xl mx-auto overflow-y-auto space-y-6">
              <div className="border-b border-[#33363D] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                    <RouteIcon className="w-4 h-4" />
                    <span>A* Navigation Engine</span>
                  </div>
                  <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">Cost-Aware Surface Pathfinding</h1>
                  <p className="text-sm text-[#A6A8AD] mt-1">
                    Computes suggested exploration trajectories balancing scientific objectives, elevation changes, and terrain safety.
                  </p>
                </div>

                {/* Switch back to map button */}
                <button
                  onClick={() => setActiveTab('explore')}
                  className="bg-[#22252c] hover:bg-[#33363D] text-[#F3F3F3] px-3.5 py-2 rounded-lg text-xs font-mono flex items-center space-x-2 border border-[#33363D] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D97745]" />
                  <span>View on Map</span>
                </button>
              </div>

              {/* Waypoint Selection Status */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D]">
                  <span className="text-[#A6A8AD] uppercase text-[10px]">Origin Waypoint</span>
                  <div className="text-[#F3F3F3] mt-1 font-semibold">
                    {startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : 'Not set (click map in Explore tab)'}
                  </div>
                </div>
                <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D]">
                  <span className="text-[#A6A8AD] uppercase text-[10px]">Destination Waypoint</span>
                  <div className="text-[#F3F3F3] mt-1 font-semibold">
                    {destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : 'Not set (click map in Explore tab)'}
                  </div>
                </div>
              </div>

              {/* Route Results & Elevation Profile */}
              {routeData ? (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">TOTAL DISTANCE</span>
                      <div className="text-base font-bold text-sky-400 mt-1">{routeData.distance_km} km</div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">DIFFICULTY</span>
                      <div className={`text-base font-bold mt-1 ${getDifficultyColor(routeData.estimated_difficulty)}`}>
                        {routeData.estimated_difficulty}
                      </div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">ASCENT / DESCENT</span>
                      <div className="text-xs font-bold text-[#F3F3F3] mt-1.5">
                        +{routeData.elevation_gain_m}m / −{routeData.elevation_loss_m ?? 0}m
                      </div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">MAX / MEAN SLOPE</span>
                      <div className="text-base font-bold text-[#D97745] mt-1">
                        {routeData.max_slope_deg}° <span className="text-xs font-normal text-white">({routeData.mean_slope_deg != null ? `${routeData.mean_slope_deg}°` : 'N/A'})</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">&lt;15° FEASIBILITY</span>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        {routeData.under_15_deg_pct != null ? `${routeData.under_15_deg_pct}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Rover Safety Clearance Banner */}
                  <div className="p-3 rounded-lg bg-[#191b20] border border-[#33363D] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${routeData.max_slope_deg <= 20.0 ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                      <span className="font-semibold text-white">Perseverance Autonomous Safety Clearance:</span>
                    </div>
                    <span className={routeData.max_slope_deg <= 20.0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {routeData.max_slope_deg <= 20.0 ? `PASSED (Max slope ${routeData.max_slope_deg}° ≤ 20.0° threshold)` : `HAZARD (Max slope ${routeData.max_slope_deg}° > 20.0° threshold)`}
                    </span>
                  </div>

                  {/* Route Comparison Card: Shortest vs Safest */}
                  <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-[#33363D] pb-1.5">
                      <span className="font-bold text-[#F3F3F3] uppercase text-[11px]">Route Comparison: Shortest Line vs. Cost-Weighted A*</span>
                      <span className="text-[10px] text-sky-400 font-semibold">Slope Penalty Factor: 2.0x</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-[#101114] rounded border border-emerald-500/40 space-y-1">
                        <div className="text-emerald-400 font-bold text-xs flex items-center space-x-1.5">
                          <span>✔</span>
                          <span>Cost-Optimized A* Trajectory (Selected)</span>
                        </div>
                        <div className="text-[11px] text-[#A6A8AD]">Distance: <strong className="text-white">{routeData.distance_km} km</strong></div>
                        <div className="text-[11px] text-[#A6A8AD]">Max Slope: <strong className="text-emerald-400">{routeData.max_slope_deg}°</strong></div>
                        <p className="text-[10px] text-emerald-300/80 pt-1">Follows low-angle depositional terraces, actively skirting steep delta scarps.</p>
                      </div>
                      <div className="p-2.5 bg-[#101114] rounded border border-[#33363D] space-y-1">
                        <div className="text-[#A6A8AD] font-bold text-xs flex items-center space-x-1.5">
                          <span>✖</span>
                          <span>Direct Euclidean Line (Unoptimized)</span>
                        </div>
                        <div className="text-[11px] text-[#A6A8AD]">Distance: <strong className="text-white">{routeData.direct_distance_km ?? 'N/A'} km</strong></div>
                        <div className="text-[11px] text-[#A6A8AD]">Max Slope: <strong className="text-rose-400">{routeData.direct_max_slope_deg != null ? `${routeData.direct_max_slope_deg}°` : 'N/A'}</strong></div>
                        <p className="text-[10px] text-rose-300/80 pt-1">Direct straight line crosses impassable crater rim cliffs, causing fatal rover tip-over.</p>
                      </div>
                    </div>
                  </div>

                  {/* Elevation Profile Graph */}
                  {renderElevationProfileSVG()}

                  {/* Slope Profile Graph with Steepest Section Highlight */}
                  {renderSlopeProfileSVG()}

                  {/* Waypoints Sample Table */}
                  <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F3F3F3] font-semibold uppercase">Traverse Waypoints ({routeData.route?.length} points)</span>
                      <span className="text-[#A6A8AD] text-[11px]">Interval: ~20m ground baseline</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-[#33363D] rounded text-[11px] font-mono">
                      <table className="w-full text-left">
                        <thead className="bg-[#101114] text-[#A6A8AD] sticky top-0">
                          <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Latitude</th>
                            <th className="p-2">Longitude</th>
                            <th className="p-2">Elevation</th>
                            <th className="p-2">Slope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#33363D]">
                          {routeData.route?.slice(0, 50).map((pt, i) => (
                            <tr key={i} className="hover:bg-[#22252c]/50">
                              <td className="p-2 text-[#A6A8AD]">{i + 1}</td>
                              <td className="p-2 text-[#F3F3F3]">{pt.lat}° N</td>
                              <td className="p-2 text-[#F3F3F3]">{pt.lng}° E</td>
                              <td className="p-2 text-sky-400">{pt.elevation_m} m</td>
                              <td className="p-2 text-emerald-400">{pt.slope_deg}°</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Assumptions & Disclosures */}
                  <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                    <h4 className="text-xs font-mono uppercase text-[#F3F3F3] font-semibold">Algorithm Assumptions & Disclosures</h4>
                    <ul className="text-xs space-y-1 font-mono text-[#A6A8AD] list-disc list-inside">
                      {(routeData.assumptions || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-[#191b20] border border-[#33363D] rounded-lg text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#D97745]/20 border border-[#D97745] flex items-center justify-center text-[#D97745] mx-auto">
                    <RouteIcon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#F3F3F3]">No Trajectory Active</h3>
                    <p className="text-xs text-[#A6A8AD] max-w-md mx-auto">
                      Navigate to the <strong>Explore Mars</strong> tab, click the map to select starting and destination waypoints (or load a mission preset), then click <strong>Compute Suggested Route</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="bg-[#D97745] hover:bg-[#B85C38] text-white px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors"
                  >
                    Open Explore Map
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="p-8 max-w-5xl mx-auto overflow-y-auto space-y-6">
              <div className="border-b border-[#33363D] pb-4">
                <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Planetary Geology & Rover Science</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">USGS Geologic Formations & Perseverance Milestones</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Schematic units after USGS SIM 3464 (approximate boundaries) and NASA Mars 2020 Perseverance mission exploration records.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#A6A8AD] tracking-wider font-semibold">
                    Primary Geological Units (Jezero Crater Delta)
                  </h3>
                  <span className="text-[10px] font-mono text-[#D97745]">USGS SIM 3464 Schematic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#191b20] border-l-4 border-amber-500 border border-[#33363D] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F3F3F3]">Western Delta Deposit (HNb)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Late Noachian (~3.7 Ga)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Rock Type:</strong> Sedimentary (Sandstones & Clays)
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Mineralogy:</strong> Smectite clays, Fe/Mg-carbonates, hydrated silica
                    </div>
                    <p className="text-xs text-[#A6A8AD] leading-relaxed pt-1">
                      Sedimentary river delta fan formed by inflow from Neretva Vallis into Lake Jezero. Outstanding priority for biosignature preservation.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#191b20] border-l-4 border-emerald-500 border border-[#33363D] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F3F3F3]">Séítah Formation (Ncf)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Early Noachian (~3.9 Ga)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Rock Type:</strong> Igneous (Olivine-Cumulate / Picrite)
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Mineralogy:</strong> Coarse olivine, augite pyroxene, carbonate alteration
                    </div>
                    <p className="text-xs text-[#A6A8AD] leading-relaxed pt-1">
                      Stratiform layered cumulate representing differentiated lava lake or subvolcanic sill on the Jezero basin floor prior to lake transgression.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#191b20] border-l-4 border-indigo-500 border border-[#33363D] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F3F3F3]">Máaz Formation (Hcf)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        Early Hesperian (~3.6 Ga)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Rock Type:</strong> Igneous (Basaltic / Pyroxene-rich)
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Mineralogy:</strong> Low/High-Ca pyroxenes, plagioclase, sulfate rinds
                    </div>
                    <p className="text-xs text-[#A6A8AD] leading-relaxed pt-1">
                      Pervasive crater floor basalt capping Séítah, providing crucial radiometric dating benchmarks for Mars crater chronology.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#191b20] border-l-4 border-pink-500 border border-[#33363D] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F3F3F3]">Neretva Vallis (HNch)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono">
                        Late Noachian (~3.8 Ga)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Rock Type:</strong> Fluvial Breach / Conglomerates
                    </div>
                    <div className="text-[11px] text-[#A6A8AD] font-mono">
                      <strong>Mineralogy:</strong> Polymict breccia & upstream clay clasts
                    </div>
                    <p className="text-xs text-[#A6A8AD] leading-relaxed pt-1">
                      Breached inlet channel on western crater rim that once discharged into the open-basin lake.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#A6A8AD] tracking-wider font-semibold">
                    Perseverance Rover Cored Samples & Milestones (Approximate Sols)
                  </h3>
                  <span className="text-[10px] font-mono text-[#A6A8AD]">Source: NASA Mars 2020 Mission Releases</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol 0</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Octavia E. Butler Landing (Approx. Sol 0)</span>
                        <span className="text-[10px] text-[#A6A8AD] font-mono">(18.4447°N, 77.4508°E)</span>
                      </div>
                      <p className="text-xs text-[#A6A8AD] mt-0.5">Touchdown site inside Jezero Crater floor. Initiated the Mars 2020 mission.</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#D97745] bg-[#22252c] px-2 py-1 rounded border border-[#33363D]">
                      -2,567 m
                    </span>
                  </div>

                  <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol ~180</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Bastide & Rochette (Approx. Sol 180–198)</span>
                        <span className="text-[10px] text-[#A6A8AD] font-mono">(18.4285°N, 77.4419°E)</span>
                      </div>
                      <p className="text-xs text-[#A6A8AD] mt-0.5">Montdenier & Montagnac cored samples confirming olivine-cumulate igneous basement.</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#D97745] bg-[#22252c] px-2 py-1 rounded border border-[#33363D]">
                      -2,562 m
                    </span>
                  </div>

                  <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol ~420</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Three Forks Delta Entry Point (Approx. Sol 420)</span>
                        <span className="text-[10px] text-[#A6A8AD] font-mono">(18.4352°N, 77.4208°E)</span>
                      </div>
                      <p className="text-xs text-[#A6A8AD] mt-0.5">Sample depot staging location; contact between crater floor and delta fan.</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#D97745] bg-[#22252c] px-2 py-1 rounded border border-[#33363D]">
                      -2,565 m
                    </span>
                  </div>

                  <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol ~550</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Wildcat Ridge Clastics (Approx. Sol 550)</span>
                        <span className="text-[10px] text-[#A6A8AD] font-mono">(18.4412°N, 77.4081°E)</span>
                      </div>
                      <p className="text-xs text-[#A6A8AD] mt-0.5">SHERLOC UV Raman detected aromatic organic molecules in fine-grained lacustrine mudstones.</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#D97745] bg-[#22252c] px-2 py-1 rounded border border-[#33363D]">
                      -2,538 m
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="p-8 max-w-4xl mx-auto overflow-y-auto space-y-6">
              <div className="border-b border-[#33363D] pb-4">
                <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Project Overview & Provenance</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">Astro-nah: Martian Surface Exploration & Navigation</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Engineered for the NASA Space Apps Challenge 2026.
                </p>
              </div>

              <div className="space-y-4 text-xs text-[#A6A8AD] leading-relaxed">
                {/* Data Sources and Credits Block */}
                <div className="p-5 bg-[#191b20] rounded-lg border border-[#33363D] space-y-3">
                  <div className="flex items-center space-x-2 text-[#F3F3F3] font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#D97745]" />
                    <span>Data Sources, Provenance & Scientific Credits</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div className="p-3 bg-[#101114] rounded border border-[#33363D] space-y-1">
                      <span className="text-white font-bold block">1. MRO CTX Surface Mosaic (~6m/px)</span>
                      <p className="text-[11px] text-[#A6A8AD]">
                        Context Camera (CTX) regional visible-spectrum orthomosaic. Courtesy of NASA / JPL-Caltech / MSSS.
                      </p>
                    </div>
                    <div className="p-3 bg-[#101114] rounded border border-[#33363D] space-y-1">
                      <span className="text-white font-bold block">2. USGS Jezero TRN CTX DTM (20m/px)</span>
                      <p className="text-[11px] text-[#A6A8AD]">
                        Mars 2020 Terrain-Relative Navigation digital elevation model. Courtesy of USGS Astrogeology Science Center.
                      </p>
                    </div>
                    <div className="p-3 bg-[#101114] rounded border border-[#33363D] space-y-1">
                      <span className="text-white font-bold block">3. USGS Geologic Map (SIM 3464)</span>
                      <p className="text-[11px] text-[#A6A8AD]">
                        Sun, V. Z., & Stack, K. M. (2020), <em>Geologic map of Jezero crater</em>, USGS SIM 3464. Rendered with schematic unit boundaries.
                      </p>
                    </div>
                    <div className="p-3 bg-[#101114] rounded border border-[#33363D] space-y-1">
                      <span className="text-white font-bold block">4. NASA Mars Trek & Perseverance Records</span>
                      <p className="text-[11px] text-[#A6A8AD]">
                        Solar System Treks Project / JPL-Caltech (Viking MDIM2.1 & HiRISE WMTS stream) and NASA Mars 2020 Science Team traverse milestones.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technology & Algorithms */}
                <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                  <div className="text-[#F3F3F3] font-semibold font-mono text-sm">System Architecture & Pathfinding Engine</div>
                  <p>
                    Astro-nah couples a <strong>FastAPI + Rasterio</strong> spatial computing backend with a <strong>Cost-Weighted A* Pathfinding Engine</strong>. Physical slope gradients are derived on-the-fly using central finite differences on true 20m ground spacing. Paths apply a steep quadratic resistance penalty to inclines above 15° and impassability constraints above 20°, navigating through natural saddles and depositional ramps.
                  </p>
                </div>

                {/* Disclaimer */}
                <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                  <div className="flex items-center space-x-2 text-[#F3F3F3] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Scientific Rigor & Disclaimer</span>
                  </div>
                  <p>
                    Astro-nah is a scientific navigation prototype and concept demonstration created for the NASA Space Apps Challenge 2026. It is not an officially certified astronaut life-support or rover autopilot clearance system. Terrain analysis and trajectories reflect mathematical models applied to orbital remote sensing data and cannot resolve sub-pixel physical obstacles (&lt;20m boulders, loose sand drift).
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        <StatusPanel
          backendStatus={backendStatus}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          routeData={routeData}
        />
      </div>

      <BottomBar
        cursorCoords={cursorCoords}
        startPoint={startPoint}
        destinationPoint={destinationPoint}
      />
    </div>
  );
}
