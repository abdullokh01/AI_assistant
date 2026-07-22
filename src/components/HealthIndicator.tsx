// Health Indicator Widget - AI Project Intelligence Platform
// Path: src/components/HealthIndicator.tsx

import React from 'react';

interface HealthIndicatorProps {
  healthScore: number;
  confidenceScore: number;
  activeRisks: number;
  blockedTasks: number;
}

export default function HealthIndicator({
  healthScore,
  confidenceScore,
  activeRisks,
  blockedTasks,
}: HealthIndicatorProps) {
  // Safe default calculations
  const strokeDash = 2 * Math.PI * 40; // r=40
  const healthOffset = strokeDash - (healthScore / 100) * strokeDash;
  const confidenceOffset = strokeDash - (confidenceScore / 100) * strokeDash;

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 stroke-emerald-500';
    if (score >= 70) return 'text-cyan-400 stroke-cyan-500';
    if (score >= 50) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const getHealthMessage = (score: number) => {
    if (score >= 90) return 'Operations are stable and optimized. Delivery risk is nominal.';
    if (score >= 70) return 'Minor bottlenecks detected. Monitor risk mitigations closely.';
    if (score >= 50) return 'Warning: Blockers are accumulating. Communication mismatch.';
    return 'Critical Delivery Alert: Immediate intervention required. Check inconsistencies.';
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      {/* RADIUS GAUGE - HEALTH */}
      <div className="flex flex-col items-center justify-center p-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Project Health</span>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
            {/* Value Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={strokeDash}
              strokeDashoffset={healthOffset}
              strokeWidth="8"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${getHealthColor(healthScore)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{Math.round(healthScore)}%</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Stable</span>
          </div>
        </div>
      </div>

      {/* RADIUS GAUGE - CONFIDENCE */}
      <div className="flex flex-col items-center justify-center p-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">AI Confidence</span>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
            {/* Value Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={strokeDash}
              strokeDashoffset={confidenceOffset}
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-violet-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{Math.round(confidenceScore)}%</span>
            <span className="text-[9px] uppercase tracking-wider text-violet-400">Claude AI</span>
          </div>
        </div>
      </div>

      {/* DELIVERY DIAGNOSIS PANEL */}
      <div className="flex flex-col justify-center h-full border-t md:border-t-0 md:border-l border-slate-800/80 p-4">
        <h3 className="font-extrabold text-sm text-slate-200 mb-1">Engine Diagnosis</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {getHealthMessage(healthScore)}
        </p>
        <div className="flex gap-4">
          <div className="flex-1 bg-[#101323]/50 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Active Risks</span>
              <span className={`text-base font-black ${activeRisks > 0 ? 'text-rose-400' : 'text-slate-355'}`}>{activeRisks}</span>
            </div>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1 bg-[#101323]/50 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Blocked Tasks</span>
              <span className={`text-base font-black ${blockedTasks > 0 ? 'text-amber-400' : 'text-slate-355'}`}>{blockedTasks}</span>
            </div>
            <span className="text-lg">🛑</span>
          </div>
        </div>
      </div>
    </div>
  );
}
