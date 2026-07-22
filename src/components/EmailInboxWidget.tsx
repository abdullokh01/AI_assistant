// Email Inbox Control Widget - AI Project Intelligence Platform
// Path: src/components/EmailInboxWidget.tsx

'use client';

import React, { useState } from 'react';
import { Email } from '../lib/core/domain/types';

interface EmailInboxWidgetProps {
  emails: Email[];
  onSendReply: (id: string, customDraft: string) => Promise<void>;
  syncLoading: boolean;
  onSync: () => void;
}

export default function EmailInboxWidget({
  emails,
  onSendReply,
  syncLoading,
  onSync,
}: EmailInboxWidgetProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails.length > 0 ? emails[0].id : null
  );
  const [draftText, setDraftText] = useState<string>('');
  const [sendLoading, setSendLoading] = useState<boolean>(false);

  // Synchronize state when selected email shifts
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  React.useEffect(() => {
    if (selectedEmail) {
      setDraftText(selectedEmail.responseDraft || '');
    }
  }, [selectedEmailId, emails]);

  const getTagStyle = (tag?: string) => {
    switch (tag) {
      case 'Important': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'Client': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
      case 'Need Action': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Waiting Reply': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const handleSend = async () => {
    if (!selectedEmail) return;
    setSendLoading(true);
    try {
      await onSendReply(selectedEmail.id, draftText);
      alert('Reply sent successfully!');
    } catch (e: any) {
      alert(`Send failed: ${e.message}`);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
      {/* EMAIL SIDEBAR LIST */}
      <div className="lg:col-span-1 border-r border-slate-800/80 pr-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-slate-200">Synced Emails</h3>
          <button
            onClick={onSync}
            disabled={syncLoading}
            className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-1.5 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-all font-bold"
          >
            {syncLoading ? 'Syncing...' : '🔄 Sync IMAP'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {emails.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No synced emails found.</p>
          ) : (
            emails.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmailId(e.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedEmailId === e.id || (!selectedEmailId && emails[0].id === e.id)
                    ? 'bg-cyan-950/20 border-cyan-500/50'
                    : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-extrabold text-slate-350 truncate w-32">
                    {e.fromName || e.fromEmail}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getTagStyle(e.classification)}`}>
                    {e.classification || 'Internal'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">{e.subject || '(No Subject)'}</h4>
                <p className="text-[10px] text-slate-450 line-clamp-1">{e.body}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* EMAIL DETAILED VIEWER */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        {selectedEmail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4">
            {/* Header info */}
            <div className="border-b border-slate-850 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-white">{selectedEmail.subject}</h3>
                <span className="text-[10px] text-slate-400">
                  From: <span className="font-semibold text-slate-300">{selectedEmail.fromName} ({selectedEmail.fromEmail})</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(selectedEmail.receivedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Email Body */}
            <div className="flex-1 bg-[#101323]/30 border border-slate-850 p-4 rounded-xl overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans">
              {selectedEmail.body}
            </div>

            {/* Response Draft Editor */}
            <div className="border-t border-slate-850 pt-3 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  AI Draft Reply
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedEmail.sentAt ? `🟢 Sent on ${new Date(selectedEmail.sentAt).toLocaleDateString()}` : '⚪ Not Sent'}
                </span>
              </div>

              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full bg-[#101323]/50 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none min-h-[120px] font-mono leading-relaxed"
                placeholder="Write your email reply here..."
                disabled={!!selectedEmail.sentAt}
              />

              {!selectedEmail.sentAt && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSend}
                    disabled={sendLoading}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
                  >
                    {sendLoading ? 'Sending...' : '✉️ Send Draft via SMTP'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select an email to view details and response drafts.
          </div>
        )}
      </div>
    </div>
  );
}
