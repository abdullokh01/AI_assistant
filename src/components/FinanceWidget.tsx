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
interface Aggregates {
  total: number;
  salaryTotal: number;
  expenseTotal: number;
  byProject: { project: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
}

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Deterministic accent per project so bars/table read consistently.
const PROJECT_COLORS = ['#00e5ff', '#a855f7', '#00ffaa', '#ff9f1c', '#ff3366', '#4d7cff', '#f15bb5', '#8ac926'];
const colorFor = (name: string, list: string[]) => PROJECT_COLORS[list.indexOf(name) % PROJECT_COLORS.length];

const fmtUZS = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

export default function FinanceWidget() {
  const [rows, setRows] = useState<Row[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [agg, setAgg] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [savingExp, setSavingExp] = useState(false);

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

  const projMax = agg && agg.byProject.length ? agg.byProject[0].amount : 1;
  const monthMax = agg && agg.byMonth.length ? Math.max(...agg.byMonth.map((m) => m.amount)) : 1;

  return (
    <div className="space-y-6">
      {/* KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <span className="fin-kpi-label">Total Spend · All Time</span>
          <span className="fin-kpi-value">{agg ? fmtUZS(agg.total) : '—'}</span>
          <span className="fin-kpi-unit">
            {agg ? `UZS · payroll ${fmtM(agg.salaryTotal)} · other ${fmtM(agg.expenseTotal)}` : 'UZS'}
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

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by project */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-200">Spend by Project</h3>
          <div className="space-y-3">
            {agg?.byProject.map((p) => (
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
            {agg?.byMonth.map((m) => (
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
