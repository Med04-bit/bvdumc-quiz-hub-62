-- Event type enum
DO $$ BEGIN
  CREATE TYPE public.event_mode AS ENUM ('ONLINE','OFFLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.round_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.result_visibility AS ENUM ('IMMEDIATE','AFTER_EVENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_mode public.event_mode NOT NULL DEFAULT 'OFFLINE',
  ADD COLUMN IF NOT EXISTS online_platform text,
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz;

ALTER TABLE public.event_rounds
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_marking numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_backward_navigation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_answer_change boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS result_visibility public.result_visibility NOT NULL DEFAULT 'AFTER_EVENT',
  ADD COLUMN IF NOT EXISTS status public.round_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Organiser check (leadership + admins)
CREATE OR REPLACE FUNCTION public.is_organiser(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','PRESIDENT','VICE_PRESIDENT','IT_LOGISTICS_HEAD',
                   'CREATIVE_HEAD','PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_organiser(uuid) FROM PUBLIC, anon;

DROP POLICY IF EXISTS events_admin_manage ON public.events;
CREATE POLICY events_organiser_manage ON public.events FOR ALL TO authenticated
  USING (public.is_organiser(auth.uid())) WITH CHECK (public.is_organiser(auth.uid()));

DROP POLICY IF EXISTS event_rounds_admin_manage ON public.event_rounds;
CREATE POLICY event_rounds_organiser_manage ON public.event_rounds FOR ALL TO authenticated
  USING (public.is_organiser(auth.uid())) WITH CHECK (public.is_organiser(auth.uid()));

CREATE INDEX IF NOT EXISTS event_rounds_event_order_idx ON public.event_rounds (event_id, round_order);