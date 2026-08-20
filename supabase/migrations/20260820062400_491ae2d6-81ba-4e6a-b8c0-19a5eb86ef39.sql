-- ============ enum for academic divisions ============
DO $$ BEGIN
  CREATE TYPE public.academic_division AS ENUM ('PRE_CLINICAL','PARA_CLINICAL','CLINICAL','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ subjects ============
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  division public.academic_division NOT NULL DEFAULT 'OTHER',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, parent_topic_id, name)
);
CREATE INDEX IF NOT EXISTS topics_subject_idx ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS topics_parent_idx ON public.topics(parent_topic_id);

-- ============ question columns ============
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtopic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS negative_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

CREATE INDEX IF NOT EXISTS questions_status_idx ON public.questions(status);
CREATE INDEX IF NOT EXISTS questions_subject_idx ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS questions_topic_idx ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS questions_created_by_idx ON public.questions(created_by);
CREATE INDEX IF NOT EXISTS questions_tags_idx ON public.questions USING gin(tags);
CREATE INDEX IF NOT EXISTS questions_created_at_idx ON public.questions(created_at DESC);

-- ============ version history ============
CREATE TABLE IF NOT EXISTS public.question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  status public.question_status NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_versions_question_idx
  ON public.question_versions(question_id, created_at DESC);

-- ============ usage tracking ============
CREATE TABLE IF NOT EXISTS public.question_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  round_id uuid REFERENCES public.event_rounds(id) ON DELETE SET NULL,
  version_number integer,
  used_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_usage_question_idx ON public.question_usage(question_id);
CREATE INDEX IF NOT EXISTS question_usage_event_idx ON public.question_usage(event_id);

ALTER TABLE public.question_reviews
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

-- ============ role helpers ============
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('SUPER_ADMIN','ADMIN','FOUNDER'));
$$;

CREATE OR REPLACE FUNCTION public.is_senior_leadership(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','FOUNDER','PRESIDENT','VICE_PRESIDENT'));
$$;

CREATE OR REPLACE FUNCTION public.is_organiser(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','FOUNDER','PRESIDENT','VICE_PRESIDENT','IT_LOGISTICS_HEAD',
                   'CREATIVE_HEAD','PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD')
  );
$$;

-- who may see the internal question bank at all (never participants/volunteers)
CREATE OR REPLACE FUNCTION public.can_access_question_bank(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','FOUNDER','PRESIDENT','VICE_PRESIDENT',
                   'PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD',
                   'QUESTION_SETTER','QUESTION_REVIEWER','QUIZMASTER')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_author_questions(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SUPER_ADMIN','ADMIN','FOUNDER','PRESIDENT','VICE_PRESIDENT',
                   'PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD','QUESTION_SETTER')
  );
$$;

-- division head mapping: can this user review questions in this division?
CREATE OR REPLACE FUNCTION public.can_review_division(_user_id uuid, _division public.academic_division)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_senior_leadership(_user_id)
      OR public.has_role(_user_id, 'QUESTION_REVIEWER')
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ((_division = 'PRE_CLINICAL'  AND ur.role = 'PRE_CLINICAL_HEAD')
            OR (_division = 'PARA_CLINICAL' AND ur.role = 'PARA_CLINICAL_HEAD')
            OR (_division = 'CLINICAL'      AND ur.role = 'CLINICAL_HEAD'))
      );
$$;

CREATE OR REPLACE FUNCTION public.can_review_question(_user_id uuid, _question_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_senior_leadership(_user_id)
      OR public.has_role(_user_id, 'QUESTION_REVIEWER')
      OR EXISTS (
        SELECT 1
        FROM public.questions q
        JOIN public.subjects s ON s.id = q.subject_id
        WHERE q.id = _question_id
          AND public.can_review_division(_user_id, s.division)
      );
$$;

REVOKE EXECUTE ON FUNCTION public.is_senior_leadership(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_question_bank(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_author_questions(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_review_division(uuid, public.academic_division) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_review_question(uuid, uuid) FROM anon, authenticated;

-- ============ versioning triggers ============
CREATE OR REPLACE FUNCTION public.questions_version_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE content_changed boolean;
BEGIN
  content_changed := (NEW.question_text IS DISTINCT FROM OLD.question_text)
    OR (NEW.question_type IS DISTINCT FROM OLD.question_type)
    OR (NEW.options IS DISTINCT FROM OLD.options)
    OR (NEW.correct_answers IS DISTINCT FROM OLD.correct_answers)
    OR (NEW.correct_answer IS DISTINCT FROM OLD.correct_answer)
    OR (NEW.explanation IS DISTINCT FROM OLD.explanation)
    OR (NEW.points IS DISTINCT FROM OLD.points)
    OR (NEW.negative_marks IS DISTINCT FROM OLD.negative_marks)
    OR (NEW.subject_id IS DISTINCT FROM OLD.subject_id)
    OR (NEW.topic_id IS DISTINCT FROM OLD.topic_id)
    OR (NEW.subtopic_id IS DISTINCT FROM OLD.subtopic_id)
    OR (NEW.difficulty IS DISTINCT FROM OLD.difficulty)
    OR (NEW.tags IS DISTINCT FROM OLD.tags)
    OR (NEW.source_reference IS DISTINCT FROM OLD.source_reference);

  -- editing an approved question starts a fresh draft version; history is kept
  IF content_changed AND OLD.status = 'APPROVED' AND NEW.status = OLD.status THEN
    NEW.version_number := OLD.version_number + 1;
    NEW.status := 'DRAFT';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.submitted_at := NULL;
  END IF;

  IF NEW.status = 'SUBMITTED' AND OLD.status IS DISTINCT FROM 'SUBMITTED' THEN
    NEW.submitted_at := now();
  END IF;

  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS questions_version_guard ON public.questions;
CREATE TRIGGER questions_version_guard BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.questions_version_guard();

CREATE OR REPLACE FUNCTION public.questions_snapshot()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.version_number = OLD.version_number
     AND NEW.status = OLD.status
     AND to_jsonb(NEW) - 'updated_at' - 'updated_by' = to_jsonb(OLD) - 'updated_at' - 'updated_by' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.question_versions (question_id, version_number, status, snapshot, changed_by)
  VALUES (NEW.id, NEW.version_number, NEW.status, to_jsonb(NEW), COALESCE(auth.uid(), NEW.created_by));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS questions_snapshot ON public.questions;
CREATE TRIGGER questions_snapshot AFTER INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.questions_snapshot();

DROP TRIGGER IF EXISTS subjects_updated_at ON public.subjects;
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS topics_updated_at ON public.topics;
CREATE TRIGGER topics_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ grants ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
GRANT SELECT, INSERT ON public.question_versions TO authenticated;
GRANT ALL ON public.question_versions TO service_role;
GRANT SELECT, INSERT ON public.question_usage TO authenticated;
GRANT ALL ON public.question_usage TO service_role;

-- ============ RLS ============
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subjects_select ON public.subjects;
CREATE POLICY subjects_select ON public.subjects FOR SELECT TO authenticated
  USING (public.can_access_question_bank(auth.uid()));
DROP POLICY IF EXISTS subjects_manage ON public.subjects;
CREATE POLICY subjects_manage ON public.subjects FOR ALL TO authenticated
  USING (public.is_senior_leadership(auth.uid()))
  WITH CHECK (public.is_senior_leadership(auth.uid()));

DROP POLICY IF EXISTS topics_select ON public.topics;
CREATE POLICY topics_select ON public.topics FOR SELECT TO authenticated
  USING (public.can_access_question_bank(auth.uid()));
DROP POLICY IF EXISTS topics_manage ON public.topics;
CREATE POLICY topics_manage ON public.topics FOR ALL TO authenticated
  USING (public.is_senior_leadership(auth.uid())
      OR public.has_any_role(auth.uid(), ARRAY['PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD']::app_role[]))
  WITH CHECK (public.is_senior_leadership(auth.uid())
      OR public.has_any_role(auth.uid(), ARRAY['PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD']::app_role[]));

DROP POLICY IF EXISTS question_versions_select ON public.question_versions;
CREATE POLICY question_versions_select ON public.question_versions FOR SELECT TO authenticated
  USING (
    public.can_access_question_bank(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
        AND (q.created_by = auth.uid()
             OR public.is_senior_leadership(auth.uid())
             OR public.can_review_question(auth.uid(), q.id)
             OR public.has_role(auth.uid(), 'QUIZMASTER'))
    )
  );

DROP POLICY IF EXISTS question_usage_select ON public.question_usage;
CREATE POLICY question_usage_select ON public.question_usage FOR SELECT TO authenticated
  USING (public.can_access_question_bank(auth.uid()));
DROP POLICY IF EXISTS question_usage_insert ON public.question_usage;
CREATE POLICY question_usage_insert ON public.question_usage FOR INSERT TO authenticated
  WITH CHECK (public.is_organiser(auth.uid()) OR public.has_role(auth.uid(), 'QUIZMASTER'));

-- questions: rebuild policies
DROP POLICY IF EXISTS questions_admin_manage ON public.questions;
DROP POLICY IF EXISTS questions_insert_setters ON public.questions;
DROP POLICY IF EXISTS questions_select_authorized ON public.questions;
DROP POLICY IF EXISTS questions_update_own_draft ON public.questions;

CREATE POLICY questions_select ON public.questions FOR SELECT TO authenticated
  USING (
    public.can_access_question_bank(auth.uid())
    AND (
      created_by = auth.uid()
      OR public.is_senior_leadership(auth.uid())
      OR public.has_any_role(auth.uid(), ARRAY['QUESTION_REVIEWER','QUIZMASTER','PRE_CLINICAL_HEAD','PARA_CLINICAL_HEAD','CLINICAL_HEAD']::app_role[])
    )
  );

CREATE POLICY questions_insert ON public.questions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.can_author_questions(auth.uid()));

CREATE POLICY questions_update_author ON public.questions FOR UPDATE TO authenticated
  USING (created_by = auth.uid()
         AND status = ANY (ARRAY['DRAFT','SUBMITTED','CHANGES_REQUESTED','REJECTED','APPROVED']::question_status[]))
  WITH CHECK (created_by = auth.uid());

CREATE POLICY questions_update_reviewer ON public.questions FOR UPDATE TO authenticated
  USING (public.can_review_question(auth.uid(), id))
  WITH CHECK (public.can_review_question(auth.uid(), id));

CREATE POLICY questions_delete_admin ON public.questions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- reviews: reviewers scoped by division
DROP POLICY IF EXISTS question_reviews_insert_reviewers ON public.question_reviews;
DROP POLICY IF EXISTS question_reviews_select_authorized ON public.question_reviews;
DROP POLICY IF EXISTS question_reviews_admin_manage ON public.question_reviews;

CREATE POLICY question_reviews_insert ON public.question_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND public.can_review_question(auth.uid(), question_id));

CREATE POLICY question_reviews_select ON public.question_reviews FOR SELECT TO authenticated
  USING (
    public.can_access_question_bank(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
        AND (q.created_by = auth.uid()
             OR public.is_senior_leadership(auth.uid())
             OR public.can_review_question(auth.uid(), q.id))
    )
  );

-- ============ seed subjects ============
INSERT INTO public.subjects (name, code, division, sort_order) VALUES
  ('Anatomy','ANAT','PRE_CLINICAL',10),
  ('Physiology','PHYS','PRE_CLINICAL',20),
  ('Biochemistry','BIOC','PRE_CLINICAL',30),
  ('Pathology','PATH','PARA_CLINICAL',40),
  ('Pharmacology','PHAR','PARA_CLINICAL',50),
  ('Microbiology','MICR','PARA_CLINICAL',60),
  ('Forensic Medicine','FMT','PARA_CLINICAL',70),
  ('Community Medicine','CM','PARA_CLINICAL',80),
  ('Medicine','MED','CLINICAL',90),
  ('Surgery','SURG','CLINICAL',100),
  ('Pediatrics','PEDS','CLINICAL',110),
  ('Obstetrics & Gynaecology','OBGY','CLINICAL',120),
  ('Orthopaedics','ORTHO','CLINICAL',130),
  ('ENT','ENT','CLINICAL',140),
  ('Ophthalmology','OPHTH','CLINICAL',150),
  ('Dermatology','DERM','CLINICAL',160),
  ('Psychiatry','PSY','CLINICAL',170),
  ('Radiology','RADIO','CLINICAL',180),
  ('Anaesthesiology','ANAES','CLINICAL',190)
ON CONFLICT (name) DO NOTHING;