// Dashboard Layout Shell - AI Project Intelligence Platform
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
    <div className="flex h-screen overflow-hidden text-slate-100 bg-[#06070a]">
      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col bg-[#0b0d19]/80 border-r border-slate-800 backdrop-blur-md">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-bold text-sm text-white">OS</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AI Project OS
            </h1>
            <span className="text-[10px] text-cyan-400 tracking-widest uppercase font-semibold">
              Intelligence Engine
            </span>
          </div>
        </div>

        {/* PROJECT SELECTOR */}
        <div className="p-4 border-b border-slate-800">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active Project
          </label>
          <div className="relative">
            <select
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="w-full bg-[#111322] border border-slate-800 text-sm text-white rounded-lg px-3 py-2 outline-none appearance-none cursor-pointer focus:border-cyan-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'inconsistencies', label: 'Inconsistencies', icon: '🚨' },
            { id: 'emails', label: 'Email Control', icon: '✉️' },
            { id: 'trello', label: 'Trello Board', icon: '📋' },
            { id: 'telegram', label: 'Telegram Bot', icon: '🤖' },
            { id: 'memory', label: 'Project Memory', icon: '🧠' },
            { id: 'learning', label: 'Daily Lesson', icon: '🎓' },
            { id: 'pm', label: 'PM Assistant', icon: '📝' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-l-2 border-cyan-500 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* AUDIT TRIGGER */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onRunAudit}
            disabled={auditLoading}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-cyan-500/10 transition-all ${
              auditLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {auditLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Auditing...
              </>
            ) : (
              <>
                🔍 Run AI Audit
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0b0d19]/40 border-b border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold capitalize text-slate-100">{activeTab}</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-bold uppercase tracking-wider pulse-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              Demo Simulation Mode
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Vercel Edge API Active
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700">
              CEO
            </div>
          </div>
        </header>

        {/* CONTAINER */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
