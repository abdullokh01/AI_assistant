// Finance API - salary ledger, aggregates, add entry, one-time history import
// Path: src/app/api/finance/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/shared/supabase-client';
import history from '../../../lib/data/finance-history.json';

type Row = {
  id?: string;
  period_year: number;
  period_month: number;
  employee_name: string;
  position?: string;
  project: string;
  status?: string;
  amount_uzs: number;
  bonus_usd?: number | null;
  source?: string;
};

// GET — full ledger plus pre-computed aggregates for the charts.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('finance_salaries')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .order('amount_uzs', { ascending: false });

    if (error) throw error;
    const rows = (data || []) as Row[];

    const byProject: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    for (const r of rows) {
      byProject[r.project] = (byProject[r.project] || 0) + Number(r.amount_uzs);
      const key = `${r.period_year}-${String(r.period_month).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + Number(r.amount_uzs);
    }

    const total = rows.reduce((s, r) => s + Number(r.amount_uzs), 0);

    return NextResponse.json({
      success: true,
      rows,
      aggregates: {
        total,
        byProject: Object.entries(byProject)
          .map(([project, amount]) => ({ project, amount }))
          .sort((a, b) => b.amount - a.amount),
        byMonth: Object.entries(byMonth)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — add a single salary entry from the UI.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row: Row = {
      period_year: Number(body.period_year),
      period_month: Number(body.period_month),
      employee_name: String(body.employee_name || '').trim(),
      position: body.position || null,
      project: String(body.project || 'Unassigned').trim() || 'Unassigned',
      status: body.status || null,
      amount_uzs: Number(body.amount_uzs) || 0,
      bonus_usd: body.bonus_usd != null && body.bonus_usd !== '' ? Number(body.bonus_usd) : null,
      source: 'manual',
    };

    if (!row.employee_name || !row.period_year || !row.period_month) {
      return NextResponse.json({ error: 'Name, year and month are required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('finance_salaries')
      .upsert(row, { onConflict: 'period_year,period_month,employee_name,project' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — one-time import of the Excel history bundled at build time.
export async function PUT() {
  try {
    const rows: Row[] = (history as any[]).map((h) => ({
      period_year: h.year,
      period_month: h.month,
      employee_name: h.name,
      position: h.position || null,
      project: h.project || 'Unassigned',
      status: h.status || null,
      amount_uzs: h.amount,
      source: 'excel',
    }));

    const { error } = await supabaseAdmin
      .from('finance_salaries')
      .upsert(rows, { onConflict: 'period_year,period_month,employee_name,project' });

    if (error) throw error;
    return NextResponse.json({ success: true, imported: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
