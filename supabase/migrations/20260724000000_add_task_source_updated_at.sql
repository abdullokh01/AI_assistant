-- Track when the SOURCE system (e.g. Trello) last changed a task.
--
-- tasks.updated_at is owned by the handle_updated_at() trigger and is bumped to
-- NOW() on every sync, so it cannot tell "moved to Done today" apart from "has
-- been Done since March". source_updated_at mirrors Trello's dateLastActivity
-- and is never touched by the trigger, which is what the daily report filters on.

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tasks_source_updated_at
    ON public.tasks(project_id, status, source_updated_at DESC);
