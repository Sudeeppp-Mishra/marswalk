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
                    Slope = arctan(√((dz/dx)² + (dz/dy)²))
                  </div>
                  <p className="text-xs text-[#A6A8AD] leading-relaxed">
                    Calculated using true pixel spatial resolution (meters per pixel) rather than raw grid indexing to preserve metric ground distance.
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

              <div className="bg-[#191b20] border border-[#33363D] rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold font-mono text-[#F3F3F3]">Selected Waypoints</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#101114] rounded border border-[#33363D]">
                    <span className="text-[#A6A8AD]">Origin:</span>
                    <div className="text-[#F3F3F3] mt-1 font-semibold">
                      {startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : 'None (click on map in Explore tab)'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#101114] rounded border border-[#33363D]">
                    <span className="text-[#A6A8AD]">Destination:</span>
                    <div className="text-[#F3F3F3] mt-1 font-semibold">
                      {destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : 'None (click on map in Explore tab)'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#22252c] rounded border border-[#33363D] text-xs space-y-2">
                  <div className="font-mono font-medium text-[#D97745]">A* Cost Weighting Model:</div>
                  <div className="font-mono text-[#A6A8AD] text-[11px]">
                    Total Cost = Distance Cost + Terrain Penalty + Hazard Penalty + Uncertainty Penalty
                  </div>
                  <p className="text-[11px] text-[#A6A8AD]">
                    All paths generated are suggested trajectories based on available orbital data models.
                  </p>
                </div>
              </div>
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

