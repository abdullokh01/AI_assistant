// Projects Listing API Endpoint - AI Project Intelligence Platform
// Path: src/app/api/projects/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/shared/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query projects from database using admin client (bypasses RLS secure lock)
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .neq('id', '00000000-0000-0000-0000-000000000000') // Exclude the system settings project from selection
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
