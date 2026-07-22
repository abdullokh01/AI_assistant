// Core Domain Types - AI Project Intelligence Platform
// Path: src/lib/core/domain/types.ts

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'active' | 'archived' | 'paused';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  healthScore: number;
  confidenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
}

export interface TelegramChat {
  id: string;
  projectId: string;
  chatId: number;
  title: string;
  isConnected: boolean;
  settings: Record<string, any>;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailClassification = 'Important' | 'Client' | 'Internal' | 'Waiting Reply' | 'Need Action';

export interface Email {
  id: string;
  projectId: string;
  messageId: string;
  threadId?: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string[];
  subject?: string;
  body?: string;
  receivedAt: Date;
  classification?: EmailClassification;
  responseDraft?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrelloBoard {
  id: string;
  projectId: string;
  trelloBoardId: string;
  name: string;
  url?: string;
  listMappings: Record<string, TaskStatus>;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'QA' | 'Done' | 'Blocked';
export type TaskSource = 'manual' | 'trello' | 'telegram' | 'email';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  source: TaskSource;
  sourceId?: string;
  assigneeId?: string;
  dueDate?: Date;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type MemoryCategory = 
  | 'Business Rules' 
  | 'Architecture' 
  | 'Requirements' 
  | 'Decisions' 
  | 'Known Issues' 
  | 'Stakeholders' 
  | 'Glossary' 
  | 'Sprint History' 
  | 'Client Preferences';

export interface ProjectMemory {
  id: string;
  projectId: string;
  category: MemoryCategory;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type DecisionStatus = 'proposed' | 'agreed' | 'superseded' | 'rejected';

export interface Decision {
  id: string;
  projectId: string;
  title: string;
  context?: string;
  outcome: string;
  deciders: string[];
  status: DecisionStatus;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'active' | 'mitigated' | 'triggered' | 'closed';

export interface Risk {
  id: string;
  projectId: string;
  description: string;
  severity: RiskSeverity;
  status: RiskStatus;
  mitigationPlan?: string;
  detectedAt: Date;
  confidenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenQuestion {
  id: string;
  projectId: string;
  question: string;
  raisedBy?: string;
  answeredBy?: string;
  answer?: string;
  status: 'Open' | 'Answered';
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  date: Date;
  notes?: string;
  transcript?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ObservationType = 
  | 'Inconsistency' 
  | 'Risk' 
  | 'Deadliness' 
  | 'Inactivity' 
  | 'Duplicate' 
  | 'Scope Creep' 
  | 'Communication Problems';

export interface AIObservation {
  id: string;
  projectId: string;
  sourceType: 'telegram' | 'trello' | 'email' | 'meeting' | 'general';
  sourceId?: string;
  observation: string;
  type: ObservationType;
  status: 'pending' | 'resolved' | 'ignored';
  confidenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIFeedback {
  id: string;
  projectId: string;
  userId?: string;
  query?: string;
  feedbackText: string;
  rating: number; // 1 to 5
  createdAt: Date;
}

export interface Notification {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  message: string;
  type: 'inconsistency' | 'risk' | 'task' | 'report' | 'general';
  isRead: boolean;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  projectId: string;
  taskId?: string;
  triggerAt: Date;
  message: string;
  type: 'Planning' | 'Follow-up' | 'Deadline' | 'Waiting' | 'Meeting' | 'Custom';
  status: 'Pending' | 'Sent' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningLesson {
  id: string;
  topic: 'Project Management' | 'Leadership' | 'Negotiation' | 'AI' | 'Software Architecture' | 'System Design' | 'Product Thinking' | 'CEO Thinking';
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  createdAt: Date;
}

export type DocumentType = 
  | 'PRD' 
  | 'SRS' 
  | 'TechSpec' 
  | 'MeetingMinutes' 
  | 'Proposal' 
  | 'CommercialOffer' 
  | 'Contract' 
  | 'SprintPlan' 
  | 'UserStories' 
  | 'AcceptanceCriteria' 
  | 'ReleaseNotes' 
  | 'TestCases' 
  | 'BugReports' 
  | 'ChangeRequests';

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: DocumentType;
  status: 'draft' | 'final' | 'archived';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedDocument {
  id: string;
  documentId: string;
  generationPrompt?: string;
  content: string;
  version: number;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId?: string;
  actionType: string;
  description: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface EventLog {
  id: string;
  projectId: string;
  eventName: string;
  eventData: Record<string, any>;
  createdAt: Date;
}

export interface ProjectSettings {
  id: string;
  projectId: string;
  key: string;
  value: Record<string, any>;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  projectId: string;
  type: 'telegram' | 'email' | 'trello';
  credentials: Record<string, any>;
  isActive: boolean;
  updatedAt: Date;
}

export interface DailyReport {
  id: string;
  projectId: string;
  summary: string;
  completedTasks: any[];
  inProgressTasks: any[];
  blockedTasks: any[];
  risks: any[];
  waitingItems: any[];
  decisions: any[];
  priorities: any[];
  questionsForCeo: any[];
  healthScore: number;
  confidenceScore: number;
  reportDate: string; // YYYY-MM-DD
  createdAt: Date;
}

export interface WeeklyReport {
  id: string;
  projectId: string;
  summary: string;
  accomplishments: any[];
  roadblocks: any[];
  nextWeekPlan: any[];
  healthTrend: any[];
  reportDate: string; // YYYY-MM-DD
  createdAt: Date;
}
