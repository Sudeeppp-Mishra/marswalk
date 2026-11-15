import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Play, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Compass, 
  Box, 
  Scan, 
  Layers, 
  TrendingUp, 
  Activity, 
  User, 
  Truck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { sfx } from '../../utils/audio';

const TOUR_STEPS = [
  {
    step: 1,
    target: 'presets',
    category: 'Waypoints & Mission Target',
    title: '1. Select a Milestone Preset or Click Map',
    description: 'Select an authentic Perseverance milestone from the Presets dropdown (e.g., Landing Site → Kodiak Butte), or click any two points directly on the Jezero Delta to drop Origin (Green) and Target (Orange) waypoints.',
    actionLabel: 'Load Kodiak Preset',
    actionType: 'preset_kodiak',
    icon: MapPin,
    color: '#10B981'
  },
  {
    step: 2,
    target: 'mode_compute',
    category: 'Surface Navigation Engine',
    title: '2. Rover vs Astronaut Mode & Compute Route',
    description: 'Toggle between Rover Mode (15° vehicle slope limit, 0.12 km/h) and Astronaut Mode (25° foot EVA limit, 1.1 km/h). Click Compute Route to run our cost-weighted A* algorithm navigating natural saddles around impassable scarps.',
    actionLabel: 'Compute Traverse',
    actionType: 'compute_route',
    icon: Play,
    color: '#D97745'
  },
  {
    step: 3,
    target: 'layers',
    category: 'Scientific Cartography',
    title: '3. Inspect 3-Tier Slope Hazard & Elevation DEM',
    description: 'Toggle Slope Hazard to reveal our 3-tier safety classification derived from the 20m CTX DTM: <10° Safe (Green), 10°–20° Caution (Amber), and >20° Impassable Hazard (Crimson). Adjust the Blend slider to overlay directly on satellite CTX imagery.',
    actionLabel: 'View Slope Hazard',
    actionType: 'layer_slope',
    icon: TrendingUp,
    color: '#F59E0B'
  },
  {
    step: 4,
    target: 'comparison_geology',
    category: 'Scientific Insights',
    title: '4. Safest vs Shortest & USGS Geology Crossings',
    description: 'Check the right telemetry panel: our side-by-side comparison table proves why the shortest path is blocked by >20° cliffs, while the safest route stays within safe limits. Review the percentage breakdown of USGS SIM 3464 geological formations crossed.',
    actionLabel: null,
    actionType: null,
    icon: Layers,
    color: '#38BDF8'
  },
  {
    step: 5,
    target: 'micro_3d',
    category: 'Ultra-HD Micro-Terrain & 3D Mesh',
    title: '5. 25cm HiRISE Lens & 3D WebGL Orbit',
    description: 'Open the 25cm Lens to sample sub-meter boulder fields directly from the local 9.1GB HiRISE GeoTIFF. Launch 3D Orbit to fly around the crater in full WebGL with flyover cameras and click-to-place waypoints.',
    actionLabel: 'Launch 3D Orbit',
    actionType: 'open_3d',
    icon: Box,
    color: '#A855F7'
  },
  {
    step: 6,
    target: 'simulation_export',
    category: 'Mission Execution & Export',
    title: '6. Live EVA Telemetry Simulation & Export',
    description: 'Hit Space to simulate the astronaut traverse with live Mars Position Telemetry (Lat, Lon, Elevation, Heading, O2 margin). When finished, export your mission flight plan as industry-standard GeoJSON or CSV.',
    actionLabel: 'Play EVA Simulation',
    actionType: 'play_sim',
    icon: Download,
    color: '#10B981'
  }
];

export default function InUIGuideTour({
  isActive,
  onClose,
  onApplyPreset,
  onComputeRoute,
  onSetActiveLayer,
  onOpen3D,
  onToggleSim
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    sfx.playBlip();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sfx.playBlip();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    sfx.playSuccess();
    try {
      localStorage.setItem('has_seen_marswalk_guide', 'true');
    } catch (e) {}
    onClose();
  };

  const handleExecuteAction = () => {
    sfx.playSuccess();
    if (currentStep.actionType === 'preset_kodiak' && onApplyPreset) {
      onApplyPreset('perseverance_to_kodiak');
    } else if (currentStep.actionType === 'compute_route' && onComputeRoute) {
      onComputeRoute();
    } else if (currentStep.actionType === 'layer_slope' && onSetActiveLayer) {
      onSetActiveLayer('slope');
    } else if (currentStep.actionType === 'open_3d' && onOpen3D) {
      onOpen3D();
    } else if (currentStep.actionType === 'play_sim' && onToggleSim) {
      onToggleSim();
    }
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1500] w-[94%] max-w-xl pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 font-mono select-none">
      {/* Sleek In-UI Floating Card */}
      <div className="relative bg-[#191b20]/95 backdrop-blur-xl border border-[#33363D] rounded-xl shadow-2xl p-4 overflow-hidden" style={{ borderColor: `${currentStep.color}80` }}>
        {/* Glowing Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#101114]">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
              backgroundColor: currentStep.color 
            }}
          />
        </div>

        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2 border-b border-[#33363D]/60 mb-2.5">
          <div className="flex items-center space-x-2">
            <span 
              className="p-1 rounded flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${currentStep.color}25`, color: currentStep.color, border: `1px solid ${currentStep.color}50` }}
            >
              <StepIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              {currentStep.category}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#A6A8AD] bg-[#14161a] px-2 py-0.5 rounded border border-[#33363D]">
              STEP {currentStep.step} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleComplete}
              title="Close Guide"
              className="p-1 rounded text-[#A6A8AD] hover:text-white hover:bg-[#22252c] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Title & Detailed Description */}
        <div className="space-y-1.5 mb-3">
          <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
            <span style={{ color: currentStep.color }}>●</span>
            <span>{currentStep.title}</span>
          </h4>
          <p className="text-[11px] text-[#A6A8AD] leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Interactive Action Button for this step (if available) */}
        {currentStep.actionLabel && (
          <div className="mb-3 p-2 rounded-lg bg-[#101114] border border-[#33363D] flex items-center justify-between">
            <span className="text-[10px] text-[#A6A8AD] flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>1-Click Interactive Demo:</span>
            </span>
            <button
              onClick={handleExecuteAction}
              className="px-2.5 py-1 rounded text-[11px] font-bold text-white flex items-center space-x-1 shadow transition-transform active:scale-95"
              style={{ backgroundColor: currentStep.color }}
            >
              <Zap className="w-3 h-3" />
              <span>{currentStep.actionLabel}</span>
            </button>
          </div>
        )}

        {/* Navigation & Stepper Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#33363D]/60">
          {/* Stepper Dots (Click any dot to jump) */}
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => { setCurrentStepIndex(idx); sfx.playBlip(); }}
                title={`Jump to Step ${s.step}: ${s.title}`}
                className={`transition-all rounded-full ${
                  currentStepIndex === idx
                    ? 'w-5 h-2 rounded-full'
                    : 'w-2 h-2 hover:scale-125'
                }`}
                style={{ 
                  backgroundColor: currentStepIndex === idx ? currentStep.color : currentStepIndex > idx ? '#10B981' : '#33363D' 
                }}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 ? (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#A6A8AD] hover:text-white border border-[#33363D] text-[11px] font-bold flex items-center space-x-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="text-[10px] text-[#777] hover:text-[#A6A8AD] transition-colors px-1"
              >
                Skip Tour
              </button>
            )}

            {currentStepIndex < TOUR_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-3 py-1 rounded text-[11px] font-bold text-white flex items-center space-x-1 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: currentStep.color }}
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-3 py-1 rounded text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center space-x-1 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Finish Guide</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
