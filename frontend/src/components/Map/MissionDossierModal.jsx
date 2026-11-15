import React from 'react';
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
  Download
} from 'lucide-react';
import { exportRouteAsGeoJSON, exportRouteAsCSV, exportMissionDossierReport } from '../../utils/exportRoute';

export default function MissionDossierModal({ isOpen, onClose, routeData, startPoint, destinationPoint }) {
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
                {startPoint ? `${startPoint.lat}° N, ${startPoint.lng}° E` : 'Landing Site'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#A6A8AD] uppercase">Target Objective</span>
              <div className="font-semibold text-[#D97745] mt-0.5">
                {destinationPoint ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` : 'Kodiak Butte'}
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
