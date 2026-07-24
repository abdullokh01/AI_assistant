-- Finance: monthly salary / spend ledger.
-- One row per employee per month. project drives the "spend by project" charts;
-- amount_uzs is the paid salary (Итоговый Оклад) in Uzbek som.

CREATE TABLE IF NOT EXISTS public.finance_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_year INT NOT NULL,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    employee_name TEXT NOT NULL,
    position TEXT,
    project TEXT NOT NULL DEFAULT 'Unassigned',
    status TEXT,
    amount_uzs NUMERIC NOT NULL DEFAULT 0,
    bonus_usd NUMERIC,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'excel')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_period
    ON public.finance_salaries(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_finance_project
    ON public.finance_salaries(project);

-- Keep updated_at fresh (function already exists from the init schema).
DROP TRIGGER IF EXISTS trigger_update_finance ON public.finance_salaries;
CREATE TRIGGER trigger_update_finance BEFORE UPDATE ON public.finance_salaries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prevent duplicate imports of the same person/month/project.
CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_row
    ON public.finance_salaries(period_year, period_month, employee_name, project);
