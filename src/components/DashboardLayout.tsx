// Jarvis HUD Dashboard Layout Shell - AI Project Intelligence Platform
// Path: src/components/DashboardLayout.tsx

'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/shared/supabase-client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: Array<{ id: string; name: string }>;
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  onRunAudit: () => void;
  auditLoading: boolean;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard HUD', icon: '⚡' },
  { id: 'inconsistencies', label: 'Anomaly Audit', icon: '🚨' },
  { id: 'emails', label: 'Inbox Streams', icon: '✉️' },
  { id: 'trello', label: 'Agile Kanban', icon: '📋' },
  { id: 'telegram', label: 'Telegram Bot', icon: '🤖' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'memory', label: 'Core Memory', icon: '🧠' },
  { id: 'learning', label: 'CEO Lesson', icon: '🎓' },
  { id: 'pm', label: 'PM Assistant', icon: '📝' },
];

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
  const [collapsed, setCollapsed] = useState(false);
  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || activeTab;

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
      <aside
        className={`hud-rail flex flex-col bg-[#060a14]/92 border-r border-[#00e5ff]/15 backdrop-blur-xl z-20 relative transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'w-[74px]' : 'w-72'
        }`}
      >
        {/* animated top accent line */}
        <span className="hud-rail-accent" />

        {/* TOP BRAND WITH PULSING JARVIS CORE */}
        <div className={`flex flex-col items-center justify-center border-b border-[#00e5ff]/10 ${collapsed ? 'p-4 gap-3' : 'p-6 gap-4'}`}>
          <div className="jarvis-core relative shrink-0">
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">
              AI
            </span>
          </div>
          {!collapsed && (
            <div className="text-center">
              <h1 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#00e5ff] to-[#a855f7] tracking-wider font-display">
                JARVIS // OS
              </h1>
              <span className="text-[9px] text-[#00ffaa] tracking-widest uppercase font-extrabold cyber-mono">
                ● Intel Core Online
              </span>
            </div>
          )}
        </div>

        {/* COLLAPSE TOGGLE */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="hud-toggle"
        >
          <span className={`hud-toggle-chevron ${collapsed ? 'rotate-180' : ''}`}>‹</span>
        </button>

        {/* PROJECT SELECTOR HUD */}
        {!collapsed && (
          <div className="p-4 border-b border-[#00e5ff]/10">
            <label className="block text-[8px] font-black text-[#06b6d4] uppercase tracking-widest mb-2 cyber-mono">
              SELECT CHANNEL
            </label>
            <div className="relative">
              <select
                value={currentProjectId}
                onChange={(e) => setCurrentProjectId(e.target.value)}
                className="w-full bg-[#090f1d] border border-cyan-500/20 text-xs text-cyan-300 px-3 py-2 outline-none appearance-none cursor-pointer focus:border-cyan-400 font-mono shadow-inner shadow-cyan-500/5"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
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
        )}

        {/* NAVIGATION LINEUP */}
        <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`hud-nav group ${active ? 'hud-nav--active' : ''} ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="hud-nav-bar" />
                <span className="text-sm shrink-0">{item.icon}</span>
                {!collapsed && <span className="hud-nav-label">{item.label}</span>}
                {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
              </button>
            );
          })}
        </nav>

        {/* SCANNER TRIGGER HUD */}
        <div className={`border-t border-[#00e5ff]/10 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={onRunAudit}
            disabled={auditLoading}
            title={collapsed ? 'Run diagnostic' : undefined}
            className={`hud-diagnostic ${auditLoading ? 'opacity-50 cursor-not-allowed' : ''} ${collapsed ? 'px-0' : ''}`}
          >
            {auditLoading ? (
              <svg className="animate-spin h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span className="text-sm">⚡</span>
            )}
            {!collapsed && <span>{auditLoading ? 'SCANNING...' : 'RUN DIAGNOSTIC'}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        {/* HEADER HUD */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#060a14]/60 border-b border-cyan-500/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black tracking-[0.14em] uppercase text-cyan-300 font-display" style={{ textShadow: '0 0 12px rgba(0,229,255,0.35)' }}>
              SYSTEM::{activeLabel}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 text-[#00ffaa] text-[9px] font-black uppercase tracking-wider cyber-mono">
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
              <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-xs text-cyan-400 cyber-mono"
                style={{ clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))' }}>
                AI
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                title="Terminate session"
                className="hud-logout"
              >
                ⏻
              </button>
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
