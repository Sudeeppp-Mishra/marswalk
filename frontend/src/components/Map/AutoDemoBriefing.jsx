import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Sparkles, 
  Compass, 
  TrendingUp, 
  Route as RouteIcon, 
  Waves, 
  Activity, 
  FileText,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { sfx } from '../../utils/audio';

const DEMO_STEPS = [
  {
    step: 1,
    durationMs: 5500,
    title: '1. MISSION TARGET & WAYPOINT ACQUISITION',
    subtitle: 'Target Acquired: Landing Site → Kodiak Butte Delta Remnant (2.79 km traverse).',
    badge: 'STAGE 1 / 6',
    icon: Compass,
    color: '#10B981',
    action: (helpers) => {
      helpers.applyPreset('perseverance_to_kodiak');
      helpers.setActiveLayer('ctx');
      helpers.setLakeActive(false);
      helpers.closeDossier();
    }
  },
  {
    step: 2,
    durationMs: 6000,
    title: '2. 3-TIER SLOPE HAZARD & 20m CTX SCAN',
    subtitle: 'Cartography Scan: <10° Safe (Green), 10°–20° Caution (Amber), >20° Impassable Scarp (Red Hazard).',
    badge: 'STAGE 2 / 6',
    icon: TrendingUp,
    color: '#F59E0B',
    action: (helpers) => {
      helpers.setActiveLayer('slope');
      helpers.setOverlayOpacity(0.75);
      helpers.setLakeActive(false);
      helpers.closeDossier();
    }
  },
  {
    step: 3,
    durationMs: 6500,
    title: '3. COST-WEIGHTED A* ROUTING // SAFEST VS SHORTEST',
    subtitle: 'Direct path is blocked by a 26.8° cliff! Our algorithm navigates gentle natural depositional saddles.',
    badge: 'STAGE 3 / 6',
    icon: RouteIcon,
    color: '#D97745',
    action: (helpers) => {
      helpers.computeRoute();
      helpers.setActiveLayer('ctx');
      helpers.setLakeActive(false);
      helpers.closeDossier();
    }
  },
  {
    step: 4,
    durationMs: 7000,
    title: '4. ANCIENT LAKE JEZERO (~3.7 Ga) PALEOHYDROLOGY',
    subtitle: 'Flooding crater floor to -2,395m highstand reveals the ancient shoreline where the delta formed.',
    badge: 'STAGE 4 / 6',
    icon: Waves,
    color: '#38BDF8',
    action: (helpers) => {
      helpers.setLakeActive(true, -2395);
      helpers.closeDossier();
    }
  },
  {
    step: 5,
    durationMs: 7000,
    title: '5. AUTONOMOUS EVA TELEMETRY SIMULATION',
    subtitle: 'Simulating astronaut traverse with live Mars GPS coordinates, elevation, heading, and O2 margins.',
    badge: 'STAGE 5 / 6',
    icon: Activity,
    color: '#10B981',
    action: (helpers) => {
      helpers.setLakeActive(false);
      helpers.closeDossier();
      helpers.startSim();
    }
  },
  {
    step: 6,
    durationMs: 7500,
    title: '6. MISSION DOSSIER REPORT & MOBILE QR DISPATCH',
    subtitle: 'Mission briefing complete! Scan the QR code to open this exact route on your smartphone or export data.',
    badge: 'STAGE 6 / 6',
    icon: QrCode,
    color: '#A855F7',
    action: (helpers) => {
      helpers.stopSim();
      helpers.openDossier();
    }
  }
];

export default function AutoDemoBriefing({
  isActive,
  onClose,
  applyPreset,
  setActiveLayer,
  setOverlayOpacity,
  computeRoute,
  setLakeActive,
  startSim,
  stopSim,
  openDossier,
  closeDossier
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressPct, setProgressPct] = useState(0);

  const helpersRef = useRef({
    applyPreset,
    setActiveLayer,
    setOverlayOpacity,
    computeRoute,
    setLakeActive,
    startSim,
    stopSim,
    openDossier,
    closeDossier
  });

  useEffect(() => {
    helpersRef.current = {
      applyPreset,
      setActiveLayer,
      setOverlayOpacity,
      computeRoute,
      setLakeActive,
      startSim,
      stopSim,
      openDossier,
      closeDossier
    };
  });

  // Reset when activated
  useEffect(() => {
    if (isActive) {
      setCurrentStepIdx(0);
      setIsPlaying(true);
      setProgressPct(0);
      sfx.playSuccess();
      DEMO_STEPS[0].action(helpersRef.current);
    } else {
      stopSim();
      closeDossier();
    }
  }, [isActive]);

  // Step advancement timer loop
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    const step = DEMO_STEPS[currentStepIdx];
    const duration = step.durationMs;
    const intervalMs = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgressPct(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        if (currentStepIdx < DEMO_STEPS.length - 1) {
          const nextIdx = currentStepIdx + 1;
          setCurrentStepIdx(nextIdx);
          setProgressPct(0);
          sfx.playBlip();
          DEMO_STEPS[nextIdx].action(helpersRef.current);
        } else {
          // Completed full briefing
          sfx.playSuccess();
          setIsPlaying(false);
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, isPlaying, currentStepIdx]);

  if (!isActive) return null;

  const currentStep = DEMO_STEPS[currentStepIdx];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    sfx.playBlip();
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setProgressPct(0);
      DEMO_STEPS[nextIdx].action(helpersRef.current);
    } else {
      onClose();
    }
  };

  const handleTogglePlay = () => {
    sfx.playBlip();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1400] w-[95vw] sm:w-[580px] md:w-[620px] pointer-events-auto font-mono select-none animate-in slide-in-from-top-3 duration-300">
      <div 
        className="relative bg-[#121418]/94 backdrop-blur-md border rounded-xl shadow-2xl p-3.5 overflow-hidden transition-all duration-300"
        style={{ borderColor: `${currentStep.color}90`, boxShadow: `0 12px 35px -8px ${currentStep.color}35` }}
      >
        {/* Animated Progress Bar Across Entire Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#101114]">
          <div 
            className="h-full transition-all duration-75"
            style={{ 
              width: `${((currentStepIdx + progressPct / 100) / DEMO_STEPS.length) * 100}%`,
              backgroundColor: currentStep.color 
            }}
          />
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-[#33363D]/60 mb-2">
          <div className="flex items-center space-x-2">
            <span 
              className="p-1 rounded flex items-center justify-center text-xs font-bold animate-pulse"
              style={{ backgroundColor: `${currentStep.color}25`, color: currentStep.color, border: `1px solid ${currentStep.color}50` }}
            >
              <StepIcon className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>{currentStep.badge}</span>
                <span className="text-[9px] text-amber-400 font-normal">● 1-CLICK BRIEFING</span>
              </span>
            </div>
          </div>

          {/* Stepper Controls: Play/Pause, Skip, Close */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePlay}
              title={isPlaying ? 'Pause Briefing' : 'Resume Briefing'}
              className="p-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-white border border-[#33363D] transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            </button>
            <button
              onClick={handleNext}
              title="Next Stage"
              className="p-1.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-white border border-[#33363D] transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              onClick={onClose}
              title="Exit Mission Briefing"
              className="p-1.5 rounded text-[#A6A8AD] hover:text-white hover:bg-[#22252c] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cinematic Step Title & Subtitle */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
            <span style={{ color: currentStep.color }}>●</span>
            <span>{currentStep.title}</span>
          </h4>
          <p className="text-[11px] text-[#D1D5DB] leading-relaxed">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Step Progression Indicators */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#33363D]/60 text-[10px]">
          <div className="flex items-center space-x-1.5">
            {DEMO_STEPS.map((s, idx) => (
              <div
                key={s.step}
                className={`transition-all rounded-full ${
                  currentStepIdx === idx
                    ? 'w-4 h-1.5'
                    : 'w-1.5 h-1.5'
                }`}
                style={{ 
                  backgroundColor: currentStepIdx === idx ? currentStep.color : currentStepIdx > idx ? '#10B981' : '#33363D' 
                }}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[9.5px] text-[#A6A8AD]">
              {currentStepIdx < DEMO_STEPS.length - 1 ? 'Auto-advancing...' : 'Briefing Complete'}
            </span>
            <button
              onClick={onClose}
              className="px-2.5 py-0.5 rounded bg-[#22252c] hover:bg-[#2b2e36] text-[#E5E7EB] border border-[#33363D] font-bold text-[10px] transition-colors"
            >
              {currentStepIdx === DEMO_STEPS.length - 1 ? 'Finish & Explore' : 'Exit Demo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

