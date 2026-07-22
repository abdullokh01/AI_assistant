// Repository Interfaces - AI Project Intelligence Platform
// Path: src/lib/core/domain/repositories.ts

import { 
  Project, Task, Email, TelegramChat, TrelloBoard, 
  ProjectMemory, Decision, Risk, OpenQuestion, 
  DailyReport, WeeklyReport, LearningLesson, 
  Document, ActivityLog, Integration, ProjectSettings 
} from './types';

export interface IProjectRepository {
  getById(id: string): Promise<Project | null>;
  listAll(userId: string): Promise<Project[]>;
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, ownerUserId: string): Promise<Project>;
  update(id: string, updates: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<boolean>;
  getHealthSummary(projectId: string): Promise<any>;
}

export interface ITaskRepository {
  getById(id: string): Promise<Task | null>;
  listByProject(projectId: string): Promise<Task[]>;
  save(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Task>;
  delete(id: string): Promise<boolean>;
  syncTrelloTasks(projectId: string, trelloCards: any[]): Promise<void>;
}

export interface IEmailRepository {
  getById(id: string): Promise<Email | null>;
  listByProject(projectId: string): Promise<Email[]>;
  getUnreadEmails(projectId: string): Promise<Email[]>;
  save(email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Email>;
  updateClassification(id: string, classification: Email['classification'], draftReply?: string): Promise<Email>;
}

export interface ITelegramRepository {
  getByChatId(chatId: number): Promise<TelegramChat | null>;
  getByProject(projectId: string): Promise<TelegramChat | null>;
  save(chat: Omit<TelegramChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TelegramChat>;
}

export interface ITrelloRepository {
  getByProject(projectId: string): Promise<TrelloBoard | null>;
  save(board: Omit<TrelloBoard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TrelloBoard>;
}

export interface IMemoryRepository {
  listByProject(projectId: string): Promise<ProjectMemory[]>;
  save(memory: Omit<ProjectMemory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ProjectMemory>;
  delete(id: string): Promise<boolean>;
  searchMemory(projectId: string, query: string): Promise<ProjectMemory[]>;
}

export interface IDecisionRepository {
  listByProject(projectId: string): Promise<Decision[]>;
  save(decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Decision>;
}

export interface IRiskRepository {
  listActive(projectId: string): Promise<Risk[]>;
  save(risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Risk>;
}

export interface IQuestionRepository {
  listOpen(projectId: string): Promise<OpenQuestion[]>;
  save(question: Omit<OpenQuestion, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<OpenQuestion>;
}

export interface IReportRepository {
  getDailyReport(projectId: string, date: string): Promise<DailyReport | null>;
  saveDailyReport(report: Omit<DailyReport, 'id' | 'createdAt'> & { id?: string }): Promise<DailyReport>;
  getWeeklyReport(projectId: string, date: string): Promise<WeeklyReport | null>;
  saveWeeklyReport(report: Omit<WeeklyReport, 'id' | 'createdAt'> & { id?: string }): Promise<WeeklyReport>;
  listDailyReports(projectId: string): Promise<DailyReport[]>;
  listWeeklyReports(projectId: string): Promise<WeeklyReport[]>;
}

export interface ILearningRepository {
  getLessonForDate(topic: string, date: string): Promise<LearningLesson | null>;
  saveLesson(lesson: Omit<LearningLesson, 'id' | 'createdAt'> & { id?: string }): Promise<LearningLesson>;
}

export interface IDocumentRepository {
  getById(id: string): Promise<Document | null>;
  listByProject(projectId: string): Promise<Document[]>;
  save(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Document>;
  saveGeneratedVersion(documentId: string, content: string, prompt?: string, version?: number): Promise<void>;
}

export interface IActivityRepository {
  log(projectId: string, actionType: string, description: string, details?: any, userId?: string): Promise<ActivityLog>;
  listRecent(projectId: string, limit?: number): Promise<ActivityLog[]>;
}

export interface IIntegrationRepository {
  getByProject(projectId: string): Promise<Integration[]>;
  getSpecific(projectId: string, type: 'telegram' | 'email' | 'trello'): Promise<Integration | null>;
  save(integration: Omit<Integration, 'id' | 'updatedAt'> & { id?: string }): Promise<Integration>;
}

export interface ISettingsRepository {
  get(projectId: string, key: string): Promise<ProjectSettings | null>;
  save(projectId: string, key: string, value: any): Promise<ProjectSettings>;
}
