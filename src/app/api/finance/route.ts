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

// GET — salary + expense ledgers plus combined aggregates for the charts.
export async function GET() {
  try {
    const [salRes, expRes] = await Promise.all([
      supabaseAdmin
        .from('finance_salaries')
        .select('*')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .order('amount_uzs', { ascending: false }),
      // Expenses table may not exist yet on an un-migrated DB — tolerate that.
      supabaseAdmin.from('finance_expenses').select('*').order('spent_date', { ascending: false }),
    ]);

    if (salRes.error) throw salRes.error;
    const rows = (salRes.data || []) as Row[];
    const expenses = (expRes.error ? [] : expRes.data || []) as any[];

    const byProject: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const bump = (project: string, monthKey: string, amount: number) => {
      byProject[project] = (byProject[project] || 0) + amount;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + amount;
    };

    let salaryTotal = 0;
    for (const r of rows) {
      const amt = Number(r.amount_uzs);
      salaryTotal += amt;
      bump(r.project, `${r.period_year}-${String(r.period_month).padStart(2, '0')}`, amt);
    }

    let expenseTotal = 0;
    for (const e of expenses) {
      const amt = Number(e.amount_uzs);
      expenseTotal += amt;
      bump(e.project || 'General', String(e.spent_date).slice(0, 7), amt);
    }

    return NextResponse.json({
      success: true,
      rows,
      expenses,
      aggregates: {
        total: salaryTotal + expenseTotal,
        salaryTotal,
        expenseTotal,
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

// DELETE — remove a single ledger row by id (?id=...).
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('finance_salaries').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
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
