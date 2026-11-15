import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Box, 
  X, 
  RotateCw, 
  Sun, 
  Mountain, 
  Eye, 
  Sliders, 
  Sparkles,
  Compass,
  Play,
  Pause,
  MapPin,
  TrendingUp,
  Layers,
  Camera,
  FastForward,
  Navigation,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { calculateRoute } from '../../services/api';
import { sfx } from '../../utils/audio';

const JEZERO_BOUNDS = {
  minLat: 18.21,
  maxLat: 18.72,
  minLng: 77.16,
  maxLng: 77.70,
  minElev: -2710.7,
  maxElev: -1515.5
};

// 6 Authentic Jezero Landmarks with coordinates and descriptions
const LANDMARKS = [
  { 
    id: 'landing', 
    name: 'Landing Site', 
    subtitle: 'Octavia E. Butler (Sol 0)', 
    lat: 18.4447, 
    lng: 77.4508, 
    color: '#10B981',
    description: 'Touchdown point of Mars 2020 Perseverance inside Jezero crater floor.'
  },
  { 
    id: 'kodiak', 
    name: 'Kodiak Butte', 
    subtitle: 'Delta Foreset Remnant', 
    lat: 18.4231, 
    lng: 77.4125, 
    color: '#38BDF8',
    description: 'Stratified Gilbert-type foreset outcrop proving Lake Jezero water depth.'
  },
  { 
    id: 'wildcat', 
    name: 'Wildcat Ridge', 
    subtitle: 'Clastic Mudstones', 
    lat: 18.4483, 
    lng: 77.4049, 
    color: '#F59E0B',
    description: 'Fine-grained mudstones where SHERLOC detected organic molecules.'
  },
  { 
    id: 'belva', 
    name: 'Belva Crater', 
    subtitle: '1km Impact Trench', 
    lat: 18.4886, 
    lng: 77.4438, 
    color: '#EF4444',
    description: 'Deep impact crater rim exposing 3D cross-sections of fluvial conglomerates.'
  },
  { 
    id: 'neretva', 
    name: 'Neretva Canyon', 
    subtitle: 'Paleofluvial Inflow Gorge', 
    lat: 18.4820, 
    lng: 77.3600, 
    color: '#EC4899',
    description: 'Ancient river breach canyon carved by catastrophic flooding into the lake.'
  },
  { 
    id: 'three_forks', 
    name: 'Three Forks', 
    subtitle: 'Sample Cache Depot', 
    lat: 18.4350, 
    lng: 77.4400, 
    color: '#A855F7',
    description: 'Flat landing floor depot where 10 sample return tubes were deposited.'
  }
];

// Presets for instant 3D route planning
const PRESETS = [
  { id: 'perseverance_to_kodiak', name: '1. Landing Site → Kodiak Butte', start: [18.4447, 77.4508], dest: [18.4231, 77.4125] },
  { id: 'three_forks_to_wildcat', name: '2. Three Forks → Wildcat Ridge', start: [18.4350, 77.4400], dest: [18.4483, 77.4049] },
  { id: 'seitah_traversal', name: '3. South Séítah → Artuby Ridge', start: [18.4285, 77.4419], dest: [18.4203, 77.4529] },
  { id: 'delta_top_ascent', name: '4. Delta Scarp → Belva Crater', start: [18.4483, 77.4049], dest: [18.4886, 77.4438] },
  { id: 'neretva_vallis_inflow', name: '5. Upper Delta → Neretva Canyon', start: [18.4682, 77.3754], dest: [18.4820, 77.3600] }
];

export default function Terrain3DModal({
  isOpen,
  onClose,
  routeData: initialRouteData,
  startPoint: initialStartPoint,
  destinationPoint: initialDestPoint,
  onSelectWaypoint,
  onRouteComputed
}) {
  const mountRef = useRef(null);
  const [exaggeration, setExaggeration] = useState(2.2);
  const [textureType, setTextureType] = useState('ctx'); // 'ctx', 'elevation', 'slope'
  const [sunMode, setSunMode] = useState('noon'); // 'noon', 'sunset', 'dawn'
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState(null);

  // Active route state (synced with parent or computed locally in 3D)
  const [activeRoute, setActiveRoute] = useState(initialRouteData);
  const [startPoint, setStartPoint] = useState(initialStartPoint);
  const [destPoint, setDestPoint] = useState(initialDestPoint);

  // 3D Flyover Traverse animation state
  const [isFlyingOver, setIsFlyingOver] = useState(false);
  const flyoverProgressRef = useRef(0);

  // Three.js References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const routeLineRef = useRef(null);
  const routeGlowRef = useRef(null);
  const beaconPinsRef = useRef(null);
  const markersGroupRef = useRef(null);
  const heightDataRef = useRef(null);
  const dirLightRef = useRef(null);

  // Auto-rotating state ref to avoid stale closures in requestAnimationFrame
  const isAutoRotatingRef = useRef(isAutoRotating);
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Keep route synced with prop if prop changes
  useEffect(() => {
    setActiveRoute(initialRouteData);
  }, [initialRouteData]);

  // Convert (lat, lng, elev) to 3D X, Y, Z space (mesh centered at 0, 0, size 100x100)
  const geoTo3D = (lat, lng, elev = null, heightGrid = null, exag = 2.2) => {
    const normX = (lng - JEZERO_BOUNDS.minLng) / (JEZERO_BOUNDS.maxLng - JEZERO_BOUNDS.minLng);
    const normY = (lat - JEZERO_BOUNDS.minLat) / (JEZERO_BOUNDS.maxLat - JEZERO_BOUNDS.minLat);
    
    const x = (normX - 0.5) * 100;
    const z = (0.5 - normY) * 100; // Inverted for 3D coordinate space
    
    let y = 0;
    if (elev != null) {
      const normZ = (elev - JEZERO_BOUNDS.minElev) / (JEZERO_BOUNDS.maxElev - JEZERO_BOUNDS.minElev);
      y = normZ * 12.0 * exag;
    } else if (heightGrid) {
      const gx = Math.min(511, Math.max(0, Math.round(normX * 511)));
      const gy = Math.min(511, Math.max(0, Math.round((1 - normY) * 511)));
      const hVal = heightGrid[gy * 512 + gx] / 255.0;
      y = hVal * 12.0 * exag;
    }
    return { x, y, z };
  };

  // Helper to generate a crisp 3D Billboard text badge sprite
  const createBillboardBadge = (name, subtitle, color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    // Outer card background
    ctx.fillStyle = 'rgba(16, 17, 20, 0.90)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 124, 20);
    ctx.fill();
    ctx.stroke();

    // Beacon glow dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(46, 70, 16, 0, Math.PI * 2);
    ctx.fill();

    // Primary Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(name, 80, 62);

    // Subtitle / context
    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px monospace';
    ctx.fillText(subtitle, 80, 105);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(13.5, 3.8, 1);
    return sprite;
  };

  // Main Three.js Setup Effect
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    let isSubscribed = true;
    setIsLoading(true);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.0035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 60, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping under ground
    controls.minDistance = 10;
    controls.maxDistance = 260;
    controls.target.set(0, 0, 0);

    // 3. Lighting (Martian Solar Illumination)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight.position.set(60, 90, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 4. Load Authentic 20m CTX DTM Heightmap
    const img = new Image();
    img.src = '/overlays/jezero_heightmap.png';
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      if (!isSubscribed) return;

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, 512, 512).data;

      const heightGrid = new Float32Array(512 * 512);
      for (let i = 0; i < 512 * 512; i++) {
        heightGrid[i] = imgData[i * 4];
      }
      heightDataRef.current = heightGrid;

      // Create 3D Terrain Plane Geometry
      const segs = 180;
      const geometry = new THREE.PlaneGeometry(100, 100, segs, segs);
      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const normU = (vx + 50) / 100;
        const normV = (vz + 50) / 100;

        const gx = Math.min(511, Math.max(0, Math.round(normU * 511)));
        const gy = Math.min(511, Math.max(0, Math.round(normV * 511)));
        const hNorm = heightGrid[gy * 512 + gx] / 255.0;
        pos.setY(i, hNorm * 12.0 * exaggeration);
      }
      geometry.computeVertexNormals();

      // Load Draped Surface Texture
      const textureLoader = new THREE.TextureLoader();
      const getTexUrl = (type) => {
        if (type === 'elevation') return '/overlays/jezero_elevation_overlay.png';
        if (type === 'slope') return '/overlays/jezero_slope_overlay.png';
        return '/overlays/jezero_ctx_local_overlay.png';
      };

      const surfaceTexture = textureLoader.load(getTexUrl(textureType));
      surfaceTexture.generateMipmaps = true;
      surfaceTexture.minFilter = THREE.LinearMipmapLinearFilter;

      const material = new THREE.MeshStandardMaterial({
        map: surfaceTexture,
        roughness: 0.82,
        metalness: 0.08,
        flatShading: false
      });

      const terrainMesh = new THREE.Mesh(geometry, material);
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      scene.add(terrainMesh);
      terrainMeshRef.current = terrainMesh;

      // 5. Render All 6 Landmarks with 3D Billboard Badges
      renderLandmarks(scene, heightGrid, exaggeration);

      // 6. Render Active 3D Route
      if (activeRoute) {
        render3DRoute(scene, activeRoute, heightGrid, exaggeration);
      }

      setIsLoading(false);
    };

    // Animation Render Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Orbit Auto-Rotate
      if (isAutoRotatingRef.current && controlsRef.current && !isFlyingOver) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      // Flyover Camera Animation along Route Spline
      if (isFlyingOver && activeRoute?.route?.length > 1 && heightDataRef.current) {
        flyoverProgressRef.current = (flyoverProgressRef.current + 0.0015) % 1.0;
        const pts = activeRoute.route;
        const total = pts.length - 1;
        const exactIdx = flyoverProgressRef.current * total;
        const i0 = Math.floor(exactIdx);
        const i1 = Math.min(total, i0 + 1);
        const t = exactIdx - i0;

        const p0 = geoTo3D(pts[i0].lat, pts[i0].lng, pts[i0].elevation_m, heightDataRef.current, exaggeration);
        const p1 = geoTo3D(pts[i1].lat, pts[i1].lng, pts[i1].elevation_m, heightDataRef.current, exaggeration);

        const currentPos = new THREE.Vector3().lerpVectors(
          new THREE.Vector3(p0.x, p0.y + 4.5, p0.z),
          new THREE.Vector3(p1.x, p1.y + 4.5, p1.z),
          t
        );

        camera.position.copy(currentPos);
        controls.target.set(p1.x, p1.y + 1.0, p1.z);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [isOpen]);

  // Render 3D Route Spline & Origin/Destination Beacons
  const render3DRoute = (scene, route, heightGrid, exag) => {
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (beaconPinsRef.current) {
      scene.remove(beaconPinsRef.current);
      beaconPinsRef.current = null;
    }
    if (!route?.route || route.route.length < 2) return;

    const points = [];
    route.route.forEach((pt) => {
      const pos = geoTo3D(pt.lat, pt.lng, pt.elevation_m, heightGrid, exag);
      points.push(new THREE.Vector3(pos.x, pos.y + 0.38, pos.z));
    });

    // Glowing Neon Spline
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, 0.42, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.2
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);
    routeLineRef.current = tubeMesh;

    // Glowing Start / Destination Beacons
    const beacons = new THREE.Group();
    const start3D = points[0];
    const dest3D = points[points.length - 1];

    // Origin Beacon (Emerald)
    const startCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    startCyl.position.set(start3D.x, start3D.y + 3, start3D.z);
    const startSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1 })
    );
    startSphere.position.set(start3D.x, start3D.y + 6, start3D.z);
    beacons.add(startCyl);
    beacons.add(startSphere);

    // Destination Beacon (Mars Terracotta)
    const destCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 8),
      new THREE.MeshBasicMaterial({ color: 0xd97745 })
    );
    destCyl.position.set(dest3D.x, dest3D.y + 3, dest3D.z);
    const destSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97745, emissive: 0xd97745, emissiveIntensity: 1 })
    );
    destSphere.position.set(dest3D.x, dest3D.y + 6, dest3D.z);
    beacons.add(destCyl);
    beacons.add(destSphere);

    scene.add(beacons);
    beaconPinsRef.current = beacons;
  };

  // Render 6 Jezero Landmarks with Floating Billboard Labels
  const renderLandmarks = (scene, heightGrid, exag) => {
    if (markersGroupRef.current) {
      scene.remove(markersGroupRef.current);
    }
    const group = new THREE.Group();

    LANDMARKS.forEach((lm) => {
      const pos = geoTo3D(lm.lat, lm.lng, null, heightGrid, exag);

      // Pin Mast
      const pinGeom = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: lm.color });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      pin.position.set(pos.x, pos.y + 2.25, pos.z);

      // Glowing Sphere
      const sphereGeom = new THREE.SphereGeometry(0.9, 14, 14);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: lm.color,
        emissive: lm.color,
        emissiveIntensity: 0.8
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(pos.x, pos.y + 4.5, pos.z);

      // Floating 3D Billboard Text Badge
      const billboard = createBillboardBadge(lm.name, lm.subtitle, lm.color);
      billboard.position.set(pos.x, pos.y + 7.8, pos.z);

      group.add(pin);
      group.add(sphere);
      group.add(billboard);
    });

    scene.add(group);
    markersGroupRef.current = group;
  };

  // Teleport Camera to Landmark
  const handleFocusLandmark = (lm) => {
    setSelectedLandmark(lm);
    sfx.playBlip();
    if (!controlsRef.current || !cameraRef.current || !heightDataRef.current) return;

    const pos = geoTo3D(lm.lat, lm.lng, null, heightDataRef.current, exaggeration);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Smooth camera transition to landmark
    camera.position.set(pos.x, pos.y + 22, pos.z + 32);
    controls.target.set(pos.x, pos.y + 2, pos.z);
    controls.update();
  };

  // Compute Route Directly from 3D View
  const handleCompute3DRoute = async (startCoords, destCoords) => {
    setIsCalculating(true);
    sfx.playBlip();

    const start = startCoords || startPoint || { lat: LANDMARKS[0].lat, lng: LANDMARKS[0].lng };
    const dest = destCoords || destPoint || { lat: LANDMARKS[1].lat, lng: LANDMARKS[1].lng };

    const res = await calculateRoute(start, dest, 20.0);
    setIsCalculating(false);

    if (res && res.status === 'success') {
      setActiveRoute(res);
      sfx.playSuccess();
      if (onRouteComputed) onRouteComputed(res);

      if (sceneRef.current && heightDataRef.current) {
        render3DRoute(sceneRef.current, res, heightDataRef.current, exaggeration);
      }
    } else {
      sfx.playWarning();
    }
  };

  // Apply a Preset from the 3D HUD
  const handleApplyPresetIn3D = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const start = { lat: preset.start[0], lng: preset.start[1] };
    const dest = { lat: preset.dest[0], lng: preset.dest[1] };
    setStartPoint(start);
    setDestPoint(dest);
    if (onSelectWaypoint) {
      onSelectWaypoint('start', start);
      onSelectWaypoint('destination', dest);
    }
    handleCompute3DRoute(start, dest);
  };

  // Update Vertical Exaggeration on-the-fly
  const handleExaggerationChange = (newExag) => {
    setExaggeration(newExag);
    if (!terrainMeshRef.current || !heightDataRef.current) return;

    const geometry = terrainMeshRef.current.geometry;
    const pos = geometry.attributes.position;
    const heightGrid = heightDataRef.current;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const normU = (vx + 50) / 100;
      const normV = (vz + 50) / 100;

      const gx = Math.min(511, Math.max(0, Math.round(normU * 511)));
      const gy = Math.min(511, Math.max(0, Math.round(normV * 511)));
      const hNorm = heightGrid[gy * 512 + gx] / 255.0;
      pos.setY(i, hNorm * 12.0 * newExag);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();

    if (sceneRef.current) {
      if (activeRoute) render3DRoute(sceneRef.current, activeRoute, heightGrid, newExag);
      renderLandmarks(sceneRef.current, heightGrid, newExag);
    }
  };

  // Switch Draped Texture
  const handleTextureChange = (type) => {
    setTextureType(type);
    sfx.playBlip();
    if (!terrainMeshRef.current) return;

    const textureLoader = new THREE.TextureLoader();
    let url = '/overlays/jezero_ctx_local_overlay.png';
    if (type === 'elevation') url = '/overlays/jezero_elevation_overlay.png';
    if (type === 'slope') url = '/overlays/jezero_slope_overlay.png';

    textureLoader.load(url, (tex) => {
      tex.generateMipmaps = true;
      terrainMeshRef.current.material.map = tex;
      terrainMeshRef.current.material.needsUpdate = true;
    });
  };

  // Adjust Sun Angle / Time of Day
  const handleSunModeChange = (mode) => {
    setSunMode(mode);
    sfx.playBlip();
    if (!dirLightRef.current || !sceneRef.current) return;

    const light = dirLightRef.current;
    if (mode === 'noon') {
      light.position.set(20, 100, 30);
      light.intensity = 1.5;
      light.color.setHex(0xfff5e6);
      sceneRef.current.background.setHex(0x0a0c10);
    } else if (mode === 'sunset') {
      light.position.set(-80, 25, -40); // Low angle casting long dramatic shadows
      light.intensity = 1.3;
      light.color.setHex(0xff7744); // Martian golden-orange sunset
      sceneRef.current.background.setHex(0x180d12);
    } else if (mode === 'dawn') {
      light.position.set(80, 30, 40);
      light.intensity = 1.2;
      light.color.setHex(0xffeedd);
      sceneRef.current.background.setHex(0x0c0f18);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-2 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-7xl bg-[#101114] border border-[#33363D] rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header Bar */}
        <div className="bg-[#191b20] border-b border-[#33363D] px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs select-none">
          {/* Title & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">JEZERO 3D TERRAIN ORBIT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  20m DTM MESH
                </span>
              </div>
              <p className="text-[10px] text-[#A6A8AD] hidden md:block">
                Interactive WebGL 3D Model with Physics Orbit, Draped Textures &amp; Traversal Splines
              </p>
            </div>
          </div>

          {/* Center Group: Surface Textures & Sun Position */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Texture Selector */}
            <div className="flex items-center space-x-1 bg-[#101114] p-1 rounded-lg border border-[#33363D]">
              <button
                onClick={() => handleTextureChange('ctx')}
                className={`px-2 py-1 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'ctx' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                CTX (6m)
              </button>
              <button
                onClick={() => handleTextureChange('elevation')}
                className={`px-2 py-1 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'elevation' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                Elevation DEM
              </button>
              <button
                onClick={() => handleTextureChange('slope')}
                className={`px-2 py-1 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'slope' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                Slope Hazard
              </button>
            </div>

            {/* Sun Illumination Angle */}
            <div className="flex items-center space-x-1 bg-[#101114] p-1 rounded-lg border border-[#33363D] text-[10px]">
              <Sun className="w-3.5 h-3.5 text-amber-400 ml-1" />
              <button
                onClick={() => handleSunModeChange('noon')}
                className={`px-1.5 py-0.5 rounded ${sunMode === 'noon' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-[#A6A8AD]'}`}
              >
                Noon
              </button>
              <button
                onClick={() => handleSunModeChange('sunset')}
                title="Low-angle sunset casting dramatic shadows across crater scarps"
                className={`px-1.5 py-0.5 rounded ${sunMode === 'sunset' ? 'bg-orange-500/30 text-orange-300 font-bold' : 'text-[#A6A8AD]'}`}
              >
                Sunset
              </button>
              <button
                onClick={() => handleSunModeChange('dawn')}
                className={`px-1.5 py-0.5 rounded ${sunMode === 'dawn' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-[#A6A8AD]'}`}
              >
                Dawn
              </button>
            </div>
          </div>

          {/* Right Controls: Auto-Rotate, Reset & Close */}
          <div className="flex items-center space-x-2">
            {/* Auto-Rotate Orbit Button */}
            <button
              onClick={() => {
                setIsAutoRotating(prev => !prev);
                sfx.playBlip();
              }}
              title="Toggle Cinematic 360° Auto-Rotate Orbit"
              className={`px-2.5 py-1.5 rounded border transition-colors flex items-center space-x-1 text-[11px] ${
                isAutoRotating
                  ? 'bg-sky-500 text-black font-bold border-sky-400 shadow-lg shadow-sky-500/30'
                  : 'bg-[#22252c] text-[#A6A8AD] border-[#33363D] hover:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span>{isAutoRotating ? 'ORBITING...' : 'ORBIT 360°'}</span>
            </button>

            {/* Flyover Traverse Camera Button */}
            {activeRoute && (
              <button
                onClick={() => {
                  setIsFlyingOver(prev => !prev);
                  sfx.playBlip();
                }}
                title="Cinematic camera flyover following the 3D traverse"
                className={`px-2.5 py-1.5 rounded border transition-colors flex items-center space-x-1 text-[11px] ${
                  isFlyingOver
                    ? 'bg-amber-500 text-black font-bold border-amber-400'
                    : 'bg-[#22252c] text-[#A6A8AD] border-[#33363D] hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isFlyingOver ? 'EXIT FLYOVER' : 'FLYOVER'}</span>
              </button>
            )}

            {/* Reset Camera View */}
            <button
              onClick={() => {
                if (controlsRef.current && cameraRef.current) {
                  cameraRef.current.position.set(0, 60, 80);
                  controlsRef.current.target.set(0, 0, 0);
                  controlsRef.current.update();
                  setIsFlyingOver(false);
                  sfx.playBlip();
                }
              }}
              title="Reset Camera to Top Overview"
              className="px-2 py-1.5 rounded bg-[#22252c] text-[#A6A8AD] border border-[#33363D] hover:text-white text-[11px]"
            >
              Reset
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#22252c] hover:bg-rose-950/60 text-[#A6A8AD] hover:text-rose-300 border border-[#33363D] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Mission Planning Bar: Presets & Compute Route inside 3D View */}
        <div className="bg-[#14161a] border-b border-[#33363D] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-[#A6A8AD] text-[10px] uppercase font-bold flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-[#D97745]" />
              <span>3D Traversal Presets:</span>
            </span>

            <select
              onChange={(e) => {
                if (e.target.value) handleApplyPresetIn3D(e.target.value);
              }}
              defaultValue=""
              className="bg-[#191b20] border border-[#33363D] text-[#F3F3F3] text-[11px] rounded px-2 py-1 outline-none hover:border-[#D97745] transition-colors cursor-pointer"
            >
              <option value="" disabled>Select Mission Traversal...</option>
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={() => handleCompute3DRoute()}
              disabled={isCalculating}
              className="bg-[#D97745] hover:bg-[#B85C38] text-white px-3 py-1 rounded font-bold text-[11px] shadow-lg flex items-center space-x-1 transition-all transform active:scale-95 whitespace-nowrap"
            >
              <Play className={`w-3 h-3 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>{isCalculating ? 'CALCULATING 3D...' : 'COMPUTE 3D PATH'}</span>
            </button>
          </div>

          {/* Quick Landmark Teleport Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <span className="text-[#A6A8AD] text-[9px] uppercase hidden lg:inline mr-1">Focus Landmark:</span>
            {LANDMARKS.map(lm => (
              <button
                key={lm.id}
                onClick={() => handleFocusLandmark(lm)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-[#191b20] hover:bg-[#22252c] border border-[#33363D] hover:border-white transition-colors flex items-center space-x-1 text-white"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lm.color }}></span>
                <span>{lm.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WebGL 3D Viewport Canvas */}
        <div className="relative flex-1 w-full h-full">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
              <div className="p-4 rounded-xl bg-[#191b20] border border-[#33363D] text-center space-y-2 font-mono text-xs">
                <Box className="w-6 h-6 text-[#D97745] animate-bounce mx-auto" />
                <div className="text-white font-bold">Constructing 3D Jezero Crater Mesh...</div>
                <div className="text-[#A6A8AD] text-[10px]">Sampling 20m CTX DTM elevation heights</div>
              </div>
            </div>
          )}

          {/* Floating Telemetry & Exaggeration Controls (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 font-mono text-xs pointer-events-none max-w-sm">
            {/* Active 3D Route Telemetry Card */}
            {activeRoute?.route && (
              <div className="bg-[#191b20]/95 backdrop-blur-md border border-emerald-500/40 rounded-lg p-2.5 shadow-2xl pointer-events-auto space-y-1.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-1 border-b border-[#33363D]">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>3D TRAVERSE ACTIVE</span>
                  </div>
                  <span className="text-[10px] text-white font-bold">{activeRoute.distance_km} km</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#A6A8AD]">
                  <div>Max Slope: <strong className="text-[#D97745]">{activeRoute.max_slope_deg}°</strong></div>
                  <div>Difficulty: <strong className="text-emerald-400">{activeRoute.estimated_difficulty}</strong></div>
                  <div>Ascent: <strong className="text-emerald-400">+{activeRoute.elevation_gain_m}m</strong></div>
                  <div>Descent: <strong className="text-sky-400">−{activeRoute.elevation_loss_m ?? 0}m</strong></div>
                </div>
                <div className="text-[9px] text-[#A6A8AD] pt-0.5 border-t border-[#33363D]/60 leading-tight">
                  Traverse displayed as elevated green neon spline through Jezero Delta.
                </div>
              </div>
            )}

            {/* Vertical Exaggeration Slider */}
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2.5 shadow-xl pointer-events-auto space-y-1.5 w-64">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#A6A8AD] uppercase font-bold flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-[#D97745]" />
                  <span>Vertical Relief Exaggeration</span>
                </span>
                <span className="text-white font-bold">{exaggeration}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.2"
                value={exaggeration}
                onChange={(e) => handleExaggerationChange(parseFloat(e.target.value))}
                className="w-full accent-[#D97745] h-1.5 bg-[#101114] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#A6A8AD]">
                <span>0.8x (True Scale)</span>
                <span>2.2x (Recommended)</span>
                <span>4.0x (Peak)</span>
              </div>
            </div>
          </div>

          {/* Selected Landmark Info Card (Bottom Right) */}
          {selectedLandmark && (
            <div className="absolute bottom-4 right-4 z-10 pointer-events-auto max-w-xs bg-[#191b20]/95 backdrop-blur-md border rounded-lg p-3 font-mono shadow-2xl space-y-1 animate-in fade-in duration-200" style={{ borderColor: selectedLandmark.color }}>
              <div className="flex items-center justify-between pb-1 border-b border-[#33363D]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedLandmark.color }}></span>
                  <span className="font-bold text-white text-xs">{selectedLandmark.name}</span>
                </div>
                <button
                  onClick={() => setSelectedLandmark(null)}
                  className="text-[#A6A8AD] hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="text-[10px] text-[#D97745] font-semibold">{selectedLandmark.subtitle}</div>
              <p className="text-[10px] text-[#A6A8AD] leading-relaxed pt-1">{selectedLandmark.description}</p>
              <div className="flex space-x-1.5 pt-2 border-t border-[#33363D]">
                <button
                  onClick={() => {
                    setStartPoint({ lat: selectedLandmark.lat, lng: selectedLandmark.lng });
                    sfx.playBlip();
                  }}
                  className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white py-1 rounded text-[9px] font-bold"
                >
                  Set as Origin
                </button>
                <button
                  onClick={() => {
                    setDestPoint({ lat: selectedLandmark.lat, lng: selectedLandmark.lng });
                    sfx.playBlip();
                  }}
                  className="flex-1 bg-[#D97745]/80 hover:bg-[#D97745] text-white py-1 rounded text-[9px] font-bold"
                >
                  Set as Target
                </button>
              </div>
            </div>
          )}

          {/* Camera Navigation Tips HUD (Top Right) */}
          <div className="absolute top-4 right-4 z-10 hidden sm:block pointer-events-none">
            <div className="bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg p-2.5 font-mono text-[10px] text-[#A6A8AD] shadow-xl space-y-1">
              <div className="text-white font-bold text-[9px] uppercase border-b border-[#33363D] pb-0.5 mb-1 flex items-center space-x-1">
                <Navigation className="w-3 h-3 text-[#38BDF8]" />
                <span>3D Navigation Controls</span>
              </div>
              <div>• <strong>Left Click + Drag:</strong> 360° Orbit &amp; Pitch</div>
              <div>• <strong>Right Click + Drag:</strong> Pan Terrain</div>
              <div>• <strong>Scroll Wheel:</strong> Zoom In / Out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
