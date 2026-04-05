-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_outputs_project_id ON public.project_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
