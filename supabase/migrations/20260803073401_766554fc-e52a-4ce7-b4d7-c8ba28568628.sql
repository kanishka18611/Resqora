-- 1. Audit logging is only meaningful for a verified session; block anonymous callers.
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, jsonb, text) FROM anon;

-- 2. Token-gated public functions: reject implausible tokens before any lookup.
CREATE OR REPLACE FUNCTION public.get_shared_track(_token text)
 RETURNS TABLE(latitude double precision, longitude double precision, accuracy double precision, speed double precision, battery_level integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.latitude, p.longitude, p.accuracy, p.speed, p.battery_level, p.created_at
  FROM public.location_pings p
  JOIN public.share_links l ON l.emergency_id = p.emergency_id
  WHERE _token IS NOT NULL
    AND length(_token) >= 32
    AND l.token = _token
    AND l.active = true
    AND l.kind = 'live'
    AND (l.expires_at IS NULL OR l.expires_at > now())
  ORDER BY p.created_at DESC
  LIMIT 50;
$function$;

CREATE OR REPLACE FUNCTION public.get_shared_profile(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link public.share_links;
  prof public.profiles;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN NULL; END IF;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.get_shared_location(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link public.share_links;
  em public.emergencies;
  prof public.profiles;
  last_ping public.location_pings;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN NULL; END IF;
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
  SELECT * INTO last_ping FROM public.location_pings
    WHERE emergency_id = em.id ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'full_name', COALESCE(prof.full_name, 'RESQORA user'),
    'user_phone', prof.phone,
    'blood_group', CASE WHEN COALESCE(prof.share_medical_in_alerts, true) THEN prof.blood_group END,
    'allergies', CASE WHEN COALESCE(prof.share_medical_in_alerts, true) THEN prof.allergies END,
    'medical_conditions', CASE WHEN COALESCE(prof.share_medical_in_alerts, true) THEN prof.medical_conditions END,
    'medications', CASE WHEN COALESCE(prof.share_medical_in_alerts, true) THEN prof.medications END,
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
    'speed', last_ping.speed,
    'battery_level', last_ping.battery_level,
    'accuracy', last_ping.accuracy,
    'reference', upper(substring(em.id::text, 1, 8)),
    'timeline', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'label', e.label, 'detail', e.detail, 'created_at', e.created_at
      ) ORDER BY e.created_at)
      FROM public.emergency_events e WHERE e.emergency_id = em.id
    ), '[]'::jsonb)
  );
END; $function$;

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
  IF _token IS NULL OR length(_token) < 32 OR _emergency_id IS NULL THEN RETURN NULL; END IF;
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
    'full_name', COALESCE(prof.full_name, 'RESQORA user'),
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

CREATE OR REPLACE FUNCTION public.log_guardian_access(_emergency_id uuid, _token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sess public.guardian_sessions;
BEGIN
  IF _token IS NULL OR length(_token) < 32 OR _emergency_id IS NULL THEN RETURN; END IF;
  SELECT * INTO sess FROM public.guardian_sessions
   WHERE token = _token
     AND emergency_id = _emergency_id
     AND active = true
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;
  IF sess IS NULL THEN RETURN; END IF;
  INSERT INTO public.security_events (user_id, event, detail, metadata)
  VALUES (
    sess.user_id,
    'Guardian access',
    sess.guardian_name || ' opened the Guardian dashboard',
    jsonb_build_object('emergency_id', sess.emergency_id, 'guardian_session', sess.id)
  );
END;
$function$;
