// Email Sync API Router - AI Project Intelligence Platform
// Path: src/app/api/sync/email/route.ts

import { NextResponse } from 'next/server';
import { EmailService } from '../../../../lib/core/infrastructure/email';
import { supabaseAdmin } from '../../../../lib/shared/supabase-client';

export async function POST(request: Request) {
  try {
    let projectId = '';
    try {
      const body = await request.json();
      projectId = body.projectId;
    } catch {
      // Body empty or not JSON, check query params
      const { searchParams } = new URL(request.url);
      projectId = searchParams.get('projectId') || '';
    }

    const emailService = new EmailService();
    const results: any[] = [];

    if (projectId) {
      // Sync specific project
      const emails = await emailService.syncEmails(projectId, {
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT ? Number(process.env.IMAP_PORT) : undefined,
        user: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD,
      });
      results.push({ projectId, syncedCount: emails.length });
    } else {
      // Sync all active projects
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('id, name')
        .eq('status', 'active');
      
      if (projects) {
        for (const p of projects) {
          const emails = await emailService.syncEmails(p.id, {
            host: process.env.IMAP_HOST,
            port: process.env.IMAP_PORT ? Number(process.env.IMAP_PORT) : undefined,
            user: process.env.EMAIL_USERNAME,
            password: process.env.EMAIL_PASSWORD,
          });
          results.push({ projectId: p.id, name: p.name, syncedCount: emails.length });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Email sync route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support GET for testing sync easily from browser
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';

  const emailService = new EmailService();
  const emails = await emailService.syncEmails(projectId || 'demo-project-id', {
    host: process.env.IMAP_HOST,
    user: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  });

  return NextResponse.json({
    message: 'Sync simulation execution successfully',
    syncedCount: emails.length,
    emails: emails.map(e => ({ subject: e.subject, classification: e.classification }))
  });
}
