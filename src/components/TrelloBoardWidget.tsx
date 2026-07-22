// Trello Board Widget - AI Project Intelligence Platform
// Path: src/components/TrelloBoardWidget.tsx

'use client';

import React from 'react';
import { Task, TaskStatus } from '../lib/core/domain/types';

interface TrelloBoardWidgetProps {
  tasks: Task[];
  onSync: () => void;
  syncLoading: boolean;
}

export default function TrelloBoardWidget({
  tasks,
  onSync,
  syncLoading,
}: TrelloBoardWidgetProps) {
  const columns: { title: TaskStatus; icon: string }[] = [
    { title: 'Todo', icon: '📝' },
    { title: 'In Progress', icon: '⚡' },
    { title: 'QA', icon: '🔍' },
    { title: 'Done', icon: '✅' },
    { title: 'Blocked', icon: '🛑' },
  ];

  const getTaskByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const getLabelColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('front')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (l.includes('back') || l.includes('data')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (l.includes('ai') || l.includes('intel')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700/50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-200">Trello Board Synchronization</h3>
          <p className="text-xs text-slate-400">Synced cards mapped into Agile status columns</p>
        </div>
        <button
          onClick={onSync}
          disabled={syncLoading}
          className="text-xs bg-slate-900 border border-slate-850 px-3 py-2 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-all font-bold"
        >
          {syncLoading ? 'Syncing...' : '🔄 Sync Trello Board'}
        </button>
      </div>

      {/* BOARD KANBAN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = getTaskByStatus(col.title);
          return (
            <div key={col.title} className="bg-[#0b0d19]/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[550px] min-w-[220px]">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-black text-slate-300 uppercase tracking-wider">
                  <span>{col.icon}</span>
                  {col.title}
                </span>
                <span className="bg-slate-900 border border-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-[10px] border border-dashed border-slate-850 rounded-xl">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div key={t.id} className="bg-[#111322]/80 border border-slate-850 hover:border-slate-750 p-3.5 rounded-xl shadow-lg transition-all space-y-3">
                      <h4 className="text-xs font-bold leading-snug text-slate-200">{t.title}</h4>
                      {t.description && (
                        <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed">{t.description}</p>
                      )}

                      {/* Labels */}
                      {t.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.labels.map((lbl) => (
                            <span
                              key={lbl}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getLabelColor(lbl)}`}
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[8px] text-slate-500">
                        <span>
                          {t.dueDate ? `📅 ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'}
                        </span>
                        <span className="bg-slate-900 border border-slate-850 px-1 rounded text-slate-400 uppercase font-black tracking-widest">
                          {t.source}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
