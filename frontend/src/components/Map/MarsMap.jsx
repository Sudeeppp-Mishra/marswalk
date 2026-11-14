import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Crosshair, Layers, MapPin, Eye, AlertCircle } from 'lucide-react';
import L from 'leaflet';

// Fix standard Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom component to capture mouse position & map clicks
function MapEvents({ onMouseMove, onMapClick }) {
  useMapEvents({
    mousemove(e) {
      onMouseMove({ lat: e.latlng.lat.toFixed(4), lng: e.latlng.lng.toFixed(4) });
    },
    click(e) {
      onMapClick({ lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) });
    },
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
  // Jezero Crater coordinates (~18.38° N, 77.58° E)
  const jezeroCenter = [18.38, 77.58];

  const handleMapClick = (coords) => {
    if (!startPoint) {
      onSelectPoint('start', coords);
    } else if (!destinationPoint) {
      onSelectPoint('destination', coords);
    } else {
      // Reset and set start again
      onSelectPoint('start', coords);
      onSelectPoint('destination', null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#101114] overflow-hidden flex flex-col">
      {/* Map Control HUD Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex space-x-2">
        <div className="bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg p-1.5 flex items-center space-x-1 shadow-xl">
          <button
            onClick={() => setActiveLayer('ctx')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeLayer === 'ctx'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            CTX Mosaic (6m)
          </button>
          <button
            onClick={() => setActiveLayer('dem')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeLayer === 'dem'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            Elevation DEM
          </button>
          <button
            onClick={() => setActiveLayer('slope')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeLayer === 'slope'
                ? 'bg-[#D97745] text-white font-medium'
                : 'text-[#A6A8AD] hover:text-[#F3F3F3] hover:bg-[#22252c]'
            }`}
          >
            Slope Hazard
          </button>
        </div>
      </div>

      {/* Point Selection Instructions Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#191b20]/90 backdrop-blur-md border border-[#33363D] rounded-lg px-3 py-2 text-xs font-mono shadow-xl flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-[#A6A8AD]">START:</span>
          <span className="text-[#F3F3F3]">
            {startPoint ? `${startPoint.lat}°, ${startPoint.lng}°` : 'Click map to select'}
          </span>
        </div>
        <div className="w-[1px] h-4 bg-[#33363D]"></div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97745] inline-block"></span>
          <span className="text-[#A6A8AD]">DEST:</span>
          <span className="text-[#F3F3F3]">
            {destinationPoint ? `${destinationPoint.lat}°, ${destinationPoint.lng}°` : 'Click map to select'}
          </span>
        </div>
      </div>

      {/* OpenStreetMap / Planetary MapContainer */}
      <MapContainer
        center={jezeroCenter}
        zoom={11}
        minZoom={6}
        maxZoom={16}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <MapEvents onMouseMove={onCursorChange} onMapClick={handleMapClick} />
        
        {/* USGS / NASA Planetary or base tiles */}
        <TileLayer
          attribution='&copy; NASA/JPL/MSSS/USGS'
          url="https://cartocdn_b.global.ssl.fastly.net/base-dark/{z}/{x}/{y}.png"
          opacity={0.85}
        />

        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-emerald-400">START LOCATION</p>
                <p>Lat: {startPoint.lat}°</p>
                <p>Lon: {startPoint.lng}°</p>
              </div>
            </Popup>
          </Marker>
        )}

        {destinationPoint && (
          <Marker position={[destinationPoint.lat, destinationPoint.lng]}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <p className="font-bold text-[#D97745]">DESTINATION</p>
                <p>Lat: {destinationPoint.lat}°</p>
                <p>Lon: {destinationPoint.lng}°</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Dataset Acquisition Status Toast */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#191b20]/95 border border-[#33363D] text-xs text-[#A6A8AD] rounded-lg p-3 max-w-sm backdrop-blur">
        <div className="flex items-center space-x-2 text-[#D97745] font-semibold font-mono mb-1">
          <AlertCircle className="w-4 h-4" />
          <span>PHASE 1 STATUS: FOUNDATION</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The map canvas is ready for Jezero Crater. Raster integration (MRO CTX Mosaic & DEM) will be configured in Phase 2 once the local datasets are verified.
        </p>
      </div>
    </div>
  );
}

