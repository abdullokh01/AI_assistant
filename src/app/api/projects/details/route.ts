// Unified Project Details API Endpoint - AI Project Intelligence Platform
// Path: src/app/api/projects/details/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/shared/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameters' }, { status: 400 });
    }

    // 1. Fetch project details
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Run remaining database queries in parallel for high performance
    const [
      { data: tasks },
      { data: emails },
      { data: telegramChat },
      { data: memories },
      { data: observations },
      { data: risks },
      { data: decisions },
      { data: dailyReport },
      { data: activities }
    ] = await Promise.all([
      supabaseAdmin.from('tasks').select('*').eq('project_id', projectId),
      supabaseAdmin.from('emails').select('*').eq('project_id', projectId).order('received_at', { ascending: false }),
      supabaseAdmin.from('telegram_chats').select('*').eq('project_id', projectId).maybeSingle(),
      supabaseAdmin.from('project_memory').select('*').eq('project_id', projectId),
      supabaseAdmin.from('ai_observations').select('*').eq('project_id', projectId).eq('status', 'pending'),
      supabaseAdmin.from('risks').select('*').eq('project_id', projectId).eq('status', 'active'),
      supabaseAdmin.from('decisions').select('*').eq('project_id', projectId),
      supabaseAdmin.from('daily_reports').select('*').eq('project_id', projectId).order('report_date', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('activity_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50)
    ]);

    return NextResponse.json({
      success: true,
      project,
      tasks: tasks || [],
      emails: emails || [],
      telegramChat: telegramChat || null,
      memories: memories || [],
      observations: observations || [],
      risks: risks || [],
      decisions: decisions || [],
      dailyReport: dailyReport || null,
      activities: activities || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
