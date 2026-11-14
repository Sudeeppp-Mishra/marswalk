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
          <span className="text-sky-400">Range: {minElev.toFixed(0)}m to {maxElev.toFixed(0)}m (Δ {(maxElev - minElev).toFixed(0)}m)</span>
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#101114] text-[#F3F3F3] overflow-hidden select-none">
      <Header backendStatus={backendStatus} activeTab={activeTab} />

      <div className="flex flex-1 overflow-hidden">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#101114]">
          {activeTab === 'explore' && (
            <MarsMap
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
                <h3 className="font-semibold text-sm text-[#F3F3F3]">Coverage Statistics (Authentic DTM)</h3>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">TOTAL DISTANCE</span>
                      <div className="text-base font-bold text-sky-400 mt-1">{routeData.distance_km} km</div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">DIFFICULTY</span>
                      <div className="text-base font-bold text-emerald-400 mt-1">{routeData.estimated_difficulty}</div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">ELEVATION GAIN</span>
                      <div className="text-base font-bold text-[#F3F3F3] mt-1">+{routeData.elevation_gain_m} m</div>
                    </div>
                    <div className="p-3 bg-[#191b20] rounded border border-[#33363D]">
                      <span className="text-[#A6A8AD] text-[10px]">MAX SLOPE</span>
                      <div className="text-base font-bold text-[#D97745] mt-1">{routeData.max_slope_deg}°</div>
                    </div>
                  </div>

                  {/* Elevation Profile Graph */}
                  {renderElevationProfileSVG()}

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
                      {routeData.assumptions.map((item, idx) => (
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
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">USGS Geologic Formations & Perseverance Observations</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Authentic geological mappings from the USGS Planetary Geologic Mapping Program (SIM 3464) and Mars 2020 Perseverance mission.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase text-[#A6A8AD] tracking-wider font-semibold">
                  Primary Geological Units (Jezero Crater Delta)
                </h3>
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
                <h3 className="font-mono text-xs uppercase text-[#A6A8AD] tracking-wider font-semibold">
                  Perseverance Rover Cored Samples & Milestones
                </h3>
                <div className="space-y-2">
                  <div className="p-3 bg-[#191b20] rounded-lg border border-[#33363D] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol 0</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Octavia E. Butler Landing</span>
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
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol 180</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Bastide & Rochette (Séítah)</span>
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
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol 420</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Three Forks Delta Entry Point</span>
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
                        <span className="text-xs font-bold text-emerald-400 font-mono">Sol 550</span>
                        <span className="text-xs font-semibold text-[#F3F3F3]">Wildcat Ridge (Delta Clastics)</span>
                        <span className="text-[10px] text-[#A6A8AD] font-mono">(18.4412°N, 77.4081°E)</span>
                      </div>
                      <p className="text-xs text-[#A6A8AD] mt-0.5">SHERLOC UV Raman detected high concentration of aromatic organic molecules in mudstones.</p>
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
                  <span>Project Overview</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">Astro-nah: Navigating the Unknown</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Developed for the NASA Space Apps Challenge 2026.
                </p>
              </div>

              <div className="space-y-4 text-xs text-[#A6A8AD] leading-relaxed">
                <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                  <div className="flex items-center space-x-2 text-[#F3F3F3] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Scientific Rigor & Disclaimer</span>
                  </div>
                  <p>
                    Astro-nah is a scientific navigation prototype and concept demonstration. It is not an officially certified astronaut life-support or safety clearance system. Terrain analysis and routes reflect mathematical models applied to orbital remote sensing data and may not resolve sub-pixel physical obstacles.
                  </p>
                </div>

                <div className="p-4 bg-[#191b20] rounded-lg border border-[#33363D] space-y-2">
                  <div className="text-[#F3F3F3] font-semibold font-mono">NASA Challenge Resources</div>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                    <li>JPL Mars Trek (trek.nasa.gov/mars)</li>
                    <li>USGS Planetary Geologic Mapping Program</li>
                    <li>Mars Perseverance Raw Images Gallery</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>

        <StatusPanel
          activeTab={activeTab}
          backendStatus={backendStatus}
          datasets={datasets}
          cursorCoords={cursorCoords}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          activeLayer={activeLayer}
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
