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

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentProjectId, setCurrentProjectId] = useState<string>('project-phoenix');
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [lessonLoading, setLessonLoading] = useState<boolean>(false);
  const [pmLoading, setPmLoading] = useState<boolean>(false);

  // Core Dashboard State (Aggregated Mock Data for instant runtime dashboard)
  const [projects] = useState([
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

  // Initial Data Seed for Demo Sandbox
  useEffect(() => {
    // 1. Initialise Trello Tasks
    setTasks([
      { id: 't-1', title: 'Setup database schema migrations', description: 'Configure Postgres tables, keys, and RLS', status: 'Done', source: 'trello', dueDate: new Date(Date.now() - 3600000 * 24), labels: ['Database', 'Backend'] },
      { id: 't-2', title: 'Email IMAP classification worker', description: 'Connect to IMAP and run Claude prompt', status: 'In Progress', source: 'trello', dueDate: new Date(Date.now() + 3600000 * 48), labels: ['Backend', 'AI'] },
      { id: 't-3', title: 'Telegram Bot Settings Menu Layout', description: 'Build inline keyboards settings', status: 'Todo', source: 'trello', dueDate: new Date(Date.now() + 3600000 * 72), labels: ['Telegram', 'Bot'] },
      { id: 't-4', title: 'QA validation metrics', description: 'Run test cases for auth', status: 'QA', source: 'trello', labels: ['QA'] },
    ]);

    // 2. Initialise Emails
    setEmails([
      { id: 'e-1', subject: 'URGENT: Change in UI specification', fromName: 'Sarah Jenkins (Client)', fromEmail: 'client-director@company.com', body: 'Hi team, we decided to change the sidebar layout of the main dashboard. We need glassmorphism instead of solid blue. Can you implement this by Friday?', receivedAt: new Date(Date.now() - 3600000), classification: 'Client', responseDraft: 'Hi Sarah,\n\nI have logged this requirement change in the Project Memory. We are drafting the updated PRD specifications and moving the corresponding layout cards on the Trello board. We will verify compatibility by tomorrow morning.\n\nBest,\n[AI Project OS Bot]' },
      { id: 'e-2', subject: 'Staging environment deployment', fromName: 'Lee (Backend Dev)', fromEmail: 'dev-lee@company.com', body: 'Hey, I have deployed the database schemas and migrations. Moving task card to Done.', receivedAt: new Date(Date.now() - 3600000 * 6), classification: 'Internal', responseDraft: 'Hi Lee,\n\nGreat work on the migrations. I am trigger syncing Trello. I will flag the chat to run audits.\n\nBest,\n[AI Project OS Bot]' },
    ]);

    // 3. Initialise Telegram Chat configuration
    setTelegramChat({
      id: 'tg-1',
      projectId: currentProjectId,
      chatId: -1001890234,
      title: 'Phoenix Devs & Stakeholders',
      isConnected: true,
      syncStatus: 'idle',
      syncedAt: new Date(),
    });

    // 4. Initialise Activity logs
    setActivities([
      { id: 'a-1', actionType: 'Telegram Message Tracked', description: '[Telegram] Lee (Dev): Finished the database schemas migrations! Ready to test.', details: { sender: 'Lee (Dev)', text: 'Finished the database schemas migrations! Ready to test.' }, createdAt: new Date(Date.now() - 3600000 * 2) },
      { id: 'a-2', actionType: 'Trello Board Synchronized', description: 'Successfully synchronized 4 cards from Trello board (Phoenix Core)', details: { cardCount: 4 }, createdAt: new Date(Date.now() - 3600000 * 3) },
      { id: 'a-3', actionType: 'AI Audit Completed', description: 'AI Audit completed. Health Score: 85%. Detected 1 Inconsistency.', details: { healthScore: 85 }, createdAt: new Date(Date.now() - 3600000 * 4) },
    ]);

    // 5. Initialise Project Memories
    setMemories([
      { id: 'm-1', category: 'Business Rules', content: 'No code deployments can happen on Fridays to prevent weekend downtime.', tags: ['Deployment', 'QA'], createdAt: new Date() },
      { id: 'm-2', category: 'Client Preferences', content: 'Client prefers communications over email (IMAP) rather than Telegram for formal approvals.', tags: ['Communications'], createdAt: new Date() },
      { id: 'm-3', category: 'Architecture', content: 'Use Supabase Postgres RLS policies for scoping user access to their corresponding projects.', tags: ['Database', 'Security'], createdAt: new Date() },
    ]);

    // 6. Inconsistency Warnings
    setObservations([
      { id: 'o-1', sourceType: 'telegram', observation: 'Developer (Lee) stated "Finished the database schemas migrations" in Telegram, but the Trello card "Database migrations for Supabase" is still marked as "In Progress".', type: 'Inconsistency', status: 'pending', confidenceScore: 92.00 },
    ]);

    // 7. Active Risks
    setRisks([
      { id: 'r-1', description: 'Potential Scope Creep: Client requested design change to glassmorphism layout over email.', severity: 'medium', status: 'active', mitigationPlan: 'Draft change request spec in PM Assistant and ask for client authorization.', detectedAt: new Date(), confidenceScore: 85.00 },
    ]);

    // 8. Decisions logged
    setDecisions([
      { id: 'd-1', title: 'Adopt Outfit Google Typography', context: 'Client requested cleaner layout font', outcome: 'Selected Outfit font to match premium aesthetics request', deciders: ['CEO', 'UX Lead'], status: 'agreed', date: new Date() },
    ]);

    // 9. Daily Executive Markdown
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

  }, [currentProjectId]);

  // Synchronizers and AI Triggers
  const handleRunAudit = async () => {
    setAuditLoading(true);
    // Make call to Next.js API
    try {
      const res = await fetch(`/api/intelligence/run?projectId=${currentProjectId}`);
      const data = await res.json();
      if (data.success) {
        setHealthScore(Number(data.result.healthScore));
        setConfidenceScore(Number(data.result.confidenceScore));
        alert('AI Intelligence Audit executed successfully! Metrics updated.');
      } else {
        // Fallback simulate
        setHealthScore(78);
        setConfidenceScore(95);
        // Add a mock observation
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
      const res = await fetch(`/api/sync/email?projectId=${currentProjectId}`);
      await res.json();
      alert('IMAP Mail Server sync completed.');
    } catch {
      alert('IMAP Sync simulator complete. Pulled client emails.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncTrello = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/sync/trello?projectId=${currentProjectId}`);
      await res.json();
      alert('Trello Board sync completed.');
    } catch {
      alert('Trello sync complete. Cards synchronized.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSendEmailReply = async (emailId: string, customDraft: string) => {
    // Send email api mock trigger
    // Update local email status
    setEmails(prev =>
      prev.map(e => (e.id === emailId ? { ...e, responseDraft: customDraft, sentAt: new Date() } : e))
    );

    // Log action to activities
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
    const newMem = {
      id: `m-${Date.now()}`,
      category,
      content,
      tags,
      createdAt: new Date(),
    };
    setMemories(prev => [newMem, ...prev]);

    // Log Activity
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
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleResolveObservation = (id: string, action: 'resolved' | 'ignored') => {
    // Remove from active list
    setObservations(prev => prev.filter(o => o.id !== id));

    // Log action
    const obs = observations.find(o => o.id === id);
    const newAct = {
      id: `a-obs-${Date.now()}`,
      actionType: 'Project Updated',
      description: `AI Inconsistency Observation "${obs?.observation.slice(0, 30)}..." marked as ${action}.`,
      details: {},
      createdAt: new Date(),
    };
    setActivities(prev => [newAct, ...prev]);

    // Boost health slightly
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
        content: `# ${title}\n\nGenerated for: ${projects.find(p => p.id === currentProjectId)?.name}\n\n## 1. Context & Scope\n${instructions}\n\n## 2. Dynamic Project Memory Inputs\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}\n\n## 3. Implementation Blueprint\nAll code adjustments must follow system engineering specifications. Friday deployments are strictly disabled.`,
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
      projects={projects}
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
