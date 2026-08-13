-- 1. Emergency live status
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS live_status text NOT NULL DEFAULT 'need_help';
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- 2. Location pings
CREATE TABLE IF NOT EXISTS public.location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_pings TO authenticated;
GRANT ALL ON public.location_pings TO service_role;
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pings" ON public.location_pings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS location_pings_emergency_idx ON public.location_pings(emergency_id, created_at DESC);

-- 3. Share links
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  emergency_id uuid REFERENCES public.emergencies(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'live',
  token text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_links TO authenticated;
GRANT ALL ON public.share_links TO service_role;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own share links" ON public.share_links FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Safety check-ins
CREATE TABLE IF NOT EXISTS public.safety_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  note text,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  confirmed_at timestamptz,
  emergency_id uuid REFERENCES public.emergencies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_checkins TO authenticated;
GRANT ALL ON public.safety_checkins TO service_role;
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.safety_checkins FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER safety_checkins_updated_at BEFORE UPDATE ON public.safety_checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Emergency notes
CREATE TABLE IF NOT EXISTS public.emergency_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_notes TO authenticated;
GRANT ALL ON public.emergency_notes TO service_role;
ALTER TABLE public.emergency_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.emergency_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER emergency_notes_updated_at BEFORE UPDATE ON public.emergency_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Blood donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  blood_group text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  last_donation_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_donors TO authenticated;
GRANT ALL ON public.blood_donors TO service_role;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors manage own listing" ON public.blood_donors FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Signed in users read available donors" ON public.blood_donors FOR SELECT TO authenticated
  USING (available = true);
CREATE TRIGGER blood_donors_updated_at BEFORE UPDATE ON public.blood_donors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Favorite places
CREATE TABLE IF NOT EXISTS public.favorite_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_key text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_places TO authenticated;
GRANT ALL ON public.favorite_places TO service_role;
ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorite_places FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Activity log
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activity" ON public.activity_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON public.activity_logs(user_id, created_at DESC);

-- 9. Public lookup functions for share links
CREATE OR REPLACE FUNCTION public.get_shared_location(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link public.share_links;
  em public.emergencies;
  prof public.profiles;
BEGIN
  SELECT * INTO link FROM public.share_links
    WHERE token = _token AND active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF link IS NULL OR link.emergency_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO em FROM public.emergencies WHERE id = link.emergency_id;
  SELECT * INTO prof FROM public.profiles WHERE id = link.user_id;
  IF em IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'full_name', COALESCE(prof.full_name, 'AEGIS user'),
    'type', em.type,
    'severity', em.severity,
    'status', em.status,
    'live_status', em.live_status,
    'latitude', em.latitude,
    'longitude', em.longitude,
    'address', em.address,
    'notes', em.notes,
    'started_at', em.started_at,
    'resolved_at', em.resolved_at,
    'location_updated_at', em.location_updated_at,
    'reference', upper(substring(em.id::text, 1, 8))
  );
END; $$;

CREATE OR REPLACE FUNCTION public.get_shared_profile(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link public.share_links;
  prof public.profiles;
BEGIN
  SELECT * INTO link FROM public.share_links
    WHERE token = _token AND active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF link IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = link.user_id;
  IF prof IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'full_name', prof.full_name,
    'avatar_url', prof.avatar_url,
    'date_of_birth', prof.date_of_birth,
    'gender', prof.gender,
    'blood_group', prof.blood_group,
    'allergies', prof.allergies,
    'medical_conditions', prof.medical_conditions,
    'medications', prof.medications,
    'home_address', prof.home_address,
    'current_city', prof.current_city,
    'phone', prof.phone,
    'contacts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', c.name, 'relationship', c.relationship, 'phone', c.phone) ORDER BY c.position)
      FROM public.emergency_contacts c WHERE c.user_id = prof.id
    ), '[]'::jsonb),
    'notes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('title', n.title, 'category', n.category, 'content', n.content) ORDER BY n.created_at)
      FROM public.emergency_notes n WHERE n.user_id = prof.id
    ), '[]'::jsonb)
  );
END; $$;

REVOKE ALL ON FUNCTION public.get_shared_location(text) FROM public;
REVOKE ALL ON FUNCTION public.get_shared_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_location(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_profile(text) TO anon, authenticated;