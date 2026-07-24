// Finance Budgets API - set a budget per project
// Path: src/app/api/finance/budgets/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/shared/supabase-client';

// POST — upsert a project's budget.
export async function POST(request: Request) {
  try {
    const b = await request.json();
    const project = String(b.project || '').trim();
    if (!project) return NextResponse.json({ error: 'Project is required.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('finance_budgets')
      .upsert({ project, budget_uzs: Number(b.budget_uzs) || 0 }, { onConflict: 'project' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
