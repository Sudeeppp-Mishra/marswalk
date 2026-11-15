import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  ImageOverlay, 
  Marker, 
  Popup, 
  Polygon, 
  Polyline,
  Rectangle,
  CircleMarker,
  Pane,
  Tooltip,
  ZoomControl,
  AttributionControl,
  useMap,
  useMapEvents 
} from 'react-leaflet';
import { 
  Eye, 
  Scan, 
  Box,
  Mountain, 
  TrendingUp, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  Volume2, 
  VolumeX, 
  Grid, 
  Sliders, 
  Activity, 
  Compass, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Share2, 
  Ruler, 
  Truck, 
  User, 
  AlertTriangle, 
  HelpCircle, 
  Keyboard, 
  Navigation as NavIcon 
} from 'lucide-react';
import L from 'leaflet';
import { getOverlayUrl, getTerrainAtPoint, calculateRoute, getGeologyData, DEFAULT_GEOLOGY_DATA } from '../../services/api';
import { sfx } from '../../utils/audio';
import { exportRouteAsGeoJSON, exportRouteAsCSV } from '../../utils/exportRoute';
import MissionDossierModal from './MissionDossierModal';
import RouteElevationProfileBar from './RouteElevationProfileBar';
import MapLegendBar from './MapLegendBar';
import GeologyLegendBar from './GeologyLegendBar';
import HiRISEInspectorModal from './HiRISEInspectorModal';
import Terrain3DModal from './Terrain3DModal';
import InUIGuideTour from '../Common/InUIGuideTour';

const JEZERO_BOUNDS = [
  [18.2110274, 77.1604655],
  [18.7211945, 77.6991776]
];

const HIRISE_BOUNDS = [
  [18.3067994, 77.2229331],
  [18.669315, 77.583964]
];

// Named surface features visible on the map (Jezero Crater scientific landmarks)
const SURFACE_LABELS = [
  { name: "Kodiak Butte", coords: [18.4231, 77.4125], type: "Delta Remnant" },
  { name: "Wildcat Ridge", coords: [18.4395, 77.4120], type: "Clastic Outcrop" },
  { name: "Belva Crater", coords: [18.4550, 77.3820], type: "Impact Crater" },
  { name: "Three Forks", coords: [18.4352, 77.4208], type: "Sample Depot" },
  { name: "Neretva Vallis", coords: [18.4720, 77.3350], type: "Inflow Canyon" },
  { name: "South Séítah", coords: [18.4285, 77.4419], type: "Olivine Outcrop" },
  { name: "Jezero Delta Fan", coords: [18.450, 77.400], type: "Ancient River Delta" },
  { name: "Octavia E. Butler Landing", coords: [18.4447, 77.4508], type: "Touchdown Site" },
];

const JEZERO_CENTER = [18.38, 77.58];

const GRATICULE_LATS = [18.25, 18.30, 18.35, 18.40, 18.45, 18.50, 18.55, 18.60, 18.65, 18.70];
const GRATICULE_LONS = [77.20, 77.25, 77.30, 77.35, 77.40, 77.45, 77.50, 77.55, 77.60, 77.65];

// Custom Leaflet Icons for Aerospace HUD feel
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="position:relative; display:flex; flex-direction:column; align-items:center;">
    <div style="background:#10B981; color:#064E3B; font-family:monospace; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; box-shadow:0 0 12px rgba(16,185,129,0.9); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:3px;">
      <span>●</span> ORIGIN
    </div>
    <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #10B981;"></div>
  </div>`,
  iconSize: [62, 27],
  iconAnchor: [31, 27]
});

const destIcon = L.divIcon({
  className: 'custom-dest-marker',
  html: `<div style="position:relative; display:flex; flex-direction:column; align-items:center;">
    <div style="background:#D97745; color:#fff; font-family:monospace; font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px; box-shadow:0 0 12px rgba(217,119,69,0.9); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:3px;">
      <span>★</span> TARGET
    </div>
    <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #D97745;"></div>
  </div>`,
  iconSize: [62, 27],
  iconAnchor: [31, 27]
});

// Compact Glowing Dot for Rover Sols when zoomed out (Prevents stacking/overlap)
const compactRoverDot = L.divIcon({
  className: 'custom-sol-dot',
  html: `<div style="position:relative; width:16px; height:16px; display:flex; align-items:center; justify-content:center;">
    <span style="position:absolute; inset:0; border-radius:9999px; background:rgba(56,189,248,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <div style="width:8px; height:8px; border-radius:9999px; background:#38BDF8; border:1.5px solid #ffffff; box-shadow:0 0 8px #38BDF8; cursor:pointer;"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Full Sol Badge when zoomed in (Level-of-Detail cartography with staggered elevation to prevent overlap)
const expandedRoverIcon = (sol, index = 0) => {
  const verticalOffsets = [10, 26, 10, 26, 10];
  const offset = verticalOffsets[index % verticalOffsets.length];
  return L.divIcon({
    className: 'custom-sol-marker',
    html: `<div style="background-color: rgba(25, 27, 32, 0.95); color:#38BDF8; border:1px solid #38BDF8; font-family:monospace; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.8); white-space:nowrap; cursor:pointer;">
      Sol ${sol}
    </div>`,
    iconSize: [46, 18],
    iconAnchor: [23, offset]
  });
};

const createAstronautIcon = () => L.divIcon({
  className: 'custom-astronaut-marker',
  html: `<div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
    <span style="position:absolute; inset:0; border-radius:9999px; background:rgba(56,189,248,0.45); animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <div style="position:relative; width:24px; height:24px; border-radius:9999px; background:#0284c7; border:2px solid #ffffff; box-shadow:0 0 12px rgba(14,165,233,1); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:12px; cursor:pointer;">
      👨‍🚀
    </div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const scrubberIcon = L.divIcon({
  className: 'custom-scrubber-marker',
  html: `<div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
    <span style="position:absolute; inset:0; border-radius:9999px; background:rgba(217,119,69,0.6); animation:ping 0.8s infinite;"></span>
    <div style="width:12px; height:12px; border-radius:9999px; background:#D97745; border:2px solid #fff; box-shadow:0 0 12px #D97745;"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Auto-fitter: ONLY fits bounds ONCE when a new route is calculated.
// Never resets zoom or center during user interaction, zoom in/out, panning, or simulation ticks.
function RouteAutoFitter({ routeData }) {
  const map = useMap();
  const lastFittedRouteRef = useRef(null);

  useEffect(() => {
    if (routeData && routeData !== lastFittedRouteRef.current && routeData.route?.length > 1) {
      lastFittedRouteRef.current = routeData;
      const coords = routeData.route.map(pt => [pt.lat, pt.lng]);
      map.fitBounds(coords, { 
        paddingTopLeft: [50, 100], 
        paddingBottomRight: [50, 200], 
        maxZoom: 14 
      });
    } else if (!routeData) {
      lastFittedRouteRef.current = null;
    }
  }, [routeData, map]);

  return null;
}

// Auto-zoom controller: zooms to z>=13 when HiRISE layer is selected so 25cm detail is visible
function LayerZoomController({ activeLayer }) {
  const map = useMap();
  const prevLayerRef = useRef(null);

  useEffect(() => {
    if (activeLayer === 'hirise' && prevLayerRef.current !== 'hirise') {
      if (map.getZoom() < 13) {
        map.flyTo(map.getCenter(), 13, { duration: 0.8 });
      }
    }
    prevLayerRef.current = activeLayer;
  }, [activeLayer, map]);

  return null;
}

// Initial Bounds Fitter: Frames Jezero Crater Delta edge-to-edge on load with zero dark void
function InitialBoundsFitter() {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      map.fitBounds(JEZERO_BOUNDS, { padding: [0, 0] });
    }
  }, [map]);

  return null;
}

function MapEventsHandler({ onCursorMove, onMapClick, onZoomChange }) {
  const throttleRef = useRef(0);

  const map = useMapEvents({
    zoomend() {
      if (onZoomChange) onZoomChange(map.getZoom());
    },
    mousemove(e) {
      const now = Date.now();
      if (now - throttleRef.current > 100) {
        throttleRef.current = now;
        onCursorMove(e.latlng.lat, e.latlng.lng);
      }
    },
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(4));
      const lng = Number(e.latlng.lng.toFixed(4));
      onMapClick(lat, lng);
    }
  });

  return null;
}

export default function MarsMap({ 
  cursorCoords,
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
  const [hoveredCoords, setHoveredCoords] = useState({ lat: 18.4231, lng: 77.4125 });
  const [terrainSample, setTerrainSample] = useState(null);
  const [showGeology, setShowGeology] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [showGraticule, setShowGraticule] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.70);
  const [isMuted, setIsMuted] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isHiRISEInspectorOpen, setIsHiRISEInspectorOpen] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [scrubberPoint, setScrubberPoint] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(11);

  // EVA Traverse Simulator state
  const [simState, setSimState] = useState({ isPlaying: false, stepIndex: 0, speed: 1 });

  // Mode: 'rover' (Perseverance 15° limit) vs 'astronaut' (EVA Foot 25° limit)
  const [exploreMode, setExploreMode] = useState('rover');
  const [showShortestComparison, setShowShortestComparison] = useState(true);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(null);

  // Automatically display the 3-step walkthrough overlay for first-time judges
  useEffect(() => {
    try {
      if (!localStorage.getItem('has_seen_marswalk_guide')) {
        const timer = setTimeout(() => setShowGuideModal(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  // Synchronize start, destination, and slope into browser URL for shareable links
  useEffect(() => {
    try {
      if (startPoint && destinationPoint) {
        const url = new URL(window.location);
        url.searchParams.set('start', `${startPoint.lat.toFixed(5)},${startPoint.lng.toFixed(5)}`);
        url.searchParams.set('dest', `${destinationPoint.lat.toFixed(5)},${destinationPoint.lng.toFixed(5)}`);
        url.searchParams.set('slope', maxSlope);
        window.history.replaceState({}, '', url);
      }
    } catch (e) {}
  }, [startPoint, destinationPoint, maxSlope]);

  const [geologyData, setGeologyData] = useState(DEFAULT_GEOLOGY_DATA);
  const [isCalculating, setIsCalculating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Synchronized refs for reliable global keyboard interactions (Space, Reset, etc.)
  const startPointRef = useRef(startPoint);
  const destinationPointRef = useRef(destinationPoint);
  const routeDataRef = useRef(routeData);
  const maxSlopeRef = useRef(maxSlope);
  const isCalculatingRef = useRef(isCalculating);

  useEffect(() => { startPointRef.current = startPoint; }, [startPoint]);
  useEffect(() => { destinationPointRef.current = destinationPoint; }, [destinationPoint]);
  useEffect(() => { routeDataRef.current = routeData; }, [routeData]);
  useEffect(() => { maxSlopeRef.current = maxSlope; }, [maxSlope]);
  useEffect(() => { isCalculatingRef.current = isCalculating; }, [isCalculating]);

  // Point in polygon helper for geology unit intersection
  const isPointInPolygon = (lat, lng, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Feature 4: "What does this route cross?" summary
  const geologyCrossings = useMemo(() => {
    if (!routeData?.route || routeData.route.length === 0 || !geologyData?.geological_units) {
      return null;
    }
    const counts = {};
    const units = geologyData.geological_units;
    const total = routeData.route.length;

    routeData.route.forEach(pt => {
      let matched = null;
      for (const u of units) {
        if (u.coordinates && isPointInPolygon(pt.lat, pt.lng, u.coordinates)) {
          matched = u;
          break;
        }
      }
      const key = matched ? matched.short_label || matched.name : 'Unmapped Basin Floor';
      const color = matched ? matched.color : '#64748B';
      if (!counts[key]) counts[key] = { count: 0, color, name: key };
      counts[key].count++;
    });

    return Object.values(counts)
      .map(item => ({
        name: item.name,
        color: item.color,
        pct: Math.round((item.count / total) * 100)
      }))
      .filter(item => item.pct > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [routeData, geologyData]);

  // Feature 5: Steepest-segment warnings
  const steepestSegment = useMemo(() => {
    if (!routeData?.route || routeData.route.length === 0) return null;
    let maxPt = routeData.route[0];
    let maxIdx = 0;
    routeData.route.forEach((pt, i) => {
      if (pt.slope_deg > maxPt.slope_deg) {
        maxPt = pt;
        maxIdx = i;
      }
    });
    const distAtSteepest = ((maxIdx / Math.max(1, routeData.route.length - 1)) * routeData.distance_km).toFixed(2);
    return {
      lat: maxPt.lat,
      lng: maxPt.lng,
      slope: maxPt.slope_deg,
      elevation: maxPt.elevation_m,
      km: distAtSteepest,
      isHazard: maxPt.slope_deg > (maxSlope || 20)
    };
  }, [routeData, maxSlope]);

  // Measure tool calculation
  const measureResult = useMemo(() => {
    if (measurePoints.length !== 2) return null;
    const [p1, p2] = measurePoints;
    const R = 3396190.0;
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLng = (p2.lng - p1.lng) * (Math.PI / 180) * Math.cos(((p1.lat + p2.lat) / 2) * (Math.PI / 180));
    const distM = Math.round(R * Math.hypot(dLat, dLng));
    const distKm = (distM / 1000).toFixed(2);
    const deltaElev = (p1.elevation != null && p2.elevation != null)
      ? Math.round(p2.elevation - p1.elevation)
      : null;
    return { distM, distKm, deltaElev };
  }, [measurePoints]);

  useEffect(() => {
    let isMounted = true;
    async function loadGeology() {
      try {
        const data = await getGeologyData();
        if (isMounted && data && data.geological_units && data.geological_units.length > 0) {
          setGeologyData(data);
        }
      } catch (err) {
        console.warn('Geology dataset fallback active:', err);
      }
    }
    loadGeology();
    return () => { isMounted = false; };
  }, []);

  // Handle simulation animation step loop
  useEffect(() => {
    let timer;
    if (simState.isPlaying && routeData?.route?.length > 1) {
      const interval = Math.max(25, Math.floor(90 / simState.speed));
      timer = setInterval(() => {
        setSimState(prev => {
          if (prev.stepIndex >= routeData.route.length - 1) {
            return { ...prev, isPlaying: false, stepIndex: routeData.route.length - 1 };
          }
          return { ...prev, stepIndex: prev.stepIndex + 1 };
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [simState.isPlaying, simState.speed, routeData]);

  // Reset simulation when route changes
  useEffect(() => {
    setSimState({ isPlaying: false, stepIndex: 0, speed: 1 });
  }, [routeData]);

  // Keyboard shortcuts listener for rapid hackathon demo interactions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') {
        handleResetPoints();
      } else if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (routeDataRef.current) {
          // Play / Pause live traverse simulation
          setSimState(prev => {
            const rData = routeDataRef.current;
            const isAtEnd = prev.stepIndex >= (rData?.route?.length || 1) - 1;
            return {
              ...prev,
              isPlaying: isAtEnd ? true : !prev.isPlaying,
              stepIndex: isAtEnd ? 0 : prev.stepIndex
            };
          });
          sfx.playBlip();
        } else if (startPointRef.current && destinationPointRef.current && !isCalculatingRef.current) {
          // Solve route instantly when waypoints are set
          sfx.playBlip();
          handleComputeRouteWithSlope(maxSlopeRef.current);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGraticule(prev => !prev);
        sfx.playBlip();
      } else if (e.key === 'd' || e.key === 'D') {
        if (routeDataRef.current) {
          setIsDossierOpen(true);
          sfx.playBlip();
        }
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'o' || e.key === 'O') {
        setIs3DModalOpen(prev => !prev);
        sfx.playBlip();
      } else if (e.key === '1') {
        setActiveLayer('ctx');
        sfx.playBlip();
      } else if (e.key === '2') {
        setActiveLayer('hirise');
        sfx.playBlip();
      } else if (e.key === '3') {
        setActiveLayer('elevation');
        sfx.playBlip();
      } else if (e.key === '4') {
        setActiveLayer('slope');
        sfx.playBlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sfx.setMuted(nextMuted);
    if (!nextMuted) sfx.playBlip();
  };

  const handleCursorMove = async (lat, lng) => {
    setHoveredCoords({ lat, lng });
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
      sfx.playWarning();
      setFeedbackMsg({
        type: 'warning',
        text: 'Coordinate is outside Jezero DTM coverage (18.21°–18.72°N, 77.16°–77.70°E).'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    if (isMeasureMode) {
      sfx.playBlip();
      const elev = terrainSample?.valid ? terrainSample.elevation_m : null;
      if (measurePoints.length >= 2) {
        setMeasurePoints([{ lat, lng, elevation: elev }]);
      } else {
        setMeasurePoints(prev => [...prev, { lat, lng, elevation: elev }]);
      }
      return;
    }

    sfx.playBlip();

    if (!startPoint) {
      onSelectPoint('start', { lat, lng });
      setFeedbackMsg({ type: 'info', text: 'Origin set. Click destination on the map.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else if (!destinationPoint) {
      onSelectPoint('destination', { lat, lng });
      setFeedbackMsg({ type: 'success', text: 'Waypoints set. Click "Compute Route" or press Space.' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      onSelectPoint('start', { lat, lng });
      onSelectPoint('destination', null);
      setRouteData(null);
    }
  };

  const handleComputeRouteWithSlope = async (targetSlope) => {
    if (!startPoint || !destinationPoint) return;
    setIsCalculating(true);
    setFeedbackMsg(null);
    sfx.playBlip();

    const slopeVal = targetSlope !== undefined ? targetSlope : maxSlope;
    const res = await calculateRoute(startPoint, destinationPoint, slopeVal);
    setIsCalculating(false);

    if (res && res.status === 'success') {
      setRouteData(res);
      sfx.playSuccess();
      if (res.hazard_warning) {
        setFeedbackMsg({ type: 'warning', text: res.hazard_warning });
        setTimeout(() => setFeedbackMsg(null), 7000);
      } else {
        setFeedbackMsg({ type: 'success', text: `Route computed: ${res.distance_km} km (${res.estimated_difficulty})` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } else {
      sfx.playWarning();
      setFeedbackMsg({ type: 'error', text: res?.error || 'Path blocked by steep terrain hazards.' });
    }
  };

  const handleComputeRoute = () => handleComputeRouteWithSlope(maxSlope);

  const handleResetPoints = () => {
    sfx.playBlip();
    onSelectPoint('start', null);
    onSelectPoint('destination', null);
    setRouteData(null);
    setFeedbackMsg(null);
    setSimState({ isPlaying: false, stepIndex: 0, speed: 1 });
  };

  const handleShareMission = () => {
    if (!startPoint || !destinationPoint) return;
    const url = `${window.location.origin}${window.location.pathname}?start=${startPoint.lat},${startPoint.lng}&dest=${destinationPoint.lat},${destinationPoint.lng}&slope=${maxSlope}`;
    navigator.clipboard.writeText(url).then(() => {
      sfx.playSuccess();
      setFeedbackMsg({ type: 'success', text: 'Mission Dispatch Link copied to clipboard!' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    }).catch(() => {
      sfx.playBlip();
    });
  };

  // 5 Authentic Perseverance presets with real rover landing & science targets
  const handleApplyPreset = (presetKey) => {
    sfx.playBlip();
    let s = null, d = null, title = '';
    if (presetKey === 'perseverance_to_kodiak') {
      s = { lat: 18.4447, lng: 77.4508 };
      d = { lat: 18.4231, lng: 77.4125 };
      title = 'Preset 1: Landing Site to Kodiak Butte Delta Remnant';
    } else if (presetKey === 'three_forks_to_wildcat') {
      s = { lat: 18.4352, lng: 77.4208 };
      d = { lat: 18.4412, lng: 77.4081 };
      title = 'Preset 2: Three Forks Sample Depot to Wildcat Ridge';
    } else if (presetKey === 'seitah_traversal') {
      s = { lat: 18.4265, lng: 77.4420 };
      d = { lat: 18.4310, lng: 77.4285 };
      title = 'Preset 3: South Séítah Olivine Cumulate to Artuby Ridge';
    } else if (presetKey === 'delta_top_ascent') {
      s = { lat: 18.4412, lng: 77.4081 };
      d = { lat: 18.4550, lng: 77.3820 };
      title = 'Preset 4: Delta Scarp Incline to Belva Crater Overlook';
    } else if (presetKey === 'neretva_vallis_inflow') {
      s = { lat: 18.4550, lng: 77.3820 };
      d = { lat: 18.4720, lng: 77.3350 };
      title = 'Preset 5: Upper Delta Terrace to Neretva Canyon Inflow';
    }

    if (s && d) {
      onSelectPoint('start', s);
      onSelectPoint('destination', d);
      setFeedbackMsg({ type: 'info', text: `${title}: Calculating traverse path...` });
      setIsCalculating(true);
      calculateRoute(s, d, maxSlope).then(res => {
        setIsCalculating(false);
        if (res && res.status === 'success') {
          setRouteData(res);
          sfx.playSuccess();
          setFeedbackMsg({ type: 'success', text: `${title}: Route computed (${res.distance_km} km)` });
        } else {
          setFeedbackMsg({ type: 'error', text: res?.error || 'Path blocked by steep terrain hazards.' });
        }
      }).catch(() => {
        setIsCalculating(false);
        setFeedbackMsg({ type: 'error', text: 'Route calculation failed.' });
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const polylineCoords = useMemo(() => {
    return routeData?.route?.map(pt => [pt.lat, pt.lng]) || [];
  }, [routeData]);

  const currentSimPoint = routeData?.route?.[simState.stepIndex];

  // GPS Position System — tracks astronaut sim position or cursor hover
  const gpsPosition = useMemo(() => {
    if (routeData && currentSimPoint) {
      const progress = simState.stepIndex / Math.max(1, routeData.route.length - 1);
      const distRemaining = routeData.distance_km * (1 - progress);
      let heading = 0;
      if (simState.stepIndex < routeData.route.length - 1) {
        const next = routeData.route[simState.stepIndex + 1];
        const dLng = next.lng - currentSimPoint.lng;
        const dLat = next.lat - currentSimPoint.lat;
        heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
      }
      const dirs = ['N','NE','E','SE','S','SW','W','NW'];
      return {
        lat: currentSimPoint.lat, lng: currentSimPoint.lng,
        elevation: currentSimPoint.elevation_m, slope: currentSimPoint.slope_deg,
        heading: Math.round(heading), compassDir: dirs[Math.round(heading / 45) % 8],
        distRemaining: distRemaining.toFixed(2), isLive: simState.isPlaying,
        progress: (progress * 100).toFixed(0)
      };
    }
    if (terrainSample?.valid) {
      return {
        lat: Number(hoveredCoords.lat), lng: Number(hoveredCoords.lng),
        elevation: terrainSample.elevation_m, slope: terrainSample.slope_deg,
        heading: null, compassDir: null, distRemaining: null, isLive: false, progress: null
      };
    }
    return null;
  }, [routeData, currentSimPoint, simState, terrainSample, hoveredCoords]);

  // Build slope-colored route segments (Green <=8°, Amber 8-15°, Red >15°)
  const slopeSegments = useMemo(() => {
    if (!routeData?.route || routeData.route.length < 2) return [];
    const segments = [];
    let currentPositions = [[routeData.route[0].lat, routeData.route[0].lng]];
    
    const getSlopeColor = (slope) => {
      if (slope <= 8.0) return '#10B981';   // Nominal (<8°) - Green
      if (slope <= 15.0) return '#F59E0B';  // Moderate (8-15°) - Amber
      return '#EF4444';                     // Steep (>15°) - Crimson
    };

    let currentColor = getSlopeColor(routeData.route[0].slope_deg);

    for (let i = 1; i < routeData.route.length; i++) {
      const pt = routeData.route[i];
      const color = getSlopeColor(pt.slope_deg);
      const coord = [pt.lat, pt.lng];

      if (color === currentColor) {
        currentPositions.push(coord);
      } else {
        currentPositions.push(coord);
        segments.push({ positions: currentPositions, color: currentColor });
        currentPositions = [coord];
        currentColor = color;
      }
    }
    if (currentPositions.length > 1) {
      segments.push({ positions: currentPositions, color: currentColor });
    }
    return segments;
  }, [routeData]);

  return (
    <div className="relative w-full h-full bg-[#101114] overflow-hidden flex flex-col">
      {/* Top Map Command Bar - Spacious, Unified, Single Aerospace HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none flex flex-wrap items-center justify-between gap-2 font-mono">
        {/* Left Section: Layers & Science Overlays */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#14161a]/85 backdrop-blur-md border border-[#33363D]/80 rounded-lg p-1 shadow-xl">
          {/* Segmented Layer Switch */}
          <div className="flex items-center space-x-0.5 bg-[#101114]/80 rounded p-0.5 border border-[#33363D]/60">
            <button
              onClick={() => { setActiveLayer('ctx'); sfx.playBlip(); }}
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center space-x-1 ${
                activeLayer === 'ctx'
                  ? 'bg-[#D97745] text-white font-medium shadow'
                  : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>CTX</span>
            </button>
            <button
              onClick={() => { setActiveLayer('hirise'); sfx.playBlip(); }}
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center space-x-1 ${
                activeLayer === 'hirise'
                  ? 'bg-[#D97745] text-white font-medium shadow'
                  : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
              }`}
            >
              <Scan className="w-3 h-3 text-sky-400" />
              <span>HiRISE</span>
            </button>
            <button
              onClick={() => { setActiveLayer('elevation'); sfx.playBlip(); }}
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center space-x-1 ${
                activeLayer === 'elevation'
                  ? 'bg-[#D97745] text-white font-medium shadow'
                  : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
              }`}
            >
              <span>DEM</span>
            </button>
            <button
              onClick={() => { setActiveLayer('slope'); sfx.playBlip(); }}
              className={`px-2 py-1 rounded text-[11px] transition-all flex items-center space-x-1 ${
                activeLayer === 'slope'
                  ? 'bg-[#D97745] text-white font-medium shadow'
                  : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
              } ${activeGuideStep === 3 ? 'ring-2 ring-amber-400 shadow-amber-500/50 scale-105' : ''}`}
            >
              <span>Slope</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#33363D]/60 mx-0.5 hidden sm:block" />

          {/* 3D Orbit & 25cm Micro Lens */}
          <button
            onClick={() => { setIs3DModalOpen(true); sfx.playBlip(); }}
            title="Launch Interactive 3D WebGL Terrain Orbit"
            className={`px-2 py-1 rounded text-[11px] transition-all flex items-center space-x-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 ${
              activeGuideStep === 5 ? 'ring-2 ring-emerald-400 shadow-emerald-500/50 scale-105' : ''
            }`}
          >
            <Box className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-semibold">3D</span>
          </button>

          <button
            onClick={() => { setIsHiRISEInspectorOpen(true); sfx.playBlip(); }}
            title="Inspect authentic 25cm/px micro-terrain lens"
            className={`px-2 py-1 rounded text-[11px] transition-all flex items-center space-x-1 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 ${
              activeGuideStep === 5 ? 'ring-2 ring-purple-400 shadow-purple-500/50 scale-105' : ''
            }`}
          >
            <Scan className="w-3 h-3 text-purple-400 animate-pulse" />
            <span className="font-semibold hidden md:inline">25cm Lens</span>
          </button>

          <div className="w-[1px] h-4 bg-[#33363D]/60 mx-0.5 hidden sm:block" />

          {/* Science Overlays: Geology & Sols */}
          <button
            onClick={() => { setShowGeology(!showGeology); sfx.playBlip(); }}
            className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center space-x-1 ${
              showGeology 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold' 
                : 'bg-transparent text-[#A6A8AD] border-transparent hover:bg-[#22252c] hover:text-white'
            }`}
          >
            <span>Geology</span>
            <span className={`text-[8px] px-1 rounded ${showGeology ? 'bg-amber-500 text-black font-bold' : 'bg-[#101114]'}`}>
              {showGeology ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => { setShowObservations(!showObservations); sfx.playBlip(); }}
            className={`px-2 py-1 rounded text-[10px] border transition-colors flex items-center space-x-1 ${
              showObservations 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-semibold' 
                : 'bg-transparent text-[#A6A8AD] border-transparent hover:bg-[#22252c] hover:text-white'
            }`}
          >
            <span>Sols</span>
            <span className={`text-[8px] px-1 rounded ${showObservations ? 'bg-sky-400 text-black font-bold' : 'bg-[#101114]'}`}>
              {showObservations ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Contextual Opacity Blend */}
          {(activeLayer === 'slope' || activeLayer === 'elevation') && (
            <div className="hidden lg:flex items-center space-x-1 pl-1 text-[10px]">
              <span className="text-[#A6A8AD]">Blend:</span>
              {[0.4, 0.7, 1.0].map((op) => (
                <button
                  key={op}
                  onClick={() => { setOverlayOpacity(op); sfx.playBlip(); }}
                  className={`px-1 py-0.5 rounded transition-colors ${
                    overlayOpacity === op ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:bg-[#22252c]'
                  }`}
                >
                  {Math.round(op * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center Section: Presets, Mode, Compute & Simulation Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#14161a]/85 backdrop-blur-md border border-[#33363D]/80 rounded-lg p-1 shadow-xl">
          {/* Milestone Presets Dropdown */}
          <div className={`flex items-center space-x-1 px-1 rounded transition-all ${
            activeGuideStep === 1 ? 'border border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-500/30' : ''
          }`}>
            <Compass className="w-3.5 h-3.5 text-[#D97745]" />
            <select
              onChange={(e) => {
                if (e.target.value) handleApplyPreset(e.target.value);
              }}
              defaultValue=""
              className="bg-[#101114]/90 border border-[#33363D] text-[#F3F3F3] text-[11px] rounded px-2 py-1 outline-none hover:border-[#D97745] transition-colors cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
            >
              <option value="" disabled>Milestone Presets...</option>
              <option value="perseverance_to_kodiak">1. Landing → Kodiak Butte</option>
              <option value="three_forks_to_wildcat">2. Three Forks → Wildcat Ridge</option>
              <option value="seitah_traversal">3. Séítah Outcrop → Artuby</option>
              <option value="delta_top_ascent">4. Delta Scarp → Belva Overlook</option>
              <option value="neretva_vallis_inflow">5. Upper Delta → Neretva Canyon</option>
            </select>
          </div>

          <div className="w-[1px] h-4 bg-[#33363D]/60 mx-0.5" />

          {/* Rover Mode vs Astronaut Mode Segmented Switch */}
          <div className={`bg-[#101114]/80 border rounded p-0.5 flex items-center space-x-0.5 transition-all ${
            activeGuideStep === 2 ? 'border-[#D97745] ring-2 ring-[#D97745]/80 shadow-orange-500/30' : 'border-[#33363D]/60'
          }`}>
            <button
              onClick={() => {
                setExploreMode('rover');
                if (setMaxSlope) setMaxSlope(15);
                sfx.playBlip();
                if (startPoint && destinationPoint) handleComputeRouteWithSlope(15);
              }}
              title="Rover Mode (15° slope limit, 0.12 km/h)"
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center space-x-1 ${
                exploreMode === 'rover'
                  ? 'bg-[#D97745] text-white font-bold shadow'
                  : 'text-[#A6A8AD] hover:bg-[#22252c] hover:text-white'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span className="hidden sm:inline">Rover (15°)</span>
            </button>
            <button
              onClick={() => {
                setExploreMode('astronaut');
                if (setMaxSlope) setMaxSlope(25);
                sfx.playBlip();
                if (startPoint && destinationPoint) handleComputeRouteWithSlope(25);
              }}
              title="Astronaut Mode (25° slope limit, 1.1 km/h)"
              className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center space-x-1 ${
                exploreMode === 'astronaut'
                  ? 'bg-sky-500 text-black font-bold shadow'
                  : 'text-[#A6A8AD] hover:bg-[#22252c] hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">EVA (25°)</span>
            </button>
          </div>

          {/* Compute Action or EVA Simulation Transport Controls */}
          {routeData ? (
            <div className={`flex items-center space-x-1 pl-1 transition-all ${
              activeGuideStep === 6 ? 'border border-sky-400 ring-2 ring-sky-400/80 rounded p-0.5' : ''
            }`}>
              <button
                onClick={() => {
                  setSimState(prev => {
                    if (prev.stepIndex >= (routeData.route?.length || 1) - 1) {
                      return { ...prev, isPlaying: true, stepIndex: 0 };
                    }
                    return { ...prev, isPlaying: !prev.isPlaying };
                  });
                  sfx.playBlip();
                }}
                className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-[11px] flex items-center space-x-1 shadow transition-transform active:scale-95"
              >
                {simState.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-black" />}
                <span>{simState.isPlaying ? 'PAUSE' : 'SIMULATE'}</span>
              </button>
              <button
                onClick={() => {
                  const speeds = [1, 2, 5, 10];
                  const nextSpeed = speeds[(speeds.indexOf(simState.speed) + 1) % speeds.length];
                  setSimState(prev => ({ ...prev, speed: nextSpeed }));
                  sfx.playBlip();
                }}
                className="px-1.5 py-1 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#A6A8AD] hover:text-white border border-[#33363D] text-[10px]"
                title="Simulation Speed Multiplier"
              >
                {simState.speed}x
              </button>
              <button
                onClick={() => { setShowShortestComparison(!showShortestComparison); sfx.playBlip(); }}
                title="Toggle display of direct Shortest Path vs Safest A* route"
                className={`px-1.5 py-1 rounded text-[10px] border transition-colors hidden md:block ${
                  showShortestComparison ? 'bg-slate-700/80 text-white border-slate-500 font-bold' : 'bg-[#14161a] text-[#A6A8AD] border-[#33363D]'
                }`}
              >
                Shortest: {showShortestComparison ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setIsDossierOpen(true)}
                title="View Full Mission Dossier (D)"
                className="px-2 py-1 rounded bg-[#D97745]/20 hover:bg-[#D97745]/30 text-[#D97745] border border-[#D97745]/40 text-[10px] hidden sm:flex items-center space-x-1"
              >
                <FileText className="w-3 h-3" />
                <span>Dossier</span>
              </button>
              <button
                onClick={handleResetPoints}
                title="Reset Route (R)"
                className="p-1 rounded bg-[#22252c] hover:bg-rose-950/50 text-[#A6A8AD] hover:text-rose-400 border border-[#33363D]"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          ) : (
            startPoint && destinationPoint && (
              <button
                onClick={handleComputeRoute}
                disabled={isCalculating}
                className={`bg-[#D97745] hover:bg-[#B85C38] text-white px-3 py-1 rounded font-bold text-[11px] shadow flex items-center space-x-1 transition-transform active:scale-95 animate-pulse ${
                  activeGuideStep === 2 ? 'ring-2 ring-orange-400 shadow-orange-500/50 scale-105' : ''
                }`}
              >
                <Play className={`w-3 h-3 fill-white ${isCalculating ? 'animate-spin' : ''}`} />
                <span>{isCalculating ? 'COMPUTING...' : 'COMPUTE ROUTE'}</span>
              </button>
            )
          )}
        </div>

        {/* Right Section: Quick Tactical Tools */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#14161a]/85 backdrop-blur-md border border-[#33363D]/80 rounded-lg p-1 shadow-xl">
          <button
            onClick={() => { setShowGraticule(!showGraticule); sfx.playBlip(); }}
            title="Toggle Tactical Martian Grid (G)"
            className={`p-1.5 rounded transition-colors ${
              showGraticule ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setIsMeasureMode(!isMeasureMode);
              setMeasurePoints([]);
              sfx.playBlip();
            }}
            title="Measure distance & elevation difference"
            className={`p-1.5 rounded transition-colors ${
              isMeasureMode ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>

          {startPoint && destinationPoint && (
            <button
              onClick={handleShareMission}
              title="Copy Shareable Route Link to Clipboard"
              className="p-1.5 rounded bg-[#22252c] hover:bg-sky-950/50 text-sky-400 hover:text-sky-300 border border-[#33363D] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => { setShowGuideModal(true); sfx.playBlip(); }}
            title="Interactive Walkthrough Guide for Judges"
            className="px-2 py-1 rounded text-xs font-mono flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded text-[#A6A8AD] hover:text-white hover:bg-[#22252c] transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Floating Feedback Notification — docked at bottom-center to never overlap top controls */}
      {feedbackMsg && (
        <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-[1300] pointer-events-auto text-xs font-mono px-3.5 py-1.5 rounded-lg shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-2 duration-200 select-none ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/60 text-rose-200'
            : feedbackMsg.type === 'warning'
            ? 'bg-amber-950/95 border-amber-500/60 text-amber-200'
            : 'bg-[#14161a]/95 border-emerald-500/60 text-emerald-300'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Main Leaflet Map Container - Bounded tightly to Jezero Crater Delta edge-to-edge */}
      <MapContainer
        center={JEZERO_CENTER}
        zoom={11}
        minZoom={11}
        maxZoom={16}
        maxBounds={JEZERO_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full z-0 bg-[#101114]"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <AttributionControl position="bottomright" prefix="NASA / JPL-Caltech / MSSS / USGS Astrogeology / Mars Trek" />
        <InitialBoundsFitter />
        <MapEventsHandler 
          onCursorMove={handleCursorMove} 
          onMapClick={handleMapClick} 
          onZoomChange={(z) => setCurrentZoom(z)}
        />
        <RouteAutoFitter routeData={routeData} />
        <LayerZoomController activeLayer={activeLayer} />

        {/* Authentic Local CTX Image Overlay - base for all views */}
        {(activeLayer === 'ctx' || activeLayer === 'elevation' || activeLayer === 'slope') && (
          <ImageOverlay
            url={getOverlayUrl('ctx')}
            bounds={JEZERO_BOUNDS}
            opacity={1.0}
          />
        )}

        {/* HiRISE 25cm Ultra-HD Controlled Mosaic — CTX dimmed underneath, HiRISE tiles sharp on top */}
        {activeLayer === 'hirise' && (
          <>
            {/* Dimmed CTX base for context outside HiRISE swath */}
            <ImageOverlay
              url={getOverlayUrl('ctx')}
              bounds={JEZERO_BOUNDS}
              opacity={0.35}
            />
            <TileLayer
              attribution='&copy; NASA/JPL/Univ. of Arizona MRO HiRISE'
              url="https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0//default/default028mm/{z}/{y}/{x}.png"
              minZoom={10}
              maxNativeZoom={16}
              maxZoom={18}
              opacity={1.0}
              bounds={HIRISE_BOUNDS}
            />
            {/* HiRISE swath footprint — purple dashed outline shows coverage boundary */}
            <Rectangle
              bounds={HIRISE_BOUNDS}
              pathOptions={{
                color: '#A855F7',
                weight: 2,
                fillOpacity: 0,
                dashArray: '6, 4',
                opacity: 0.8
              }}
            />
            {/* HiRISE active indicator label */}
            <Marker
              position={[HIRISE_BOUNDS[1][0] - 0.005, (HIRISE_BOUNDS[0][1] + HIRISE_BOUNDS[1][1]) / 2]}
              interactive={false}
              icon={L.divIcon({
                className: 'hirise-badge',
                html: `<div style="background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.7); color:#D8B4FE; font-family:ui-monospace,monospace; font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; white-space:nowrap; text-shadow:0 0 4px #000; letter-spacing:0.5px;">⬡ HiRISE 25cm/px SWATH — Zoom in for sub-meter detail</div>`,
                iconSize: [280, 18],
                iconAnchor: [140, 9]
              })}
            />
          </>
        )}

        {/* 20m CTX DTM Elevation Color Overlay (Blended directly over CTX surface) */}
        {activeLayer === 'elevation' && (
          <ImageOverlay
            url={getOverlayUrl('elevation')}
            bounds={JEZERO_BOUNDS}
            opacity={overlayOpacity}
          />
        )}

        {/* Derived Slope Hazard Map (Blended directly over CTX surface) */}
        {activeLayer === 'slope' && (
          <ImageOverlay
            url={getOverlayUrl('slope')}
            bounds={JEZERO_BOUNDS}
            opacity={overlayOpacity}
          />
        )}

        {/* Tactical Coordinate Grid & Surface Labels Pane — z-index above imagery overlays */}
        <Pane name="gridPane" style={{ zIndex: 420 }}>
          {/* Coordinate Graticule */}
          {showGraticule && (
            <>
              {GRATICULE_LATS.map(lat => (
                <React.Fragment key={`lat-${lat}`}>
                  <Polyline
                    positions={[
                      [lat, JEZERO_BOUNDS[0][1]],
                      [lat, JEZERO_BOUNDS[1][1]]
                    ]}
                    pane="gridPane"
                    pathOptions={{
                      color: '#38BDF8',
                      weight: 1.2,
                      opacity: 0.55,
                      dashArray: '4, 8'
                    }}
                  />
                  <Marker
                    position={[lat, JEZERO_BOUNDS[0][1] + 0.01]}
                    pane="gridPane"
                    icon={L.divIcon({
                      className: 'grid-label',
                      html: `<span style="color:#38BDF8; font-size:8px; font-family:monospace; opacity:0.6; white-space:nowrap;">${lat.toFixed(2)}°N</span>`,
                      iconSize: [40, 12],
                      iconAnchor: [0, 6]
                    })}
                  />
                </React.Fragment>
              ))}
              {GRATICULE_LONS.map(lon => (
                <React.Fragment key={`lon-${lon}`}>
                  <Polyline
                    positions={[
                      [JEZERO_BOUNDS[0][0], lon],
                      [JEZERO_BOUNDS[1][0], lon]
                    ]}
                    pane="gridPane"
                    pathOptions={{
                      color: '#38BDF8',
                      weight: 1.2,
                      opacity: 0.55,
                      dashArray: '4, 8'
                    }}
                  />
                  <Marker
                    position={[JEZERO_BOUNDS[1][0] - 0.01, lon]}
                    pane="gridPane"
                    icon={L.divIcon({
                      className: 'grid-label',
                      html: `<span style="color:#38BDF8; font-size:8px; font-family:monospace; opacity:0.6; white-space:nowrap;">${lon.toFixed(2)}°E</span>`,
                      iconSize: [40, 12],
                      iconAnchor: [20, 12]
                    })}
                  />
                </React.Fragment>
              ))}
            </>
          )}

          {/* Named Surface Feature Labels — always visible for astronaut orientation */}
          {SURFACE_LABELS.map((f, i) => (
            <Marker
              key={`label-${i}`}
              position={f.coords}
              pane="gridPane"
              icon={L.divIcon({
                className: 'surface-label',
                html: `<div style="display:flex; flex-direction:column; align-items:center; pointer-events:none;">
                  <div style="width:4px; height:4px; border-radius:50%; background:#D97745; box-shadow:0 0 6px #D97745; margin-bottom:2px;"></div>
                  <span style="color:#F3F3F3; font-size:9px; font-family:ui-monospace,monospace; font-weight:600; text-shadow:0 0 4px #000, 0 0 8px #000, 1px 1px 2px #000; white-space:nowrap; letter-spacing:0.3px;">${f.name}</span>
                </div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 0]
              })}
              interactive={false}
            />
          ))}
        </Pane>

        {/* Dedicated Geology Pane: Z-Index 450 (above base satellite mosaic & overlays, below route & waypoints) */}
        <Pane name="geologyPane" style={{ zIndex: 450 }}>
          {showGeology && geologyData?.geological_units?.map((unit) => (
            <Polygon
              key={unit.id}
              positions={unit.coordinates}
              pane="geologyPane"
              pathOptions={{
                color: unit.color,
                weight: 2,
                fillColor: unit.color,
                fillOpacity: 0.22,
                dashArray: null
              }}
            >
              {unit.short_label && (
                <Tooltip 
                  permanent 
                  direction="center" 
                  className="geology-label-tooltip"
                  opacity={0.92}
                >
                  <span style={{ color: unit.color, fontWeight: 'bold', fontSize: '10px' }}>
                    {unit.short_label}
                  </span>
                </Tooltip>
              )}
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
            </Polygon>
          ))}
        </Pane>

        {/* Dedicated Rover Observation Pane: Z-Index 580 */}
        <Pane name="roverPane" style={{ zIndex: 580 }}>
          {showObservations && geologyData?.rover_observations?.map((obs, idx) => {
            const isCompact = currentZoom < 15;
            return (
              <Marker 
                key={`rover-${idx}`} 
                position={obs.coords}
                pane="roverPane"
                icon={isCompact ? compactRoverDot : expandedRoverIcon(obs.sol, idx)}
              >
                <Tooltip 
                  direction="top" 
                  offset={isCompact ? [0, -6] : [0, -10]}
                  opacity={0.95}
                >
                  <span className="font-mono text-[10px] font-bold text-sky-400">
                    Sol {obs.sol}: {obs.name}
                  </span>
                </Tooltip>
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
                    
                    <div className="flex space-x-2 pt-2 border-t border-[#33363D]">
                      <button
                        onClick={() => {
                          onSelectPoint('start', { lat: obs.coords[0], lng: obs.coords[1] });
                          setRouteData(null);
                          sfx.playBlip();
                        }}
                        className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white py-1 rounded text-[10px] font-mono transition-colors"
                      >
                        Set Origin
                      </button>
                      <button
                        onClick={() => {
                          onSelectPoint('destination', { lat: obs.coords[0], lng: obs.coords[1] });
                          setRouteData(null);
                          sfx.playBlip();
                        }}
                        className="flex-1 bg-[#D97745]/80 hover:bg-[#D97745] text-white py-1 rounded text-[10px] font-mono transition-colors"
                      >
                        Set Dest
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </Pane>

        {/* Dedicated Route Pane with High Z-Index so it is ALWAYS rendered on top of imagery & geology */}
        <Pane name="routePane" style={{ zIndex: 620 }}>
          {/* Direct Shortest Route Polyline (Dashed Gray) — Demonstrates why Safest A* route is necessary */}
          {showShortestComparison && routeData?.shortest_route && routeData.shortest_route.length > 1 && (
            <Polyline
              positions={routeData.shortest_route.map(p => [p.lat, p.lng])}
              pane="routePane"
              pathOptions={{
                color: '#9CA3AF',
                weight: 3.5,
                opacity: 0.85,
                dashArray: '6, 6'
              }}
            >
              <Tooltip sticky direction="top" opacity={0.95}>
                <span className="font-mono text-[10px] text-gray-200">
                  Direct Shortest: {routeData.shortest_distance_km} km (Crosses {routeData.shortest_max_slope_deg}° Scarp!)
                </span>
              </Tooltip>
            </Polyline>
          )}

          {/* Active Measure Tool Polyline */}
          {measurePoints.length === 2 && (
            <Polyline
              positions={measurePoints.map(p => [p.lat, p.lng])}
              pane="routePane"
              pathOptions={{
                color: '#F59E0B',
                weight: 3,
                dashArray: '5, 5',
                opacity: 0.95
              }}
            />
          )}

          {/* Slope-Colored Trajectory Polyline (Green <=8°, Amber 8-15°, Red >15°) */}
          {slopeSegments.length > 0 && (
            <>
              {/* Background Contrast Halo */}
              <Polyline
                positions={polylineCoords}
                pane="routePane"
                pathOptions={{
                  color: '#000000',
                  weight: 7,
                  opacity: 0.75
                }}
              />
              {/* Colored Segments */}
              {slopeSegments.map((seg, idx) => (
                <Polyline
                  key={`slope-seg-${idx}`}
                  positions={seg.positions}
                  pane="routePane"
                  pathOptions={{
                    color: seg.color,
                    weight: 4.5,
                    opacity: 0.98
                  }}
                />
              ))}
            </>
          )}
        </Pane>

        {/* Dedicated Waypoint Pane with Highest Z-Index */}
        <Pane name="waypointPane" style={{ zIndex: 650 }}>
          {/* Steepest Segment Warning Marker on Route */}
          {steepestSegment && (
            <Marker
              position={[steepestSegment.lat, steepestSegment.lng]}
              pane="waypointPane"
              icon={L.divIcon({
                className: 'peak-slope-badge',
                html: `<div style="background:${steepestSegment.isHazard ? '#EF4444' : '#F59E0B'}; color:#fff; font-family:monospace; font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; border:1px solid #fff; box-shadow:0 0 10px rgba(239,68,68,0.85); white-space:nowrap; display:flex; align-items:center; gap:3px;">
                  <span>▲</span> PEAK: ${steepestSegment.slope}° @ km ${steepestSegment.km}
                </div>`,
                iconSize: [150, 20],
                iconAnchor: [75, 24]
              })}
            >
              <Popup>
                <div className="p-1 font-mono text-xs space-y-1">
                  <div className="font-bold text-rose-400">STEEPEST TERRAIN SECTION</div>
                  <div>Slope Incline: <strong>{steepestSegment.slope}°</strong></div>
                  <div>Distance from Origin: <strong>{steepestSegment.km} km</strong></div>
                  <div>Elevation: <strong>{steepestSegment.elevation?.toFixed(0)} m</strong></div>
                  <div className="text-[10px] text-[#A6A8AD] border-t border-[#33363D] pt-1">
                    {steepestSegment.isHazard 
                      ? '⚠️ Exceeds slope threshold! A* steered around scarp.' 
                      : '✓ Within safe slope threshold.'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Measure Tool Waypoint Dots */}
          {measurePoints.map((pt, idx) => (
            <CircleMarker
              key={`measure-pt-${idx}`}
              center={[pt.lat, pt.lng]}
              pane="waypointPane"
              radius={6}
              pathOptions={{
                color: '#FFFFFF',
                weight: 2,
                fillColor: idx === 0 ? '#10B981' : '#F59E0B',
                fillOpacity: 1.0
              }}
            />
          ))}

          {/* Start Point Marker (Draggable) */}
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
                  sfx.playBlip();
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

          {/* Destination Point Marker (Draggable) */}
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
                  sfx.playBlip();
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

          {/* Live Animated Simulated Astronaut Marker */}
          {routeData && currentSimPoint && (
            <Marker
              position={[currentSimPoint.lat, currentSimPoint.lng]}
              icon={createAstronautIcon()}
            >
              <Popup>
                <div className="p-1 font-mono text-xs space-y-1">
                  <div className="font-bold text-sky-400">ASTRONAUT EVA TELEMETRY</div>
                  <div>Traversed: <strong>{((simState.stepIndex / (routeData.route.length - 1)) * routeData.distance_km).toFixed(2)} km</strong></div>
                  <div>Elevation: <strong>{currentSimPoint.elevation_m.toFixed(0)} m</strong></div>
                  <div>Slope: <strong>{currentSimPoint.slope_deg.toFixed(1)}°</strong></div>
                  <div className="text-[10px] text-[#A6A8AD] border-t border-[#33363D] pt-1">
                    O₂ Margin: <strong>{Math.max(65, Math.round(100 - (simState.stepIndex / routeData.route.length) * 20))}%</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Hover Scrubber Reticle Marker on Map */}
          {scrubberPoint && (
            <Marker
              position={[scrubberPoint.lat, scrubberPoint.lng]}
              icon={scrubberIcon}
            />
          )}
        </Pane>
      </MapContainer>

      {/* Feature 4: "What does this route cross?" Geology Crossings Card on Map */}
      {routeData && geologyCrossings && geologyCrossings.length > 0 && (
        <div className="absolute top-28 right-3 z-[1000] pointer-events-auto bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2.5 shadow-2xl max-w-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#33363D] mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[10px] font-mono font-bold text-[#F3F3F3] uppercase tracking-wider">Geology Crossings</span>
            </div>
            <span className="text-[9px] font-mono text-[#A6A8AD]">USGS SIM 3464</span>
          </div>
          {/* Multi-segment colored progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#101114] mb-2 border border-[#33363D]">
            {geologyCrossings.map((g, idx) => (
              <div
                key={`bar-${idx}`}
                style={{ width: `${g.pct}%`, backgroundColor: g.color }}
                title={`${g.name}: ${g.pct}%`}
              />
            ))}
          </div>
          {/* Percentage breakdown list */}
          <div className="space-y-1">
            {geologyCrossings.map((g, idx) => (
              <div key={`item-${idx}`} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center space-x-1.5 truncate pr-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }}></span>
                  <span className="text-[#A6A8AD] truncate">{g.name}</span>
                </div>
                <span className="text-[#F3F3F3] font-bold">{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Measurement Floating Status Banner */}
      {isMeasureMode && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000] bg-[#191b20]/95 backdrop-blur-md border border-amber-500/50 rounded-lg px-3 py-2 shadow-2xl flex items-center space-x-3 text-xs font-mono animate-in fade-in duration-200">
          <Ruler className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="text-white">
            {measurePoints.length === 0 && 'Click first point on terrain to start measurement.'}
            {measurePoints.length === 1 && 'Click second point to measure distance and elevation difference.'}
            {measurePoints.length === 2 && measureResult && (
              <div className="flex items-center space-x-2">
                <span>Distance: <strong className="text-amber-400">{measureResult.distKm} km ({measureResult.distM}m)</strong></span>
                {measureResult.deltaElev != null && (
                  <span className="pl-2 border-l border-[#33363D]">
                    Δ Elev: <strong className={measureResult.deltaElev >= 0 ? 'text-emerald-400' : 'text-sky-400'}>
                      {measureResult.deltaElev >= 0 ? `+${measureResult.deltaElev}` : measureResult.deltaElev} m
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => { setIsMeasureMode(false); setMeasurePoints([]); }}
            className="text-[#A6A8AD] hover:text-white ml-2 text-[10px] px-2 py-0.5 rounded bg-[#22252c] border border-[#33363D] transition-colors"
          >
            EXIT
          </button>
        </div>
      )}

      {/* USGS Geology Legend (Active when USGS Geology is ON) */}
      <GeologyLegendBar showGeology={showGeology} hasActiveRoute={!!routeData} />

      {/* Interactive Bottom Elevation Profile Drawer (Active when route computed) */}
      <RouteElevationProfileBar
        routeData={routeData}
        forceCollapse={showGuideModal}
        onHoverPoint={(pt) => setScrubberPoint(pt)}
        onLeavePoint={() => setScrubberPoint(null)}
        onJumpToStep={(stepIdx) => {
          setSimState(prev => ({ ...prev, stepIndex: stepIdx, isPlaying: false }));
          sfx.playBlip();
        }}
      />

      {/* Map Scientific Colormap Legend */}
      <MapLegendBar activeLayer={activeLayer} />

      {/* Mars GPS Position System — floating HUD for astronaut orientation */}
      {gpsPosition && (
        <div className={`absolute ${routeData && !showGuideModal ? 'bottom-[180px]' : 'bottom-12'} left-3 z-[1000] pointer-events-none transition-all duration-300`}>
          <div className="bg-[#121418]/80 backdrop-blur-md border border-emerald-500/40 rounded-lg p-2 shadow-xl pointer-events-auto min-w-[175px]">
            <div className="flex items-center space-x-1.5 mb-1 pb-1 border-b border-[#33363D]">
              <span className={`w-1.5 h-1.5 rounded-full ${gpsPosition.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`}></span>
              <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Mars Position System</span>
              {gpsPosition.isLive && (
                <span className="text-[7px] px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">LIVE</span>
              )}
            </div>
            <div className="space-y-0 text-[9px] font-mono leading-tight">
              <div className="flex justify-between gap-2">
                <span className="text-[#A6A8AD]">LAT</span>
                <span className="text-white font-bold">{Number(gpsPosition.lat).toFixed(4)}° N</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#A6A8AD]">LON</span>
                <span className="text-white font-bold">{Number(gpsPosition.lng).toFixed(4)}° E</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#A6A8AD]">ELV</span>
                <span className="text-white font-bold">{gpsPosition.elevation != null ? `${Number(gpsPosition.elevation).toFixed(0)} m` : '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#A6A8AD]">SLP</span>
                <span className={`font-bold ${gpsPosition.slope > 15 ? 'text-rose-400' : gpsPosition.slope > 8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {gpsPosition.slope != null ? `${Number(gpsPosition.slope).toFixed(1)}°` : '—'}
                </span>
              </div>
              {gpsPosition.heading != null && (
                <>
                  <div className="border-t border-[#33363D] my-0.5"></div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A6A8AD]">HDG</span>
                    <span className="text-sky-300 font-bold">{gpsPosition.heading}° {gpsPosition.compassDir}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A6A8AD]">REM</span>
                    <span className="text-[#D97745] font-bold">{gpsPosition.distRemaining} km</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A6A8AD]">TRV</span>
                    <span className="text-white font-bold">{gpsPosition.progress}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive In-UI Guided Tour Dock for Hackathon Judges */}
      <InUIGuideTour
        isActive={showGuideModal}
        onClose={() => {
          setShowGuideModal(false);
          setActiveGuideStep(null);
        }}
        onStepChange={(step) => setActiveGuideStep(step)}
        onApplyPreset={handleApplyPreset}
        onComputeRoute={handleComputeRoute}
        onSetActiveLayer={(layer) => setActiveLayer(layer)}
        onOpen3D={() => setIs3DModalOpen(true)}
        onToggleSim={() => {
          setSimState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        }}
      />

      {/* EVA Mission Dispatch Dossier Modal */}
      <MissionDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        routeData={routeData}
        startPoint={startPoint}
        destinationPoint={destinationPoint}
      />

      {/* HiRISE 25cm Ultra-HD Micro-Terrain Inspection Lens Modal */}
      <HiRISEInspectorModal
        isOpen={isHiRISEInspectorOpen}
        onClose={() => setIsHiRISEInspectorOpen(false)}
        currentCoords={cursorCoords || destinationPoint || startPoint || hoveredCoords}
        onSelectWaypoint={onSelectPoint}
        routeData={routeData}
      />

      {/* Interactive 3D WebGL Jezero Crater Orbit Terrain Modal */}
      <Terrain3DModal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        routeData={routeData}
        startPoint={startPoint}
        destinationPoint={destinationPoint}
        onSelectWaypoint={onSelectPoint}
        onRouteComputed={(newRoute) => setRouteData(newRoute)}
      />
    </div>
  );
}
