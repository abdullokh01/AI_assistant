// Telegram Sync Widget - AI Project Intelligence Platform
// Path: src/components/TelegramSyncWidget.tsx

'use client';

import React from 'react';
import { TelegramChat } from '../lib/core/domain/types';

interface TelegramSyncWidgetProps {
  chat: TelegramChat | null;
  onSync: () => void;
  syncLoading: boolean;
  activities: any[];
}

export default function TelegramSyncWidget({
  chat,
  onSync,
  syncLoading,
  activities,
}: TelegramSyncWidgetProps) {
  const tgMessages = activities.filter((a) => a.actionType === 'Telegram Message Tracked');

  return (
    <div className="glass-panel p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* BOT METADATA & CONNECTION */}
      <div className="lg:col-span-1 border-r border-slate-800/80 pr-4 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="font-extrabold text-base text-slate-200">Telegram Bot Integration</h3>
              <p className="text-[10px] text-slate-500">Connected group chat configuration</p>
            </div>
          </div>

          {chat ? (
            <div className="space-y-3 bg-[#101323]/50 border border-slate-850 p-4 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Chat Title:</span>
                <span className="font-bold text-slate-200">{chat.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Telegram Chat ID:</span>
                <span className="font-mono text-slate-400">{chat.chatId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Bot Connection:</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Last Synced:</span>
                <span className="text-slate-400">
                  {chat.syncedAt ? new Date(chat.syncedAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-400 leading-relaxed">
              ⚠️ *No Chat Linked*
              <p className="text-[10px] text-slate-450 mt-1">
                Link this project to a Telegram group chat. Click below or type `/start` inside your Telegram group.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onSync}
          disabled={syncLoading || !chat}
          className="w-full bg-slate-900 border border-slate-850 hover:border-cyan-500 hover:text-cyan-400 text-slate-200 text-xs font-bold py-2 px-4 rounded-lg transition-all"
        >
          {syncLoading ? 'Syncing...' : '🔄 Sync Group Chat Feed'}
        </button>
      </div>

      {/* RECENT MESSAGE FEED */}
      <div className="lg:col-span-2 flex flex-col h-[320px] overflow-hidden">
        <h3 className="font-extrabold text-sm text-slate-200 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
          Tracked Chat Stream (Activity Log)
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 bg-[#101323]/20 border border-slate-850 p-4 rounded-xl">
          {tgMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No Telegram messages tracked yet.</p>
          ) : (
            tgMessages.map((m) => (
              <div key={m.id} className="flex gap-3 text-xs bg-[#111322]/80 border border-slate-850 p-3 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                  {m.details.sender?.slice(0, 2).toUpperCase() || 'TG'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{m.details.sender}</span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{m.details.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
