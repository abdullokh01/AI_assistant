// Intelligence Engine Runner Route - AI Project Intelligence Platform
// Path: src/app/api/intelligence/run/route.ts

import { NextResponse } from 'next/server';
import { IntelligenceEngine } from '../../../../lib/core/infrastructure/intelligence';
import { supabaseAdmin } from '../../../../lib/shared/supabase-client';

export async function POST(request: Request) {
  try {
    let projectId = '';
    try {
      const body = await request.json();
      projectId = body.projectId;
    } catch {
      const { searchParams } = new URL(request.url);
      projectId = searchParams.get('projectId') || '';
    }

    if (!projectId) {
      // Run audit for all active projects
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('id, name')
        .eq('status', 'active');
      
      const results = [];
      if (projects) {
        const engine = new IntelligenceEngine();
        for (const p of projects) {
          const res = await engine.auditProject(p.id);
          results.push({ projectId: p.id, name: p.name, ...res });
        }
      }
      return NextResponse.json({ success: true, audits: results });
    }

    const engine = new IntelligenceEngine();
    const result = await engine.auditProject(projectId);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Intelligence run error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  try {
    const engine = new IntelligenceEngine();
    const result = await engine.auditProject(projectId);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
