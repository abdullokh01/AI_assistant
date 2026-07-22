// Intelligence Engine Orchestrator - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/intelligence.ts

import { 
  ProjectRepository, TaskRepository, EmailRepository, 
  MemoryRepository, RiskRepository, DecisionRepository, 
  ActivityRepository, TelegramRepository 
} from './supabase';
import { ClaudeService } from './claude';
import { TelegramBotService } from './telegram';
import { supabaseAdmin } from '../../shared/supabase-client';

export class IntelligenceEngine {
  private projectRepo = new ProjectRepository();
  private taskRepo = new TaskRepository();
  private emailRepo = new EmailRepository();
  private memoryRepo = new MemoryRepository();
  private riskRepo = new RiskRepository();
  private decisionRepo = new DecisionRepository();
  private activityRepo = new ActivityRepository();
  private telegramRepo = new TelegramRepository();
  private claudeService = new ClaudeService();
  private botService = new TelegramBotService();

  // Run the full AI Project Intelligence Audit
  async auditProject(projectId: string): Promise<any> {
    console.log(`Running Intelligence Engine Audit for Project: ${projectId}`);
    
    // 1. Gather all project data
    const project = await this.projectRepo.getById(projectId);
    if (!project) throw new Error('Project not found');

    const tasks = await this.taskRepo.listByProject(projectId);
    const emails = await this.emailRepo.listByProject(projectId);
    const memories = await this.memoryRepo.listByProject(projectId);

    // Fetch recent group chat messages (from activity log mapped to telegram messages)
    const activities = await this.activityRepo.listRecent(projectId, 100);
    const tgMessages = activities
      .filter((a) => a.actionType === 'Telegram Message Tracked')
      .map((a) => ({
        sender: a.details.sender || 'User',
        text: a.details.text || '',
        date: a.createdAt,
      }));

    // 2. Invoke Claude Intelligence Engine
    const auditResult = await this.claudeService.runIntelligenceAudit(
      project,
      tasks,
      emails,
      tgMessages,
      memories
    );

    const { healthScore, confidenceScore, observations, detectedRisks, decisions } = auditResult;

    // 3. Update Project Table with new scores
    await this.projectRepo.update(projectId, {
      healthScore,
      confidenceScore,
    });

    // 4. Save observations to database (clear previous pending and save new)
    // To keep it simple, we clear pending observations for this project first
    await supabaseAdmin
      .from('ai_observations')
      .delete()
      .eq('project_id', projectId)
      .eq('status', 'pending');

    for (const obs of observations) {
      await supabaseAdmin.from('ai_observations').insert({
        project_id: projectId,
        source_type: obs.sourceType,
        source_id: obs.sourceId,
        observation: obs.observation,
        type: obs.type,
        status: obs.status,
        confidence_score: obs.confidenceScore,
      });

      // Send Telegram alert if we have a connected chat and it is an Inconsistency or Risk
      const chat = await this.telegramRepo.getByProject(projectId);
      if (chat && chat.isConnected) {
        let alertEmoji = '⚠️';
        if (obs.type === 'Inconsistency') alertEmoji = '🚨 *Inconsistency Mismatch Detected*';
        if (obs.type === 'Scope Creep') alertEmoji = '📈 *Scope Creep Alert*';
        if (obs.type === 'Risk') alertEmoji = '⚠️ *Risk Warning*';

        const text = `${alertEmoji}\n\n${obs.observation}\n\n_AI Confidence Score: ${obs.confidenceScore}%_`;
        await this.botService.sendMessage(chat.chatId, text);
      }
    }

    // 5. Save newly detected risks to the risks table
    for (const risk of detectedRisks) {
      // Check if description already exists in active risks
      const { data: existing } = await supabaseAdmin
        .from('risks')
        .select('id')
        .eq('project_id', projectId)
        .eq('description', risk.description)
        .eq('status', 'active')
        .maybeSingle();

      if (!existing) {
        await this.riskRepo.save({
          projectId,
          description: risk.description,
          severity: risk.severity,
          status: risk.status,
          mitigationPlan: risk.mitigationPlan,
          detectedAt: new Date(risk.detectedAt),
          confidenceScore: risk.confidenceScore,
        });
      }
    }

    // 6. Save newly captured decisions to the decisions table
    for (const dec of decisions) {
      const { data: existing } = await supabaseAdmin
        .from('decisions')
        .select('id')
        .eq('project_id', projectId)
        .eq('title', dec.title)
        .maybeSingle();

      if (!existing) {
        await this.decisionRepo.save({
          projectId,
          title: dec.title,
          context: dec.context,
          outcome: dec.outcome,
          deciders: dec.deciders,
          status: dec.status,
          date: new Date(dec.date),
        });
      }
    }

    // 7. Log completion
    await this.activityRepo.log(
      projectId,
      'AI Audit Completed',
      `AI Project Intelligence Audit completed. Health Score: ${healthScore}%. Observations: ${observations.length}.`,
      { healthScore, confidenceScore, observationCount: observations.length }
    );

    return {
      healthScore,
      confidenceScore,
      observationsCount: observations.length,
      risksCount: detectedRisks.length,
    };
  }
}
