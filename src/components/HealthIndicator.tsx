// Jarvis HUD Health Indicator Widget - AI Project Intelligence Platform
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
  const strokeDash = 2 * Math.PI * 40;
  const healthOffset = strokeDash - (healthScore / 100) * strokeDash;
  const confidenceOffset = strokeDash - (confidenceScore / 100) * strokeDash;

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-[#00ffaa] stroke-[#00ffaa]';
    if (score >= 70) return 'text-cyan-400 stroke-cyan-400';
    if (score >= 50) return 'text-amber-400 stroke-amber-400';
    return 'text-[#ff3366] stroke-[#ff3366]';
  };

  const getDiagnosisMessage = (score: number) => {
    if (score >= 90) return 'SYSTEM STATUS // OPTIMAL. Operational metrics satisfy all architectural constraints. Integrity checks green.';
    if (score >= 70) return 'SYSTEM STATUS // STABLE. Minor channel synchronization latency observed. Continuous auditing active.';
    if (score >= 50) return 'SYSTEM STATUS // WARNING. Mismatches detected between Slack log telemetry and Trello states.';
    return 'SYSTEM STATUS // CRITICAL. Delivery risk bounds exceeded. Core actions needed to align project components.';
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      {/* TELEMETRY DIAL 1: PROJECT HEALTH */}
      <div className="flex flex-col items-center justify-center p-2">
        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3 cyber-mono">
          [01] // Project Health
        </span>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(6, 182, 212, 0.04)" strokeWidth="6" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="3 3" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={strokeDash}
              strokeDashoffset={healthOffset}
              strokeWidth="6"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${getHealthColor(healthScore)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white tracking-tighter cyber-mono">{Math.round(healthScore)}%</span>
            <span className="text-[7px] font-bold tracking-widest text-slate-500 uppercase">SYS_INDEX</span>
          </div>
        </div>
      </div>

      {/* TELEMETRY DIAL 2: AI CONFIDENCE */}
      <div className="flex flex-col items-center justify-center p-2">
        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-3 cyber-mono">
          [02] // AI Confidence
        </span>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(168, 85, 247, 0.04)" strokeWidth="6" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(168, 85, 247, 0.1)" strokeWidth="1" strokeDasharray="3 3" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={strokeDash}
              strokeDashoffset={confidenceOffset}
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-purple-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white tracking-tighter cyber-mono">{Math.round(confidenceScore)}%</span>
            <span className="text-[7px] font-bold tracking-widest text-purple-400 uppercase">SONNET_5</span>
          </div>
        </div>
      </div>

      {/* TELEMETRY STATUS AND DATA CHIPS */}
      <div className="flex flex-col justify-center h-full border-t md:border-t-0 md:border-l border-[#00e5ff]/10 p-4">
        <h3 className="font-extrabold text-xs text-cyan-400 tracking-wider uppercase mb-1 cyber-mono">Jarvis Diagnostic Log</h3>
        <p className="text-[10px] text-slate-400 leading-relaxed min-h-[48px] mb-4 font-mono">
          {getDiagnosisMessage(healthScore)}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#090f1d]/60 border border-cyan-500/10 p-2 rounded-lg flex items-center justify-between">
            <div>
              <span className="block text-[7px] uppercase tracking-widest font-black text-slate-500 cyber-mono">Active Risks</span>
              <span className={`text-xs font-black cyber-mono ${activeRisks > 0 ? 'text-[#ff3366]' : 'text-slate-300'}`}>
                {activeRisks} // UNITS
              </span>
            </div>
          </div>
          <div className="bg-[#090f1d]/60 border border-cyan-500/10 p-2 rounded-lg flex items-center justify-between">
            <div>
              <span className="block text-[7px] uppercase tracking-widest font-black text-slate-500 cyber-mono">Blocked Cards</span>
              <span className={`text-xs font-black cyber-mono ${blockedTasks > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {blockedTasks} // UNITS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
