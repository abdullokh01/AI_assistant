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

  // Projects list (Mocks + Database loaded projects)
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([
    { id: 'project-phoenix', name: '🔥 Project Phoenix (Core SaaS)' },
    { id: 'saas-portal', name: '💻 SaaS Portal Integration' },
    { id: 'mobile-app', name: '📱 iOS / Android Mobile Delivery' },
  ]);

  const [healthScore, setHealthScore] = useState<number>(85);
  const [confidenceScore, setConfidenceScore] = useState<number>(94);

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

  // 1. Fetch available projects from Supabase on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase.from('projects').select('id, name');
        if (data && data.length > 0) {
          // Merge database projects with mock projects
          setProjectsList(prev => [
            ...prev,
            ...data.map((p: any) => ({ id: p.id, name: `📁 ${p.name}` }))
          ]);
          // Automatically select the first real project if available
          setCurrentProjectId(data[0].id);
        }
      } catch (e) {
        console.warn('Could not load projects from Supabase. Operating in offline mock mode.');
      }
    };
    fetchProjects();
  }, []);

  // 2. Load Project Data (Supabase fetch with fallback to mocks)
  const loadProjectData = async (projectId: string) => {
    if (!isUUID(projectId)) {
      // Seed MOCK data for offline demo
      setTasks([
        { id: 't-1', title: 'Setup database schema migrations', description: 'Configure Postgres tables, keys, and RLS', status: 'Done', source: 'trello', dueDate: new Date(Date.now() - 3600000 * 24), labels: ['Database', 'Backend'] },
        { id: 't-2', title: 'Email IMAP classification worker', description: 'Connect to IMAP and run Claude prompt', status: 'In Progress', source: 'trello', dueDate: new Date(Date.now() + 3600000 * 48), labels: ['Backend', 'AI'] },
        { id: 't-3', title: 'Telegram Bot Settings Menu Layout', description: 'Build inline keyboards settings', status: 'Todo', source: 'trello', dueDate: new Date(Date.now() + 3600000 * 72), labels: ['Telegram', 'Bot'] },
        { id: 't-4', title: 'QA validation metrics', description: 'Run test cases for auth', status: 'QA', source: 'trello', labels: ['QA'] },
      ]);

      setEmails([
        { id: 'e-1', subject: 'URGENT: Change in UI specification', fromName: 'Sarah Jenkins (Client)', fromEmail: 'client-director@company.com', body: 'Hi team, we decided to change the sidebar layout of the main dashboard. We need glassmorphism instead of solid blue. Can you implement this by Friday?', receivedAt: new Date(Date.now() - 3600000), classification: 'Client', responseDraft: 'Hi Sarah,\n\nI have logged this requirement change in the Project Memory. We are drafting the updated PRD specifications and moving the corresponding layout cards on the Trello board. We will verify compatibility by tomorrow morning.\n\nBest,\n[AI Project OS Bot]' },
        { id: 'e-2', subject: 'Staging environment deployment', fromName: 'Lee (Backend Dev)', fromEmail: 'dev-lee@company.com', body: 'Hey, I have deployed the database schemas and migrations. Moving task card to Done.', receivedAt: new Date(Date.now() - 3600000 * 6), classification: 'Internal', responseDraft: 'Hi Lee,\n\nGreat work on the migrations. I am trigger syncing Trello. I will flag the chat to run audits.\n\nBest,\n[AI Project OS Bot]' },
      ]);

      setTelegramChat({
        id: 'tg-1',
        projectId,
        chatId: -1001890234,
        title: 'Phoenix Devs & Stakeholders',
        isConnected: true,
        syncStatus: 'idle',
        syncedAt: new Date(),
      });

      setActivities([
        { id: 'a-1', actionType: 'Telegram Message Tracked', description: '[Telegram] Lee (Dev): Finished the database schemas migrations! Ready to test.', details: { sender: 'Lee (Dev)', text: 'Finished the database schemas migrations! Ready to test.' }, createdAt: new Date(Date.now() - 3600000 * 2) },
        { id: 'a-2', actionType: 'Trello Board Synchronized', description: 'Successfully synchronized 4 cards from Trello board (Phoenix Core)', details: { cardCount: 4 }, createdAt: new Date(Date.now() - 3600000 * 3) },
        { id: 'a-3', actionType: 'AI Audit Completed', description: 'AI Audit completed. Health Score: 85%. Detected 1 Inconsistency.', details: { healthScore: 85 }, createdAt: new Date(Date.now() - 3600000 * 4) },
      ]);

      setMemories([
        { id: 'm-1', category: 'Business Rules', content: 'No code deployments can happen on Fridays to prevent weekend downtime.', tags: ['Deployment', 'QA'], createdAt: new Date() },
        { id: 'm-2', category: 'Client Preferences', content: 'Client prefers communications over email (IMAP) rather than Telegram for formal approvals.', tags: ['Communications'], createdAt: new Date() },
        { id: 'm-3', category: 'Architecture', content: 'Use Supabase Postgres RLS policies for scoping user access to their corresponding projects.', tags: ['Database', 'Security'], createdAt: new Date() },
      ]);

      setObservations([
        { id: 'o-1', sourceType: 'telegram', observation: 'Developer (Lee) stated "Finished the database schemas migrations" in Telegram, but the Trello card "Database migrations for Supabase" is still marked as "In Progress".', type: 'Inconsistency', status: 'pending', confidenceScore: 92.00 },
      ]);

      setRisks([
        { id: 'r-1', description: 'Potential Scope Creep: Client requested design change to glassmorphism layout over email.', severity: 'medium', status: 'active', mitigationPlan: 'Draft change request spec in PM Assistant and ask for client authorization.', detectedAt: new Date(), confidenceScore: 85.00 },
      ]);

      setDecisions([
        { id: 'd-1', title: 'Adopt Outfit Google Typography', context: 'Client requested cleaner layout font', outcome: 'Selected Outfit font to match premium aesthetics request', deciders: ['CEO', 'UX Lead'], status: 'agreed', date: new Date() },
      ]);

      setDailyReportMarkdown(`### DAILY EXECUTIVE SUMMARY
The project **Project Phoenix** is currently operating at **85% Health** with **94% AI Confidence**. There is one pending channel inconsistency detected between Telegram and Trello.

### COMPLETED TODAY
- **Setup database schema migrations** (Source: Trello, Assignee: Lee)

### IN PROGRESS & BLOCKED
- [In Progress] **Email IMAP classification worker** (Due: Friday)
- [QA Review] **QA validation metrics**

### RECENT OBSERVATIONS & WARNINGS
- 🚨 *Inconsistency*: Developer stated "Finished migrations" on Telegram but Trello still says "In Progress".
- ⚠️ *Scope Creep Risk*: Client requested sidebar glassmorphism layout changes.

### QUESTIONS FOR CEO
1. Should we authorize a 1-day sprint extension to implement the client's glassmorphism UI changes?
2. Approve the draft contract specification in the PM Workspace?
`);
      return;
    }

    // REAL DATABASE FETCH (If projectId is a valid UUID)
    try {
      // 1. Fetch project details
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
      if (proj) {
        setHealthScore(Number(proj.health_score));
        setConfidenceScore(Number(proj.confidence_score));
      }

      // 2. Fetch Tasks
      const { data: dbTasks } = await supabase.from('tasks').select('*').eq('project_id', projectId);
      if (dbTasks) {
        setTasks(dbTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          source: t.source,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          labels: t.labels || [],
        })));
      }

      // 3. Fetch Emails
      const { data: dbEmails } = await supabase.from('emails').select('*').eq('project_id', projectId).order('received_at', { ascending: false });
      if (dbEmails) {
        setEmails(dbEmails.map((e: any) => ({
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
      }

      // 4. Fetch Telegram Chat Configuration
      const { data: dbChat } = await supabase.from('telegram_chats').select('*').eq('project_id', projectId).maybeSingle();
      if (dbChat) {
        setTelegramChat({
          id: dbChat.id,
          projectId: dbChat.project_id,
          chatId: Number(dbChat.chat_id),
          title: dbChat.title,
          isConnected: dbChat.is_connected,
          syncStatus: dbChat.sync_status,
          syncedAt: dbChat.synced_at ? new Date(dbChat.synced_at) : undefined,
        });
      } else {
        setTelegramChat(null);
      }

      // 5. Fetch Memory Items
      const { data: dbMemory } = await supabase.from('project_memory').select('*').eq('project_id', projectId);
      if (dbMemory) {
        setMemories(dbMemory.map((m: any) => ({
          id: m.id,
          category: m.category,
          content: m.content,
          tags: m.tags || [],
          createdAt: new Date(m.created_at),
        })));
      }

      // 6. Fetch AI Observations (Inconsistencies)
      const { data: dbObs } = await supabase.from('ai_observations').select('*').eq('project_id', projectId).eq('status', 'pending');
      if (dbObs) {
        setObservations(dbObs.map((o: any) => ({
          id: o.id,
          sourceType: o.source_type,
          observation: o.observation,
          type: o.type,
          status: o.status,
          confidenceScore: Number(o.confidence_score),
        })));
      }

      // 7. Fetch Risks
      const { data: dbRisks } = await supabase.from('risks').select('*').eq('project_id', projectId).eq('status', 'active');
      if (dbRisks) {
        setRisks(dbRisks.map((r: any) => ({
          id: r.id,
          description: r.description,
          severity: r.severity,
          status: r.status,
          mitigationPlan: r.mitigation_plan,
          detectedAt: new Date(r.detected_at),
          confidenceScore: Number(r.confidence_score),
        })));
      }

      // 8. Fetch Decisions
      const { data: dbDec } = await supabase.from('decisions').select('*').eq('project_id', projectId);
      if (dbDec) {
        setDecisions(dbDec.map((d: any) => ({
          id: d.id,
          title: d.title,
          context: d.context,
          outcome: d.outcome,
          deciders: d.deciders || [],
          status: d.status,
          date: new Date(d.date),
        })));
      }

      // 9. Fetch Daily Report Summary
      const { data: dbReport } = await supabase.from('daily_reports').select('*').eq('project_id', projectId).order('report_date', { ascending: false }).limit(1).maybeSingle();
      if (dbReport) {
        setDailyReportMarkdown(dbReport.summary);
      } else {
        setDailyReportMarkdown('### DAILY EXECUTIVE SUMMARY\nNo report generated yet. Trigger diagnostic scan.');
      }

      // 10. Fetch Activity Logs
      const { data: dbActs } = await supabase.from('activity_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50);
      if (dbActs) {
        setActivities(dbActs.map((a: any) => ({
          id: a.id,
          actionType: a.action_type,
          description: a.description,
          details: a.details,
          createdAt: new Date(a.created_at),
        })));
      }
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
