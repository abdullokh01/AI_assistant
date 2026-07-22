// Inconsistency Alerts Widget - AI Project Intelligence Platform
// Path: src/components/InconsistencyAlerts.tsx

'use client';

import React from 'react';
import { AIObservation } from '../lib/core/domain/types';

interface InconsistencyAlertsProps {
  observations: AIObservation[];
  onResolve: (id: string, action: 'resolved' | 'ignored') => void;
}

export default function InconsistencyAlerts({
  observations,
  onResolve,
}: InconsistencyAlertsProps) {
  const pendingObs = observations.filter((obs) => obs.status === 'pending');

  const getObservationColor = (type: string) => {
    switch (type) {
      case 'Inconsistency': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'Scope Creep': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'Deadliness': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-200">Intelligence Engine Warnings</h3>
          <p className="text-xs text-slate-400">Cross-channel anomalies detected by continuous AI scanning</p>
        </div>
        <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-full">
          {pendingObs.length} Active Warnings
        </span>
      </div>

      {pendingObs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <span className="text-2xl mb-2 block">✨</span>
          <p className="text-xs font-medium">All channels aligned. No project inconsistencies detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingObs.map((obs) => (
            <div
              key={obs.id}
              className={`p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${getObservationColor(obs.type)}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-black/30 border border-white/5">
                    {obs.type}
                  </span>
                  <span className="text-[10px] text-slate-450">
                    Source: <span className="font-semibold capitalize text-slate-350">{obs.sourceType}</span>
                  </span>
                  <span className="text-[10px] bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                    🎯 {Math.round(obs.confidenceScore)}% Confidence
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">{obs.observation}</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => onResolve(obs.id, 'resolved')}
                  className="flex-1 md:flex-none text-center bg-slate-900 border border-slate-700/50 hover:bg-emerald-950/20 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  ✓ Resolve Card
                </button>
                <button
                  onClick={() => onResolve(obs.id, 'ignored')}
                  className="flex-1 md:flex-none text-center bg-transparent border border-transparent hover:border-slate-800 text-slate-500 hover:text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
