// Learning Agent Daily Lesson API - AI Project Intelligence Platform
// Path: src/app/api/learning/lesson/route.ts

import { NextResponse } from 'next/server';
import { ActivityRepository, RiskRepository, LearningRepository } from '../../../../lib/core/infrastructure/supabase';
import { ClaudeService } from '../../../../lib/core/infrastructure/claude';

export async function POST(request: Request) {
  try {
    let projectId = '';
    let topic = 'Leadership';
    const date = new Date().toISOString().split('T')[0];

    try {
      const body = await request.json();
      projectId = body.projectId;
      if (body.topic) topic = body.topic;
    } catch {
      const { searchParams } = new URL(request.url);
      projectId = searchParams.get('projectId') || '';
      topic = searchParams.get('topic') || 'Leadership';
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const activityRepo = new ActivityRepository();
    const riskRepo = new RiskRepository();
    const learningRepo = new LearningRepository();
    const claudeService = new ClaudeService();

    // Gather logs and risks
    const activities = await activityRepo.listRecent(projectId, 50);
    const risks = await riskRepo.listActive(projectId);

    // Generate lesson via Claude
    const lessonData = await claudeService.generateDailyLesson(topic, date, activities, risks);

    // Save lesson
    const saved = await learningRepo.saveLesson({
      topic: topic as any,
      title: lessonData.title,
      content: lessonData.content,
      date,
      durationMinutes: lessonData.durationMinutes,
    });

    await activityRepo.log(
      projectId,
      'Learning Lesson Generated',
      `Learning agent compiled a 15-minute lesson on "${topic}": "${lessonData.title}"`
    );

    return NextResponse.json({ success: true, lesson: saved });
  } catch (error: any) {
    console.error('Learning route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';
  const topic = searchParams.get('topic') || 'Leadership';

  const url = new URL(request.url);
  const fakeRequest = new Request(url, { method: 'POST', body: JSON.stringify({ projectId, topic }) });
  return await POST(fakeRequest);
}
