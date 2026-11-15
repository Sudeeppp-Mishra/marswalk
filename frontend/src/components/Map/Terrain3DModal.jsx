import React, { useEffect, useRef, useState } from 'react';
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
  Maximize2, 
  Sparkles,
  Compass,
  Layers
} from 'lucide-react';
import { sfx } from '../../utils/audio';

const JEZERO_BOUNDS = {
  minLat: 18.21,
  maxLat: 18.72,
  minLng: 77.16,
  maxLng: 77.70,
  minElev: -2710.7,
  maxElev: -1515.5
};

const LANDMARKS = [
  { name: 'Kodiak Butte', lat: 18.4231, lng: 77.4125, color: '#38BDF8' },
  { name: 'Landing Site', lat: 18.4447, lng: 77.4508, color: '#10B981' },
  { name: 'Wildcat Ridge', lat: 18.4483, lng: 77.4049, color: '#F59E0B' },
  { name: 'Belva Crater', lat: 18.4886, lng: 77.4438, color: '#EF4444' }
];

export default function Terrain3DModal({
  isOpen,
  onClose,
  routeData,
  startPoint,
  destinationPoint
}) {
  const mountRef = useRef(null);
  const [exaggeration, setExaggeration] = useState(2.2);
  const [textureType, setTextureType] = useState('ctx'); // 'ctx', 'elevation', 'slope'
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const routeLineRef = useRef(null);
  const markersGroupRef = useRef(null);
  const heightDataRef = useRef(null);

  // Convert (lat, lng) to 3D XZ coordinates (mesh size 100x100)
  const geoTo3D = (lat, lng, elev = null, heightGrid = null, exag = 2.2) => {
    const normX = (lng - JEZERO_BOUNDS.minLng) / (JEZERO_BOUNDS.maxLng - JEZERO_BOUNDS.minLng);
    const normY = (lat - JEZERO_BOUNDS.minLat) / (JEZERO_BOUNDS.maxLat - JEZERO_BOUNDS.minLat);
    
    const x = (normX - 0.5) * 100;
    const z = (0.5 - normY) * 100; // Inverted for 3D coordinates
    
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
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.004);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(0, 55, 75);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Don't flip below horizon
    controls.minDistance = 15;
    controls.maxDistance = 250;
    controls.target.set(0, 0, 0);

    // 3. Lighting (Martian Solar Illumination)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight.position.set(60, 90, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 4. Load Heightmap & Textures
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
        heightGrid[i] = imgData[i * 4]; // Grayscale R channel
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

      // Load Draped Texture
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
        roughness: 0.85,
        metalness: 0.1,
        flatShading: false
      });

      const terrainMesh = new THREE.Mesh(geometry, material);
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      scene.add(terrainMesh);
      terrainMeshRef.current = terrainMesh;

      // 5. Render 3D Route if Available
      render3DRoute(scene, heightGrid, exaggeration);

      // 6. Render Jezero Milestones Markers
      renderLandmarks(scene, heightGrid, exaggeration);

      setIsLoading(false);
    };

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isAutoRotating && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
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

  // Re-render route when routeData changes
  const render3DRoute = (scene, heightGrid, exag) => {
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (!routeData?.route || routeData.route.length < 2) return;

    const points = [];
    routeData.route.forEach((pt) => {
      const pos = geoTo3D(pt.lat, pt.lng, pt.elevation_m, heightGrid, exag);
      points.push(new THREE.Vector3(pos.x, pos.y + 0.35, pos.z)); // Lift slightly above surface
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, 0.35, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.2
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);
    routeLineRef.current = tubeMesh;
  };

  // Render 3D Pins for Milestones
  const renderLandmarks = (scene, heightGrid, exag) => {
    if (markersGroupRef.current) {
      scene.remove(markersGroupRef.current);
    }
    const group = new THREE.Group();

    LANDMARKS.forEach((lm) => {
      const pos = geoTo3D(lm.lat, lm.lng, null, heightGrid, exag);
      const pinGeom = new THREE.CylinderGeometry(0.1, 0.1, 4.0, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: lm.color });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      pin.position.set(pos.x, pos.y + 2.0, pos.z);

      const sphereGeom = new THREE.SphereGeometry(0.8, 12, 12);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: lm.color,
        emissive: lm.color,
        emissiveIntensity: 0.6
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(pos.x, pos.y + 4.0, pos.z);

      group.add(pin);
      group.add(sphere);
    });

    scene.add(group);
    markersGroupRef.current = group;
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
      render3DRoute(sceneRef.current, heightGrid, newExag);
      renderLandmarks(sceneRef.current, heightGrid, newExag);
    }
  };

  // Switch Draped Texture
  const handleTextureChange = (type) => {
    setTextureType(type);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-7xl bg-[#101114] border border-[#33363D] rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Top Control Bar */}
        <div className="h-14 bg-[#191b20] border-b border-[#33363D] px-4 flex items-center justify-between z-10 font-mono text-xs select-none">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">JEZERO 3D TERRAIN ORBIT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  20m DTM MESH
                </span>
              </div>
              <p className="text-[10px] text-[#A6A8AD] hidden sm:block">
                Interactive WebGL Elevation Model with Orbit Physics &amp; Real-time Route Spline
              </p>
            </div>
          </div>

          {/* Center: Surface Draped Texture Selector */}
          <div className="hidden md:flex items-center space-x-1 bg-[#101114] p-1 rounded-lg border border-[#33363D]">
            <button
              onClick={() => handleTextureChange('ctx')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                textureType === 'ctx' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
              }`}
            >
              CTX Optical (6m)
            </button>
            <button
              onClick={() => handleTextureChange('elevation')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                textureType === 'elevation' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
              }`}
            >
              Elevation DEM
            </button>
            <button
              onClick={() => handleTextureChange('slope')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                textureType === 'slope' ? 'bg-[#D97745] text-white font-bold' : 'text-[#A6A8AD] hover:text-white'
              }`}
            >
              Slope Hazard
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Auto-Rotate Toggle */}
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              title="Toggle Cinematic Auto-Rotate Orbit"
              className={`px-2 py-1.5 rounded border transition-colors flex items-center space-x-1 text-[11px] ${
                isAutoRotating
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                  : 'bg-[#22252c] text-[#A6A8AD] border-[#33363D] hover:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Orbit</span>
            </button>

            {/* Reset Camera */}
            <button
              onClick={() => {
                if (controlsRef.current) {
                  controlsRef.current.reset();
                  sfx.playBlip();
                }
              }}
              title="Reset Camera View"
              className="px-2 py-1.5 rounded bg-[#22252c] text-[#A6A8AD] border border-[#33363D] hover:text-white text-[11px]"
            >
              Reset
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#22252c] hover:bg-rose-950/60 text-[#A6A8AD] hover:text-rose-300 border border-[#33363D] transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
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

          {/* Floating Controls HUD: Exaggeration Slider & Route Indicator */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 font-mono text-xs pointer-events-none">
            {/* Vertical Exaggeration Control */}
            <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2.5 shadow-xl pointer-events-auto space-y-1.5 w-60">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#A6A8AD] uppercase font-bold flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-[#D97745]" />
                  <span>Vertical Exaggeration</span>
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
                <span>1.0x (True Scale)</span>
                <span>2.2x (Recommended)</span>
                <span>4.0x (Peak)</span>
              </div>
            </div>

            {/* Route Status in 3D */}
            {routeData?.route && (
              <div className="bg-[#191b20]/95 backdrop-blur-md border border-emerald-500/40 rounded-lg p-2 shadow-xl pointer-events-auto text-[10px] space-y-0.5">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active 3D Route Rendered</span>
                </div>
                <div className="text-[#A6A8AD]">
                  Traverse: <strong className="text-white">{routeData.distance_km} km</strong> • Max Slope: <strong className="text-[#D97745]">{routeData.max_slope_deg}°</strong>
                </div>
              </div>
            )}
          </div>

          {/* Floating Camera Navigation Tips */}
          <div className="absolute top-4 right-4 z-10 hidden sm:block pointer-events-none">
            <div className="bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg p-2.5 font-mono text-[10px] text-[#A6A8AD] shadow-xl space-y-1">
              <div className="text-white font-bold text-[9px] uppercase border-b border-[#33363D] pb-0.5 mb-1">
                3D Navigation Controls
              </div>
              <div>• <strong>Left Click + Drag:</strong> Orbit / Pitch</div>
              <div>• <strong>Right Click + Drag:</strong> Pan Terrain</div>
              <div>• <strong>Scroll Wheel:</strong> Zoom In / Out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
