
-- Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'maintenance_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'regional_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'maintenance_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_verification';

-- Create regions table
CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view regions" ON public.regions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert regions" ON public.regions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update regions" ON public.regions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete regions" ON public.regions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add region_id to stores
ALTER TABLE public.stores ADD COLUMN region_id uuid REFERENCES public.regions(id);

-- Add workflow fields to complaints
ALTER TABLE public.complaints ADD COLUMN flow_type text; -- 'internal' or 'external'
ALTER TABLE public.complaints ADD COLUMN current_stage integer NOT NULL DEFAULT 1;

-- Update default status for new complaints
ALTER TABLE public.complaints ALTER COLUMN status SET DEFAULT 'Submitted';

-- Create workflow actions log
CREATE TABLE public.workflow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  stage integer NOT NULL,
  action text NOT NULL,
  actor_id uuid NOT NULL,
  actor_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view workflow actions" ON public.workflow_actions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Actors can insert workflow actions" ON public.workflow_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());
