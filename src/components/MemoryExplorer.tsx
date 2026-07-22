// Memory Explorer Widget - AI Project Intelligence Platform
// Path: src/components/MemoryExplorer.tsx

'use client';

import React, { useState } from 'react';
import { ProjectMemory, MemoryCategory } from '../lib/core/domain/types';

interface MemoryExplorerProps {
  memories: ProjectMemory[];
  onAddMemory: (category: MemoryCategory, content: string, tags: string[]) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export default function MemoryExplorer({
  memories,
  onAddMemory,
  onDeleteMemory,
}: MemoryExplorerProps) {
  const [activeCategory, setActiveCategory] = useState<MemoryCategory>('Business Rules');
  const [contentInput, setContentInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const categories: MemoryCategory[] = [
    'Business Rules', 'Architecture', 'Requirements', 'Decisions', 
    'Known Issues', 'Stakeholders', 'Glossary', 'Sprint History', 'Client Preferences'
  ];

  const filteredMemories = memories.filter((m) => m.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) return;

    setSubmitting(true);
    try {
      const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
      await onAddMemory(activeCategory, contentInput, tags);
      setContentInput('');
      setTagInput('');
      alert('Memory added successfully!');
    } catch (err: any) {
      alert(`Failed to add memory: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* CATEGORY SELECTOR SIDEBAR */}
      <div className="lg:col-span-1 border-r border-slate-800/80 pr-4 space-y-1">
        <h3 className="font-extrabold text-sm text-slate-200 mb-3">Memory Categories</h3>
        {categories.map((cat) => {
          const count = memories.filter((m) => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>{cat}</span>
              <span className="bg-slate-900 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-black">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* MEMORY LIST & FORM */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-[420px] overflow-hidden">
        {/* ADD MEMORY FORM */}
        <form onSubmit={handleSubmit} className="bg-[#101323]/40 border border-slate-850 p-4 rounded-xl space-y-3">
          <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">
            Add to "{activeCategory}" Memory
          </span>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder={`Enter rule or preference (e.g. "Staging deploy occurs automatically on PR merges")`}
              className="flex-1 bg-[#111322] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:border-cyan-500 focus:outline-none"
              required
            />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="tags (comma separated)"
              className="w-full md:w-48 bg-[#111322] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-all"
            >
              {submitting ? 'Saving...' : '＋ Add'}
            </button>
          </div>
        </form>

        {/* MEMORY ITEMS STREAM */}
        <div className="flex-1 overflow-y-auto space-y-3 bg-[#101323]/10 border border-slate-850 p-4 rounded-xl">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-xs">
              Memory index empty for this category. Add rules to feed Claude PM operations.
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div key={m.id} className="bg-[#111322]/80 border border-slate-850 p-3.5 rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{m.content}</p>
                  {m.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {m.tags.map((t) => (
                        <span key={t} className="bg-slate-900 border border-slate-850 text-slate-450 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="text-slate-550 hover:text-rose-400 text-xs font-bold transition-all px-1.5"
                  title="Delete memory"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
