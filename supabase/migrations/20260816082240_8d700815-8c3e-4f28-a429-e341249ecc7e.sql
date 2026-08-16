-- ENUMS
CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','IT_LOGISTICS_HEAD','QUESTION_SETTER','QUESTION_REVIEWER','QUIZMASTER','SCOREKEEPER','VOLUNTEER','PARTICIPANT');
CREATE TYPE public.event_status AS ENUM ('DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','COMPLETED','ARCHIVED');
CREATE TYPE public.question_status AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED');
CREATE TYPE public.question_type AS ENUM ('MCQ','TRUE_FALSE','SHORT_ANSWER','IMAGE_BASED','BUZZER');
CREATE TYPE public.difficulty_level AS ENUM ('EASY','MEDIUM','HARD');
CREATE TYPE public.registration_status AS ENUM ('PENDING','CONFIRMED','WAITLISTED','CANCELLED');
CREATE TYPE public.review_verdict AS ENUM ('APPROVED','REJECTED','NEEDS_REVISION');

-- COMMON TRIGGER FN
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  institution TEXT DEFAULT 'Bharati Vidyapeeth Deemed University Medical College, Pune',
  year_of_study TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('SUPER_ADMIN','ADMIN'));
$$;

-- profile/role policies
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- auto profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'PARTICIPANT') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  status public.event_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_time_order CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(event_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "events_select_authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_admin_manage" ON public.events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- EVENT ROUNDS
CREATE TABLE public.event_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round_order INTEGER NOT NULL DEFAULT 1 CHECK (round_order > 0),
  round_type TEXT,
  question_count INTEGER NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, round_order)
);
CREATE INDEX idx_event_rounds_event ON public.event_rounds(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rounds TO authenticated;
GRANT ALL ON public.event_rounds TO service_role;
ALTER TABLE public.event_rounds ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_rounds_updated_at BEFORE UPDATE ON public.event_rounds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "event_rounds_select_authenticated" ON public.event_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_rounds_admin_manage" ON public.event_rounds FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- PARTICIPANTS
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  college TEXT,
  year_of_study TEXT,
  status public.registration_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_participants_event ON public.participants(event_id);
CREATE INDEX idx_participants_user ON public.participants(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "participants_select_authenticated" ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "participants_admin_manage" ON public.participants FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- TEAMS
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, name)
);
CREATE INDEX idx_teams_event ON public.teams(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "teams_select_authenticated" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_admin_manage" ON public.teams FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  is_captain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, participant_id)
);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_select_authenticated" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_admin_manage" ON public.team_members FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- QUESTIONS
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  round_id UUID REFERENCES public.event_rounds(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type public.question_type NOT NULL DEFAULT 'MCQ',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  explanation TEXT,
  subject TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'MEDIUM',
  status public.question_status NOT NULL DEFAULT 'DRAFT',
  points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_status ON public.questions(status);
CREATE INDEX idx_questions_created_by ON public.questions(created_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "questions_select_authorized" ON public.questions FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','QUESTION_REVIEWER','QUIZMASTER']::public.app_role[]));
CREATE POLICY "questions_insert_setters" ON public.questions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','QUESTION_SETTER']::public.app_role[]));
CREATE POLICY "questions_update_own_draft" ON public.questions FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND status IN ('DRAFT','REJECTED')) WITH CHECK (created_by = auth.uid());
CREATE POLICY "questions_admin_manage" ON public.questions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- QUESTION REVIEWS
CREATE TABLE public.question_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verdict public.review_verdict NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_question_reviews_question ON public.question_reviews(question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_reviews TO authenticated;
GRANT ALL ON public.question_reviews TO service_role;
ALTER TABLE public.question_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_reviews_select_authorized" ON public.question_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','QUESTION_REVIEWER']::public.app_role[]));
CREATE POLICY "question_reviews_insert_reviewers" ON public.question_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','QUESTION_REVIEWER']::public.app_role[]));
CREATE POLICY "question_reviews_admin_manage" ON public.question_reviews FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- SCORES
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.event_rounds(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  points NUMERIC(10,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scores_subject_present CHECK (participant_id IS NOT NULL OR team_id IS NOT NULL)
);
CREATE INDEX idx_scores_event ON public.scores(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER scores_updated_at BEFORE UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "scores_select_authenticated" ON public.scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "scores_manage_scorekeepers" ON public.scores FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','SCOREKEEPER','QUIZMASTER']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','SCOREKEEPER','QUIZMASTER']::public.app_role[]));

-- CERTIFICATES
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'PARTICIPATION',
  serial_number TEXT UNIQUE,
  issued_on DATE,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_certificates_event ON public.certificates(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "certificates_select_authenticated" ON public.certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "certificates_admin_manage" ON public.certificates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- VOLUNTEERS
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  duty TEXT,
  shift TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_volunteers_event ON public.volunteers(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT ALL ON public.volunteers TO service_role;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER volunteers_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "volunteers_select_authenticated" ON public.volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "volunteers_manage" ON public.volunteers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','IT_LOGISTICS_HEAD']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','IT_LOGISTICS_HEAD']::public.app_role[]));

-- LOGISTICS
CREATE TABLE public.logistics_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logistics_event ON public.logistics_items(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logistics_items TO authenticated;
GRANT ALL ON public.logistics_items TO service_role;
ALTER TABLE public.logistics_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER logistics_updated_at BEFORE UPDATE ON public.logistics_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "logistics_select_authenticated" ON public.logistics_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "logistics_manage" ON public.logistics_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','IT_LOGISTICS_HEAD']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['SUPER_ADMIN','ADMIN','IT_LOGISTICS_HEAD']::public.app_role[]));

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit_logs_insert_self" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());