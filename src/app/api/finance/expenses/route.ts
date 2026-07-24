// Finance Expenses API - general (non-salary) cost ledger
// Path: src/app/api/finance/expenses/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/shared/supabase-client';

// POST — add an expense.
export async function POST(request: Request) {
  try {
    const b = await request.json();
    const row = {
      spent_date: b.spent_date,
      purpose: String(b.purpose || '').trim(),
      spender: b.spender ? String(b.spender).trim() : null,
      project: String(b.project || 'General').trim() || 'General',
      amount_uzs: Number(b.amount_uzs) || 0,
      comment: b.comment ? String(b.comment).trim() : null,
    };
    if (!row.spent_date || !row.purpose || !row.amount_uzs) {
      return NextResponse.json({ error: 'Date, purpose and amount are required.' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('finance_expenses').insert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove an expense by id (?id=...).
export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { error } = await supabaseAdmin.from('finance_expenses').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
