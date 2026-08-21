-- ============================================================
--  Repurpose AI - Database Schema
--  Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
--  Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ─── PROFILES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT,
  plan                     TEXT        NOT NULL DEFAULT 'free',
  stripe_customer_id       TEXT,
  projects_used_this_month INTEGER     NOT NULL DEFAULT 0,
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


-- ─── PROJECTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  source_type      TEXT        NOT NULL DEFAULT 'paste',
  transcript       TEXT,
  selected_outputs TEXT[]      NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'completed',
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


-- ─── SUBSCRIPTIONS ───────────────────────────────────────────
-- All writes are done server-side via service role (Stripe webhook).
-- Users can only read their own subscription.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        UNIQUE,
  stripe_customer_id     TEXT,
  status                 TEXT        NOT NULL DEFAULT 'incomplete',
  plan_id                TEXT        NOT NULL DEFAULT 'free',
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscription') THEN
    CREATE POLICY "Users can view own subscription" ON public.subscriptions
      FOR SELECT USING (auth.uid() = user_id);
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

DROP TRIGGER IF EXISTS update_profiles_updated_at     ON public.profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at     ON public.projects;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────

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


-- ─── ACCOUNT DELETION ────────────────────────────────────────
-- Called client-side via supabase.rpc('delete_user')

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;


-- ─── ATOMIC USAGE INCREMENT ──────────────────────────────────
-- Returns new count or raises exception if limit reached.
-- Limits: free=5, creator/pro=unlimited (9999)

CREATE OR REPLACE FUNCTION public.increment_projects_used(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT
    CASE plan
      WHEN 'pro'     THEN 9999
      WHEN 'creator' THEN 9999
      ELSE 5
    END INTO max_limit
  FROM public.profiles
  WHERE id = user_id;

  UPDATE public.profiles
  SET projects_used_this_month = projects_used_this_month + 1
  WHERE id = user_id
    AND projects_used_this_month < max_limit
  RETURNING projects_used_this_month INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Monthly generation limit reached' USING ERRCODE = 'LM001';
  END IF;

  RETURN new_count;
END;
$$;


-- ─── MONTHLY USAGE RESET ─────────────────────────────────────
-- Called via cron (api/keep-alive or external scheduler)

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET projects_used_this_month = 0;
END;
$$;


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_user_id                    ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at                 ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id               ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status                ON public.subscriptions(status);
