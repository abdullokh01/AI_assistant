// Jarvis HUD Dashboard Layout Shell - AI Project Intelligence Platform
// Path: src/components/DashboardLayout.tsx

'use client';

import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: Array<{ id: string; name: string }>;
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  onRunAudit: () => void;
  auditLoading: boolean;
}

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  projects,
  currentProjectId,
  setCurrentProjectId,
  onRunAudit,
  auditLoading,
}: React.PropsWithChildren<SidebarProps>) {
  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-[#020408] relative">
      {/* BACKGROUND GRAPHIC LINES */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-10 left-10 w-[400px] h-[1px] bg-gradient-to-r from-cyan-500 to-transparent"></div>
        <div className="absolute top-10 left-10 w-[1px] h-[300px] bg-gradient-to-b from-cyan-500 to-transparent"></div>
        <div className="absolute bottom-10 right-10 w-[400px] h-[1px] bg-gradient-to-l from-purple-500 to-transparent"></div>
        <div className="absolute bottom-10 right-10 w-[1px] h-[300px] bg-gradient-to-t from-purple-500 to-transparent"></div>
      </div>

      {/* SIDEBAR HUD */}
      <aside className="w-72 flex flex-col bg-[#060a14]/90 border-r border-[#00e5ff]/15 backdrop-blur-xl z-10 relative">
        {/* TOP BRAND WITH PULSING JARVIS CORE */}
        <div className="p-6 flex flex-col items-center justify-center border-b border-[#00e5ff]/10 space-y-4">
          <div className="jarvis-core relative">
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">
              AI
            </span>
          </div>
          <div className="text-center">
            <h1 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#00e5ff] to-[#a855f7] tracking-wider cyber-mono">
              JARVIS // OS
            </h1>
            <span className="text-[9px] text-[#00ffaa] tracking-widest uppercase font-extrabold cyber-mono pulse-glow">
              ● Intel Core Online
            </span>
          </div>
        </div>

        {/* PROJECT SELECTOR HUD */}
        <div className="p-4 border-b border-[#00e5ff]/10">
          <label className="block text-[8px] font-black text-[#06b6d4] uppercase tracking-widest mb-2 cyber-mono">
            SELECT CHANNEL
          </label>
          <div className="relative">
            <select
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="w-full bg-[#090f1d] border border-cyan-500/20 text-xs text-cyan-300 rounded-md px-3 py-2 outline-none appearance-none cursor-pointer focus:border-cyan-400 font-mono shadow-inner shadow-cyan-500/5"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#020408] text-cyan-300">
                  {p.name.replace(/^[^\w]*/, '')}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
              <span className="text-[8px]">▼</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINUP */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Dashboard HUD', icon: '⚡' },
            { id: 'inconsistencies', label: 'Anomaly Audit', icon: '🚨' },
            { id: 'emails', label: 'Inbox Streams', icon: '✉️' },
            { id: 'trello', label: 'Agile Kanban', icon: '📋' },
            { id: 'telegram', label: 'Telegram Bot', icon: '🤖' },
            { id: 'memory', label: 'Core Memory', icon: '🧠' },
            { id: 'learning', label: 'CEO Lesson', icon: '🎓' },
            { id: 'pm', label: 'PM Assistant', icon: '📝' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === item.id
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-[#00e5ff] cyber-mono shadow-lg shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-cyan-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {activeTab === item.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow animate-ping"></span>
              )}
            </button>
          ))}
        </nav>

        {/* SCANNER TRIGGER HUD */}
        <div className="p-4 border-t border-[#00e5ff]/10">
          <button
            onClick={onRunAudit}
            disabled={auditLoading}
            className={`w-full flex items-center justify-center gap-2 bg-transparent border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-400 text-xs font-black py-2.5 px-4 rounded-lg tracking-widest uppercase transition-all shadow-md shadow-cyan-500/5 ${
              auditLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {auditLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                SCANNING...
              </>
            ) : (
              <>
                ⚡ RUN DIAGNOSTIC
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        {/* HEADER HUD */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#060a14]/60 border-b border-cyan-500/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-extrabold tracking-widest uppercase text-cyan-400 cyber-mono">
              SYSTEM::{activeTab}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 text-[#00ffaa] rounded-md text-[9px] font-black uppercase tracking-wider cyber-mono">
              <span className="w-1 h-1 rounded-full bg-[#00ffaa] animate-ping"></span>
              SECURE LINK // ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              NODE_ENV // PROD_EDGE
            </span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-350 tracking-wider uppercase cyber-mono">Jarvis.Core</span>
                <span className="block text-[8px] text-cyan-400 font-mono">LEVEL_05_AUTH</span>
              </div>
              <div className="w-9 h-9 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-xs text-cyan-400 cyber-mono">
                AI
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER */}
        <main className="flex-1 overflow-y-auto p-8 relative scan-sweeper">
          {children}
        </main>
      </div>
    </div>
  );
}
