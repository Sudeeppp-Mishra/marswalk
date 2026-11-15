import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scan, 
  Sparkles
} from 'lucide-react';
import { getHiRISECropUrl } from '../../services/api';

const LANDMARKS = [
  {
    id: "kodiak_butte",
    name: "Kodiak Butte Delta Remnant",
    coords: [18.4231, 77.4125],
    elevation_m: -2480.0,
    feature_type: "Stratigraphic Remnant Mesa",
    desc: "Isolated flat-topped butte preserving Gilbert-type delta bottomset, foreset, and topset beds that proved the ancient lake depth."
  },
  {
    id: "wildcat_ridge",
    name: "Wildcat Ridge Clastic Outcrop",
    coords: [18.4395, 77.4120],
    elevation_m: -2534.6,
    feature_type: "Sedimentary Mudstone Facies",
    desc: "Fine-grained clay mudstones rich in organic aromatics deposited in quiet ancient waters at the delta front."
  },
  {
    id: "belva_crater",
    name: "Belva Impact Crater Rim",
    coords: [18.4550, 77.3820],
    elevation_m: -2410.0,
    feature_type: "Post-Delta Impact Crater (~1 km dia)",
    desc: "Natural geological trench cutting through the delta, exposing internal stratigraphy and megabreccia blocks in 3D cross-section."
  },
  {
    id: "three_forks_depot",
    name: "Three Forks Sample Cache Depot",
    coords: [18.4352, 77.4208],
    elevation_m: -2565.1,
    feature_type: "Mars Sample Return (MSR) Cache",
    desc: "Smooth, boulder-free sandy apron chosen by NASA as the surface backup repository where 10 titanium sample tubes were safely deposited."
  },
  {
    id: "neretva_canyon",
    name: "Neretva Vallis Inflow Gorge",
    coords: [18.4720, 77.3350],
    elevation_m: -2350.0,
    feature_type: "Paleofluvial Breach Valley",
    desc: "Breached canyon through the western crater rim carved by catastrophic deluge river floods entering Lake Jezero."
  },
  {
    id: "seitah_outcrop",
    name: "South Séítah Olivine Cumulate",
    coords: [18.4285, 77.4419],
    elevation_m: -2562.4,
    feature_type: "Layered Igneous Intrusive Basement",
    desc: "Coarse-grained olivine-cumulate bedrock exposed between active ripple dunes, showing ancient groundwater alteration."
  }
];

export default function HiRISEInspectorModal({ 
  isOpen, 
  onClose, 
  currentCoords, 
  onSelectWaypoint,
  routeData 
}) {
  const [selectedLandmark, setSelectedLandmark] = useState(LANDMARKS[0]);
  const [apertureRadiusM, setApertureRadiusM] = useState(120); // 120m ground radius (~240m across)
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const HIRISE_BOUNDS = {
    minLat: 18.32,
    maxLat: 18.66,
    minLng: 77.23,
    maxLng: 77.58
  };

  useEffect(() => {
    if (currentCoords && currentCoords.lat && currentCoords.lng) {
      const lat = Number(currentCoords.lat);
      const lng = Number(currentCoords.lng);

      // Check if near any landmark
      const match = LANDMARKS.find(l => 
        Math.abs(l.coords[0] - lat) < 0.015 &&
        Math.abs(l.coords[1] - lng) < 0.015
      );
      if (match) {
        setSelectedLandmark(match);
        setImgError(false);
      } else if (
        lat >= HIRISE_BOUNDS.minLat && 
        lat <= HIRISE_BOUNDS.maxLat && 
        lng >= HIRISE_BOUNDS.minLng && 
        lng <= HIRISE_BOUNDS.maxLng
      ) {
        // Valid coordinate inside HiRISE footprint
        setSelectedLandmark({
          id: "custom_target",
          name: "Custom Surface Target",
          coords: [lat, lng],
          elevation_m: currentCoords.elevation || -2550.0,
          feature_type: "Orbital Remote Target",
          desc: "Targeted sub-meter inspection aperture centered on user selected coordinate."
        });
        setImgError(false);
      } else {
        // Coordinate is outside HiRISE swath, default to primary Kodiak Butte
        setSelectedLandmark(LANDMARKS[0]);
        setImgError(false);
      }
    }
  }, [currentCoords, isOpen]);

  if (!isOpen) return null;

  const lat = selectedLandmark.coords[0];
  const lng = selectedLandmark.coords[1];
  const cropUrl = getHiRISECropUrl(lat, lng, apertureRadiusM, 512);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#191b20] border border-[#33363D] rounded-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col font-mono text-xs text-[#F3F3F3]">
        {/* Modal Header */}
        <div className="p-3.5 px-4 border-b border-[#33363D] flex items-center justify-between bg-[#14161a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-purple-500/20 border border-purple-500/60 flex items-center justify-center text-purple-400">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide text-white">HiRISE 25cm ULTRA-HD INSPECTION LENS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  LOCAL 9.1 GB TIF ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-[#A6A8AD]">
                Sub-meter optical imagery extracted directly from authentic 85,600 × 85,952 px MRO GeoTIFF
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#22252c] text-[#A6A8AD] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Landmark Selector Tabs */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#A6A8AD] uppercase font-bold tracking-wider">
              Select Jezero Crater Scientific Landmark:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {LANDMARKS.map(lm => (
                <button
                  key={lm.id}
                  onClick={() => {
                    setSelectedLandmark(lm);
                    setImgLoaded(false);
                    setImgError(false);
                  }}
                  className={`p-2 rounded text-left border transition-all ${
                    selectedLandmark.id === lm.id
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                      : 'bg-[#101114] border-[#33363D] text-[#A6A8AD] hover:border-purple-500/50 hover:text-white'
                  }`}
                >
                  <div className="font-bold truncate text-[11px]">{lm.name}</div>
                  <div className="text-[9px] text-[#A6A8AD] truncate">{lm.feature_type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Inspection Viewport & Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: 25cm Imagery Viewport */}
            <div className="space-y-2">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-purple-500/40 bg-[#101114] flex items-center justify-center shadow-xl">
                {!imgLoaded && !imgError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-[#A6A8AD] bg-[#101114]/80 z-10">
                    <Scan className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-[11px]">Extracting 25cm raster window from 9.1GB GeoTIFF...</span>
                  </div>
                )}
                {imgError ? (
                  <div className="p-6 text-center text-xs flex flex-col items-center justify-center space-y-3">
                    <span className="text-amber-400 font-bold">Outside HiRISE Swath Coverage</span>
                    <p className="text-[11px] text-[#A6A8AD] max-w-xs leading-relaxed">
                      Coordinates ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E) fall outside the authentic 25cm orbital swath (18.32°–18.66°N).
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLandmark(LANDMARKS[0]);
                        setImgError(false);
                      }}
                      className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-lg transition-colors"
                    >
                      Inspect Kodiak Butte (25cm Swath)
                    </button>
                  </div>
                ) : (
                  <img
                    src={cropUrl}
                    alt={selectedLandmark.name}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => { setImgError(true); setImgLoaded(false); }}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                )}

                {/* HUD Overlay Reticle */}
                <div className="absolute inset-0 pointer-events-none border border-white/10">
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-purple-300 border border-purple-500/40">
                    RESOLUTION: 0.25 m / px
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-white border border-white/20">
                    FIELD: {apertureRadiusM * 2}m × {apertureRadiusM * 2}m
                  </div>
                  {/* Center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-purple-400/50 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    </div>
                  </div>
                  {/* Scale bar in bottom right — dynamic based on aperture */}
                  {(() => {
                    const fieldDiameter = apertureRadiusM * 2;
                    const scaleM = fieldDiameter <= 150 ? 25 : fieldDiameter <= 300 ? 50 : 100;
                    const scalePct = (scaleM / fieldDiameter) * 100;
                    return (
                      <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-1 rounded border border-[#33363D] text-[9px] text-[#F3F3F3]">
                        <div className="h-1 bg-white mb-0.5" style={{ width: `${Math.min(scalePct, 50)}%`, minWidth: '24px' }}></div>
                        <span>{scaleM} meters</span>
                      </div>
                    );
                  })()}

                  {/* Route overlay — shows computed path within viewport */}
                  {routeData?.route?.length > 1 && (() => {
                    const fieldRadius = apertureRadiusM;
                    const mPerDegLat = 59274;
                    const mPerDegLng = mPerDegLat * Math.cos(lat * Math.PI / 180);
                    const latMin = lat - fieldRadius / mPerDegLat;
                    const latMax = lat + fieldRadius / mPerDegLat;
                    const lngMin = lng - fieldRadius / mPerDegLng;
                    const lngMax = lng + fieldRadius / mPerDegLng;

                    const pts = routeData.route
                      .filter(p => p.lat >= latMin && p.lat <= latMax && p.lng >= lngMin && p.lng <= lngMax)
                      .map(p => ({
                        x: ((p.lng - lngMin) / (lngMax - lngMin)) * 100,
                        y: (1 - (p.lat - latMin) / (latMax - latMin)) * 100
                      }));

                    if (pts.length < 2) return null;
                    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                    return (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.9" />
                        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Aperture Width Controls */}
              <div className="flex items-center justify-between text-[11px] p-2 rounded bg-[#101114] border border-[#33363D]">
                <span className="text-[#A6A8AD]">Inspection Aperture:</span>
                <div className="flex space-x-1.5">
                  {[60, 120, 250].map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setApertureRadiusM(r);
                        setImgLoaded(false);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                        apertureRadiusM === r 
                          ? 'bg-purple-600 text-white font-bold' 
                          : 'bg-[#22252c] text-[#A6A8AD] hover:text-white'
                      }`}
                    >
                      {r * 2}m Box
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Scientific Interpretation & Feature Breakdown */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#101114] border border-[#33363D] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{selectedLandmark.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22252c] text-[#D97745]">
                      {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-300 font-semibold">{selectedLandmark.feature_type}</div>
                  <p className="text-[11px] text-[#A6A8AD] leading-relaxed pt-1">
                    {selectedLandmark.desc}
                  </p>
                </div>

                {/* Sub-Meter Visible Features List */}
                <div className="p-3 rounded-lg bg-[#101114] border border-[#33363D] space-y-2">
                  <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Resolvable at 25 cm/pixel Ground Resolution:</span>
                  </div>
                  <ul className="text-[11px] text-[#A6A8AD] space-y-1.5 list-disc list-inside">
                    <li><strong className="text-white">Individual Mega-Boulders (&gt;1m)</strong>: Discrete rock fall blocks and impact ejecta fragments.</li>
                    <li><strong className="text-white">Aeolian Ripple Fields</strong>: Transverse aeolian ridges (TARs) and active wind-blown sand dunes.</li>
                    <li><strong className="text-white">Delta Stratification</strong>: Discrete sedimentary bedding planes, channel incisions, and scarp layers.</li>
                    <li><strong className="text-white">Traverse Traction Feasibility</strong>: Identifies firm rock pavement vs. loose hazard dunes.</li>
                  </ul>
                </div>
              </div>

              {/* Waypoint Actions */}
              {onSelectWaypoint && (
                <div className="flex space-x-2 pt-2 border-t border-[#33363D]">
                  <button
                    onClick={() => {
                      onSelectWaypoint('start', { lat, lng });
                      onClose();
                    }}
                    className="flex-1 py-2 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-mono text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>● Set as Origin</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectWaypoint('destination', { lat, lng });
                      onClose();
                    }}
                    className="flex-1 py-2 rounded bg-[#D97745] hover:bg-[#B85C38] text-white font-mono text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>★ Set as Target</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4 border-t border-[#33363D] bg-[#14161a] flex items-center justify-between text-[11px] text-[#A6A8AD]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Dataset: <strong>JEZ_hirise_soc_006 (NASA / JPL / Univ. of Arizona)</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#22252c] hover:bg-[#33363D] text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

