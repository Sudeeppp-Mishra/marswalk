import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  ImageOverlay, 
  Marker, 
  Popup, 
  Rectangle,
  useMapEvents 
} from 'react-leaflet';
import { 
  Crosshair, 
  Layers, 
  MapPin, 
  Eye, 
  AlertCircle, 
  Compass, 
  Navigation as NavIcon,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import { getOverlayUrl, getTerrainAtPoint } from '../../services/api';

// Bounding box of the authentic Jezero CTX mosaic & DTM
// [south, west] to [north, east]
const JEZERO_BOUNDS = [
  [18.2110274, 77.1604655],
  [18.7211945, 77.6991776]
];

const JEZERO_CENTER = [18.38, 77.58];

// Scientific Landmarks
const LANDMARKS = [
  {
    name: 'Octavia E. Butler Landing',
    type: 'Perseverance Rover Site',
    coords: [18.4447, 77.4508],
    description: 'Mars 2020 landing site (Feb 18, 2021). Elevation: -2570m.'
  },
  {
    name: 'Kodiak Butte (Delta Remnant)',
    type: 'Geological Formation',
    coords: [18.4231, 77.4125],
    description: 'Prominent erosional butte displaying distinct deltaic horizontal layering.'
  },
  {
    name: 'Delta Scarp Front',
    type: 'Sedimentary Fan',
    coords: [18.4350, 77.4200],
    description: 'Frontal escarpment of the ancient river delta.'
  }
];

// Helper component for mouse tracking and click handlers
function MapEventsHandler({ onCursorMove, onMapClick }) {
  const throttleRef = useRef(0);

  useMapEvents({
    mousemove(e) {
      const now = Date.now();
      if (now - throttleRef.current > 120) {
        throttleRef.current = now;
        onCursorMove(e.latlng.lat, e.latlng.lng);
      }
    },
    click(e) {
      onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    }
  });

  return null;
}

export default function MarsMap({ 
  onCursorChange, 
  startPoint, 
  destinationPoint, 
  onSelectPoint,
  activeLayer,
  setActiveLayer 
}) {
  const [terrainSample, setTerrainSample] = useState(null);
  const [showLandmarks, setShowLandmarks] = useState(true);

  const handleCursorMove = async (lat, lng) => {
    // 1. Report coordinates immediately to parent
    onCursorChange({ 
      lat: lat.toFixed(4), 
      lng: lng.toFixed(4),
      elevation: terrainSample?.elevation_m,
      slope: terrainSample?.slope_deg,
      risk_tier: terrainSample?.risk_tier
    });

    // 2. Query point terrain from backend if within Jezero bounds
    if (
      lat >= JEZERO_BOUNDS[0][0] && lat <= JEZERO_BOUNDS[1][0] &&
      lng >= JEZERO_BOUNDS[0][1] && lng <= JEZERO_BOUNDS[1][1]
    ) {
      const sample = await getTerrainAtPoint(lat.toFixed(4), lng.toFixed(4));
      if (sample && sample.valid) {
        setTerrainSample(sample);
        onCursorChange({ 
          lat: lat.toFixed(4), 
          lng: lng.toFixed(4),
          elevation: sample.elevation_m,
          slope: sample.slope_deg,
          risk_tier: sample.risk_tier
        });
      }
    }
  };

  const handleMapClick = (lat, lng) => {
    if (!startPoint) {
      onSelectPoint('start', { lat, lng });
    } else if (!destinationPoint) {
      onSelectPoint('destination', { lat, lng });
    } else {
      onSelectPoint('start', { lat, lng });
      onSelectPoint('destination', null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#101114] overflow-hidden flex flex-col">
      {/* Top HUD Layer Selector */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        <div className="bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg p-1.5 flex items-center space-x-1 shadow-xl">
          <button
            onClick={() => setActiveLayer('ctx')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
              activeLayer === 'ctx'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>MRO CTX Mosaic (6m)</span>
          </button>
          <button
            onClick={() => setActiveLayer('elevation')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
              activeLayer === 'elevation'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            <span>Elevation DEM (20m)</span>
          </button>
          <button
            onClick={() => setActiveLayer('slope')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
              activeLayer === 'slope'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            <span>Slope Hazard</span>
          </button>
          <button
            onClick={() => setActiveLayer('viking')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeLayer === 'viking'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            Global Base (Viking)
          </button>
        </div>

        {/* Toggle Landmarks Button */}
        <button
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`px-3 py-1.5 rounded text-xs font-mono border backdrop-blur-md transition-colors ${
            showLandmarks 
              ? 'bg-[#22252c] text-emerald-400 border-emerald-500/40' 
              : 'bg-[#191b20]/90 text-[#A6A8AD] border-[#33363D]'
          }`}
        >
          {showLandmarks ? 'Landmarks: Visible' : 'Landmarks: Hidden'}
        </button>
      </div>

      {/* Top Right Waypoint Indicators */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg px-3 py-2 text-xs font-mono shadow-xl flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span className="text-[#A6A8AD]">START:</span>
          <span className="text-[#F3F3F3]">
            {startPoint ? `${startPoint.lat}°, ${startPoint.lng}°` : 'Click map to place'}
          </span>
        </div>
        <div className="w-[1px] h-4 bg-[#33363D]"></div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97745] inline-block animate-pulse"></span>
          <span className="text-[#A6A8AD]">DEST:</span>
          <span className="text-[#F3F3F3]">
            {destinationPoint ? `${destinationPoint.lat}°, ${destinationPoint.lng}°` : 'Click map to place'}
          </span>
        </div>
      </div>

      {/* Main Map Container */}
      <MapContainer
        center={JEZERO_CENTER}
        zoom={11}
        minZoom={8}
        maxZoom={15}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <MapEventsHandler 
          onCursorMove={handleCursorMove} 
          onMapClick={handleMapClick} 
        />

        {/* Base Layer: JPL Mars Trek Viking Global 232m Color Mosaic */}
        <TileLayer
          attribution='&copy; NASA/JPL/USGS Mars Trek'
          url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg"
          maxNativeZoom={7}
          maxZoom={15}
        />

        {/* Authentic Layer 1: MRO CTX Mosaic (6m/pixel) from JPL Mars Trek */}
        {(activeLayer === 'ctx' || activeLayer === 'elevation' || activeLayer === 'slope') && (
          <TileLayer
            attribution='&copy; NASA/JPL/MSSS MRO Context Camera (CTX)'
            url="https://trek.nasa.gov/tiles/Mars/EQ/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/1.0.0//default/default028mm/{z}/{y}/{x}.png"
            minZoom={8}
            maxNativeZoom={13}
            maxZoom={15}
            opacity={activeLayer === 'ctx' ? 1.0 : 0.35}
            bounds={JEZERO_BOUNDS}
          />
        )}

        {/* Authentic Layer 2: 20m CTX DTM Elevation Color Overlay */}
        {activeLayer === 'elevation' && (
          <ImageOverlay
            url={getOverlayUrl('elevation')}
            bounds={JEZERO_BOUNDS}
            opacity={0.8}
          />
        )}

        {/* Authentic Layer 3: Derived Slope Hazard Map */}
        {activeLayer === 'slope' && (
          <ImageOverlay
            url={getOverlayUrl('slope')}
            bounds={JEZERO_BOUNDS}
            opacity={0.8}
          />
        )}

        {/* Jezero Delta Bounding Box Border */}
        <Rectangle
          bounds={JEZERO_BOUNDS}
          pathOptions={{
            color: '#D97745',
            weight: 1,
            fill: false,
            dashArray: '4, 4'
          }}
        />

        {/* Scientific Landmarks */}
        {showLandmarks && LANDMARKS.map((item, idx) => (
          <Marker key={idx} position={item.coords}>
            <Popup>
              <div className="p-1 font-mono text-xs max-w-xs space-y-1">
                <div className="font-bold text-[#D97745]">{item.name}</div>
                <div className="text-[10px] uppercase text-[#A6A8AD]">{item.type}</div>
                <p className="text-[11px] leading-tight text-[#F3F3F3]">{item.description}</p>
                <div className="text-[10px] text-[#A6A8AD]">
                  Coords: {item.coords[0]}° N, {item.coords[1]}° E
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Start Point Marker */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-emerald-400">START WAYPOINT</p>
                <p>Lat: {startPoint.lat}° N</p>
                <p>Lon: {startPoint.lng}° E</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Point Marker */}
        {destinationPoint && (
          <Marker position={[destinationPoint.lat, destinationPoint.lng]}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-[#D97745]">DESTINATION WAYPOINT</p>
                <p>Lat: {destinationPoint.lat}° N</p>
                <p>Lon: {destinationPoint.lng}° E</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend & Calibration Card */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#191b20]/95 border border-[#33363D] text-xs text-[#A6A8AD] rounded-lg p-3 max-w-xs backdrop-blur shadow-2xl">
        <div className="flex items-center justify-between font-mono text-xs text-[#F3F3F3] mb-1.5">
          <span className="font-bold text-[#D97745]">JEZERO DELTA COVERAGE</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22252c] text-emerald-400 border border-[#33363D]">
            AUTHENTIC
          </span>
        </div>
        
        {activeLayer === 'slope' && (
          <div className="space-y-1 pt-1 border-t border-[#33363D] font-mono text-[10px]">
            <div className="text-[#F3F3F3]">Slope Hazard Scale (Magma):</div>
            <div className="h-2 w-full rounded bg-gradient-to-r from-purple-950 via-rose-600 to-amber-300"></div>
            <div className="flex justify-between text-[9px] text-[#A6A8AD]">
              <span>0° (Flat)</span>
              <span>15° (Caution)</span>
              <span>&gt; 25° (Hazard)</span>
            </div>
          </div>
        )}

        {activeLayer === 'elevation' && (
          <div className="space-y-1 pt-1 border-t border-[#33363D] font-mono text-[10px]">
            <div className="text-[#F3F3F3]">Elevation Scale (Turbo):</div>
            <div className="h-2 w-full rounded bg-gradient-to-r from-blue-700 via-emerald-500 to-red-600"></div>
            <div className="flex justify-between text-[9px] text-[#A6A8AD]">
              <span>-2,710 m (Floor)</span>
              <span>-1,515 m (Crater Rim)</span>
            </div>
          </div>
        )}

        {activeLayer === 'ctx' && (
          <p className="text-[11px] leading-relaxed mt-1 text-[#A6A8AD]">
            MRO CTX Mosaic (~6m/pixel) from NASA JPL Mars Trek. Covers delta deposits and Perseverance traverse terrain.
          </p>
        )}
      </div>
    </div>
  );
}
