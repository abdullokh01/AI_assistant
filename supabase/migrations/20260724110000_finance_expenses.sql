-- Finance: general (non-salary) expenses ledger.
-- Salaries live in finance_salaries; this table is for everything else —
-- equipment, subscriptions, one-off purchases, etc.

CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spent_date DATE NOT NULL,                 -- ishlatilgan sana
    purpose TEXT NOT NULL,                     -- nima uchun
    spender TEXT,                              -- kim ishlatdi
    project TEXT NOT NULL DEFAULT 'General',
    amount_uzs NUMERIC NOT NULL DEFAULT 0,     -- qancha
    comment TEXT,                              -- comment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,  -- create date
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.finance_expenses(spent_date);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.finance_expenses(project);

DROP TRIGGER IF EXISTS trigger_update_expenses ON public.finance_expenses;
CREATE TRIGGER trigger_update_expenses BEFORE UPDATE ON public.finance_expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
