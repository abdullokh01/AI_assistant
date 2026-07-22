-- Create Migration for AI Project Intelligence Platform Schema
-- Path: supabase/migrations/20260722000000_init_schema.sql

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. TABLES DEFINITIONS
-- =========================================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived', 'paused')),
    health_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL CHECK (health_score >= 0.00 AND health_score <= 100.00),
    confidence_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 100.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (project_id, user_id)
);

-- TELEGRAM CHATS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
    chat_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    is_connected BOOLEAN DEFAULT TRUE NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    sync_status TEXT DEFAULT 'idle' NOT NULL CHECK (sync_status IN ('idle', 'syncing', 'error')),
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EMAILS TABLE
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    message_id TEXT UNIQUE NOT NULL,
    thread_id TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT[] NOT NULL,
    subject TEXT,
    body TEXT,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    classification TEXT CHECK (classification IN ('Important', 'Client', 'Internal', 'Waiting Reply', 'Need Action')),
    response_draft TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRELLO BOARDS TABLE
CREATE TABLE IF NOT EXISTS public.trello_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
    trello_board_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    list_mappings JSONB DEFAULT '{}'::jsonb NOT NULL, -- e.g., {"listId1": "Todo", "listId2": "In Progress"}
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Todo' NOT NULL CHECK (status IN ('Todo', 'In Progress', 'QA', 'Done', 'Blocked')),
    source TEXT DEFAULT 'manual' NOT NULL CHECK (source IN ('manual', 'trello', 'telegram', 'email')),
    source_id TEXT, -- e.g., Trello Card ID, Telegram msg ID, Email msg ID
    assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    labels TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PROJECT MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.project_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Business Rules', 'Architecture', 'Requirements', 'Decisions', 
        'Known Issues', 'Stakeholders', 'Glossary', 'Sprint History', 'Client Preferences'
    )),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- DECISIONS TABLE
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    context TEXT,
    outcome TEXT NOT NULL,
    deciders TEXT[] DEFAULT '{}'::text[] NOT NULL,
    status TEXT DEFAULT 'agreed' NOT NULL CHECK (status IN ('proposed', 'agreed', 'superseded', 'rejected')),
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RISKS TABLE
CREATE TABLE IF NOT EXISTS public.risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'mitigated', 'triggered', 'closed')),
    mitigation_plan TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confidence_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 100.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- OPEN QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.open_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    raised_by TEXT,
    answered_by TEXT,
    answer TEXT,
    status TEXT DEFAULT 'Open' NOT NULL CHECK (status IN ('Open', 'Answered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    transcript TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('telegram', 'trello', 'email', 'meeting', 'general')),
    source_id TEXT, -- References specific email_id, task_id, or chat message
    observation TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'Inconsistency', 'Risk', 'Deadliness', 'Inactivity', 
        'Duplicate', 'Scope Creep', 'Communication Problems'
    )),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'resolved', 'ignored')),
    confidence_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 100.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    query TEXT,
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('inconsistency', 'risk', 'task', 'report', 'general')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    trigger_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Planning', 'Follow-up', 'Deadline', 'Waiting', 'Meeting', 'Custom')),
    status TEXT DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Sent', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- LEARNING LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.learning_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL CHECK (topic IN (
        'Project Management', 'Leadership', 'Negotiation', 'AI', 
        'Software Architecture', 'System Design', 'Product Thinking', 'CEO Thinking'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    duration_minutes INTEGER DEFAULT 15 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'PRD', 'SRS', 'TechSpec', 'MeetingMinutes', 'Proposal', 
        'CommercialOffer', 'Contract', 'SprintPlan', 'UserStories', 
        'AcceptanceCriteria', 'ReleaseNotes', 'TestCases', 'BugReports', 'ChangeRequests'
    )),
    status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'final', 'archived')),
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- GENERATED DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    generation_prompt TEXT,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g., 'AI Generated Report', 'Reminder Sent', 'Email Processed', etc.
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EVENT LOG TABLE
CREATE TABLE IF NOT EXISTS public.event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    key TEXT NOT NULL,
    value JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (project_id, key)
);

-- INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('telegram', 'email', 'trello')),
    credentials JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (project_id, type)
);

-- DAILY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    completed_tasks JSONB DEFAULT '[]'::jsonb NOT NULL,
    in_progress_tasks JSONB DEFAULT '[]'::jsonb NOT NULL,
    blocked_tasks JSONB DEFAULT '[]'::jsonb NOT NULL,
    risks JSONB DEFAULT '[]'::jsonb NOT NULL,
    waiting_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    decisions JSONB DEFAULT '[]'::jsonb NOT NULL,
    priorities JSONB DEFAULT '[]'::jsonb NOT NULL,
    questions_for_ceo JSONB DEFAULT '[]'::jsonb NOT NULL,
    health_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL,
    confidence_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (project_id, report_date)
);

-- WEEKLY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    accomplishments JSONB DEFAULT '[]'::jsonb NOT NULL,
    roadblocks JSONB DEFAULT '[]'::jsonb NOT NULL,
    next_week_plan JSONB DEFAULT '[]'::jsonb NOT NULL,
    health_trend JSONB DEFAULT '[]'::jsonb NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (project_id, report_date)
);


-- =========================================================================
-- 2. INDEXES DEFINITIONS
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_proj ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chats_chat ON public.telegram_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_emails_project ON public.emails(project_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON public.emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_trello_boards_board ON public.trello_boards(trello_board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_project ON public.project_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON public.decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_project ON public.risks(project_id);
CREATE INDEX IF NOT EXISTS idx_open_questions_project ON public.open_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON public.meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_project ON public.ai_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reminders_trigger ON public.reminders(trigger_at, status);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project ON public.activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_proj_date ON public.daily_reports(project_id, report_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_proj_date ON public.weekly_reports(project_id, report_date);


-- =========================================================================
-- 3. UPDATED_AT AUTO-UPDATE FUNCTION & TRIGGERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_telegram_chats BEFORE UPDATE ON public.telegram_chats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_emails BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_trello_boards BEFORE UPDATE ON public.trello_boards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_project_memory BEFORE UPDATE ON public.project_memory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_decisions BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_risks BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_open_questions BEFORE UPDATE ON public.open_questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_meetings BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_ai_observations BEFORE UPDATE ON public.ai_observations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_reminders BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_integrations BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =========================================================================
-- 4. HELPER FUNCTIONS FOR SECURITY (RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_project_member(project_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.project_members 
        WHERE project_members.project_id = is_project_member.project_id 
          AND project_members.user_id = is_project_member.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trello_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Policy for public.users
CREATE POLICY "Allow read access to public profiles" ON public.users
    FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy for public.projects
CREATE POLICY "Members can select project" ON public.projects
    FOR SELECT USING (public.is_project_member(id, auth.uid()));
CREATE POLICY "Admins/Owners can update project" ON public.projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = id 
              AND project_members.user_id = auth.uid()
              AND project_members.role IN ('owner', 'admin')
        )
    );

-- Policy for public.project_members
CREATE POLICY "Members can see who is in their project" ON public.project_members
    FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Admins/Owners can manage members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = project_members.project_id
              AND project_members.user_id = auth.uid()
              AND project_members.role IN ('owner', 'admin')
        )
    );

-- Policies for Project-dependent tables
-- This template applies to: telegram_chats, emails, trello_boards, tasks, project_memory, decisions, risks, open_questions, meetings, ai_observations, ai_feedback, notifications, reminders, documents, generated_documents, activity_log, event_log, settings, integrations, daily_reports, weekly_reports

CREATE POLICY "Members can select telegram chats" ON public.telegram_chats FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify telegram chats" ON public.telegram_chats FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select emails" ON public.emails FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify emails" ON public.emails FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select trello boards" ON public.trello_boards FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify trello boards" ON public.trello_boards FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select tasks" ON public.tasks FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify tasks" ON public.tasks FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select project memory" ON public.project_memory FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify project memory" ON public.project_memory FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select decisions" ON public.decisions FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify decisions" ON public.decisions FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select risks" ON public.risks FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify risks" ON public.risks FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select open questions" ON public.open_questions FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify open questions" ON public.open_questions FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select meetings" ON public.meetings FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify meetings" ON public.meetings FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select ai observations" ON public.ai_observations FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify ai observations" ON public.ai_observations FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select ai feedback" ON public.ai_feedback FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify ai feedback" ON public.ai_feedback FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select notifications" ON public.notifications FOR SELECT USING (public.is_project_member(project_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Members can modify notifications" ON public.notifications FOR ALL USING (public.is_project_member(project_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Members can select reminders" ON public.reminders FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify reminders" ON public.reminders FOR ALL USING (public.is_project_member(project_id, auth.uid()));

-- Policy for learning lessons (Available to all logged-in platform users)
CREATE POLICY "Anyone can read learning lessons" ON public.learning_lessons FOR SELECT USING (true);
CREATE POLICY "Only admins/system can manage learning lessons" ON public.learning_lessons FOR ALL USING (true);

CREATE POLICY "Members can select documents" ON public.documents FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify documents" ON public.documents FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select generated documents" ON public.generated_documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_id 
          AND public.is_project_member(d.project_id, auth.uid())
    )
);
CREATE POLICY "Members can modify generated documents" ON public.generated_documents FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_id 
          AND public.is_project_member(d.project_id, auth.uid())
    )
);

CREATE POLICY "Members can select activity logs" ON public.activity_log FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify activity logs" ON public.activity_log FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select event logs" ON public.event_log FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify event logs" ON public.event_log FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select settings" ON public.settings FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify settings" ON public.settings FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select integrations" ON public.integrations FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify integrations" ON public.integrations FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select daily reports" ON public.daily_reports FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify daily reports" ON public.daily_reports FOR ALL USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can select weekly reports" ON public.weekly_reports FOR SELECT USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can modify weekly reports" ON public.weekly_reports FOR ALL USING (public.is_project_member(project_id, auth.uid()));


-- =========================================================================
-- 6. VIEWS DEFINITIONS
-- =========================================================================

-- View summarizing Project health and count of active risks, inconsistencies, and blocked tasks
CREATE OR REPLACE VIEW public.project_health_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.health_score,
    p.confidence_score,
    p.status AS project_status,
    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'active'), 0) AS active_risks_count,
    COALESCE(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Blocked'), 0) AS blocked_tasks_count,
    COALESCE(COUNT(DISTINCT obs.id) FILTER (WHERE obs.status = 'pending' AND obs.type = 'Inconsistency'), 0) AS pending_inconsistencies_count,
    COALESCE(COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'Open'), 0) AS open_questions_count
FROM public.projects p
LEFT JOIN public.risks r ON r.project_id = p.id
LEFT JOIN public.tasks t ON t.project_id = p.id
LEFT JOIN public.ai_observations obs ON obs.project_id = p.id
LEFT JOIN public.open_questions q ON q.project_id = p.id
GROUP BY p.id;


-- =========================================================================
-- 7. REALTIME REPLICATION ENABLEMENT
-- =========================================================================

-- Enable realtime for specified tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
