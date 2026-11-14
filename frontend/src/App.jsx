import React, { useState, useEffect } from 'react';
import Header from './components/Common/Header';
import Navigation from './components/Sidebar/Navigation';
import MarsMap from './components/Map/MarsMap';
import StatusPanel from './components/Common/StatusPanel';
import BottomBar from './components/Common/BottomBar';
import { checkBackendHealth, getDatasets } from './services/api';
import { Compass, Mountain, Sparkles, Navigation as RouteIcon, Info, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [backendStatus, setBackendStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [cursorCoords, setCursorCoords] = useState({ lat: null, lng: null });
  const [startPoint, setStartPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [activeLayer, setActiveLayer] = useState('ctx');
  const [routeData, setRouteData] = useState(null);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#101114] text-[#F3F3F3] overflow-hidden select-none">
      {/* Header */}
      <Header backendStatus={backendStatus} activeTab={activeTab} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Center Work Area */}
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
              <div className="border-b border-[#33363D] pb-4">
                <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                  <RouteIcon className="w-4 h-4" />
                  <span>A* Navigation Engine</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">Cost-Aware Surface Pathfinding</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Computes suggested exploration trajectories balancing scientific objectives, elevation changes, and terrain safety.
                </p>
              </div>

              {routeData ? (
                <div className="space-y-4">
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
                <div className="p-6 bg-[#191b20] border border-[#33363D] rounded-lg text-center space-y-3">
                  <p className="text-xs text-[#A6A8AD] font-mono">
                    No route currently computed. Go to the <strong className="text-[#F3F3F3]">Explore Mars</strong> tab, click on the map to set Origin and Destination points, and click <strong className="text-[#D97745]">Compute Suggested Route</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="p-8 max-w-4xl mx-auto overflow-y-auto space-y-6">
              <div className="border-b border-[#33363D] pb-4">
                <div className="flex items-center space-x-2 text-[#D97745] font-mono text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Scientific Context</span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F3F3F3]">USGS & Planetary Geologic Mapping</h1>
                <p className="text-sm text-[#A6A8AD] mt-1">
                  Authentic geological context and rover exploration history for Jezero Crater.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-2">
                  <h4 className="font-mono text-xs text-[#D97745] uppercase">Western Delta Deposit</h4>
                  <p className="text-xs text-[#A6A8AD] leading-relaxed">
                    Sedimentary fan formed by an ancient river system feeding into Lake Jezero during the Noachian–Hesperian transition (~3.7 Ga). High astrobiological priority for biosignature preservation.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#191b20] border border-[#33363D] space-y-2">
                  <h4 className="font-mono text-xs text-[#D97745] uppercase">Crater Floor Igneous Units</h4>
                  <p className="text-xs text-[#A6A8AD] leading-relaxed">
                    Olivine-cumulate (Séítah) and basaltic pyroxene-bearing units (Máaz) forming the floor beneath delta sediments, providing precise radiometric dating constraints.
                  </p>
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

        {/* Right Inspection & Telemetry Panel */}
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

      {/* Bottom Bar */}
      <BottomBar
        cursorCoords={cursorCoords}
        startPoint={startPoint}
        destinationPoint={destinationPoint}
      />
    </div>
  );
}

