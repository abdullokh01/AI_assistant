-- Finance: per-project budget. One row per project; spend (salaries + expenses)
-- is compared against budget_uzs to show over/under.

CREATE TABLE IF NOT EXISTS public.finance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project TEXT NOT NULL UNIQUE,
    budget_uzs NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS trigger_update_budgets ON public.finance_budgets;
CREATE TRIGGER trigger_update_budgets BEFORE UPDATE ON public.finance_budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
