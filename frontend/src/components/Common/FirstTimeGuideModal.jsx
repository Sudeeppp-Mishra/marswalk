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
  ShieldCheck,
  Zap
} from 'lucide-react';
import { sfx } from '../../utils/audio';

export default function FirstTimeGuideModal({ 
  isOpen, 
  onClose, 
  onApplyPreset,
  onComputeRoute 
}) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    sfx.playBlip();
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sfx.playBlip();
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    sfx.playSuccess();
    try {
      localStorage.setItem('has_seen_marswalk_guide', 'true');
    } catch (e) {}
    onClose();
  };

  const handleQuickPresetAndClose = () => {
    sfx.playSuccess();
    if (onApplyPreset) {
      onApplyPreset('perseverance_to_kodiak');
    }
    try {
      localStorage.setItem('has_seen_marswalk_guide', 'true');
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-[#191b20] border border-[#33363D] rounded-2xl overflow-hidden shadow-2xl font-mono flex flex-col">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-[#D97745] to-sky-400"></div>

        {/* Header Bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-[#33363D]/60">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-[#D97745]/20 text-[#D97745] border border-[#D97745]/40">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Astro-nah • Quick Mission Walkthrough
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-[#A6A8AD] hover:text-white p-1 rounded hover:bg-[#22252c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => { setCurrentStep(step); sfx.playBlip(); }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    currentStep === step
                      ? 'bg-[#D97745] text-white shadow-lg shadow-[#D97745]/40 scale-110'
                      : currentStep > step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-[#22252c] text-[#777] border border-[#33363D]'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </button>
                {step < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1.5 transition-colors ${
                    currentStep > step ? 'bg-emerald-500/50' : 'bg-[#33363D]'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <span className="text-[10px] text-[#A6A8AD]">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Step Body Content */}
        <div className="p-5 flex-1 min-h-[220px]">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>1. Pick a Preset or Click Two Points</span>
              </div>
              <p className="text-xs text-[#A6A8AD] leading-relaxed">
                Choose from 5 authentic <strong>Perseverance milestones</strong> in the <span className="text-white bg-[#22252c] px-1.5 py-0.5 rounded border border-[#33363D]">Presets</span> dropdown (e.g., <em>Landing Site → Kodiak Butte</em>). Or click anywhere on the <strong>Jezero Crater Delta</strong> map to place your <strong>Origin</strong> (Green) and <strong>Destination</strong> (Orange).
              </p>

              <div className="p-3 bg-[#101114] rounded-lg border border-[#33363D] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#A6A8AD]">Fast Track for Judges:</span>
                  <span className="text-emerald-400 font-bold">1-Click Demo</span>
                </div>
                <button
                  onClick={handleQuickPresetAndClose}
                  className="w-full py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg transition-transform active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Load Preset &amp; Start (Landing → Kodiak)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#D97745] font-bold text-sm">
                <Play className="w-4 h-4" />
                <span>2. Compute Route &amp; Compare Strategies</span>
              </div>
              <p className="text-xs text-[#A6A8AD] leading-relaxed">
                Click <strong className="text-white bg-[#D97745] px-1.5 py-0.5 rounded">Compute Route</strong>. Our central finite-difference <strong>Cost-Weighted A* Algorithm</strong> navigates through natural saddles, safely steering around steep impassable <strong className="text-rose-400">&gt;20° scarps</strong>.
              </p>

              <div className="p-3 bg-[#101114] rounded-lg border border-[#33363D] space-y-1.5 text-xs">
                <div className="text-white font-bold text-[11px] uppercase tracking-wider">
                  Features to Test:
                </div>
                <div className="text-[11px] text-[#A6A8AD] space-y-1">
                  <div>• <strong>Rover (15°) vs Astronaut (25°)</strong> mode switch.</div>
                  <div>• <strong>Safest vs Shortest</strong> comparison (shows why direct paths fail on steep cliffs).</div>
                  <div>• <strong>Geology Crossings breakdown</strong> across USGS SIM 3464 formations.</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>3. Inspect, Orbit in 3D &amp; Export</span>
              </div>
              <p className="text-xs text-[#A6A8AD] leading-relaxed">
                Review your flight plan with real aerospace telemetry, inspect boulder fields, or export for external GIS systems.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-[#101114] border border-[#33363D] space-y-1">
                  <div className="flex items-center space-x-1 text-purple-300 font-bold">
                    <Scan className="w-3.5 h-3.5" />
                    <span>25cm Lens</span>
                  </div>
                  <p className="text-[10px] text-[#A6A8AD]">Inspect authentic 9.1GB HiRISE micro-terrain GeoTIFF.</p>
                </div>

                <div className="p-2.5 rounded bg-[#101114] border border-[#33363D] space-y-1">
                  <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Orbit</span>
                  </div>
                  <p className="text-[10px] text-[#A6A8AD]">Rotate 360° around Jezero in full WebGL 3D.</p>
                </div>
              </div>

              <div className="text-[11px] text-[#A6A8AD] p-2 rounded bg-[#101114] border border-[#33363D] flex justify-between items-center">
                <span>Export Mission Traversal:</span>
                <span className="text-white font-bold">GeoJSON &amp; CSV Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 py-3.5 bg-[#14161a] border-t border-[#33363D] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-lg bg-[#22252c] text-[#A6A8AD] hover:text-white border border-[#33363D] text-xs font-bold flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="text-[#777] hover:text-[#A6A8AD] text-xs transition-colors"
            >
              Skip Tour
            </button>
          )}

          <div className="flex items-center space-x-2">
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg bg-[#D97745] hover:bg-[#B85C38] text-white text-xs font-bold flex items-center space-x-1 shadow-lg transition-transform active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Launch Traversal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

