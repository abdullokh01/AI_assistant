// PM Assistant Widget - AI Project Intelligence Platform
// Path: src/components/PMAssistantWidget.tsx

'use client';

import React, { useState } from 'react';

interface PMAssistantWidgetProps {
  onGenerate: (docType: string, title: string, instructions: string) => Promise<any>;
  loading: boolean;
  documents: any[];
}

export default function PMAssistantWidget({
  onGenerate,
  loading,
  documents,
}: PMAssistantWidgetProps) {
  const [docType, setDocType] = useState<string>('PRD');
  const [title, setTitle] = useState<string>('Product Requirements Document');
  const [instructions, setInstructions] = useState<string>('Describe the core dashboard features, database schema requirements, and authentication user flows.');
  const [activeDoc, setActiveDoc] = useState<any | null>(null);

  const docTypes = [
    'PRD', 'SRS', 'TechSpec', 'MeetingMinutes', 'Proposal', 
    'CommercialOffer', 'Contract', 'SprintPlan', 'UserStories', 
    'AcceptanceCriteria', 'ReleaseNotes', 'TestCases', 'BugReports', 'ChangeRequests'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = await onGenerate(docType, title, instructions);
    if (doc) {
      setActiveDoc(doc);
    }
  };

  const handleExport = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
      {/* FORM AND ARCHIVE LIST */}
      <div className="lg:col-span-1 border-r border-slate-800/80 pr-4 flex flex-col justify-between h-full overflow-hidden">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <h3 className="font-extrabold text-sm text-slate-200">Specification Builder</h3>
            <p className="text-[10px] text-slate-500">Generate PM deliverables grounded in Project Memory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Document Type</label>
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  // Update title default helper
                  if (e.target.value === 'PRD') setTitle('Product Requirements Document');
                  else if (e.target.value === 'SRS') setTitle('Software Requirements Specification');
                  else if (e.target.value === 'TechSpec') setTitle('Technical Architecture Specification');
                  else setTitle(`${e.target.value} Draft`);
                }}
                className="w-full bg-[#111322] border border-slate-850 text-xs text-white rounded-lg px-3 py-2 outline-none"
              >
                {docTypes.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111322] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Custom Scope Prompt</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-[#111322] border border-slate-850 rounded-lg p-3 text-xs text-slate-200 focus:outline-none min-h-[90px]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-505 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black py-2 px-4 rounded-lg shadow-lg shadow-cyan-500/10 transition-all"
            >
              {loading ? 'Generating...' : '✍️ Generate PM Document'}
            </button>
          </form>

          {/* HISTORICAL GENERATIONS */}
          {documents.length > 0 && (
            <div className="pt-3 border-t border-slate-850">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-2">History</span>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDoc(doc)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] truncate ${
                      activeDoc?.id === doc.id ? 'bg-cyan-950/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📂 [{doc.type}] {doc.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEWER */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        {activeDoc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-base font-black text-white">{activeDoc.title}</h4>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Type: {activeDoc.type} • Version: {activeDoc.version} • Draft status
                </span>
              </div>
              <button
                onClick={handleExport}
                className="text-[10px] bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-all font-bold"
              >
                📥 Export Markdown
              </button>
            </div>

            {/* Document markdown viewer */}
            <div className="flex-1 overflow-y-auto bg-[#101323]/25 border border-slate-850 p-6 rounded-xl text-xs text-slate-350 leading-relaxed font-mono space-y-3 whitespace-pre-wrap">
              {activeDoc.content}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
            <span className="text-3xl">📄</span>
            <h4 className="font-bold text-slate-350">PM Workspace Empty</h4>
            <p className="text-[10px] max-w-xs leading-relaxed">
              Generate dynamic specs using the form. Claude will weave requirements from the long-term memory logs automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
