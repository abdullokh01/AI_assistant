// Claude AI Service - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/claude.ts

import Anthropic from '@anthropic-ai/sdk';
import { Project, Task, Email, ProjectMemory, Risk, Decision, AIObservation, ActivityLog, OpenQuestion } from '../domain/types';

const anthropicKey = process.env.ANTHROPIC_API_KEY || '';

// Fallback simulator helper when ANTHROPIC_API_KEY is not defined
const isSimulationMode = !anthropicKey;

export class ClaudeService {
  private client: Anthropic | null = null;

  constructor() {
    if (!isSimulationMode) {
      this.client = new Anthropic({ apiKey: anthropicKey });
    } else {
      console.warn('Anthropic API Key is missing. ClaudeService will operate in Simulation Mode.');
    }
  }

  private async callClaude(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
    if (isSimulationMode || !this.client) {
      throw new Error('Claude SDK not initialized (Simulation Mode)');
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.1, // Low temp for structured outputs
      });

      const block = response.content[0];
      if (block.type === 'text') {
        return block.text;
      }
      return '';
    } catch (e: any) {
      console.error('Claude API Error:', e);
      throw e;
    }
  }

  // Parse JSON enclosed in ```json ... ``` blocks
  private parseJSONFromResponse(text: string): any {
    try {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/{[\s\S]*}/);
      const raw = match ? match[1] || match[0] : text;
      return JSON.parse(raw.trim());
    } catch (e) {
      console.error('Failed to parse JSON from Claude response:', text, e);
      throw new Error('AI output was not in a valid JSON format');
    }
  }

  // 1. EMAIL CLASSIFICATION & DRAFT GENERATION
  async classifyAndDraftEmail(
    emailSubject: string,
    emailBody: string,
    emailFrom: string,
    projectContext: string
  ): Promise<{ classification: Email['classification']; draftReply: string }> {
    if (isSimulationMode) {
      // Return mock data for local testing
      const isImportant = emailSubject.toLowerCase().includes('urgent') || emailSubject.toLowerCase().includes('important');
      const isClient = emailFrom.includes('client') || emailSubject.toLowerCase().includes('client');
      
      let classification: Email['classification'] = 'Internal';
      if (isImportant) classification = 'Important';
      else if (isClient) classification = 'Client';
      else if (emailBody.toLowerCase().includes('waiting')) classification = 'Waiting Reply';
      else if (emailBody.toLowerCase().includes('action') || emailBody.toLowerCase().includes('please')) classification = 'Need Action';

      const draftReply = `Hi there,\n\nThank you for reaching out. We have received your email regarding "${emailSubject}" and are reviewing it with the team. We will get back to you shortly.\n\nBest regards,\n[AI Project OS Draft]`;
      return { classification, draftReply };
    }

    const systemPrompt = `You are a Senior Project Manager and Inbox Assistant. Your task is to analyze an incoming email, classify it, and write a professional draft reply.
You must output a JSON object containing the fields:
"classification": string (must be one of: "Important", "Client", "Internal", "Waiting Reply", "Need Action")
"draftReply": string (a professional, context-appropriate reply draft)

Respond ONLY with the JSON object. Do not include markdown notes.`;

    const userPrompt = `Project Context:
${projectContext}

Incoming Email:
From: ${emailFrom}
Subject: ${emailSubject}
Body:
${emailBody}

Please classify this email and draft a suitable response.`;

    try {
      const responseText = await this.callClaude(systemPrompt, userPrompt);
      return this.parseJSONFromResponse(responseText);
    } catch {
      return {
        classification: 'Need Action',
        draftReply: 'Hi, thank you for your email. We are reviewing this details and will revert shortly.'
      };
    }
  }

  // 2. INTELLIGENCE ENGINE RUN (AUDITS, RISKS, INCONSISTENCIES)
  async runIntelligenceAudit(
    project: Project,
    tasks: Task[],
    emails: Email[],
    chatMessages: { sender: string; text: string; date: Date }[],
    memories: ProjectMemory[]
  ): Promise<{
    healthScore: number;
    confidenceScore: number;
    observations: Omit<AIObservation, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
    detectedRisks: Omit<Risk, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
    decisions: Omit<Decision, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
  }> {
    if (isSimulationMode) {
      // Simulate checking for inconsistencies
      const observations: any[] = [];
      const detectedRisks: any[] = [];
      const decisions: any[] = [];

      // Check if developer said finished but Trello status is not done
      const finishedChats = chatMessages.filter(m => m.text.toLowerCase().includes('finished') || m.text.toLowerCase().includes('done'));
      const inProgressTrelloTasks = tasks.filter(t => t.source === 'trello' && t.status !== 'Done');

      if (finishedChats.length > 0 && inProgressTrelloTasks.length > 0) {
        observations.push({
          sourceType: 'telegram',
          sourceId: 'chat_msg_inconsistency',
          observation: `Developer said "${finishedChats[0].text}" but Trello card "${inProgressTrelloTasks[0].title}" is still marked as "${inProgressTrelloTasks[0].status}".`,
          type: 'Inconsistency',
          status: 'pending',
          confidenceScore: 92.00,
        });
      }

      // Check for scope creep or deadlines
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done');
      if (overdueTasks.length > 0) {
        detectedRisks.push({
          description: `Project has ${overdueTasks.length} overdue tasks including "${overdueTasks[0].title}".`,
          severity: 'high',
          status: 'active',
          mitigationPlan: 'Re-assign tasks or adjust sprint timelines in coordination with the client.',
          detectedAt: new Date(),
          confidenceScore: 95.00,
        });
      }

      return {
        healthScore: Math.max(0, 100 - (observations.length * 15) - (detectedRisks.length * 20)),
        confidenceScore: 88.50,
        observations,
        detectedRisks,
        decisions,
      };
    }

    const systemPrompt = `You are the AI Operating System and Delivery Director. Analyze the project history and state to detect risks, contradictions/inconsistencies (e.g. developer says finished but Trello says In Progress), duplicate discussions, scope creep, and high risk decisions.
Calculate an overall project health score (0-100) and AI confidence score (0-100).
Output a JSON object containing:
- "healthScore": number
- "confidenceScore": number
- "observations": Array of objects:
    - "sourceType": "telegram" | "trello" | "email" | "meeting" | "general"
    - "sourceId": string
    - "observation": string (detailed description)
    - "type": "Inconsistency" | "Risk" | "Deadliness" | "Inactivity" | "Duplicate" | "Scope Creep" | "Communication Problems"
    - "status": "pending"
    - "confidenceScore": number
- "detectedRisks": Array of objects:
    - "description": string
    - "severity": "low" | "medium" | "high" | "critical"
    - "status": "active"
    - "mitigationPlan": string
    - "detectedAt": ISO String
    - "confidenceScore": number
- "decisions": Array of objects:
    - "title": string
    - "context": string
    - "outcome": string
    - "deciders": string[]
    - "status": "proposed" | "agreed"
    - "date": ISO String

Format response strictly as JSON.`;

    const userPrompt = `Project: ${project.name}
Description: ${project.description || 'N/A'}

Tasks:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, status: t.status, source: t.source, sourceId: t.sourceId, due: t.dueDate })))}

Emails:
${JSON.stringify(emails.map(e => ({ from: e.fromEmail, subject: e.subject, date: e.receivedAt, classification: e.classification })))}

Telegram Chat Feed:
${JSON.stringify(chatMessages)}

Project Memories / Rules:
${JSON.stringify(memories.map(m => ({ category: m.category, content: m.content })))}

Perform a deep audit.`;

    try {
      const responseText = await this.callClaude(systemPrompt, userPrompt, 3000);
      return this.parseJSONFromResponse(responseText);
    } catch (e) {
      console.error('Claude Intelligence Engine Audit failed:', e);
      return {
        healthScore: 80,
        confidenceScore: 70,
        observations: [],
        detectedRisks: [],
        decisions: [],
      };
    }
  }

  // 3. DAILY EXECUTIVE REPORT GENERATOR
  async generateDailyReport(
    project: Project,
    completedTasks: Task[],
    inProgressTasks: Task[],
    blockedTasks: Task[],
    activeRisks: Risk[],
    decisions: Decision[],
    activities: ActivityLog[],
    recentEmails: Email[],
    openQuestions: OpenQuestion[],
    healthScore: number,
    confidenceScore: number
  ): Promise<string> {
    if (isSimulationMode) {
      return `### DAILY EXECUTIVE SUMMARY
The project "${project.name}" remains on track with a health score of **${healthScore}%**. Today we resolved critical blockers and processed communications across Trello and Telegram.

### COMPLETED TODAY
${completedTasks.map(t => `- **${t.title}** (Assignee: ${t.assigneeId || 'Unassigned'})`).join('\n') || '- None'}

### IN PROGRESS & BLOCKED
${inProgressTasks.map(t => `- [In Progress] **${t.title}**`).join('\n') || '- None'}
${blockedTasks.map(t => `- [BLOCKED] **${t.title}**`).join('\n') || '- None'}

### RISKS DETECTED
${activeRisks.map(r => `- [${r.severity.toUpperCase()}] ${r.description} (Mitigation: ${r.mitigationPlan})`).join('\n') || '- None'}

### CEO QUESTIONS & TOMORROW PRIORITIES
1. Confirm if client has approved the PRD changes?
2. Priorities: Finalize database migration and deploy staging.
`;
    }

    const systemPrompt = `You are a Senior Product Manager and Delivery Director. Generate a Daily Executive Report in markdown format. It must look premium, concise, and professional, and be directed at the CEO.
Structure should include:
- Executive Summary (1 paragraph, including Health & Confidence Score explanations)
- Completed Today (list)
- In Progress & Blocked Tasks (list)
- Risks & Waiting Items (list)
- Important Decisions (list)
- Tomorrow Priorities (list)
- Questions for CEO (list)

Format strictly in Markdown.`;

    const userPrompt = `Project: ${project.name}
Health Score: ${healthScore}
Confidence Score: ${confidenceScore}

Completed Tasks: ${JSON.stringify(completedTasks.map(t => t.title))}
In Progress Tasks: ${JSON.stringify(inProgressTasks.map(t => t.title))}
Blocked Tasks: ${JSON.stringify(blockedTasks.map(t => t.title))}
Active Risks: ${JSON.stringify(activeRisks.map(r => r.description))}
Decisions Made: ${JSON.stringify(decisions.map(d => d.title))}
Emails Received: ${JSON.stringify(recentEmails.map(e => e.subject))}
Open Questions: ${JSON.stringify(openQuestions.map(q => q.question))}
Recent Activities: ${JSON.stringify(activities.map(a => a.description))}`;

    try {
      return await this.callClaude(systemPrompt, userPrompt, 2500);
    } catch (e) {
      return 'Error generating daily executive report.';
    }
  }

  // 4. PM ASSISTANT (DOCUMENT GENERATOR)
  async generatePMDocument(
    docType: string,
    title: string,
    promptInstruction: string,
    projectContext: string,
    memories: ProjectMemory[]
  ): Promise<string> {
    if (isSimulationMode) {
      return `# ${title}
## Document Type: ${docType}
Generated on: ${new Date().toLocaleDateString()}

### 1. Executive Summary
This document outlines the ${docType} specifications for the project, incorporating business rules and client preferences.

### 2. Functional Requirements
- Requirement 1: User authentication via Supabase Auth
- Requirement 2: Real-time dashboard view with health score and notifications
- Requirement 3: Automated integrations with Trello cards and Telegram bot

### 3. Business Rules (from Memory)
${memories.map(m => `- ${m.content}`).join('\n') || '- Standard Agile engineering delivery rules apply.'}
`;
    }

    const systemPrompt = `You are a Principal Product Manager, Senior Business Analyst, and Technical Writer. Generate a professional, comprehensive, production-grade document in Markdown based on the requested document type (PRD, SRS, Technical Spec, User Stories, Proposal, Contract, Sprint Plan, Release Notes, etc.).
Ensure it uses standard industry templates, is highly thorough, and leaves no placeholders. 
Incorporate existing project memory rules, requirements, and architecture patterns.`;

    const userPrompt = `Document Type: ${docType}
Title: ${title}
Instructions/Scope: ${promptInstruction}

Project Context:
${projectContext}

Project Memories / Rules:
${JSON.stringify(memories.map(m => ({ category: m.category, content: m.content })))}`;

    try {
      return await this.callClaude(systemPrompt, userPrompt, 4000);
    } catch (e) {
      return 'Error generating PM document.';
    }
  }

  // 5. LEARNING AGENT (15-MIN DAILY LESSON)
  async generateDailyLesson(
    topic: string,
    date: string,
    activities: ActivityLog[],
    risks: Risk[]
  ): Promise<{ title: string; content: string; durationMinutes: number }> {
    if (isSimulationMode) {
      return {
        title: `Dynamic Negotiation in Project Crises (${topic})`,
        content: `### Lesson Introduction
Negotiation is not just about pricing; it's about scope, resources, and alignment. Today's lesson covers system engineering negotiation.

### Core Concepts
1. **BATNA** (Best Alternative to a Negotiated Agreement).
2. **Value Creation vs. Value Claiming**.
3. **Addressing Project Blockers**: In project engineering, when a developer flags a blocker, negotiate scope rather than deadlines to maintain trust.

### Actionable Steps
- Step 1: Identify key bottlenecks early.
- Step 2: Establish a communication protocol.
- Step 3: Negotiate small deliverables.
`,
        durationMinutes: 15,
      };
    }

    const systemPrompt = `You are a Business School Dean, Senior Executive Coach, and Leadership Expert. 
Your goal is to write a highly engaging, actionable 15-minute lesson for the CEO on the topic of "${topic}".
Use recent project activities and risks as practical context so the lesson addresses real issues currently faced in the project.
Output a JSON object containing:
"title": string (engaging title)
"content": string (detailed lesson in Markdown format, with sections like Introduction, Core Concepts, Real-World Application to current project, and Actionable Steps)
"durationMinutes": number (default: 15)

Respond ONLY with JSON.`;

    const userPrompt = `Topic: ${topic}
Date: ${date}

Recent Project Activities:
${JSON.stringify(activities.slice(0, 10).map(a => a.description))}

Current Project Risks:
${JSON.stringify(risks.slice(0, 5).map(r => r.description))}`;

    try {
      const responseText = await this.callClaude(systemPrompt, userPrompt, 2500);
      return this.parseJSONFromResponse(responseText);
    } catch (e) {
      return {
        title: `Mastering Leadership under ${topic}`,
        content: `### Lesson Overview\nNegotiation and leadership are core pillars for any CEO. Adapt to project risks quickly and communicate transparently.`,
        durationMinutes: 15,
      };
    }
  }
}
