ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS is_guardian boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS emergency_contacts_one_guardian
  ON public.emergency_contacts (user_id) WHERE is_guardian;

ALTER TABLE public.location_pings ADD COLUMN IF NOT EXISTS speed double precision;
ALTER TABLE public.location_pings ADD COLUMN IF NOT EXISTS battery_level integer;

CREATE TABLE IF NOT EXISTS public.guardian_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  guardian_contact_id uuid REFERENCES public.emergency_contacts(id) ON DELETE SET NULL,
  guardian_name text NOT NULL,
  guardian_email text,
  guardian_phone text,
  token text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardian_sessions TO authenticated;
GRANT ALL ON public.guardian_sessions TO service_role;

ALTER TABLE public.guardian_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own guardian sessions" ON public.guardian_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER guardian_sessions_updated_at
  BEFORE UPDATE ON public.guardian_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_guardian_view(_emergency_id uuid, _token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sess public.guardian_sessions;
  em public.emergencies;
  prof public.profiles;
BEGIN
  SELECT * INTO sess FROM public.guardian_sessions
    WHERE token = _token
      AND emergency_id = _emergency_id
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF sess IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO em FROM public.emergencies WHERE id = sess.emergency_id;
  IF em IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = sess.user_id;

  RETURN jsonb_build_object(
    'guardian_name', sess.guardian_name,
    'full_name', COALESCE(prof.full_name, 'AEGIS user'),
    'avatar_url', prof.avatar_url,
    'user_phone', prof.phone,
    'blood_group', prof.blood_group,
    'emergency_id', em.id,
    'reference', upper(substring(em.id::text, 1, 8)),
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
    'duration_seconds', em.duration_seconds,
    'location_updated_at', em.location_updated_at,
    'expires_at', sess.expires_at,
    'timeline', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'label', e.label, 'detail', e.detail, 'created_at', e.created_at
      ) ORDER BY e.created_at)
      FROM public.emergency_events e WHERE e.emergency_id = em.id
    ), '[]'::jsonb),
    'track', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'latitude', p.latitude, 'longitude', p.longitude, 'accuracy', p.accuracy,
        'speed', p.speed, 'battery_level', p.battery_level, 'created_at', p.created_at
      ) ORDER BY p.created_at DESC)
      FROM (
        SELECT * FROM public.location_pings
        WHERE emergency_id = em.id ORDER BY created_at DESC LIMIT 50
      ) p
    ), '[]'::jsonb)
  );
END; $function$;

REVOKE ALL ON FUNCTION public.get_guardian_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guardian_view(uuid, text) TO anon, authenticated;