// Daily Report Generation Route - AI Project Intelligence Platform
// Path: src/app/api/reports/daily/route.ts

import { NextResponse } from 'next/server';
import { 
  ProjectRepository, TaskRepository, RiskRepository, 
  DecisionRepository, ActivityRepository, EmailRepository, 
  QuestionRepository, ReportRepository 
} from '../../../../lib/core/infrastructure/supabase';
import { ClaudeService } from '../../../../lib/core/infrastructure/claude';

export async function POST(request: Request) {
  try {
    let projectId = '';
    let reportDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const body = await request.json();
      projectId = body.projectId;
      if (body.reportDate) reportDate = body.reportDate;
    } catch {
      const { searchParams } = new URL(request.url);
      projectId = searchParams.get('projectId') || '';
      const queryDate = searchParams.get('reportDate');
      if (queryDate) reportDate = queryDate;
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // 1. Gather all project data
    const projectRepo = new ProjectRepository();
    const taskRepo = new TaskRepository();
    const riskRepo = new RiskRepository();
    const decisionRepo = new DecisionRepository();
    const activityRepo = new ActivityRepository();
    const emailRepo = new EmailRepository();
    const questionRepo = new QuestionRepository();
    const reportRepo = new ReportRepository();
    const claudeService = new ClaudeService();

    const project = await projectRepo.getById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tasks = await taskRepo.listByProject(projectId);
    const activeRisks = await riskRepo.listActive(projectId);
    const decisions = await decisionRepo.listByProject(projectId);
    const activities = await activityRepo.listRecent(projectId, 30);
    const unreadEmails = await emailRepo.getUnreadEmails(projectId);
    const openQuestions = await questionRepo.listOpen(projectId);

    // Filter tasks
    const completedTasks = tasks.filter(t => t.status === 'Done');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    const blockedTasks = tasks.filter(t => t.status === 'Blocked');

    // 2. Generate report text
    const summary = await claudeService.generateDailyReport(
      project,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      activeRisks,
      decisions,
      activities,
      unreadEmails,
      openQuestions,
      project.healthScore,
      project.confidenceScore
    );

    // 3. Save report to database
    const savedReport = await reportRepo.saveDailyReport({
      projectId,
      summary,
      completedTasks: completedTasks.map(t => t.title),
      inProgressTasks: inProgressTasks.map(t => t.title),
      blockedTasks: blockedTasks.map(t => t.title),
      risks: activeRisks.map(r => r.description),
      waitingItems: openQuestions.map(q => q.question),
      decisions: decisions.map(d => d.title),
      priorities: ['Review daily summaries', 'Resolve blocked tasks'],
      questionsForCeo: openQuestions.map(q => q.question),
      healthScore: project.healthScore,
      confidenceScore: project.confidenceScore,
      reportDate,
    });

    // 4. Log Activity
    await activityRepo.log(
      projectId,
      'AI Generated Report',
      `Successfully generated AI Daily Executive Report for ${reportDate}. Health: ${project.healthScore}%.`
    );

    return NextResponse.json({ success: true, report: savedReport });
  } catch (error: any) {
    console.error('Daily report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  // Simulate POST call
  const url = new URL(request.url);
  const fakeRequest = new Request(url, { method: 'POST', body: JSON.stringify({ projectId }) });
  return await POST(fakeRequest);
}
