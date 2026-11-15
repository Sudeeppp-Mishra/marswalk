import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Box, 
  X, 
  RotateCw, 
  Sun, 
  Mountain, 
  Sliders, 
  Compass,
  Play,
  RotateCcw,
  Camera,
  Navigation,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Info
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

// 6 Authentic Jezero Landmarks with staggered mast heights to prevent visual occlusion
const LANDMARKS = [
  { 
    id: 'landing', 
    name: 'Landing Site', 
    subtitle: 'Octavia E. Butler (Sol 0)', 
    lat: 18.4447, 
    lng: 77.4508, 
    color: '#10B981',
    mastHeight: 3.2,
    badgeY: 4.8,
    description: 'Touchdown point of Mars 2020 Perseverance inside Jezero crater floor.'
  },
  { 
    id: 'kodiak', 
    name: 'Kodiak Butte', 
    subtitle: 'Delta Foreset Remnant', 
    lat: 18.4231, 
    lng: 77.4125, 
    color: '#38BDF8',
    mastHeight: 6.5,
    badgeY: 8.8,
    description: 'Stratified Gilbert-type foreset outcrop proving Lake Jezero water depth.'
  },
  { 
    id: 'wildcat', 
    name: 'Wildcat Ridge', 
    subtitle: 'Clastic Mudstones', 
    lat: 18.4483, 
    lng: 77.4049, 
    color: '#F59E0B',
    mastHeight: 4.5,
    badgeY: 6.4,
    description: 'Fine-grained mudstones where SHERLOC detected organic molecules.'
  },
  { 
    id: 'belva', 
    name: 'Belva Crater', 
    subtitle: '1km Impact Trench', 
    lat: 18.4886, 
    lng: 77.4438, 
    color: '#EF4444',
    mastHeight: 8.5,
    badgeY: 11.4,
    description: 'Deep impact crater rim exposing 3D cross-sections of fluvial conglomerates.'
  },
  { 
    id: 'neretva', 
    name: 'Neretva Canyon', 
    subtitle: 'Paleofluvial Inflow Gorge', 
    lat: 18.4820, 
    lng: 77.3600, 
    color: '#EC4899',
    mastHeight: 10.2,
    badgeY: 13.8,
    description: 'Ancient river breach canyon carved by catastrophic flooding into the lake.'
  },
  { 
    id: 'three_forks', 
    name: 'Three Forks', 
    subtitle: 'Sample Cache Depot', 
    lat: 18.4350, 
    lng: 77.4400, 
    color: '#A855F7',
    mastHeight: 5.2,
    badgeY: 7.4,
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
  const [labelMode, setLabelMode] = useState('all'); // 'all', 'focus', 'off'
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Active route and waypoint state in 3D
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
  const waypointPinsGroupRef = useRef(null);
  const landmarksGroupRef = useRef(null);
  const heightDataRef = useRef(null);
  const dirLightRef = useRef(null);

  // Refs for animation loop to avoid stale React closures
  const isAutoRotatingRef = useRef(isAutoRotating);
  const activeRouteRef = useRef(activeRoute);
  const labelModeRef = useRef(labelMode);
  const selectedLandmarkRef = useRef(selectedLandmark);
  const startPointRef = useRef(startPoint);
  const destPointRef = useRef(destPoint);

  useEffect(() => { isAutoRotatingRef.current = isAutoRotating; }, [isAutoRotating]);
  useEffect(() => { activeRouteRef.current = activeRoute; }, [activeRoute]);
  useEffect(() => { labelModeRef.current = labelMode; }, [labelMode]);
  useEffect(() => { selectedLandmarkRef.current = selectedLandmark; }, [selectedLandmark]);
  useEffect(() => { startPointRef.current = startPoint; }, [startPoint]);
  useEffect(() => { destPointRef.current = destPoint; }, [destPoint]);

  // Sync with props
  useEffect(() => {
    setActiveRoute(initialRouteData);
  }, [initialRouteData]);

  useEffect(() => {
    setStartPoint(initialStartPoint);
  }, [initialStartPoint]);

  useEffect(() => {
    setDestPoint(initialDestPoint);
  }, [initialDestPoint]);

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

  // Convert 3D X, Z hit point back to geographical (lat, lng)
  const threeDToGeo = (x, z) => {
    const normX = (x / 100) + 0.5;
    const normY = 0.5 - (z / 100);
    const lng = Number((JEZERO_BOUNDS.minLng + normX * (JEZERO_BOUNDS.maxLng - JEZERO_BOUNDS.minLng)).toFixed(4));
    const lat = Number((JEZERO_BOUNDS.minLat + normY * (JEZERO_BOUNDS.maxLat - JEZERO_BOUNDS.minLat)).toFixed(4));
    return { lat, lng };
  };

  // Helper to generate a compact, crisp 3D Billboard text badge sprite
  const createCompactBillboard = (name, subtitle, color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Outer card pill
    ctx.fillStyle = 'rgba(16, 17, 20, 0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, 372, 84, 16);
    ctx.fill();
    ctx.stroke();

    // Beacon glow dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(36, 48, 12, 0, Math.PI * 2);
    ctx.fill();

    // Primary Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(name, 62, 44);

    // Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px monospace';
    ctx.fillText(subtitle, 62, 72);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(7.5, 1.9, 1);
    return sprite;
  };

  // Update Waypoint Markers (Start & Destination Beacons) on the 3D surface
  const updateWaypointBeacons = (start, dest, scene, heightGrid, exag) => {
    const activeScene = scene || sceneRef.current;
    const activeGrid = heightGrid || heightDataRef.current;
    if (!activeScene || !activeGrid) return;

    if (waypointPinsGroupRef.current) {
      activeScene.remove(waypointPinsGroupRef.current);
      waypointPinsGroupRef.current = null;
    }

    const group = new THREE.Group();

    // Origin Beacon (Emerald)
    if (start) {
      const p = geoTo3D(start.lat, start.lng, null, activeGrid, exag);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 6.0, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      mast.position.set(p.x, p.y + 3.0, p.z);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1 })
      );
      sphere.position.set(p.x, p.y + 6.0, p.z);

      const badge = createCompactBillboard('ORIGIN WAYPOINT', `${start.lat}° N, ${start.lng}° E`, '#10B981');
      badge.position.set(p.x, p.y + 8.2, p.z);

      group.add(mast);
      group.add(sphere);
      group.add(badge);
    }

    // Target Destination Beacon (Terracotta)
    if (dest) {
      const p = geoTo3D(dest.lat, dest.lng, null, activeGrid, exag);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 6.0, 8),
        new THREE.MeshBasicMaterial({ color: 0xd97745 })
      );
      mast.position.set(p.x, p.y + 3.0, p.z);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97745, emissive: 0xd97745, emissiveIntensity: 1 })
      );
      sphere.position.set(p.x, p.y + 6.0, p.z);

      const badge = createCompactBillboard('TARGET WAYPOINT', `${dest.lat}° N, ${dest.lng}° E`, '#D97745');
      badge.position.set(p.x, p.y + 8.2, p.z);

      group.add(mast);
      group.add(sphere);
      group.add(badge);
    }

    activeScene.add(group);
    waypointPinsGroupRef.current = group;
  };

  // Main Three.js Mount Effect
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
    camera.position.set(0, 58, 76);

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
    controls.minDistance = 8;
    controls.maxDistance = 250;
    controls.target.set(0, 0, 0);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.45);
    dirLight.position.set(50, 85, 35);
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

      // Construct 3D Terrain Geometry
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

      // Render Staggered Landmarks & Active Waypoint Beacons
      renderLandmarks(scene, heightGrid, exaggeration, labelModeRef.current, selectedLandmarkRef.current);
      updateWaypointBeacons(startPointRef.current, destPointRef.current, scene, heightGrid, exaggeration);

      // Render Active 3D Route if present
      if (activeRouteRef.current) {
        render3DRoute(scene, activeRouteRef.current, heightGrid, exaggeration);
      }

      setIsLoading(false);
    };

    // 5. Interactive Click-on-Terrain Raycasting Handler
    let pointerDownPos = { x: 0, y: 0, time: 0 };

    const onPointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const onPointerUp = (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      const duration = Date.now() - pointerDownPos.time;
      // If user dragged to rotate or pan, ignore as camera movement
      if (dist > 6 || duration > 400) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      if (terrainMeshRef.current) {
        const intersects = raycaster.intersectObject(terrainMeshRef.current);
        if (intersects.length > 0) {
          const hit = intersects[0].point;
          const geo = threeDToGeo(hit.x, hit.z);

          // Handle Interactive 3D Waypoint Setting
          const currentStart = startPointRef.current;
          const currentDest = destPointRef.current;

          if (!currentStart) {
            setStartPoint(geo);
            if (onSelectWaypoint) onSelectWaypoint('start', geo);
            updateWaypointBeacons(geo, null, scene, heightDataRef.current, exaggeration);
            setFeedbackNotice({ type: 'info', text: `Origin set: ${geo.lat}° N, ${geo.lng}° E. Click terrain to set Target.` });
            setTimeout(() => setFeedbackNotice(null), 3500);
            sfx.playBlip();
          } else if (!currentDest) {
            setDestPoint(geo);
            if (onSelectWaypoint) onSelectWaypoint('destination', geo);
            updateWaypointBeacons(currentStart, geo, scene, heightDataRef.current, exaggeration);
            setFeedbackNotice({ type: 'success', text: `Target set: ${geo.lat}° N, ${geo.lng}° E. Calculating 3D path...` });
            setTimeout(() => setFeedbackNotice(null), 3500);
            sfx.playBlip();
            // Automatically compute 3D route
            handleCompute3DRoute(currentStart, geo);
          } else {
            // Reset to new origin
            setStartPoint(geo);
            setDestPoint(null);
            setActiveRoute(null);
            if (onSelectWaypoint) {
              onSelectWaypoint('start', geo);
              onSelectWaypoint('destination', null);
            }
            if (routeLineRef.current) {
              scene.remove(routeLineRef.current);
              routeLineRef.current = null;
            }
            updateWaypointBeacons(geo, null, scene, heightDataRef.current, exaggeration);
            setFeedbackNotice({ type: 'info', text: `New Origin set: ${geo.lat}° N, ${geo.lng}° E. Click Target.` });
            setTimeout(() => setFeedbackNotice(null), 3500);
            sfx.playBlip();
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 6. Animation Render Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto-Rotate Orbit
      if (isAutoRotatingRef.current && controlsRef.current && !isFlyingOver) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      // Flyover Camera Animation along Route Spline
      if (isFlyingOver && activeRouteRef.current?.route?.length > 1 && heightDataRef.current) {
        flyoverProgressRef.current = (flyoverProgressRef.current + 0.0016) % 1.0;
        const pts = activeRouteRef.current.route;
        const total = pts.length - 1;
        const exactIdx = flyoverProgressRef.current * total;
        const i0 = Math.floor(exactIdx);
        const i1 = Math.min(total, i0 + 1);
        const t = exactIdx - i0;

        const p0 = geoTo3D(pts[i0].lat, pts[i0].lng, pts[i0].elevation_m, heightDataRef.current, exaggeration);
        const p1 = geoTo3D(pts[i1].lat, pts[i1].lng, pts[i1].elevation_m, heightDataRef.current, exaggeration);

        const currentPos = new THREE.Vector3().lerpVectors(
          new THREE.Vector3(p0.x, p0.y + 4.2, p0.z),
          new THREE.Vector3(p1.x, p1.y + 4.2, p1.z),
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [isOpen]);

  // Render 3D Route Spline
  const render3DRoute = (scene, route, heightGrid, exag) => {
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (!route?.route || route.route.length < 2) return;

    const points = [];
    route.route.forEach((pt) => {
      const pos = geoTo3D(pt.lat, pt.lng, pt.elevation_m, heightGrid, exag);
      points.push(new THREE.Vector3(pos.x, pos.y + 0.38, pos.z));
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, 0.45, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.95,
      roughness: 0.25,
      metalness: 0.2
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);
    routeLineRef.current = tubeMesh;
  };

  // Render 6 Jezero Landmarks with Staggered Elevations & Compact Badges
  const renderLandmarks = (scene, heightGrid, exag, mode = 'all', focusedLandmark = null) => {
    if (landmarksGroupRef.current) {
      scene.remove(landmarksGroupRef.current);
    }
    const group = new THREE.Group();

    LANDMARKS.forEach((lm) => {
      const pos = geoTo3D(lm.lat, lm.lng, null, heightGrid, exag);
      const isFocused = focusedLandmark && focusedLandmark.id === lm.id;

      // Pin Mast
      const mastH = isFocused ? lm.mastHeight * 1.3 : lm.mastHeight;
      const pinGeom = new THREE.CylinderGeometry(0.12, 0.12, mastH, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: lm.color });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      pin.position.set(pos.x, pos.y + mastH / 2, pos.z);

      // Glowing Sphere
      const sphereR = isFocused ? 1.3 : 0.85;
      const sphereGeom = new THREE.SphereGeometry(sphereR, 14, 14);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: lm.color,
        emissive: lm.color,
        emissiveIntensity: isFocused ? 1.2 : 0.8
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(pos.x, pos.y + mastH, pos.z);

      group.add(pin);
      group.add(sphere);

      // Render Billboard Badge based on mode
      const shouldRenderBadge = mode === 'all' || (mode === 'focus' && isFocused);
      if (shouldRenderBadge) {
        const billboard = createCompactBillboard(lm.name, lm.subtitle, lm.color);
        billboard.position.set(pos.x, pos.y + lm.badgeY, pos.z);
        group.add(billboard);
      }
    });

    scene.add(group);
    landmarksGroupRef.current = group;
  };

  // Teleport Camera to Landmark
  const handleFocusLandmark = (lm) => {
    setSelectedLandmark(lm);
    sfx.playBlip();
    if (!controlsRef.current || !cameraRef.current || !heightDataRef.current) return;

    const pos = geoTo3D(lm.lat, lm.lng, null, heightDataRef.current, exaggeration);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    camera.position.set(pos.x, pos.y + 22, pos.z + 32);
    controls.target.set(pos.x, pos.y + 2, pos.z);
    controls.update();

    if (sceneRef.current && heightDataRef.current) {
      renderLandmarks(sceneRef.current, heightDataRef.current, exaggeration, labelMode, lm);
    }
  };

  // Reset 3D Waypoints
  const handleReset3DPoints = () => {
    setStartPoint(null);
    setDestPoint(null);
    setActiveRoute(null);
    setIsFlyingOver(false);
    sfx.playBlip();

    if (onSelectWaypoint) {
      onSelectWaypoint('start', null);
      onSelectWaypoint('destination', null);
    }
    if (sceneRef.current) {
      if (routeLineRef.current) {
        sceneRef.current.remove(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (waypointPinsGroupRef.current) {
        sceneRef.current.remove(waypointPinsGroupRef.current);
        waypointPinsGroupRef.current = null;
      }
    }
    setFeedbackNotice({ type: 'info', text: 'Waypoints cleared. Click anywhere on 3D terrain to place Origin.' });
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Compute Route in 3D
  const handleCompute3DRoute = async (startCoords, destCoords) => {
    const start = startCoords || startPoint;
    const dest = destCoords || destPoint;

    if (!start || !dest) {
      setFeedbackNotice({ type: 'warning', text: 'Select both Origin & Target points on the 3D terrain first.' });
      setTimeout(() => setFeedbackNotice(null), 4000);
      return;
    }

    setIsCalculating(true);
    sfx.playBlip();

    const res = await calculateRoute(start, dest, 20.0);
    setIsCalculating(false);

    if (res && res.status === 'success') {
      setActiveRoute(res);
      sfx.playSuccess();
      if (onRouteComputed) onRouteComputed(res);

      if (sceneRef.current && heightDataRef.current) {
        render3DRoute(sceneRef.current, res, heightDataRef.current, exaggeration);
        updateWaypointBeacons(start, dest, sceneRef.current, heightDataRef.current, exaggeration);
      }
      setFeedbackNotice({ type: 'success', text: `3D Route computed: ${res.distance_km} km (${res.estimated_difficulty})` });
      setTimeout(() => setFeedbackNotice(null), 4000);
    } else {
      sfx.playWarning();
      setFeedbackNotice({ type: 'error', text: res?.error || 'Path blocked by steep terrain hazards.' });
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
    updateWaypointBeacons(start, dest, sceneRef.current, heightDataRef.current, exaggeration);
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
      renderLandmarks(sceneRef.current, heightGrid, newExag, labelMode, selectedLandmark);
      updateWaypointBeacons(startPoint, destPoint, sceneRef.current, heightGrid, newExag);
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
      light.position.set(-80, 25, -40);
      light.intensity = 1.35;
      light.color.setHex(0xff7744);
      sceneRef.current.background.setHex(0x180d12);
    } else if (mode === 'dawn') {
      light.position.set(80, 30, 40);
      light.intensity = 1.25;
      light.color.setHex(0xffeedd);
      sceneRef.current.background.setHex(0x0c0f18);
    }
  };

  // Toggle Billboard Badges Mode (All / Focus Only / Off)
  const handleToggleLabels = () => {
    const nextMode = labelMode === 'all' ? 'focus' : labelMode === 'focus' ? 'off' : 'all';
    setLabelMode(nextMode);
    sfx.playBlip();
    if (sceneRef.current && heightDataRef.current) {
      renderLandmarks(sceneRef.current, heightDataRef.current, exaggeration, nextMode, selectedLandmark);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full h-[96vh] max-w-7xl bg-[#101114] border border-[#33363D] rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Top Control Header Bar */}
        <div className="bg-[#191b20] border-b border-[#33363D] px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs">
          {/* Title & Badge */}
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">JEZERO 3D TERRAIN ORBIT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  20m DTM
                </span>
              </div>
              <p className="text-[10px] text-[#A6A8AD] hidden md:block">
                Click terrain to set Origin &amp; Target • Interactive Physics Orbit
              </p>
            </div>
          </div>

          {/* Center: Surface Textures, Sun Angle & Labels Mode */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Texture Selector */}
            <div className="flex items-center space-x-1 bg-[#101114] p-1 rounded-lg border border-[#33363D]">
              <button
                onClick={() => handleTextureChange('ctx')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'ctx' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                CTX (6m)
              </button>
              <button
                onClick={() => handleTextureChange('elevation')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'elevation' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                Elevation
              </button>
              <button
                onClick={() => handleTextureChange('slope')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors ${
                  textureType === 'slope' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
                }`}
              >
                Slope
              </button>
            </div>

            {/* Sun Angle Selector */}
            <div className="flex items-center space-x-1 bg-[#101114] p-1 rounded-lg border border-[#33363D] text-[10px]">
              <Sun className="w-3 h-3 text-amber-400 ml-0.5" />
              <button
                onClick={() => handleSunModeChange('noon')}
                className={`px-1.5 py-0.5 rounded ${sunMode === 'noon' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-[#A6A8AD]'}`}
              >
                Noon
              </button>
              <button
                onClick={() => handleSunModeChange('sunset')}
                title="Low sun angle casting dramatic shadows"
                className={`px-1.5 py-0.5 rounded ${sunMode === 'sunset' ? 'bg-orange-500/30 text-orange-300 font-bold' : 'text-[#A6A8AD]'}`}
              >
                Sunset
              </button>
            </div>

            {/* Labels Toggle (All / Focus Only / Off) */}
            <button
              onClick={handleToggleLabels}
              title="Cycle Labels Visibility (All -> Focus Only -> Off)"
              className="px-2 py-1 rounded text-[10px] font-mono bg-[#101114] border border-[#33363D] text-[#A6A8AD] hover:text-white flex items-center space-x-1"
            >
              <Tag className="w-3 h-3 text-sky-400" />
              <span>Labels: <strong className="text-white uppercase">{labelMode}</strong></span>
            </button>
          </div>

          {/* Right Action Controls: Orbit, Flyover, Reset & Close */}
          <div className="flex items-center space-x-1.5">
            {/* Auto-Rotate Orbit Button */}
            <button
              onClick={() => {
                setIsAutoRotating(prev => !prev);
                sfx.playBlip();
              }}
              title="Toggle Cinematic 360° Auto-Rotate Orbit"
              className={`px-2 py-1 rounded border transition-colors flex items-center space-x-1 text-[11px] ${
                isAutoRotating
                  ? 'bg-sky-500 text-black font-bold border-sky-400 shadow-md'
                  : 'bg-[#22252c] text-[#A6A8AD] border-[#33363D] hover:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span>{isAutoRotating ? 'ORBITING...' : 'ORBIT 360°'}</span>
            </button>

            {/* Flyover Camera Button */}
            {activeRoute && (
              <button
                onClick={() => {
                  setIsFlyingOver(prev => !prev);
                  sfx.playBlip();
                }}
                title="Cinematic camera flyover following the 3D traverse"
                className={`px-2 py-1 rounded border transition-colors flex items-center space-x-1 text-[11px] ${
                  isFlyingOver
                    ? 'bg-amber-500 text-black font-bold border-amber-400'
                    : 'bg-[#22252c] text-[#A6A8AD] border-[#33363D] hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isFlyingOver ? 'EXIT FLYOVER' : 'FLYOVER'}</span>
              </button>
            )}

            {/* Reset Camera Button */}
            <button
              onClick={() => {
                if (controlsRef.current && cameraRef.current) {
                  cameraRef.current.position.set(0, 58, 76);
                  controlsRef.current.target.set(0, 0, 0);
                  controlsRef.current.update();
                  setIsFlyingOver(false);
                  sfx.playBlip();
                }
              }}
              title="Reset Camera View to Top Angle"
              className="px-2 py-1 rounded bg-[#22252c] text-[#A6A8AD] border border-[#33363D] hover:text-white text-[11px]"
            >
              Reset Cam
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-[#22252c] hover:bg-rose-950/60 text-[#A6A8AD] hover:text-rose-300 border border-[#33363D] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mission Planning Bar: Origin / Target Waypoints, Presets & Compute Route */}
        <div className="bg-[#14161a] border-b border-[#33363D] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs">
          {/* Waypoint Coordinates & Status */}
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="bg-[#191b20] border border-[#33363D] px-2.5 py-1 rounded text-[11px] flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[#A6A8AD]">ORIGIN:</span>
                <span className="text-white font-bold">
                  {startPoint ? `${startPoint.lat}°, ${startPoint.lng}°` : 'Click Terrain'}
                </span>
              </div>
              <div className="w-[1px] h-3 bg-[#33363D]"></div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#D97745] animate-pulse"></span>
                <span className="text-[#A6A8AD]">TARGET:</span>
                <span className="text-white font-bold">
                  {destPoint ? `${destPoint.lat}°, ${destPoint.lng}°` : 'Click Terrain'}
                </span>
              </div>
              {(startPoint || destPoint || activeRoute) && (
                <button
                  onClick={handleReset3DPoints}
                  title="Clear Origin & Target"
                  className="ml-1 text-[10px] text-rose-400 hover:text-rose-300 px-1 py-0.5 rounded bg-[#22252c] border border-[#33363D]"
                >
                  RESET
                </button>
              )}
            </div>

            {/* Compute Path Button */}
            <button
              onClick={() => handleCompute3DRoute()}
              disabled={isCalculating || !startPoint || !destPoint}
              className={`px-3 py-1 rounded font-bold text-[11px] shadow-lg flex items-center space-x-1 transition-all ${
                startPoint && destPoint
                  ? 'bg-[#D97745] hover:bg-[#B85C38] text-white active:scale-95'
                  : 'bg-[#22252c] text-[#777] border border-[#33363D] cursor-not-allowed'
              }`}
            >
              <Play className={`w-3 h-3 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>{isCalculating ? 'CALCULATING 3D...' : 'COMPUTE 3D PATH'}</span>
            </button>

            {/* Presets Dropdown */}
            <div className="flex items-center space-x-1 bg-[#191b20] border border-[#33363D] rounded px-1.5 py-0.5">
              <Compass className="w-3 h-3 text-[#D97745]" />
              <select
                onChange={(e) => {
                  if (e.target.value) handleApplyPresetIn3D(e.target.value);
                }}
                defaultValue=""
                className="bg-transparent text-[#F3F3F3] text-[10px] outline-none cursor-pointer"
              >
                <option value="" disabled>Apply Preset Traversal...</option>
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#191b20]">{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Landmark Teleport Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <span className="text-[#A6A8AD] text-[9px] uppercase hidden xl:inline mr-1">Focus Landmark:</span>
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

        {/* WebGL 3D Viewport Canvas Container */}
        <div className="relative flex-1 w-full min-h-0 overflow-hidden">
          <div ref={mountRef} className="w-full h-full cursor-crosshair active:cursor-grabbing" />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
              <div className="p-4 rounded-xl bg-[#191b20] border border-[#33363D] text-center space-y-2 font-mono text-xs">
                <Box className="w-6 h-6 text-[#D97745] animate-bounce mx-auto" />
                <div className="text-white font-bold">Constructing 3D Jezero Crater Mesh...</div>
                <div className="text-[#A6A8AD] text-[10px]">Displacing vertices with authentic 20m CTX DTM elevation</div>
              </div>
            </div>
          )}

          {/* Toast Notification Banner */}
          {feedbackNotice && (
            <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xl backdrop-blur-md border ${
              feedbackNotice.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : feedbackNotice.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-[#191b20]/95 border-emerald-500/50 text-emerald-300'
            }`}>
              {feedbackNotice.text}
            </div>
          )}

          {/* Bottom Left: Route Telemetry & Exaggeration Controls */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2 font-mono text-xs pointer-events-none max-w-sm max-h-[40vh] overflow-y-auto">
            {/* Active 3D Route Telemetry Card */}
            {activeRoute?.route && (
              <div className="bg-[#191b20]/95 backdrop-blur-md border border-emerald-500/40 rounded-lg p-2.5 shadow-2xl pointer-events-auto space-y-1.5">
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
                  Conforms to 3D Martian terrain topography with cost-weighted slope steering.
                </div>
              </div>
            )}

            {/* Vertical Exaggeration Slider */}
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2 shadow-xl pointer-events-auto space-y-1 w-60">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#A6A8AD] uppercase font-bold flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-[#D97745]" />
                  <span>Relief Exaggeration</span>
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

          {/* Bottom Right: Selected Landmark Info Card */}
          {selectedLandmark && (
            <div className="absolute bottom-3 right-3 z-10 pointer-events-auto max-w-xs bg-[#191b20]/95 backdrop-blur-md border rounded-lg p-3 font-mono shadow-2xl space-y-1 max-h-[40vh] overflow-y-auto" style={{ borderColor: selectedLandmark.color }}>
              <div className="flex items-center justify-between pb-1 border-b border-[#33363D]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedLandmark.color }}></span>
                  <span className="font-bold text-white text-xs">{selectedLandmark.name}</span>
                </div>
                <button
                  onClick={() => setSelectedLandmark(null)}
                  className="text-[#A6A8AD] hover:text-white text-xs p-0.5"
                >
                  ✕
                </button>
              </div>
              <div className="text-[10px] text-[#D97745] font-semibold">{selectedLandmark.subtitle}</div>
              <p className="text-[10px] text-[#A6A8AD] leading-relaxed pt-1">{selectedLandmark.description}</p>
              <div className="flex space-x-1.5 pt-2 border-t border-[#33363D]">
                <button
                  onClick={() => {
                    const geo = { lat: selectedLandmark.lat, lng: selectedLandmark.lng };
                    setStartPoint(geo);
                    if (onSelectWaypoint) onSelectWaypoint('start', geo);
                    updateWaypointBeacons(geo, destPoint, sceneRef.current, heightDataRef.current, exaggeration);
                    sfx.playBlip();
                  }}
                  className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white py-1 rounded text-[9px] font-bold transition-colors"
                >
                  Set Origin
                </button>
                <button
                  onClick={() => {
                    const geo = { lat: selectedLandmark.lat, lng: selectedLandmark.lng };
                    setDestPoint(geo);
                    if (onSelectWaypoint) onSelectWaypoint('destination', geo);
                    updateWaypointBeacons(startPoint, geo, sceneRef.current, heightDataRef.current, exaggeration);
                    sfx.playBlip();
                  }}
                  className="flex-1 bg-[#D97745]/80 hover:bg-[#D97745] text-white py-1 rounded text-[9px] font-bold transition-colors"
                >
                  Set Target
                </button>
              </div>
            </div>
          )}

          {/* Top Right: Navigation Tips HUD */}
          <div className="absolute top-3 right-3 z-10 hidden sm:block pointer-events-none">
            <div className="bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg p-2 font-mono text-[9px] text-[#A6A8AD] shadow-xl space-y-0.5">
              <div className="text-white font-bold uppercase border-b border-[#33363D] pb-0.5 mb-1 flex items-center space-x-1">
                <Navigation className="w-2.5 h-2.5 text-[#38BDF8]" />
                <span>3D Interaction Guide</span>
              </div>
              <div>• <strong>Click Terrain:</strong> Drop Origin / Target Waypoints</div>
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
