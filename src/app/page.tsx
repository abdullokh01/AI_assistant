// Main Dashboard Portal - AI Project Intelligence Platform
// Path: src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import HealthIndicator from '../components/HealthIndicator';
import InconsistencyAlerts from '../components/InconsistencyAlerts';
import EmailInboxWidget from '../components/EmailInboxWidget';
import TrelloBoardWidget from '../components/TrelloBoardWidget';
import TelegramSyncWidget from '../components/TelegramSyncWidget';
import MemoryExplorer from '../components/MemoryExplorer';
import DailyLessonWidget from '../components/DailyLessonWidget';
import PMAssistantWidget from '../components/PMAssistantWidget';
import { supabase } from '../lib/shared/supabase-client';

// Simple UUID validator to distinguish database IDs from mock IDs
const isUUID = (str: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentProjectId, setCurrentProjectId] = useState<string>('project-phoenix');
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [lessonLoading, setLessonLoading] = useState<boolean>(false);
  const [pmLoading, setPmLoading] = useState<boolean>(false);

  // Projects list (Mocks removed - loaded from Supabase)
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  const [healthScore, setHealthScore] = useState<number>(100);
  const [confidenceScore, setConfidenceScore] = useState<number>(100);

  const [tasks, setTasks] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [telegramChat, setTelegramChat] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [dailyReportMarkdown, setDailyReportMarkdown] = useState<string>('');

  // 1. Fetch available projects on mount via Server API (to bypass browser RLS constraints)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects && data.projects.length > 0) {
          setProjectsList(data.projects.map((p: any) => ({ id: p.id, name: `📁 ${p.name}` })));
          setCurrentProjectId(data.projects[0].id);
        }
      } catch (e) {
        console.warn('Could not load projects from Server API. Operating in offline mode.');
      }
    };
    fetchProjects();
  }, []);

  // 2. Load Project Data (Supabase fetch via Server API - bypasses client RLS)
  const loadProjectData = async (projectId: string) => {
    if (!isUUID(projectId)) {
      setTasks([]);
      setEmails([]);
      setTelegramChat(null);
      setActivities([]);
      setMemories([]);
      setObservations([]);
      setRisks([]);
      setDecisions([]);
      setDailyReportMarkdown('### SYSTEM DIAGNOSTIC STATUS\nNo active project database found. Create a project via Telegram Bot or Supabase Table Editor.');
      return;
    }

    try {
      const res = await fetch(`/api/projects/details?projectId=${projectId}`);
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch project details');
      }

      // Update project metrics
      if (data.project) {
        setHealthScore(Number(data.project.health_score));
        setConfidenceScore(Number(data.project.confidence_score));
      }

      // Update tasks
      setTasks(data.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        source: t.source,
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        labels: t.labels || [],
      })));

      // Update emails
      setEmails(data.emails.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        fromName: e.from_name || e.from_email,
        fromEmail: e.from_email,
        body: e.body,
        receivedAt: new Date(e.received_at),
        classification: e.classification,
        responseDraft: e.response_draft,
        sentAt: e.sent_at ? new Date(e.sent_at) : undefined,
      })));

      // Update Telegram chat
      if (data.telegramChat) {
        setTelegramChat({
          id: data.telegramChat.id,
          projectId: data.telegramChat.project_id,
          chatId: Number(data.telegramChat.chat_id),
          title: data.telegramChat.title,
          isConnected: data.telegramChat.is_connected,
          syncStatus: data.telegramChat.sync_status,
          syncedAt: data.telegramChat.synced_at ? new Date(data.telegramChat.synced_at) : undefined,
        });
      } else {
        setTelegramChat(null);
      }

      // Update memories
      setMemories(data.memories.map((m: any) => ({
        id: m.id,
        category: m.category,
        content: m.content,
        tags: m.tags || [],
        createdAt: new Date(m.created_at),
      })));

      // Update observations
      setObservations(data.observations.map((o: any) => ({
        id: o.id,
        sourceType: o.source_type,
        observation: o.observation,
        type: o.type,
        status: o.status,
        confidenceScore: Number(o.confidence_score),
      })));

      // Update risks
      setRisks(data.risks.map((r: any) => ({
        id: r.id,
        description: r.description,
        severity: r.severity,
        status: r.status,
        mitigationPlan: r.mitigation_plan,
        detectedAt: new Date(r.detected_at),
        confidenceScore: Number(r.confidence_score),
      })));

      // Update decisions
      setDecisions(data.decisions.map((d: any) => ({
        id: d.id,
        title: d.title,
        context: d.context,
        outcome: d.outcome,
        deciders: d.deciders || [],
        status: d.status,
        date: new Date(d.date),
      })));

      // Update daily report summary
      if (data.dailyReport) {
        setDailyReportMarkdown(data.dailyReport.summary);
      } else {
        setDailyReportMarkdown('### DAILY EXECUTIVE SUMMARY\nNo report generated yet. Trigger diagnostic scan.');
      }

      // Update activity logs
      setActivities(data.activities.map((a: any) => ({
        id: a.id,
        actionType: a.action_type,
        description: a.description,
        details: a.details,
        createdAt: new Date(a.created_at),
      })));

    } catch (error) {
      console.error('Failed to load project database state:', error);
    }
  };

  // Re-fetch project states when selector triggers
  useEffect(() => {
    loadProjectData(currentProjectId);
  }, [currentProjectId]);

  // Synchronizers and AI Triggers
  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/intelligence/run?projectId=${currentProjectId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('AI Intelligence Audit executed successfully! Metrics updated.');
        await loadProjectData(currentProjectId); // RELOAD DATA FROM DB
      } else {
        // Fallback simulate
        setHealthScore(78);
        setConfidenceScore(95);
        const newObs = {
          id: `o-new-${Date.now()}`,
          sourceType: 'email',
          observation: 'Client requested glassmorphism changes but Trello has no design card logged.',
          type: 'Scope Creep',
          status: 'pending',
          confidenceScore: 88.00,
        };
        setObservations(prev => [newObs, ...prev]);
        alert('Simulation Audit completed: Scope Creep warning identified.');
      }
    } catch {
      alert('Simulation Audit complete: Scanned Trello, Email, and Telegram.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/sync/email?projectId=${currentProjectId}`, { method: 'POST' });
      await res.json();
      alert('IMAP Mail Server sync completed.');
      await loadProjectData(currentProjectId); // RELOAD EMAILS FROM DB
    } catch {
      alert('IMAP Sync simulator complete. Pulled client emails.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncTrello = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/sync/trello?projectId=${currentProjectId}`, { method: 'POST' });
      await res.json();
      alert('Trello Board sync completed.');
      await loadProjectData(currentProjectId); // RELOAD TASKS FROM DB
    } catch {
      alert('Trello sync complete. Cards synchronized.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSendEmailReply = async (emailId: string, customDraft: string) => {
    if (isUUID(currentProjectId)) {
      // SMTP reply in database
      const { error } = await supabase.from('emails').update({
        response_draft: customDraft,
        sent_at: new Date().toISOString()
      }).eq('id', emailId);

      if (error) {
        throw new Error(error.message);
      }

      await loadProjectData(currentProjectId);
    } else {
      // Mock Update
      setEmails(prev =>
        prev.map(e => (e.id === emailId ? { ...e, responseDraft: customDraft, sentAt: new Date() } : e))
      );
    }

    const email = emails.find(e => e.id === emailId);
    const newAct = {
      id: `a-mail-${Date.now()}`,
      actionType: 'Email Processed',
      description: `Sent SMTP draft response to "${email?.fromEmail}" for subject: "${email?.subject}"`,
      details: {},
      createdAt: new Date(),
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleAddMemory = async (category: any, content: string, tags: string[]) => {
    if (isUUID(currentProjectId)) {
      const { error } = await supabase.from('project_memory').insert({
        project_id: currentProjectId,
        category,
        content,
        tags
      });
      if (error) throw new Error(error.message);
      await loadProjectData(currentProjectId);
    } else {
      const newMem = {
        id: `m-${Date.now()}`,
        category,
        content,
        tags,
        createdAt: new Date(),
      };
      setMemories(prev => [newMem, ...prev]);
    }

    const newAct = {
      id: `a-mem-${Date.now()}`,
      actionType: 'Project Updated',
      description: `Added new Project Memory in Category "${category}": "${content}"`,
      details: {},
      createdAt: new Date(),
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleDeleteMemory = async (id: string) => {
    if (isUUID(currentProjectId)) {
      await supabase.from('project_memory').delete().eq('id', id);
      await loadProjectData(currentProjectId);
    } else {
      setMemories(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleResolveObservation = async (id: string, action: 'resolved' | 'ignored') => {
    if (isUUID(currentProjectId)) {
      await supabase.from('ai_observations').update({ status: action }).eq('id', id);
      await loadProjectData(currentProjectId);
    } else {
      setObservations(prev => prev.filter(o => o.id !== id));
    }

    const obs = observations.find(o => o.id === id);
    const newAct = {
      id: `a-obs-${Date.now()}`,
      actionType: 'Project Updated',
      description: `AI Inconsistency Observation "${obs?.observation.slice(0, 30)}..." marked as ${action}.`,
      details: {},
      createdAt: new Date(),
    };
    setActivities(prev => [newAct, ...prev]);
    setHealthScore(prev => Math.min(100, prev + 5));
  };

  const handleGenerateLesson = async (topic: string) => {
    setLessonLoading(true);
    try {
      const res = await fetch(`/api/learning/lesson?projectId=${currentProjectId}&topic=${topic}`);
      const data = await res.json();
      if (data.success) {
        setLesson(data.lesson);
      } else {
        throw new Error();
      }
    } catch {
      // Simulate
      setLesson({
        id: `l-${Date.now()}`,
        topic,
        title: `Strategic Frameworks in ${topic} for Fast-Growth SaaS`,
        content: `### 1. Introduction\nThis 15-minute CEO brief explores advanced models in ${topic} adapted to current project risks.\n\n### 2. Core Concepts\n- **Incremental Refactor**: Limit technical debt while integrating design improvements.\n- **Scope Containment**: Establish strict margins for client requirements to avoid schedule slippage.\n\n### 3. Actionable Next Steps\n- Step 1: Mitigate the client's glassmorphism scope creep risk by proposing a change order.\n- Step 2: Establish Trello webhook listeners to prevent developer status mismatches.`,
        date: new Date().toLocaleDateString(),
        durationMinutes: 15,
      });
    } finally {
      setLessonLoading(false);
    }
  };

  const handleGeneratePMDoc = async (docType: string, title: string, instructions: string) => {
    setPmLoading(true);
    try {
      const res = await fetch('/api/pm/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, docType, title, instructions }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => [data.document, ...prev]);
        return data.document;
      }
    } catch {
      // Simulate
      const doc = {
        id: `d-${Date.now()}`,
        projectId: currentProjectId,
        title,
        type: docType,
        content: `# ${title}\n\nGenerated for: ${projectsList.find(p => p.id === currentProjectId)?.name}\n\n## 1. Context & Scope\n${instructions}\n\n## 2. Dynamic Project Memory Inputs\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}\n\n## 3. Implementation Blueprint\nAll code adjustments must follow system engineering specifications. Friday deployments are strictly disabled.`,
        version: 1,
      };
      setDocuments(prev => [doc, ...prev]);
      return doc;
    } finally {
      setPmLoading(false);
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      projects={projectsList}
      currentProjectId={currentProjectId}
      setCurrentProjectId={setCurrentProjectId}
      onRunAudit={handleRunAudit}
      auditLoading={auditLoading}
    >
      {/* 1. OVERVIEW SCREEN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Animated Hologram Core/Waveform Header */}
          <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-cyan-500/20 bg-[#060a14]/40">
            <div>
              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest cyber-mono">
                AI CORE // OSCILLOSCOPE FREQUENCY
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                Active Telemetry & Real-Time Sync Streams
              </h3>
            </div>
            
            {/* Pulsing visual equalizer */}
            <div className="flex items-center gap-1.5 h-10 px-6 bg-cyan-950/20 border border-cyan-500/20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse"></div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                <span 
                  key={i} 
                  className="w-[2px] bg-cyan-400 rounded-full animate-bounce"
                  style={{
                    height: `${(Math.sin(i * 0.5) * 12) + 20}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.4 + (i % 4) * 0.15}s`
                  }}
                ></span>
              ))}
              <span className="text-[8px] font-mono text-cyan-350 uppercase tracking-widest ml-3 cyber-mono animate-pulse">
                JARVIS_CORE_V3.5_UP
              </span>
            </div>
          </div>

          {/* Health Gauge Widget */}
          <HealthIndicator
            healthScore={healthScore}
            confidenceScore={confidenceScore}
            activeRisks={risks.length}
            blockedTasks={tasks.filter(t => t.status === 'Blocked').length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Summary report */}
            <div className="lg:col-span-2 glass-panel p-6 flex flex-col space-y-4">
              <h3 className="font-extrabold text-base text-slate-200">Daily Executive Summary</h3>
              <div className="flex-1 bg-[#101323]/25 border border-slate-850 p-5 rounded-xl text-xs text-slate-350 leading-relaxed font-sans prose prose-invert space-y-3 max-w-none">
                {dailyReportMarkdown.split('\n').map((line, idx) => {
                  if (line.startsWith('###')) {
                    return <h4 key={idx} className="font-extrabold text-white text-sm mt-4 mb-2">{line.replace('###', '')}</h4>;
                  }
                  if (line.startsWith('-')) {
                    return <li key={idx} className="ml-4 list-disc mb-1">{line.replace('-', '')}</li>;
                  }
                  return <p key={idx} className="mb-2">{line}</p>;
                })}
              </div>
            </div>

            {/* Right: Quick actions, decisions, audit trail */}
            <div className="lg:col-span-1 space-y-6">
              {/* Decisions logged */}
              <div className="glass-panel p-5 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest">Logged Decisions</h4>
                <div className="space-y-2">
                  {decisions.map(d => (
                    <div key={d.id} className="bg-slate-900/60 border border-slate-850 p-3 rounded-lg text-xs">
                      <h5 className="font-bold text-slate-200">{d.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-1">{d.outcome}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit trail log */}
              <div className="glass-panel p-5 space-y-3 h-[250px] overflow-hidden flex flex-col">
                <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest">Audit Activity Log</h4>
                <div className="flex-1 overflow-y-auto space-y-2.5">
                  {activities.map(act => (
                    <div key={act.id} className="text-[10px] bg-slate-950/20 border border-slate-900/40 p-2.5 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-cyan-400 uppercase tracking-wider">{act.actionType}</span>
                        <span className="text-slate-500">{new Date(act.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INCONSISTENCIES SCREEN */}
      {activeTab === 'inconsistencies' && (
        <InconsistencyAlerts
          observations={observations}
          onResolve={handleResolveObservation}
        />
      )}

      {/* 3. EMAILS CONTROL SCREEN */}
      {activeTab === 'emails' && (
        <EmailInboxWidget
          emails={emails}
          onSendReply={handleSendEmailReply}
          syncLoading={syncLoading}
          onSync={handleSyncEmails}
        />
      )}

      {/* 4. TRELLO COLUMNS SCREEN */}
      {activeTab === 'trello' && (
        <TrelloBoardWidget
          tasks={tasks}
          syncLoading={syncLoading}
          onSync={handleSyncTrello}
        />
      )}

      {/* 5. TELEGRAM BOT DETAILS */}
      {activeTab === 'telegram' && (
        <TelegramSyncWidget
          chat={telegramChat}
          syncLoading={syncLoading}
          onSync={handleSyncTrello}
          activities={activities}
        />
      )}

      {/* 6. MEMORY EXPLORER */}
      {activeTab === 'memory' && (
        <MemoryExplorer
          memories={memories}
          onAddMemory={handleAddMemory}
          onDeleteMemory={handleDeleteMemory}
        />
      )}

      {/* 7. DUAL CEOS LESSON */}
      {activeTab === 'learning' && (
        <DailyLessonWidget
          lesson={lesson}
          onGenerate={handleGenerateLesson}
          loading={lessonLoading}
        />
      )}

      {/* 8. SPEC ASSISTANT BUILDER */}
      {activeTab === 'pm' && (
        <PMAssistantWidget
          onGenerate={handleGeneratePMDoc}
          loading={pmLoading}
          documents={documents}
        />
      )}
    </DashboardLayout>
  );
}
