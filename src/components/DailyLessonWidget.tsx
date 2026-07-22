// Daily Lesson Widget - AI Project Intelligence Platform
// Path: src/components/DailyLessonWidget.tsx

'use client';

import React, { useState } from 'react';
import { LearningLesson } from '../lib/core/domain/types';

interface DailyLessonWidgetProps {
  lesson: LearningLesson | null;
  onGenerate: (topic: string) => Promise<void>;
  loading: boolean;
}

export default function DailyLessonWidget({
  lesson,
  onGenerate,
  loading,
}: DailyLessonWidgetProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('Leadership');

  const topics = [
    'Project Management', 'Leadership', 'Negotiation', 'AI', 
    'Software Architecture', 'System Design', 'Product Thinking', 'CEO Thinking'
  ];

  const handleGenerate = () => {
    onGenerate(selectedTopic);
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* TOPIC SELECTOR */}
      <div className="lg:col-span-1 border-r border-slate-800/80 pr-4 space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-200 mb-1">CEO Daily Training</h3>
          <p className="text-[10px] text-slate-500">15-minute lessons customized to project realities</p>
        </div>

        <div className="space-y-1">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedTopic === t
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'text-slate-400 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              🎓 {t}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-violet-600/15 transition-all"
        >
          {loading ? 'Synthesizing...' : '✍️ Compile New Lesson'}
        </button>
      </div>

      {/* LESSON CONTENT VIEW */}
      <div className="lg:col-span-3 flex flex-col h-[400px] overflow-hidden">
        {lesson ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-base font-black text-white">{lesson.title}</h4>
                <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                  Topic: {lesson.topic} • {lesson.durationMinutes} Minutes read
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{lesson.date}</span>
            </div>

            {/* Lesson Body */}
            <div className="flex-1 overflow-y-auto bg-[#101323]/20 border border-slate-850 p-5 rounded-xl text-xs text-slate-300 leading-relaxed font-sans space-y-3 prose prose-invert max-w-none">
              {/* Parse headers roughly */}
              {lesson.content.split('\n').map((line, idx) => {
                if (line.startsWith('###')) {
                  return <h5 key={idx} className="font-extrabold text-white text-sm mt-4 mb-2">{line.replace('###', '')}</h5>;
                }
                if (line.startsWith('##')) {
                  return <h4 key={idx} className="font-black text-white text-base mt-5 mb-2">{line.replace('##', '')}</h4>;
                }
                if (line.startsWith('-')) {
                  return <li key={idx} className="ml-4 list-disc mb-1">{line.replace('-', '')}</li>;
                }
                return <p key={idx} className="mb-3">{line}</p>;
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
            <span className="text-3xl">📚</span>
            <h4 className="font-bold text-slate-350">No Lesson Compiled Today</h4>
            <p className="text-[10px] max-w-xs leading-relaxed">
              Compile a lesson on leadership, system design, or negotiation. Claude will pull current risks to write a targeted study.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
