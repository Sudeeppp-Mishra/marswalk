import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Compass, 
  Mountain, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Clock,
  BatteryCharging,
  Download,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { exportRouteAsGeoJSON, exportRouteAsCSV, exportMissionDossierReport } from '../../utils/exportRoute';
import { sfx } from '../../utils/audio';

export default function MissionDossierModal({ isOpen, onClose, routeData, startPoint, destinationPoint }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !routeData) return null;

  // Slope breakdown statistics
  const slopes = routeData.route?.map(pt => pt.slope_deg) || [];
  const nominalCount = slopes.filter(s => s <= 10).length;
  const cautionCount = slopes.filter(s => s > 10 && s <= 15).length;
  const steepCount = slopes.filter(s => s > 15 && s <= 20).length;
  const totalPoints = slopes.length || 1;

  const pctNominal = Math.round((nominalCount / totalPoints) * 100);
  const pctCaution = Math.round((cautionCount / totalPoints) * 100);
  const pctSteep = Math.round((steepCount / totalPoints) * 100);
  const pctUnder15 = pctNominal + pctCaution;

  // Real Perseverance rover speed ~0.12 km/h
  const roverHours = (routeData.distance_km / 0.12).toFixed(1);

  // Astronaut walking time estimation (Mars 0.38g gravity, suit weight, terrain slope impedance)
  const baseSpeedKmh = 1.1;
  const estHours = (routeData.distance_km / baseSpeedKmh) * (1 + (routeData.elevation_gain_m / 400));
  const hrs = Math.floor(estHours);
  const mins = Math.round((estHours - hrs) * 60);

  // Life support estimates (Apollo/Artemis EVA human factor guidelines)
  const estCalories = Math.round(estHours * 265);
  const estOxygenLiters = Math.round(estHours * 58);

  const originLat = startPoint?.lat != null ? Number(startPoint.lat).toFixed(4) : '18.4447';
  const originLng = startPoint?.lng != null ? Number(startPoint.lng).toFixed(4) : '77.4508';
  const destLat = destinationPoint?.lat != null ? Number(destinationPoint.lat).toFixed(4) : '18.4231';
  const destLng = destinationPoint?.lng != null ? Number(destinationPoint.lng).toFixed(4) : '77.4125';
  const maxSlope = routeData?.max_slope_deg || 20;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?start=${originLat},${originLng}&dest=${destLat},${destLng}&slope=${maxSlope}`
    : `https://astro-marswalk.vercel.app?start=${originLat},${originLng}&dest=${destLat},${destLng}&slope=${maxSlope}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&bgcolor=14161a&color=10b981&margin=1`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#191b20] border border-[#33363D] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-mono text-xs text-[#F3F3F3]">
        {/* Header */}
        <div className="p-4 border-b border-[#33363D] flex items-center justify-between bg-[#14161a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#D97745]/20 border border-[#D97745] flex items-center justify-center text-[#D97745]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide text-white">EVA MISSION DISPATCH DOSSIER</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D97745]/20 text-[#D97745] border border-[#D97745]/40">
                  EVA-JEZ-ALPHA
                </span>
              </div>
              <p className="text-[10px] text-[#A6A8AD]">Jezero Crater Delta Surface Traverse Plan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#22252c] text-[#A6A8AD] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dossier Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Coordinates Card */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#101114] rounded-lg border border-[#33363D]">
            <div>
              <span className="text-[10px] text-[#A6A8AD] uppercase">Traverse Origin</span>
              <div className="font-semibold text-emerald-400 mt-0.5">
                {startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : 'Landing Site (18.4447° N, 77.4508° E)'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#A6A8AD] uppercase">Target Objective</span>
              <div className="font-semibold text-[#D97745] mt-0.5">
                {destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : 'Kodiak Butte (18.4231° N, 77.4125° E)'}
              </div>
            </div>
          </div>

          {/* Live Mobile QR Code & Dispatch Link */}
          <div className="p-3 bg-[#14161a] rounded-lg border border-emerald-500/40 flex flex-col sm:flex-row items-center gap-3.5 shadow-lg shadow-emerald-950/20">
            <div className="p-1.5 bg-[#101114] rounded-lg border border-[#33363D] flex-shrink-0">
              <img 
                src={qrCodeUrl} 
                alt="Astro-nah Live Mission QR Code" 
                className="w-24 h-24 rounded object-contain bg-[#14161a]"
                loading="lazy"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Live App Mission Dispatch QR</span>
              </div>
              <p className="text-[10px] text-[#A6A8AD] leading-relaxed">
                Scan with any smartphone or tablet camera to instantly open this exact Jezero traverse in full 3D WebGL and 2D Leaflet without registration.
              </p>
              <div className="flex items-center justify-center sm:justify-start space-x-2 pt-0.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    sfx.playSuccess();
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="px-2.5 py-1 rounded bg-[#22252c] hover:bg-[#2b2e36] text-white border border-[#33363D] text-[10px] font-bold flex items-center space-x-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
                  <span>{copied ? 'Copied URL!' : 'Copy Shareable URL'}</span>
                </button>
                <span className="text-[9px] text-[#777] truncate hidden md:inline">
                  {shareUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Traverse Metrics */}
          <div>
            <div className="text-[11px] font-semibold text-[#D97745] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Surface Trajectory Metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-[#14161a] rounded border border-[#33363D]">
                <span className="text-[9px] text-[#A6A8AD]">TOTAL DISTANCE</span>
                <div className="text-base font-bold text-sky-400 mt-0.5">{routeData.distance_km} km</div>
                <span className="text-[9px] text-[#A6A8AD]">{routeData.waypoints_count} waypoints</span>
              </div>
              <div className="p-2.5 bg-[#14161a] rounded border border-[#33363D]">
                <span className="text-[9px] text-[#A6A8AD]">ASTRONAUT EVA</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{hrs}h {mins}m</span>
                </div>
                <span className="text-[9px] text-[#A6A8AD]">@ ~1.1 km/h suited</span>
              </div>
              <div className="p-2.5 bg-[#14161a] rounded border border-[#33363D]">
                <span className="text-[9px] text-[#A6A8AD]">ROVER DRIVE</span>
                <div className="text-base font-bold text-amber-300 mt-0.5 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{roverHours} hrs</span>
                </div>
                <span className="text-[9px] text-[#A6A8AD]">@ 0.12 km/h Perseverance</span>
              </div>
              <div className="p-2.5 bg-[#14161a] rounded border border-[#33363D]">
                <span className="text-[9px] text-[#A6A8AD]">MAX / MEAN SLOPE</span>
                <div className="text-base font-bold text-[#D97745] mt-0.5">{routeData.max_slope_deg}°</div>
                <span className="text-[9px] text-[#A6A8AD]">Mean: {routeData.mean_slope_deg ?? 'N/A'}°</span>
              </div>
            </div>
          </div>

          {/* Terrain Hazard Breakdown Bar */}
          <div className="p-3 bg-[#14161a] rounded-lg border border-[#33363D] space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-semibold text-white uppercase">Slope Hazard Classification</span>
              <span className="text-emerald-400 font-bold">{pctUnder15}% under 15° (High Feasibility)</span>
            </div>
            {/* Multi-segment progress bar */}
            <div className="h-3 w-full bg-[#101114] rounded-full overflow-hidden flex border border-[#33363D]">
              <div style={{ width: `${pctNominal}%` }} className="bg-emerald-500 transition-all" title={`Nominal: ${pctNominal}%`} />
              <div style={{ width: `${pctCaution}%` }} className="bg-amber-500 transition-all" title={`Caution: ${pctCaution}%`} />
              <div style={{ width: `${pctSteep}%` }} className="bg-orange-600 transition-all" title={`Steep: ${pctSteep}%`} />
            </div>
            <div className="flex justify-between text-[10px] text-[#A6A8AD] pt-1">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Nominal (&lt;10°): <strong>{pctNominal}%</strong></span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                <span>Moderate (10°–15°): <strong>{pctCaution}%</strong></span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
                <span>Steep (15°–20°): <strong>{pctSteep}%</strong></span>
              </span>
            </div>
          </div>

          {/* Consumables & Life Support Projection */}
          <div className="p-3 bg-[#14161a] rounded-lg border border-[#33363D] space-y-2">
            <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>Projected EVA Consumables (Per Crew Member)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-[#101114] border border-[#33363D]/60">
                <span className="text-[#A6A8AD]">Estimated Metabolic Output:</span>
                <span className="font-bold text-white">~{estCalories.toLocaleString()} kcal</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101114] border border-[#33363D]/60">
                <span className="text-[#A6A8AD]">Estimated O2 Consumption:</span>
                <span className="font-bold text-white">~{estOxygenLiters} Liters</span>
              </div>
            </div>
          </div>

          {/* Sol Operational Timeline & Sunset Deadline */}
          <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-500/40 space-y-2">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Sol Operational Timeline & Sunset Deadline</span>
              </div>
              <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                Approx. Jezero Equinox
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 rounded bg-[#101114] border border-[#33363D]">
                <span className="text-[#A6A8AD]">Nominal Departure:</span>
                <div className="font-bold text-white text-xs mt-0.5">09:30 LMST</div>
              </div>
              <div className="p-2 rounded bg-[#101114] border border-[#33363D]">
                <span className="text-[#A6A8AD]">Sunset Cutoff:</span>
                <div className="font-bold text-amber-400 text-xs mt-0.5">17:45 LMST</div>
              </div>
              <div className="p-2 rounded bg-[#101114] border border-[#33363D]">
                <span className="text-[#A6A8AD]">Est. Duration:</span>
                <div className="font-bold text-sky-400 text-xs mt-0.5">{hrs}h {mins}m</div>
              </div>
              <div className="p-2 rounded bg-[#101114] border border-[#33363D]">
                <span className="text-[#A6A8AD]">Daylight Margin:</span>
                <div className="font-bold text-emerald-400 text-xs mt-0.5">
                  ~{Math.max(0, 8.25 - estHours).toFixed(1)} hrs
                </div>
              </div>
            </div>
            <p className="text-[9.5px] text-[#C4C7CC] leading-relaxed">
              * Operational Directive: Start at 09:30 Local Mean Solar Time (LMST) and return to the airlock before Jezero sunset (17:45 LMST, approx.). Post-sunset surface temperatures plunge to -85°C with zero solar power replenishment.
            </p>
          </div>

          {/* Surface Gravimetry & Kinematics Fact */}
          <div className="p-3 bg-[#14161a] rounded-lg border border-[#33363D] space-y-1.5">
            <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Martian Surface Gravity & Mobility Physics</span>
            </div>
            <div className="text-xs text-[#F3F3F3] font-bold">
              Surface Gravity: 3.721 m/s² (38% of Earth's gravity / 0.379 g)
            </div>
            <p className="text-[10px] text-[#A6A8AD] leading-relaxed">
              A 100 kg rover or suited astronaut weighs only 38 kg on Mars. While this 62% reduction in weight significantly reduces energetic consumption when climbing grades, it dramatically lowers ground normal force and wheel traction on loose Martian regolith, increasing slip hazards on slopes &gt;15°.
            </p>
          </div>

          {/* Scientific Disclaimer Card */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-[10px] text-amber-200/90 leading-relaxed space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-amber-300">
              <AlertTriangle className="w-3 h-3" />
              <span>NASA SPACE APPS 2026 // SCIENTIFIC DEMONSTRATION NOTICE</span>
            </div>
            <p>
              Calculated using authentic USGS 20m CTX Digital Elevation Model (DTM) and MRO Context Camera (CTX) mosaics. Sub-pixel features (&lt;20m boulders, dune ripples, loose sand traps) cannot be fully resolved from orbital imagery. This route serves as a conceptual traverse simulation and is not certified for crewed exploration.
            </p>
          </div>
        </div>

        {/* Footer Actions with 1-Click Exports */}
        <div className="p-4 border-t border-[#33363D] bg-[#14161a] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportRouteAsGeoJSON(routeData, startPoint, destinationPoint)}
              className="px-2.5 py-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#F3F3F3] border border-[#33363D] flex items-center space-x-1 transition-colors text-[11px]"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>GeoJSON</span>
            </button>
            <button
              onClick={() => exportRouteAsCSV(routeData)}
              className="px-2.5 py-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#F3F3F3] border border-[#33363D] flex items-center space-x-1 transition-colors text-[11px]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportMissionDossierReport(routeData, startPoint, destinationPoint)}
              className="px-2.5 py-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#F3F3F3] border border-[#33363D] flex items-center space-x-1 transition-colors text-[11px]"
            >
              <Download className="w-3.5 h-3.5 text-[#D97745]" />
              <span>Markdown</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#F3F3F3] border border-[#33363D] flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#D97745]" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-[#D97745] hover:bg-[#B85C38] text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
