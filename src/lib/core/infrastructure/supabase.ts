// Supabase Repositories Implementation - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/supabase.ts

import { supabaseAdmin } from '../../shared/supabase-client';
import { 
  IProjectRepository, ITaskRepository, IEmailRepository, 
  ITelegramRepository, ITrelloRepository, IMemoryRepository, 
  IDecisionRepository, IRiskRepository, IQuestionRepository, 
  IReportRepository, ILearningRepository, IDocumentRepository, 
  IActivityRepository, IIntegrationRepository, ISettingsRepository 
} from '../domain/repositories';
import { 
  Project, Task, Email, TelegramChat, TrelloBoard, 
  ProjectMemory, Decision, Risk, OpenQuestion, 
  DailyReport, WeeklyReport, LearningLesson, 
  Document, ActivityLog, Integration, ProjectSettings, TaskStatus 
} from '../domain/types';

// Helpers to map DB camelCase to snake_case and back if necessary
const mapProject = (db: any): Project => ({
  id: db.id,
  name: db.name,
  description: db.description,
  status: db.status,
  healthScore: Number(db.health_score),
  confidenceScore: Number(db.confidence_score),
  createdAt: new Date(db.created_at),
  updatedAt: new Date(db.updated_at),
});

const mapTask = (db: any): Task => ({
  id: db.id,
  projectId: db.project_id,
  title: db.title,
  description: db.description,
  status: db.status as TaskStatus,
  source: db.source,
  sourceId: db.source_id,
  assigneeId: db.assignee_id,
  dueDate: db.due_date ? new Date(db.due_date) : undefined,
  labels: db.labels || [],
  sourceUpdatedAt: db.source_updated_at ? new Date(db.source_updated_at) : undefined,
  createdAt: new Date(db.created_at),
  updatedAt: new Date(db.updated_at),
});

const mapEmail = (db: any): Email => ({
  id: db.id,
  projectId: db.project_id,
  messageId: db.message_id,
  threadId: db.thread_id,
  fromEmail: db.from_email,
  fromName: db.from_name,
  toEmail: db.to_email || [],
  subject: db.subject,
  body: db.body,
  receivedAt: new Date(db.received_at),
  classification: db.classification,
  responseDraft: db.response_draft,
  sentAt: db.sent_at ? new Date(db.sent_at) : undefined,
  createdAt: new Date(db.created_at),
  updatedAt: new Date(db.updated_at),
});

// Implementation of IProjectRepository
export class ProjectRepository implements IProjectRepository {
  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapProject(data);
  }

  async listAll(userId: string): Promise<Project[]> {
    // List all projects where user is a member
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('projects (*)')
      .eq('user_id', userId);
    
    if (error || !data) return [];
    return data.map((item: any) => mapProject(item.projects)).filter(Boolean);
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, ownerUserId: string): Promise<Project> {
    const { data: projData, error: projError } = await supabaseAdmin
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        status: project.status,
        health_score: project.healthScore,
        confidence_score: project.confidenceScore,
      })
      .select()
      .single();

    if (projError || !projData) {
      throw new Error(`Failed to create project: ${projError?.message}`);
    }

    // Insert owner relationship
    const { error: memberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: projData.id,
        user_id: ownerUserId,
        role: 'owner',
      });

    if (memberError) {
      throw new Error(`Failed to link owner to project: ${memberError.message}`);
    }

    return mapProject(projData);
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.healthScore !== undefined) dbUpdates.health_score = updates.healthScore;
    if (updates.confidenceScore !== undefined) dbUpdates.confidence_score = updates.confidenceScore;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update project: ${error?.message}`);
    }
    return mapProject(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);
    return !error;
  }

  async getHealthSummary(projectId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_health_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error || !data) return null;
    return {
      projectId: data.project_id,
      projectName: data.project_name,
      healthScore: Number(data.health_score),
      confidenceScore: Number(data.confidence_score),
      projectStatus: data.project_status,
      activeRisksCount: Number(data.active_risks_count),
      blockedTasksCount: Number(data.blocked_tasks_count),
      pendingInconsistenciesCount: Number(data.pending_inconsistencies_count),
      openQuestionsCount: Number(data.open_questions_count),
    };
  }
}

// Implementation of ITaskRepository
export class TaskRepository implements ITaskRepository {
  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapTask(data);
  }

  async listByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('project_id', projectId);
    if (error || !data) return [];
    return data.map(mapTask);
  }

  async save(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Task> {
    const dbTask: any = {
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      source: task.source,
      source_id: task.sourceId,
      assignee_id: task.assigneeId,
      due_date: task.dueDate?.toISOString(),
      labels: task.labels,
    };

    let query;
    if (task.id) {
      query = supabaseAdmin.from('tasks').update(dbTask).eq('id', task.id);
    } else {
      query = supabaseAdmin.from('tasks').insert(dbTask);
    }

    const { data, error } = await query.select().single();
    if (error || !data) {
      throw new Error(`Failed to save task: ${error?.message}`);
    }
    return mapTask(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
    return !error;
  }

  async syncTrelloTasks(projectId: string, trelloCards: any[]): Promise<void> {
    // Upsert tasks based on trello card ID
    for (const card of trelloCards) {
      const taskData = {
        project_id: projectId,
        title: card.name,
        description: card.desc,
        status: card.status as TaskStatus,
        source: 'trello' as const,
        source_id: card.id,
        due_date: card.due ? new Date(card.due).toISOString() : null,
        labels: card.labels?.map((l: any) => l.name) || [],
        // Trello's own last-change time. updated_at can't be used for this —
        // the handle_updated_at() trigger overwrites it with NOW() on every sync.
        source_updated_at: card.lastActivity
          ? new Date(card.lastActivity).toISOString()
          : null,
      };

      // Check if it already exists
      const { data: existing } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .eq('source', 'trello')
        .eq('source_id', card.id)
        .maybeSingle();

      const write = (payload: any) =>
        existing
          ? supabaseAdmin.from('tasks').update(payload).eq('id', existing.id)
          : supabaseAdmin.from('tasks').insert(payload);

      const { error } = await write(taskData);

      // Tolerate a database that hasn't run the source_updated_at migration yet:
      // sync the card without it rather than failing the whole run.
      if (error && /source_updated_at/.test(error.message)) {
        const { source_updated_at, ...withoutSourceUpdatedAt } = taskData;
        await write(withoutSourceUpdatedAt);
      }
    }
  }
}

// Implementation of IEmailRepository
export class EmailRepository implements IEmailRepository {
  async getById(id: string): Promise<Email | null> {
    const { data, error } = await supabaseAdmin.from('emails').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapEmail(data);
  }

  async listByProject(projectId: string): Promise<Email[]> {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .eq('project_id', projectId)
      .order('received_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapEmail);
  }

  async getUnreadEmails(projectId: string): Promise<Email[]> {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .eq('project_id', projectId)
      .is('sent_at', null)
      .order('received_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapEmail);
  }

  async save(email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Email> {
    const dbEmail: any = {
      project_id: email.projectId,
      message_id: email.messageId,
      thread_id: email.threadId,
      from_email: email.fromEmail,
      from_name: email.fromName,
      to_email: email.toEmail,
      subject: email.subject,
      body: email.body,
      received_at: email.receivedAt.toISOString(),
      classification: email.classification,
      response_draft: email.responseDraft,
      sent_at: email.sentAt?.toISOString(),
    };

    let query;
    if (email.id) {
      query = supabaseAdmin.from('emails').update(dbEmail).eq('id', email.id);
    } else {
      query = supabaseAdmin.from('emails').insert(dbEmail);
    }

    const { data, error } = await query.select().single();
    if (error || !data) {
      throw new Error(`Failed to save email: ${error?.message}`);
    }
    return mapEmail(data);
  }

  async updateClassification(id: string, classification: Email['classification'], draftReply?: string): Promise<Email> {
    const updates: any = { classification };
    if (draftReply !== undefined) {
      updates.response_draft = draftReply;
    }
    const { data, error } = await supabaseAdmin
      .from('emails')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update email classification: ${error?.message}`);
    }
    return mapEmail(data);
  }
}

// Implementation of ITelegramRepository
export class TelegramRepository implements ITelegramRepository {
  async getByChatId(chatId: number): Promise<TelegramChat | null> {
    const { data, error } = await supabaseAdmin
      .from('telegram_chats')
      .select('*')
      .eq('chat_id', chatId)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      chatId: Number(data.chat_id),
      title: data.title,
      isConnected: data.is_connected,
      settings: data.settings,
      syncStatus: data.sync_status,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async getByProject(projectId: string): Promise<TelegramChat | null> {
    const { data, error } = await supabaseAdmin
      .from('telegram_chats')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      chatId: Number(data.chat_id),
      title: data.title,
      isConnected: data.is_connected,
      settings: data.settings,
      syncStatus: data.sync_status,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(chat: Omit<TelegramChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TelegramChat> {
    const dbChat = {
      project_id: chat.projectId,
      chat_id: chat.chatId,
      title: chat.title,
      is_connected: chat.isConnected,
      settings: chat.settings,
      sync_status: chat.syncStatus,
      synced_at: chat.syncedAt?.toISOString(),
    };

    let query;
    if (chat.id) {
      query = supabaseAdmin.from('telegram_chats').update(dbChat).eq('id', chat.id);
    } else {
      query = supabaseAdmin.from('telegram_chats').insert(dbChat);
    }

    const { data, error } = await query.select().single();
    if (error || !data) {
      throw new Error(`Failed to save telegram chat: ${error?.message}`);
    }

    return {
      id: data.id,
      projectId: data.project_id,
      chatId: Number(data.chat_id),
      title: data.title,
      isConnected: data.is_connected,
      settings: data.settings,
      syncStatus: data.sync_status,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of ITrelloRepository
export class TrelloRepository implements ITrelloRepository {
  async getByProject(projectId: string): Promise<TrelloBoard | null> {
    const { data, error } = await supabaseAdmin
      .from('trello_boards')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      trelloBoardId: data.trello_board_id,
      name: data.name,
      url: data.url,
      listMappings: data.list_mappings,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(board: Omit<TrelloBoard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TrelloBoard> {
    const dbBoard = {
      project_id: board.projectId,
      trello_board_id: board.trelloBoardId,
      name: board.name,
      url: board.url,
      list_mappings: board.listMappings,
      synced_at: board.syncedAt?.toISOString(),
    };

    let query;
    if (board.id) {
      query = supabaseAdmin.from('trello_boards').update(dbBoard).eq('id', board.id);
    } else {
      query = supabaseAdmin.from('trello_boards').insert(dbBoard);
    }

    const { data, error } = await query.select().single();
    if (error || !data) {
      throw new Error(`Failed to save trello board: ${error?.message}`);
    }

    return {
      id: data.id,
      projectId: data.project_id,
      trelloBoardId: data.trello_board_id,
      name: data.name,
      url: data.url,
      listMappings: data.list_mappings,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of IMemoryRepository
export class MemoryRepository implements IMemoryRepository {
  async listByProject(projectId: string): Promise<ProjectMemory[]> {
    const { data, error } = await supabaseAdmin
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId);
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      category: d.category,
      content: d.content,
      tags: d.tags || [],
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }

  async save(memory: Omit<ProjectMemory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ProjectMemory> {
    const dbMemory = {
      project_id: memory.projectId,
      category: memory.category,
      content: memory.content,
      tags: memory.tags,
    };

    let query;
    if (memory.id) {
      query = supabaseAdmin.from('project_memory').update(dbMemory).eq('id', memory.id);
    } else {
      query = supabaseAdmin.from('project_memory').insert(dbMemory);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save project memory: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      category: data.category,
      content: data.content,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('project_memory').delete().eq('id', id);
    return !error;
  }

  async searchMemory(projectId: string, query: string): Promise<ProjectMemory[]> {
    // Simple ILIKE filter for search
    const { data, error } = await supabaseAdmin
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId)
      .or(`content.ilike.%${query}%,category.ilike.%${query}%`);
    
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      category: d.category,
      content: d.content,
      tags: d.tags || [],
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }
}

// Implementation of IDecisionRepository
export class DecisionRepository implements IDecisionRepository {
  async listByProject(projectId: string): Promise<Decision[]> {
    const { data, error } = await supabaseAdmin
      .from('decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      title: d.title,
      context: d.context,
      outcome: d.outcome,
      deciders: d.deciders || [],
      status: d.status,
      date: new Date(d.date),
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }

  async save(decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Decision> {
    const dbDecision = {
      project_id: decision.projectId,
      title: decision.title,
      context: decision.context,
      outcome: decision.outcome,
      deciders: decision.deciders,
      status: decision.status,
      date: decision.date.toISOString(),
    };

    let query;
    if (decision.id) {
      query = supabaseAdmin.from('decisions').update(dbDecision).eq('id', decision.id);
    } else {
      query = supabaseAdmin.from('decisions').insert(dbDecision);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save decision: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      title: data.title,
      context: data.context,
      outcome: data.outcome,
      deciders: data.deciders || [],
      status: data.status,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of IRiskRepository
export class RiskRepository implements IRiskRepository {
  async listActive(projectId: string): Promise<Risk[]> {
    const { data, error } = await supabaseAdmin
      .from('risks')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active');
    
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      description: d.description,
      severity: d.severity,
      status: d.status,
      mitigationPlan: d.mitigation_plan,
      detectedAt: new Date(d.detected_at),
      confidenceScore: Number(d.confidence_score),
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }

  async save(risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Risk> {
    const dbRisk = {
      project_id: risk.projectId,
      description: risk.description,
      severity: risk.severity,
      status: risk.status,
      mitigation_plan: risk.mitigationPlan,
      detected_at: risk.detectedAt.toISOString(),
      confidence_score: risk.confidenceScore,
    };

    let query;
    if (risk.id) {
      query = supabaseAdmin.from('risks').update(dbRisk).eq('id', risk.id);
    } else {
      query = supabaseAdmin.from('risks').insert(dbRisk);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save risk: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      description: data.description,
      severity: data.severity,
      status: data.status,
      mitigationPlan: data.mitigation_plan,
      detectedAt: new Date(data.detected_at),
      confidenceScore: Number(data.confidence_score),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of IQuestionRepository
export class QuestionRepository implements IQuestionRepository {
  async listOpen(projectId: string): Promise<OpenQuestion[]> {
    const { data, error } = await supabaseAdmin
      .from('open_questions')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'Open');
    
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      question: d.question,
      raisedBy: d.raised_by,
      answeredBy: d.answered_by,
      answer: d.answer,
      status: d.status,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }

  async save(question: Omit<OpenQuestion, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<OpenQuestion> {
    const dbQuestion = {
      project_id: question.projectId,
      question: question.question,
      raised_by: question.raisedBy,
      answered_by: question.answeredBy,
      answer: question.answer,
      status: question.status,
    };

    let query;
    if (question.id) {
      query = supabaseAdmin.from('open_questions').update(dbQuestion).eq('id', question.id);
    } else {
      query = supabaseAdmin.from('open_questions').insert(dbQuestion);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save open question: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      question: data.question,
      raisedBy: data.raised_by,
      answeredBy: data.answered_by,
      answer: data.answer,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of IReportRepository
export class ReportRepository implements IReportRepository {
  async getDailyReport(projectId: string, date: string): Promise<DailyReport | null> {
    const { data, error } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .eq('project_id', projectId)
      .eq('report_date', date)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      summary: data.summary,
      completedTasks: data.completed_tasks,
      inProgressTasks: data.in_progress_tasks,
      blockedTasks: data.blocked_tasks,
      risks: data.risks,
      waitingItems: data.waiting_items,
      decisions: data.decisions,
      priorities: data.priorities,
      questionsForCeo: data.questions_for_ceo,
      healthScore: Number(data.health_score),
      confidenceScore: Number(data.confidence_score),
      reportDate: data.report_date,
      createdAt: new Date(data.created_at),
    };
  }

  async saveDailyReport(report: Omit<DailyReport, 'id' | 'createdAt'> & { id?: string }): Promise<DailyReport> {
    const dbReport = {
      project_id: report.projectId,
      summary: report.summary,
      completed_tasks: report.completedTasks,
      in_progress_tasks: report.inProgressTasks,
      blocked_tasks: report.blockedTasks,
      risks: report.risks,
      waiting_items: report.waitingItems,
      decisions: report.decisions,
      priorities: report.priorities,
      questions_for_ceo: report.questionsForCeo,
      health_score: report.healthScore,
      confidence_score: report.confidenceScore,
      report_date: report.reportDate,
    };

    let query;
    if (report.id) {
      query = supabaseAdmin.from('daily_reports').update(dbReport).eq('id', report.id);
    } else {
      // Use upsert because of report_date unique constraint per project
      query = supabaseAdmin.from('daily_reports').upsert(dbReport, { onConflict: 'project_id,report_date' });
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save daily report: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      summary: data.summary,
      completedTasks: data.completed_tasks,
      inProgressTasks: data.in_progress_tasks,
      blockedTasks: data.blocked_tasks,
      risks: data.risks,
      waitingItems: data.waiting_items,
      decisions: data.decisions,
      priorities: data.priorities,
      questionsForCeo: data.questions_for_ceo,
      healthScore: Number(data.health_score),
      confidenceScore: Number(data.confidence_score),
      reportDate: data.report_date,
      createdAt: new Date(data.created_at),
    };
  }

  async getWeeklyReport(projectId: string, date: string): Promise<WeeklyReport | null> {
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select('*')
      .eq('project_id', projectId)
      .eq('report_date', date)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      summary: data.summary,
      accomplishments: data.accomplishments,
      roadblocks: data.roadblocks,
      nextWeekPlan: data.next_week_plan,
      healthTrend: data.health_trend,
      reportDate: data.report_date,
      createdAt: new Date(data.created_at),
    };
  }

  async saveWeeklyReport(report: Omit<WeeklyReport, 'id' | 'createdAt'> & { id?: string }): Promise<WeeklyReport> {
    const dbReport = {
      project_id: report.projectId,
      summary: report.summary,
      accomplishments: report.accomplishments,
      roadblocks: report.roadblocks,
      next_week_plan: report.nextWeekPlan,
      health_trend: report.healthTrend,
      report_date: report.reportDate,
    };

    let query;
    if (report.id) {
      query = supabaseAdmin.from('weekly_reports').update(dbReport).eq('id', report.id);
    } else {
      query = supabaseAdmin.from('weekly_reports').upsert(dbReport, { onConflict: 'project_id,report_date' });
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save weekly report: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      summary: data.summary,
      accomplishments: data.accomplishments,
      roadblocks: data.roadblocks,
      nextWeekPlan: data.next_week_plan,
      healthTrend: data.health_trend,
      reportDate: data.report_date,
      createdAt: new Date(data.created_at),
    };
  }

  async listDailyReports(projectId: string): Promise<DailyReport[]> {
    const { data, error } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('report_date', { ascending: false });
    
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      summary: d.summary,
      completedTasks: d.completed_tasks,
      inProgressTasks: d.in_progress_tasks,
      blockedTasks: d.blocked_tasks,
      risks: d.risks,
      waitingItems: d.waiting_items,
      decisions: d.decisions,
      priorities: d.priorities,
      questionsForCeo: d.questions_for_ceo,
      healthScore: Number(d.health_score),
      confidenceScore: Number(d.confidence_score),
      reportDate: d.report_date,
      createdAt: new Date(d.created_at),
    }));
  }

  async listWeeklyReports(projectId: string): Promise<WeeklyReport[]> {
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('report_date', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      summary: d.summary,
      accomplishments: d.accomplishments,
      roadblocks: d.roadblocks,
      nextWeekPlan: d.next_week_plan,
      healthTrend: d.health_trend,
      reportDate: d.report_date,
      createdAt: new Date(d.created_at),
    }));
  }
}

// Implementation of ILearningRepository
export class LearningRepository implements ILearningRepository {
  async getLessonForDate(topic: string, date: string): Promise<LearningLesson | null> {
    const { data, error } = await supabaseAdmin
      .from('learning_lessons')
      .select('*')
      .eq('topic', topic)
      .eq('date', date)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      topic: data.topic,
      title: data.title,
      content: data.content,
      date: data.date,
      durationMinutes: data.duration_minutes,
      createdAt: new Date(data.created_at),
    };
  }

  async saveLesson(lesson: Omit<LearningLesson, 'id' | 'createdAt'> & { id?: string }): Promise<LearningLesson> {
    const dbLesson = {
      topic: lesson.topic,
      title: lesson.title,
      content: lesson.content,
      date: lesson.date,
      duration_minutes: lesson.durationMinutes,
    };

    let query;
    if (lesson.id) {
      query = supabaseAdmin.from('learning_lessons').update(dbLesson).eq('id', lesson.id);
    } else {
      query = supabaseAdmin.from('learning_lessons').insert(dbLesson);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save learning lesson: ${error?.message}`);

    return {
      id: data.id,
      topic: data.topic,
      title: data.title,
      content: data.content,
      date: data.date,
      durationMinutes: data.duration_minutes,
      createdAt: new Date(data.created_at),
    };
  }
}

// Implementation of IDocumentRepository
export class DocumentRepository implements IDocumentRepository {
  async getById(id: string): Promise<Document | null> {
    const { data, error } = await supabaseAdmin.from('documents').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      title: data.title,
      content: data.content,
      type: data.type,
      status: data.status,
      version: data.version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async listByProject(projectId: string): Promise<Document[]> {
    const { data, error } = await supabaseAdmin.from('documents').select('*').eq('project_id', projectId);
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      title: d.title,
      content: d.content,
      type: d.type,
      status: d.status,
      version: d.version,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  }

  async save(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Document> {
    const dbDoc = {
      project_id: doc.projectId,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      status: doc.status,
      version: doc.version,
    };

    let query;
    if (doc.id) {
      query = supabaseAdmin.from('documents').update(dbDoc).eq('id', doc.id);
    } else {
      query = supabaseAdmin.from('documents').insert(dbDoc);
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save document: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      title: data.title,
      content: data.content,
      type: data.type,
      status: data.status,
      version: data.version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async saveGeneratedVersion(documentId: string, content: string, prompt?: string, version?: number): Promise<void> {
    await supabaseAdmin.from('generated_documents').insert({
      document_id: documentId,
      content,
      generation_prompt: prompt,
      version: version || 1,
    });
  }
}

// Implementation of IActivityRepository
export class ActivityRepository implements IActivityRepository {
  async log(projectId: string, actionType: string, description: string, details?: any, userId?: string): Promise<ActivityLog> {
    const { data, error } = await supabaseAdmin
      .from('activity_log')
      .insert({
        project_id: projectId,
        user_id: userId,
        action_type: actionType,
        description,
        details: details || {},
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to log activity: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      actionType: data.action_type,
      description: data.description,
      details: data.details,
      createdAt: new Date(data.created_at),
    };
  }

  async listRecent(projectId: string, limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      userId: d.user_id,
      actionType: d.action_type,
      description: d.description,
      details: d.details,
      createdAt: new Date(d.created_at),
    }));
  }
}

// Implementation of IIntegrationRepository
export class IntegrationRepository implements IIntegrationRepository {
  async getByProject(projectId: string): Promise<Integration[]> {
    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('project_id', projectId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      type: d.type,
      credentials: d.credentials,
      isActive: d.is_active,
      updatedAt: new Date(d.updated_at),
    }));
  }

  async getSpecific(projectId: string, type: 'telegram' | 'email' | 'trello'): Promise<Integration | null> {
    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type,
      credentials: data.credentials,
      isActive: data.is_active,
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(integration: Omit<Integration, 'id' | 'updatedAt'> & { id?: string }): Promise<Integration> {
    const dbIntegration = {
      project_id: integration.projectId,
      type: integration.type,
      credentials: integration.credentials,
      is_active: integration.isActive,
    };

    let query;
    if (integration.id) {
      query = supabaseAdmin.from('integrations').update(dbIntegration).eq('id', integration.id);
    } else {
      query = supabaseAdmin.from('integrations').upsert(dbIntegration, { onConflict: 'project_id,type' });
    }

    const { data, error } = await query.select().single();
    if (error || !data) throw new Error(`Failed to save integration: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type,
      credentials: data.credentials,
      isActive: data.is_active,
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Implementation of ISettingsRepository
export class SettingsRepository implements ISettingsRepository {
  async get(projectId: string, key: string): Promise<ProjectSettings | null> {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('project_id', projectId)
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      key: data.key,
      value: data.value,
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(projectId: string, key: string, value: any): Promise<ProjectSettings> {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({
        project_id: projectId,
        key,
        value,
      }, { onConflict: 'project_id,key' })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to save settings: ${error?.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      key: data.key,
      value: data.value,
      updatedAt: new Date(data.updated_at),
    };
  }
}
