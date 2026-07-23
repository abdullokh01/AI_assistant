// Trello Sync API Router - AI Project Intelligence Platform
// Path: src/app/api/sync/trello/route.ts

import { NextResponse } from 'next/server';
import { TrelloService } from '../../../../lib/core/infrastructure/trello';
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

    const trelloService = new TrelloService();
    const results: any[] = [];

    const apiKey = process.env.TRELLO_API_KEY || '';
    const token = process.env.TRELLO_TOKEN || '';
    // Service tokens or board IDs could be stored per-project in the integrations/settings table
    const boardId = process.env.TRELLO_BOARD_ID || 'mock-board-id';

    if (projectId) {
      const tasks = await trelloService.syncBoard(projectId, apiKey, token, boardId);
      results.push({ projectId, cardCount: tasks.length });
    } else {
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('id, name')
        .eq('status', 'active');

      if (projects) {
        for (const p of projects) {
          const tasks = await trelloService.syncBoard(p.id, apiKey, token, boardId);
          results.push({ projectId: p.id, name: p.name, cardCount: tasks.length });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Trello sync route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';

  const trelloService = new TrelloService();
  const tasks = await trelloService.syncBoard(
    projectId || 'demo-project-id',
    process.env.TRELLO_API_KEY || '',
    process.env.TRELLO_TOKEN || '',
    process.env.TRELLO_BOARD_ID || 'mock-board-id'
  );

  return NextResponse.json({
    message: 'Trello sync simulation complete',
    cardCount: tasks.length,
    tasks: tasks.map(t => ({ title: t.title, status: t.status }))
  });
}
