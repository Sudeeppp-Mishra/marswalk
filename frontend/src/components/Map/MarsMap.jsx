import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  ImageOverlay, 
  Marker, 
  Popup, 
  Rectangle, 
  Polyline, 
  ZoomControl,
  useMap,
  useMapEvents 
} from 'react-leaflet';
import { 
  Crosshair, 
  Layers, 
  MapPin, 
  Eye, 
  EyeOff,
  AlertCircle, 
  Compass, 
  Navigation as NavIcon, 
  Play, 
  RotateCcw, 
  Sparkles, 
  TrendingUp, 
  Mountain, 
  Scan, 
  CheckCircle2,
  Sliders
} from 'lucide-react';
import L from 'leaflet';
import { getOverlayUrl, getTerrainAtPoint, calculateRoute, getGeologyData } from '../../services/api';

const JEZERO_BOUNDS = [
  [18.2110274, 77.1604655],
  [18.7211945, 77.6991776]
];

const HIRISE_BOUNDS = [
  [18.3067994, 77.2229331],
  [18.669315, 77.583964]
];

const JEZERO_CENTER = [18.38, 77.58];

// Futuristic Space HUD Icons for Start, Destination, and Rover Sols
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="background:#10B981; color:#064E3B; font-family:monospace; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; box-shadow:0 0 12px rgba(16,185,129,0.9); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:3px;">
    <span>●</span> ORIGIN
  </div>`,
  iconSize: [58, 22],
  iconAnchor: [29, 22]
});

const destIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `<div style="background:#D97745; color:#fff; font-family:monospace; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; box-shadow:0 0 12px rgba(217,119,69,0.9); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:3px;">
    <span>★</span> TARGET
  </div>`,
  iconSize: [58, 22],
  iconAnchor: [29, 22]
});

const createRoverIcon = (sol) => L.divIcon({
  className: 'custom-sol-marker',
  html: `<div style="background:#191b20/95; background-color: rgba(25, 27, 32, 0.9); color:#38BDF8; border:1px solid #38BDF8; font-family:monospace; font-size:9px; font-weight:bold; padding:1px 5px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.8); white-space:nowrap; cursor:pointer;">
    Sol ${sol}
  </div>`,
  iconSize: [46, 18],
  iconAnchor: [23, 9]
});

function RouteAutoFitter({ polylineCoords }) {
  const map = useMap();
  useEffect(() => {
    if (polylineCoords && polylineCoords.length > 1) {
      map.fitBounds(polylineCoords, { padding: [50, 50], maxZoom: 14 });
    }
  }, [polylineCoords, map]);
  return null;
}

function MapEventsHandler({ onCursorMove, onMapClick }) {
  const throttleRef = useRef(0);

  useMapEvents({
    mousemove(e) {
      const now = Date.now();
      if (now - throttleRef.current > 100) {
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
  setActiveLayer, 
  routeData, 
  setRouteData,
  maxSlope = 20.0,
  setMaxSlope
}) {
  const [terrainSample, setTerrainSample] = useState(null);
  
  // OFF BY DEFAULT so map starts 100% clean and pristine!
  const [showGeology, setShowGeology] = useState(false);
  const [showObservations, setShowObservations] = useState(false);

  const [geologyData, setGeologyData] = useState({ geological_units: [], rover_observations: [] });
  const [isCalculating, setIsCalculating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    async function loadGeology() {
      const data = await getGeologyData();
      if (data) setGeologyData(data);
    }
    loadGeology();
  }, []);

  const handleCursorMove = async (lat, lng) => {
    onCursorChange({ 
      lat: lat.toFixed(4), 
      lng: lng.toFixed(4),
      elevation: terrainSample?.elevation_m,
      slope: terrainSample?.slope_deg,
      risk_tier: terrainSample?.risk_tier
    });

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

  const isInsideBounds = (lat, lng) => {
    return lat >= JEZERO_BOUNDS[0][0] && lat <= JEZERO_BOUNDS[1][0] &&
           lng >= JEZERO_BOUNDS[0][1] && lng <= JEZERO_BOUNDS[1][1];
  };

  const handleMapClick = (lat, lng) => {
    if (!isInsideBounds(lat, lng)) {
      setFeedbackMsg({
        type: 'warning',
        text: 'Coordinate is outside Jezero DTM coverage (18.21°–18.72°N, 77.16°–77.70°E).'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    if (!startPoint) {
      onSelectPoint('start', { lat, lng });
      setFeedbackMsg({ type: 'info', text: 'Origin set. Click destination on the map.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else if (!destinationPoint) {
      onSelectPoint('destination', { lat, lng });
      setFeedbackMsg({ type: 'success', text: 'Waypoints set. Click "Compute Suggested Route".' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      onSelectPoint('start', { lat, lng });
      onSelectPoint('destination', null);
      setRouteData(null);
    }
  };

  const handleComputeRoute = async () => {
    if (!startPoint || !destinationPoint) return;
    setIsCalculating(true);
    setFeedbackMsg(null);

    const res = await calculateRoute(startPoint, destinationPoint, maxSlope);
    setIsCalculating(false);

    if (res && res.status === 'success') {
      setRouteData(res);
      setFeedbackMsg({ type: 'success', text: `Route computed: ${res.distance_km} km (${res.estimated_difficulty})` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res?.error || 'Path blocked by steep terrain hazards (> 20°).' });
    }
  };

  const handleResetPoints = () => {
    onSelectPoint('start', null);
    onSelectPoint('destination', null);
    setRouteData(null);
    setFeedbackMsg(null);
  };

  const handleApplyPreset = (preset) => {
    if (preset === 'perseverance_to_kodiak') {
      onSelectPoint('start', { lat: 18.4447, lng: 77.4508 });
      onSelectPoint('destination', { lat: 18.4231, lng: 77.4125 });
      setRouteData(null);
      setFeedbackMsg({ type: 'info', text: 'Loaded preset: Landing Site to Kodiak Butte.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else if (preset === 'delta_traverse') {
      onSelectPoint('start', { lat: 18.4352, lng: 77.4208 });
      onSelectPoint('destination', { lat: 18.4412, lng: 77.4081 });
      setRouteData(null);
      setFeedbackMsg({ type: 'info', text: 'Loaded preset: Three Forks to Wildcat Ridge.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const polylineCoords = routeData?.route?.map(pt => [pt.lat, pt.lng]) || [];

  return (
    <div className="relative w-full h-full bg-[#101114] overflow-hidden flex flex-col">
      {/* Top Map HUD Bar - Unified, responsive container to prevent any overlap */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none flex flex-col gap-2">
        {/* Row 1: Left controls (Layers & Science) + Right controls (Waypoints & Action) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left Group: Layers and Science Overlays */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Layer Selector */}
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-1 flex items-center space-x-1 shadow-xl">
              <button
                onClick={() => setActiveLayer('ctx')}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                  activeLayer === 'ctx'
                    ? 'bg-[#D97745] text-white font-medium shadow-md'
                    : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>CTX (6m)</span>
              </button>
              <button
                onClick={() => setActiveLayer('hirise')}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                  activeLayer === 'hirise'
                    ? 'bg-[#D97745] text-white font-medium shadow-md'
                    : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
                }`}
              >
                <Scan className="w-3.5 h-3.5 text-sky-400" />
                <span>HiRISE (25cm)</span>
              </button>
              <button
                onClick={() => setActiveLayer('elevation')}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                  activeLayer === 'elevation'
                    ? 'bg-[#D97745] text-white font-medium shadow-md'
                    : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
                }`}
              >
                <span>Elevation</span>
              </button>
              <button
                onClick={() => setActiveLayer('slope')}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                  activeLayer === 'slope'
                    ? 'bg-[#D97745] text-white font-medium shadow-md'
                    : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
                }`}
              >
                <span>Slope Hazard</span>
              </button>
              <button
                onClick={() => setActiveLayer('viking')}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeLayer === 'viking'
                    ? 'bg-[#D97745] text-white font-medium shadow-md'
                    : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
                }`}
              >
                Global Base
              </button>
            </div>

            {/* Science Overlays Toggles */}
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-1 flex items-center space-x-1 shadow-xl">
              <button
                onClick={() => setShowGeology(!showGeology)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono border transition-colors flex items-center space-x-1.5 ${
                  showGeology 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold' 
                    : 'bg-transparent text-[#A6A8AD] border-transparent hover:bg-[#22252c] hover:text-[#F3F3F3]'
                }`}
              >
                <span>USGS Geology</span>
                <span className={`text-[9px] px-1 rounded ${showGeology ? 'bg-amber-500 text-black font-bold' : 'bg-[#101114]'}`}>
                  {showGeology ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => setShowObservations(!showObservations)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono border transition-colors flex items-center space-x-1.5 ${
                  showObservations 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-semibold' 
                    : 'bg-transparent text-[#A6A8AD] border-transparent hover:bg-[#22252c] hover:text-[#F3F3F3]'
                }`}
              >
                <span>Rover Sols</span>
                <span className={`text-[9px] px-1 rounded ${showObservations ? 'bg-sky-400 text-black font-bold' : 'bg-[#101114]'}`}>
                  {showObservations ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Group: Waypoints & Route Action */}
          <div className="flex items-center gap-2 pointer-events-auto ml-auto">
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg px-3 py-1.5 text-xs font-mono shadow-xl flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-[#A6A8AD]">START:</span>
                <span className="text-[#F3F3F3]">
                  {startPoint ? `${startPoint.lat}°, ${startPoint.lng}°` : 'Click map'}
                </span>
              </div>
              <div className="w-[1px] h-3.5 bg-[#33363D]"></div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97745] inline-block animate-pulse"></span>
                <span className="text-[#A6A8AD]">DEST:</span>
                <span className="text-[#F3F3F3]">
                  {destinationPoint ? `${destinationPoint.lat}°, ${destinationPoint.lng}°` : 'Click map'}
                </span>
              </div>

              {(startPoint || destinationPoint) && (
                <button
                  onClick={handleResetPoints}
                  title="Reset Waypoints"
                  className="p-1 rounded hover:bg-[#22252c] text-[#A6A8AD] hover:text-rose-400 transition-colors ml-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Compute Route Trigger */}
            {startPoint && destinationPoint && !routeData && (
              <button
                onClick={handleComputeRoute}
                disabled={isCalculating}
                className="bg-[#D97745] hover:bg-[#B85C38] text-white px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold shadow-xl flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Play className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                <span>{isCalculating ? 'COMPUTING...' : 'COMPUTE ROUTE'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Mission Presets + Toast Notifications */}
        <div className="flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-1 flex items-center space-x-1.5 shadow-lg pointer-events-auto">
            <span className="text-[10px] font-mono uppercase text-[#A6A8AD] px-1.5">Presets:</span>
            <button
              onClick={() => handleApplyPreset('perseverance_to_kodiak')}
              className="px-2 py-1 rounded text-[11px] font-mono text-[#A6A8AD] hover:text-[#D97745] hover:bg-[#22252c] transition-colors"
            >
              Landing → Kodiak
            </button>
            <button
              onClick={() => handleApplyPreset('delta_traverse')}
              className="px-2 py-1 rounded text-[11px] font-mono text-[#A6A8AD] hover:text-[#D97745] hover:bg-[#22252c] transition-colors"
            >
              Delta Traverse
            </button>
          </div>

          {/* Notification Toast */}
          {feedbackMsg && (
            <div className={`pointer-events-auto text-xs font-mono px-3 py-1.5 rounded-lg max-w-sm shadow-xl backdrop-blur-md border transition-all ${
              feedbackMsg.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : feedbackMsg.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-[#191b20]/95 border-emerald-500/50 text-emerald-300'
            }`}>
              {feedbackMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={JEZERO_CENTER}
        zoom={11}
        minZoom={8}
        maxZoom={16}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <MapEventsHandler 
          onCursorMove={handleCursorMove} 
          onMapClick={handleMapClick} 
        />
        <RouteAutoFitter polylineCoords={polylineCoords} />

        {/* Global Mars Background Tile Layer */}
        <TileLayer
          attribution='&copy; NASA/JPL/USGS Mars Trek'
          url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg"
          maxNativeZoom={7}
          maxZoom={16}
        />

        {/* Authentic Local CTX Image Overlay (Rendered directly from user's downloaded GeoTIFF) */}
        {activeLayer === 'ctx' && (
          <ImageOverlay
            url={getOverlayUrl('ctx')}
            bounds={JEZERO_BOUNDS}
            opacity={1.0}
          />
        )}

        {/* HiRISE 25cm Ultra-HD Controlled Mosaic */}
        {activeLayer === 'hirise' && (
          <TileLayer
            attribution='&copy; NASA/JPL/Univ. of Arizona MRO HiRISE'
            url="https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0//default/default028mm/{z}/{y}/{x}.png"
            minZoom={10}
            maxNativeZoom={16}
            maxZoom={18}
            opacity={1.0}
            bounds={HIRISE_BOUNDS}
          />
        )}

        {/* 20m CTX DTM Elevation Color Overlay */}
        {activeLayer === 'elevation' && (
          <ImageOverlay
            url={getOverlayUrl('elevation')}
            bounds={JEZERO_BOUNDS}
            opacity={0.8}
          />
        )}

        {/* Derived Slope Hazard Map */}
        {activeLayer === 'slope' && (
          <ImageOverlay
            url={getOverlayUrl('slope')}
            bounds={JEZERO_BOUNDS}
            opacity={0.8}
          />
        )}

        {/* USGS Geological Units Polygons (Hidden by default, shown when toggled ON) */}
        {showGeology && geologyData.geological_units.map((unit) => (
          <Rectangle
            key={unit.id}
            bounds={[
              [unit.bounds.south, unit.bounds.west],
              [unit.bounds.north, unit.bounds.east]
            ]}
            pathOptions={{
              color: unit.color,
              weight: 1.5,
              fillColor: unit.color,
              fillOpacity: 0.12,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="p-1 font-mono text-xs max-w-sm space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#33363D] pb-1">
                  <span className="font-bold text-[#F3F3F3]">{unit.name}</span>
                  <span className="text-[10px] px-1 rounded bg-[#22252c] text-[#D97745]">
                    {unit.unit_symbol}
                  </span>
                </div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Type:</strong> {unit.rock_type}</div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Age:</strong> {unit.estimated_age}</div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Mineralogy:</strong> {unit.mineralogy}</div>
                <p className="text-[11px] text-[#F3F3F3] leading-relaxed pt-1">{unit.description}</p>
              </div>
            </Popup>
          </Rectangle>
        ))}

        {/* Authentic Perseverance Observation Stops (Hidden by default, shown when toggled ON with sleek badges) */}
        {showObservations && geologyData.rover_observations.map((obs, idx) => (
          <Marker 
            key={idx} 
            position={obs.coords}
            icon={createRoverIcon(obs.sol)}
          >
            <Popup>
              <div className="p-1 font-mono text-xs max-w-xs space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#33363D] pb-1">
                  <span className="font-bold text-sky-400">Sol {obs.sol}: {obs.name}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#22252c] text-[#A6A8AD]">
                    {obs.elevation_m}m
                  </span>
                </div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Campaign:</strong> {obs.campaign}</div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Sample:</strong> {obs.target_sample}</div>
                <div className="text-[10px] text-[#A6A8AD]"><strong className="text-[#F3F3F3]">Sensors:</strong> {obs.instrument}</div>
                <p className="text-[11px] text-[#F3F3F3] leading-tight pt-1">{obs.significance}</p>
                
                {/* 1-Click Action Buttons to Set as Origin or Destination */}
                <div className="flex space-x-2 pt-2 border-t border-[#33363D]">
                  <button
                    onClick={() => {
                      onSelectPoint('start', { lat: obs.coords[0], lng: obs.coords[1] });
                      setRouteData(null);
                    }}
                    className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white py-1 rounded text-[10px] font-mono transition-colors"
                  >
                    Set Origin
                  </button>
                  <button
                    onClick={() => {
                      onSelectPoint('destination', { lat: obs.coords[0], lng: obs.coords[1] });
                      setRouteData(null);
                    }}
                    className="flex-1 bg-[#D97745]/80 hover:bg-[#D97745] text-white py-1 rounded text-[10px] font-mono transition-colors"
                  >
                    Set Dest
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Computed Trajectory Polyline */}
        {polylineCoords.length > 0 && (
          <>
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#D97745',
                weight: 6,
                opacity: 0.4
              }}
            />
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#38BDF8',
                weight: 3,
                opacity: 0.95,
                dashArray: '6, 6'
              }}
            />
          </>
        )}

        {/* Start Point Marker (Draggable with futuristic badge) */}
        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lng]}
            icon={startIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onSelectPoint('start', { lat: Number(position.lat.toFixed(4)), lng: Number(position.lng.toFixed(4)) });
                setRouteData(null);
              }
            }}
          >
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-emerald-400">ORIGIN WAYPOINT</p>
                <p>Lat: {startPoint.lat}° N</p>
                <p>Lon: {startPoint.lng}° E</p>
                <p className="text-[10px] text-[#A6A8AD] mt-1">(Drag on terrain to reposition)</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Point Marker (Draggable with futuristic badge) */}
        {destinationPoint && (
          <Marker 
            position={[destinationPoint.lat, destinationPoint.lng]}
            icon={destIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onSelectPoint('destination', { lat: Number(position.lat.toFixed(4)), lng: Number(position.lng.toFixed(4)) });
                setRouteData(null);
              }
            }}
          >
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-[#D97745]">DESTINATION WAYPOINT</p>
                <p>Lat: {destinationPoint.lat}° N</p>
                <p>Lon: {destinationPoint.lng}° E</p>
                <p className="text-[10px] text-[#A6A8AD] mt-1">(Drag on terrain to reposition)</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Route Telemetry Card (When Route is Active) */}
      {routeData && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-[#191b20]/95 border border-[#33363D] text-xs font-mono rounded-lg p-4 max-w-sm backdrop-blur shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
            <div className="flex items-center space-x-1.5 text-sky-400 font-semibold">
              <NavIcon className="w-4 h-4" />
              <span>SUGGESTED TRAJECTORY</span>
            </div>
            <button
              onClick={handleResetPoints}
              className="text-[10px] text-[#A6A8AD] hover:text-rose-400 transition-colors"
            >
              Clear Route
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#22252c] p-2 rounded border border-[#33363D]">
              <span className="text-[#A6A8AD]">Distance:</span>
              <div className="text-[#F3F3F3] font-bold text-sm mt-0.5">
                {routeData.distance_km} km
              </div>
              <span className="text-[9px] text-[#A6A8AD]">({routeData.distance_meters?.toLocaleString()} m)</span>
            </div>

            <div className="bg-[#22252c] p-2 rounded border border-[#33363D]">
              <span className="text-[#A6A8AD]">Difficulty:</span>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">
                {routeData.estimated_difficulty}
              </div>
              <span className="text-[9px] text-[#A6A8AD]">Max Slope: {routeData.max_slope_deg}°</span>
            </div>

            <div className="bg-[#22252c] p-2 rounded border border-[#33363D]">
              <span className="text-[#A6A8AD]">Elev Gain:</span>
              <div className="text-[#F3F3F3] font-semibold mt-0.5">
                +{routeData.elevation_gain_m} m
              </div>
            </div>

            <div className="bg-[#22252c] p-2 rounded border border-[#33363D]">
              <span className="text-[#A6A8AD]">Elev Loss:</span>
              <div className="text-[#F3F3F3] font-semibold mt-0.5">
                -{routeData.elevation_loss_m} m
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#A6A8AD] leading-tight pt-1 border-t border-[#33363D]">
            Computed via A* over authentic 20m CTX DTM grid avoiding slopes &gt; {maxSlope}°.
          </div>
        </div>
      )}

      {/* Legend & Calibration Card */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#191b20]/95 border border-[#33363D] text-xs text-[#A6A8AD] rounded-lg p-3 max-w-xs backdrop-blur shadow-2xl">
        <div className="flex items-center justify-between font-mono text-xs text-[#F3F3F3] mb-1.5">
          <span className="font-bold text-[#D97745]">JEZERO DELTA COVERAGE</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22252c] text-emerald-400 border border-[#33363D]">
            AUTHENTIC
          </span>
        </div>
        
        {activeLayer === 'hirise' && (
          <p className="text-[11px] leading-relaxed text-sky-300 font-mono">
            MRO HiRISE Controlled Orthomosaic (25cm/pixel). Zoom in to inspect sub-meter boulder fields and sedimentary delta layers.
          </p>
        )}

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
            MRO CTX Mosaic (~6m/pixel). Displaying your local GeoTIFF from <code className="text-[#F3F3F3]">data/</code>.
          </p>
        )}
      </div>
    </div>
  );
}
