-- ============================================================
--  Repurpose AI Full Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → Run
--  Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================


-- ─── PROFILES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT,
  content_type             TEXT,
  output_goal              TEXT,
  plan                     TEXT        NOT NULL DEFAULT 'free',
  projects_used_this_month INTEGER     NOT NULL DEFAULT 0,
  onboarding_completed     BOOLEAN     NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── PROJECTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  source_type      TEXT        NOT NULL DEFAULT 'youtube'
                               CHECK (source_type IN ('youtube', 'upload', 'paste')),
  source_url       TEXT,
  file_path        TEXT,
  transcript       TEXT,
  selected_outputs TEXT[]      NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'processing', 'completed', 'error')),
  output_count     INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view own projects') THEN
    CREATE POLICY "Users can view own projects"   ON public.projects FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can create own projects') THEN
    CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects') THEN
    CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete own projects') THEN
    CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─── PROJECT OUTPUTS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_outputs (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  format_type  TEXT        NOT NULL,
  content      TEXT        NOT NULL DEFAULT '',
  tone         TEXT        NOT NULL DEFAULT 'professional'
                           CHECK (tone IN ('professional', 'casual', 'punchy')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_outputs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_outputs' AND policyname = 'Users can view own project outputs') THEN
    CREATE POLICY "Users can view own project outputs" ON public.project_outputs
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_outputs.project_id AND projects.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_outputs' AND policyname = 'Users can insert own project outputs') THEN
    CREATE POLICY "Users can insert own project outputs" ON public.project_outputs
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_outputs.project_id AND projects.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_outputs' AND policyname = 'Users can update own project outputs') THEN
    CREATE POLICY "Users can update own project outputs" ON public.project_outputs
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_outputs.project_id AND projects.user_id = auth.uid())
      );
  END IF;
END $$;


-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at        ON public.profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at        ON public.projects;
DROP TRIGGER IF EXISTS update_project_outputs_updated_at ON public.project_outputs;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_outputs_updated_at
  BEFORE UPDATE ON public.project_outputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_user_id           ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status            ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at        ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_outputs_project_id ON public.project_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id                ON public.profiles(id);

-- Required for upsert in generate-content edge function
CREATE UNIQUE INDEX IF NOT EXISTS project_outputs_project_format_unique
  ON public.project_outputs (project_id, format_type);


-- ─── STORAGE ─────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own files') THEN
    CREATE POLICY "Users can upload own files" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view own files') THEN
    CREATE POLICY "Users can view own files" ON storage.objects
      FOR SELECT USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
