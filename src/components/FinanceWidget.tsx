// Finance Widget - AI Project Intelligence Platform
// Path: src/components/FinanceWidget.tsx
// Salary/spend ledger: KPI tiles, spend-by-project + monthly-trend charts,
// add-entry form, and a filterable table. Data lives in finance_salaries.

'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface Row {
  id: string;
  period_year: number;
  period_month: number;
  employee_name: string;
  position?: string;
  project: string;
  status?: string;
  amount_uzs: number;
  source?: string;
}
interface Expense {
  id: string;
  spent_date: string;
  purpose: string;
  spender?: string;
  project: string;
  amount_uzs: number;
  comment?: string;
  created_at: string;
}
interface BudgetStatus {
  project: string;
  budget: number | null;
  spent: number;
  remaining: number | null;
  pct: number | null;
  over: boolean;
}
interface Aggregates {
  total: number;
  salaryTotal: number;
  expenseTotal: number;
  byProject: { project: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
  budgetStatus: BudgetStatus[];
}

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Deterministic accent per project so bars/table read consistently.
const PROJECT_COLORS = ['#00e5ff', '#a855f7', '#00ffaa', '#ff9f1c', '#ff3366', '#4d7cff', '#f15bb5', '#8ac926'];
const colorFor = (name: string, list: string[]) => PROJECT_COLORS[list.indexOf(name) % PROJECT_COLORS.length];

const fmtUZS = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

// Recompute all aggregates from the raw rows/expenses, dropping any project the
// user has excluded — so excluded projects vanish from every total, chart and
// the report, but stay restorable in the Budget-vs-Actual list.
function buildAgg(
  rows: Row[],
  expenses: Expense[],
  budgetsMap: Record<string, number>,
  excluded: Set<string>
): Aggregates {
  const inc = (p: string) => !excluded.has(p);
  const byProject: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let salaryTotal = 0;
  let expenseTotal = 0;

  for (const r of rows) {
    if (!inc(r.project)) continue;
    const a = Number(r.amount_uzs);
    salaryTotal += a;
    byProject[r.project] = (byProject[r.project] || 0) + a;
    const k = `${r.period_year}-${String(r.period_month).padStart(2, '0')}`;
    byMonth[k] = (byMonth[k] || 0) + a;
  }
  for (const e of expenses) {
    if (!inc(e.project)) continue;
    const a = Number(e.amount_uzs);
    expenseTotal += a;
    byProject[e.project] = (byProject[e.project] || 0) + a;
    const k = String(e.spent_date).slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + a;
  }

  const union = Array.from(new Set([...Object.keys(byProject), ...Object.keys(budgetsMap).filter(inc)]));
  const budgetStatus = union
    .map((project) => {
      const spent = byProject[project] || 0;
      const budget = budgetsMap[project] ?? null;
      const remaining = budget == null ? null : budget - spent;
      const pct = budget && budget > 0 ? (spent / budget) * 100 : null;
      return { project, budget, spent, remaining, pct, over: budget != null && spent > budget };
    })
    .sort((a, b) => b.spent - a.spent);

  return {
    total: salaryTotal + expenseTotal,
    salaryTotal,
    expenseTotal,
    byProject: Object.entries(byProject).map(([project, amount]) => ({ project, amount })).sort((a, b) => b.amount - a.amount),
    byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
    budgetStatus,
  };
}

export default function FinanceWidget() {
  const [rows, setRows] = useState<Row[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [agg, setAgg] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const [budgetEdits, setBudgetEdits] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  // Excluded projects persist locally so the choice survives reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fin_excluded');
      if (raw) setExcluded(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);
  const toggleExclude = (project: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(project) ? next.delete(project) : next.add(project);
      try { localStorage.setItem('fin_excluded', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  // Budgets keyed by project (from the server aggregate) + the exclusion-filtered
  // view used for every total, chart and the report.
  const budgetsMap = useMemo(() => {
    const m: Record<string, number> = {};
    (agg?.budgetStatus || []).forEach((b) => { if (b.budget != null) m[b.project] = b.budget; });
    return m;
  }, [agg]);
  const view = useMemo(
    () => (agg ? buildAgg(rows, expenses, budgetsMap, excluded) : null),
    [agg, rows, expenses, budgetsMap, excluded]
  );

  const now = new Date();
  const [form, setForm] = useState({
    period_year: now.getFullYear(),
    period_month: now.getMonth() + 1,
    employee_name: '',
    position: '',
    project: '',
    amount_uzs: '',
  });
  const todayISO = now.toISOString().slice(0, 10);
  const [expForm, setExpForm] = useState({
    spent_date: todayISO,
    purpose: '',
    spender: '',
    project: '',
    amount_uzs: '',
    comment: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load finance data');
      setRows(data.rows);
      setExpenses(data.expenses || []);
      setAgg(data.aggregates);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const projectNames = useMemo(() => (agg ? agg.byProject.map((p) => p.project) : []), [agg]);
  const months = useMemo(() => {
    const set = Array.from(new Set(rows.map((r) => `${r.period_year}-${String(r.period_month).padStart(2, '0')}`)));
    return set.sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (monthFilter === 'all') return rows;
    return rows.filter((r) => `${r.period_year}-${String(r.period_month).padStart(2, '0')}` === monthFilter);
  }, [rows, monthFilter]);

  const latestMonthKey = months[0];
  const latestMonthTotal = useMemo(
    () =>
      rows
        .filter((r) => `${r.period_year}-${String(r.period_month).padStart(2, '0')}` === latestMonthKey)
        .reduce((s, r) => s + Number(r.amount_uzs), 0),
    [rows, latestMonthKey]
  );
  const headcount = useMemo(
    () =>
      new Set(
        rows
          .filter((r) => `${r.period_year}-${String(r.period_month).padStart(2, '0')}` === latestMonthKey)
          .map((r) => r.employee_name)
      ).size,
    [rows, latestMonthKey]
  );

  const remove = async (row: Row) => {
    if (!confirm(`Delete ${row.employee_name} — ${MONTH_LABELS[row.period_month]} ${row.period_year} (${fmtUZS(row.amount_uzs)} UZS)?`)) return;
    try {
      const res = await fetch(`/api/finance?id=${row.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Build a print-ready A4 report styled like the Asoschi landing page
  // (light, teal→green gradient header, clean white cards) and open the print
  // dialog so it can be saved as PDF.
  const downloadReport = () => {
    if (!view) return;
    const UZ_MONTHS = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const UZ_SHORT = ['', 'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const now = new Date();
    const dateStr = `${now.getDate()} ${UZ_MONTHS[now.getMonth() + 1]} ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Reporting period from the first→last month present in the ledger.
    const uzMonthYear = (key: string) => `${UZ_MONTHS[Number(key.slice(5))]} ${key.slice(0, 4)}`;
    const firstMonth = view.byMonth[0]?.month;
    const lastMonth = view.byMonth[view.byMonth.length - 1]?.month;
    const periodLabel = firstMonth && lastMonth ? `${uzMonthYear(firstMonth)} — ${uzMonthYear(lastMonth)}` : '';

    const budgetRows = view.budgetStatus
      .map((b) => {
        const status = b.budget == null || b.budget === 0
          ? '<span class="muted">—</span>'
          : b.over
            ? `<span class="over">${fmtUZS(Math.abs(b.remaining!))} oshdi · +${Math.round(b.pct! - 100)}%</span>`
            : `<span class="under">${fmtUZS(b.remaining!)} qoldi · ${Math.round(b.pct!)}% ishlatildi</span>`;
        return `<tr>
          <td>${b.project}</td>
          <td class="num">${b.budget != null ? fmtUZS(b.budget) : '—'}</td>
          <td class="num">${fmtUZS(b.spent)}</td>
          <td>${status}</td>
        </tr>`;
      })
      .join('');

    const monthMax = view.byMonth.length ? Math.max(...view.byMonth.map((m) => m.amount)) : 1;
    const monthCols = view.byMonth
      .map(
        (m) => `<div class="mcol">
          <span class="mval">${fmtM(m.amount)}</span>
          <span class="mbar" style="height:${Math.max((m.amount / monthMax) * 120, 4)}px"></span>
          <span class="mlabel">${UZ_SHORT[Number(m.month.slice(5))]}'${m.month.slice(2, 4)}</span>
        </div>`
      )
      .join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Asoschi — Financial Report</title>
<style>
  @page { size: A4; margin: 11mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1c2b29; background: #fff; font-size: 11px; line-height: 1.4; }
  .hero { background: linear-gradient(135deg, #16c0a3 0%, #47d67f 100%); color: #fff; border-radius: 12px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start; }
  .title-block { text-align: right; }
  .hero h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
  .hero p { opacity: .9; margin-top: 3px; font-size: 11px; }
  .meta { text-align: left; font-size: 10px; opacity: .95; line-height: 1.6; }
  .meta b { display:block; font-size: 12px; margin-bottom: 2px; }
  .section-title { font-size: 12px; font-weight: 800; color: #0f7a63; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #e3efec; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-top: 12px; }
  .kpi { background: #f6faf9; border: 1px solid #e3efec; border-radius: 10px; padding: 10px 12px; }
  .kpi .l { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #6b8480; }
  .kpi .v { font-size: 16px; font-weight: 800; margin-top: 3px; color: #123; }
  .kpi .u { font-size: 9px; color: #8aa; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #6b8480; padding: 5px 9px; border-bottom: 2px solid #e3efec; }
  td { padding: 5px 9px; border-bottom: 1px solid #eef4f2; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  th.num { text-align: right; }
  .over { color: #d64545; font-weight: 700; }
  .under { color: #17a06a; font-weight: 600; }
  .muted { color: #aaa; }
  .trend { display: flex; align-items: flex-end; gap: 6px; height: 120px; padding-top: 16px; border-bottom: 1px solid #e3efec; }
  .mcol { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px; }
  .mbar { width: 62%; background: linear-gradient(180deg, #16c0a3, #9fe8c8); border-radius: 3px 3px 0 0; }
  .mval { font-size: 7.5px; color: #789; }
  .mlabel { font-size: 7.5px; color: #9ab; }
  .foot { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e3efec; display: flex; justify-content: space-between; font-size: 9px; color: #8aa; }
  .signed { margin-top: 16px; }
  .signed .by { font-weight: 800; font-size: 12px; color: #123; }
  .signed .role { font-size: 10px; color: #6b8480; }
  @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
  <div class="hero">
    <div class="meta">
      <b>${dateStr}</b>
      Yaratilgan vaqti: ${timeStr}<br/>
      Hisobot davri: ${periodLabel}
    </div>
    <div class="title-block">
      <h1>Asoschi — Moliyaviy hisoboti</h1>
      <p>Oyliklar va xarajatlar · reja va haqiqiy</p>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="l">Umumiy xarajat</div><div class="v">${fmtUZS(view.total)}</div><div class="u">so'm · jami</div></div>
    <div class="kpi"><div class="l">Oyliklar</div><div class="v">${fmtM(view.salaryTotal)}</div><div class="u">ish haqi</div></div>
    <div class="kpi"><div class="l">Boshqa xarajatlar</div><div class="v">${fmtM(view.expenseTotal)}</div><div class="u">xarajatlar</div></div>
    <div class="kpi"><div class="l">Loyihalar</div><div class="v">${view.byProject.length}</div><div class="u">loyihalar soni</div></div>
  </div>

  <div class="section-title">Reja va Haqiqiy · loyihalar bo'yicha</div>
  <table>
    <thead><tr><th>Loyiha</th><th class="num">Reja (byudjet)</th><th class="num">Sarflandi</th><th>Holat</th></tr></thead>
    <tbody>${budgetRows}</tbody>
  </table>

  <div class="section-title">Oylik xarajat dinamikasi</div>
  <div class="trend">${monthCols}</div>

  <div class="signed">
    <div class="by">Chop etdi: Abdullokh Ibragimov</div>
    <div class="role">Asoschi IT jamoasi · Loyiha menejeri</div>
  </div>

  <div class="foot">
    <span>© ${now.getFullYear()} Asoschi IT jamoasi</span>
    <span>Maxfiy · faqat ichki foydalanish uchun</span>
  </div>

  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      setError('Popup blocked — allow popups to download the report.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const saveBudget = async (project: string) => {
    const raw = budgetEdits[project];
    if (raw == null || raw === '') return;
    try {
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, budget_uzs: Number(raw) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save budget');
      setBudgetEdits((m) => { const n = { ...m }; delete n[project]; return n; });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExp(true);
    setError('');
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expForm, project: expForm.project || 'General' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      setExpForm((f) => ({ ...f, purpose: '', spender: '', amount_uzs: '', comment: '' }));
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingExp(false);
    }
  };

  const removeExpense = async (ex: Expense) => {
    if (!confirm(`Delete expense "${ex.purpose}" (${fmtUZS(ex.amount_uzs)} UZS)?`)) return;
    try {
      const res = await fetch(`/api/finance/expenses?id=${ex.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project: form.project || 'Unassigned' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      setForm((f) => ({ ...f, employee_name: '', position: '', amount_uzs: '' }));
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const monthKeyLabel = (key: string) => {
    const [y, m] = key.split('-');
    return `${MONTH_LABELS[Number(m)]} ${y}`;
  };

  const projMax = view && view.byProject.length ? view.byProject[0].amount : 1;
  const monthMax = view && view.byMonth.length ? Math.max(...view.byMonth.map((m) => m.amount)) : 1;

  return (
    <div className="space-y-6">
      {/* HEADER + DOWNLOAD */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-cyan-200" style={{ textShadow: '0 0 14px rgba(0,229,255,0.3)' }}>
          Finance Command
        </h2>
        <button onClick={downloadReport} disabled={!agg} className="hud-diagnostic" style={{ width: 'auto', padding: '0.6rem 1.2rem' }}>
          ⭳ DOWNLOAD REPORT
        </button>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <span className="fin-kpi-label">Total Spend · All Time</span>
          <span className="fin-kpi-value">{view ? fmtUZS(view.total) : '—'}</span>
          <span className="fin-kpi-unit">
            {view ? `UZS · payroll ${fmtM(view.salaryTotal)} · other ${fmtM(view.expenseTotal)}` : 'UZS'}
          </span>
        </div>
        <div className="glass-panel p-5">
          <span className="fin-kpi-label">{latestMonthKey ? monthKeyLabel(latestMonthKey) : 'Latest Month'}</span>
          <span className="fin-kpi-value" style={{ color: '#00ffaa' }}>{fmtUZS(latestMonthTotal)}</span>
          <span className="fin-kpi-unit">UZS · latest payroll</span>
        </div>
        <div className="glass-panel p-5">
          <span className="fin-kpi-label">Headcount · Latest</span>
          <span className="fin-kpi-value" style={{ color: '#a855f7' }}>{headcount}</span>
          <span className="fin-kpi-unit">people paid</span>
        </div>
        <div className="glass-panel p-5">
          <span className="fin-kpi-label">Projects Tracked</span>
          <span className="fin-kpi-value" style={{ color: '#ff9f1c' }}>{projectNames.length}</span>
          <span className="fin-kpi-unit">cost centers</span>
        </div>
      </div>

      {error && <div className="auth-error">⚠ {error}</div>}
      {!loading && rows.length === 0 && !error && (
        <div className="glass-panel p-6 text-center">
          <p className="hud-empty justify-center">NO LEDGER DATA — run the Excel history import (see notes).</p>
        </div>
      )}

      {/* BUDGET vs ACTUAL */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-extrabold text-base text-slate-200">Budget vs Actual · by Project</h3>
          {(() => {
            // Totals compare only projects that have a budget set (and aren't excluded).
            const budgeted = (view?.budgetStatus || []).filter((b) => b.budget != null && b.budget > 0);
            const totalBudget = budgeted.reduce((s, b) => s + (b.budget || 0), 0);
            const totalSpent = budgeted.reduce((s, b) => s + b.spent, 0);
            const diff = totalBudget - totalSpent;
            const over = totalBudget > 0 && totalSpent > totalBudget;
            const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : null;
            const c = over ? '#ff3366' : pct != null && pct > 85 ? '#ff9f1c' : '#00ffaa';
            return (
              <div className="fin-total-bar">
                <div className="fin-total-cell">
                  <span className="fin-total-l">Total Budget</span>
                  <span className="fin-total-v">{totalBudget > 0 ? fmtUZS(totalBudget) : '—'}</span>
                </div>
                <div className="fin-total-cell">
                  <span className="fin-total-l">Total Actual</span>
                  <span className="fin-total-v">{fmtUZS(totalSpent)}</span>
                </div>
                {totalBudget > 0 && (
                  <div className="fin-total-cell">
                    <span className="fin-total-l">{over ? 'Over' : 'Remaining'}</span>
                    <span className="fin-total-v" style={{ color: c }}>
                      {over ? `+${fmtUZS(Math.abs(diff))} · +${Math.round(pct! - 100)}%` : `${fmtUZS(diff)} · ${Math.round(pct!)}%`}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <p className="text-[11px] text-slate-500 font-mono -mt-2">
          Type a budget for any project and press Enter. Spend = salaries + expenses.
        </p>
        <div className="space-y-3">
          {agg?.budgetStatus.map((b) => {
            const editing = budgetEdits[b.project] ?? (b.budget != null ? String(b.budget) : '');
            const pct = b.pct;
            const barColor = b.over ? '#ff3366' : pct != null && pct > 85 ? '#ff9f1c' : '#00ffaa';
            const isEx = excluded.has(b.project);
            return (
              <div key={b.project} className="fin-budget-row" style={isEx ? { opacity: 0.4 } : undefined}>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => toggleExclude(b.project)}
                    title={isEx ? 'Restore to totals' : 'Exclude from totals & report'}
                    className={isEx ? 'fin-restore' : 'fin-del'}
                  >
                    {isEx ? '↺' : '✕'}
                  </button>
                  <span className="fin-proj-chip shrink-0" style={{ color: colorFor(b.project, projectNames), borderColor: `${colorFor(b.project, projectNames)}55` }}>
                    {b.project}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Budget</span>
                  <input
                    type="number"
                    value={editing}
                    onChange={(e) => setBudgetEdits((m) => ({ ...m, [b.project]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveBudget(b.project); }}
                    onBlur={() => { if (budgetEdits[b.project] != null) saveBudget(b.project); }}
                    placeholder="—"
                    className="fin-input !py-1 w-32 text-right"
                  />
                </div>
                <div className="fin-budget-bar-wrap">
                  <div className="fin-bar-track">
                    <div className="fin-bar-fill" style={{ width: `${pct == null ? 0 : Math.min(pct, 100)}%`, background: barColor, boxShadow: `0 0 10px ${barColor}66` }} />
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="font-mono text-xs text-slate-200 tabular-nums">{fmtM(b.spent)}</span>
                  {b.budget != null && b.budget > 0 && (
                    <span className="font-mono text-[10px] ml-2" style={{ color: barColor }}>
                      {b.over
                        ? `over ${fmtM(Math.abs(b.remaining!))} · +${Math.round(pct! - 100)}%`
                        : `${fmtM(b.remaining!)} left · ${Math.round(pct!)}% used`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by project */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-200">Spend by Project</h3>
          <div className="space-y-3">
            {view?.byProject.map((p) => (
              <div key={p.project} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">{p.project}</span>
                  <span className="font-mono tabular-nums text-slate-400">{fmtM(p.amount)}</span>
                </div>
                <div className="fin-bar-track">
                  <div
                    className="fin-bar-fill"
                    style={{
                      width: `${(p.amount / projMax) * 100}%`,
                      background: colorFor(p.project, projectNames),
                      boxShadow: `0 0 10px ${colorFor(p.project, projectNames)}66`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-200">Monthly Spend Trend</h3>
          <div className="fin-trend">
            {view?.byMonth.map((m) => (
              <div key={m.month} className="fin-trend-col" title={`${monthKeyLabel(m.month)} · ${fmtUZS(m.amount)} UZS`}>
                <span className="fin-trend-val">{fmtM(m.amount)}</span>
                <div className="fin-trend-bar" style={{ height: `${Math.max((m.amount / monthMax) * 100, 4)}%` }} />
                <span className="fin-trend-label">{m.month.split('-')[1]}/{m.month.slice(2, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD ENTRY */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-extrabold text-base text-slate-200">Add Salary Entry</h3>
        <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
          <label className="fin-field">
            <span className="fin-flabel">Year</span>
            <input type="number" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: Number(e.target.value) })} className="fin-input" />
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Month</span>
            <select value={form.period_month} onChange={(e) => setForm({ ...form, period_month: Number(e.target.value) })} className="fin-input">
              {MONTH_LABELS.slice(1).map((m, i) => (
                <option key={i} value={i + 1} className="bg-[#020408]">{m}</option>
              ))}
            </select>
          </label>
          <label className="fin-field col-span-2">
            <span className="fin-flabel">Employee</span>
            <input required value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} className="fin-input" placeholder="Name" />
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Project</span>
            <input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="fin-input" placeholder="Magnit" list="fin-projects" />
            <datalist id="fin-projects">{projectNames.map((p) => <option key={p} value={p} />)}</datalist>
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Amount UZS</span>
            <input required type="number" value={form.amount_uzs} onChange={(e) => setForm({ ...form, amount_uzs: e.target.value })} className="fin-input" placeholder="0" />
          </label>
          <button type="submit" disabled={saving} className="hud-diagnostic h-[38px]">
            {saving ? '…' : '＋ ADD'}
          </button>
        </form>
      </div>

      {/* LEDGER TABLE */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-extrabold text-base text-slate-200">Salary Ledger</h3>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="fin-input max-w-[180px]">
            <option value="all" className="bg-[#020408]">All months ({rows.length})</option>
            {months.map((m) => (
              <option key={m} value={m} className="bg-[#020408]">{monthKeyLabel(m)}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Period</th><th>Employee</th><th>Position</th><th>Project</th><th className="text-right">Amount UZS</th><th>Src</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono whitespace-nowrap">{MONTH_LABELS[r.period_month]} {String(r.period_year).slice(2)}</td>
                  <td className="text-slate-200">{r.employee_name}</td>
                  <td className="text-slate-500 max-w-[220px] truncate">{r.position}</td>
                  <td>
                    <span className="fin-proj-chip" style={{ color: colorFor(r.project, projectNames), borderColor: `${colorFor(r.project, projectNames)}55` }}>
                      {r.project}
                    </span>
                  </td>
                  <td className="text-right font-mono tabular-nums text-slate-200">{fmtUZS(r.amount_uzs)}</td>
                  <td className="text-[9px] font-mono text-slate-600 uppercase">{r.source}</td>
                  <td className="text-right">
                    <button onClick={() => remove(r)} title="Delete row" className="fin-del">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && !loading && (
            <p className="text-center text-xs text-slate-600 py-6">No entries for this filter.</p>
          )}
        </div>
      </div>

      {/* ADD EXPENSE (non-salary costs) */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-extrabold text-base text-slate-200">Add Expense · Other Costs</h3>
        <form onSubmit={submitExpense} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <label className="fin-field">
            <span className="fin-flabel">Spent date</span>
            <input required type="date" value={expForm.spent_date} onChange={(e) => setExpForm({ ...expForm, spent_date: e.target.value })} className="fin-input" />
          </label>
          <label className="fin-field col-span-2">
            <span className="fin-flabel">Purpose · nima uchun</span>
            <input required value={expForm.purpose} onChange={(e) => setExpForm({ ...expForm, purpose: e.target.value })} className="fin-input" placeholder="Server, laptop, subscription…" />
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Spender · kim</span>
            <input value={expForm.spender} onChange={(e) => setExpForm({ ...expForm, spender: e.target.value })} className="fin-input" placeholder="Name" />
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Project</span>
            <input value={expForm.project} onChange={(e) => setExpForm({ ...expForm, project: e.target.value })} className="fin-input" placeholder="General" list="fin-projects" />
          </label>
          <label className="fin-field">
            <span className="fin-flabel">Amount UZS</span>
            <input required type="number" value={expForm.amount_uzs} onChange={(e) => setExpForm({ ...expForm, amount_uzs: e.target.value })} className="fin-input" placeholder="0" />
          </label>
          <label className="fin-field col-span-2 md:col-span-5">
            <span className="fin-flabel">Comment</span>
            <input value={expForm.comment} onChange={(e) => setExpForm({ ...expForm, comment: e.target.value })} className="fin-input" placeholder="Optional note" />
          </label>
          <button type="submit" disabled={savingExp} className="hud-diagnostic h-[38px]">
            {savingExp ? '…' : '＋ ADD'}
          </button>
        </form>
      </div>

      {/* EXPENSE LEDGER */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-extrabold text-base text-slate-200">Expense Ledger · Other Costs</h3>
        <div className="overflow-x-auto">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Spent</th><th>Purpose</th><th>Spender</th><th>Project</th><th>Comment</th><th className="text-right">Amount UZS</th><th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((ex) => (
                <tr key={ex.id}>
                  <td className="font-mono whitespace-nowrap text-slate-400">{ex.spent_date}</td>
                  <td className="text-slate-200">{ex.purpose}</td>
                  <td className="text-slate-400">{ex.spender}</td>
                  <td>
                    <span className="fin-proj-chip" style={{ color: colorFor(ex.project, projectNames), borderColor: `${colorFor(ex.project, projectNames)}55` }}>
                      {ex.project}
                    </span>
                  </td>
                  <td className="text-slate-500 max-w-[220px] truncate">{ex.comment}</td>
                  <td className="text-right font-mono tabular-nums text-slate-200">{fmtUZS(ex.amount_uzs)}</td>
                  <td className="text-right">
                    <button onClick={() => removeExpense(ex)} title="Delete" className="fin-del">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && !loading && (
            <p className="text-center text-xs text-slate-600 py-6">No other expenses yet — add one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
