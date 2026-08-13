ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_medical_in_alerts boolean NOT NULL DEFAULT true;

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
    'full_name', COALESCE(prof.full_name, 'AEGIS user'),
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

DROP FUNCTION IF EXISTS public.get_shared_track(text);

CREATE FUNCTION public.get_shared_track(_token text)
 RETURNS TABLE(latitude double precision, longitude double precision, accuracy double precision, speed double precision, battery_level integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.latitude, p.longitude, p.accuracy, p.speed, p.battery_level, p.created_at
  FROM public.location_pings p
  JOIN public.share_links l ON l.emergency_id = p.emergency_id
  WHERE l.token = _token
    AND l.active = true
    AND l.kind = 'live'
    AND (l.expires_at IS NULL OR l.expires_at > now())
  ORDER BY p.created_at DESC
  LIMIT 50;
$function$;

REVOKE ALL ON FUNCTION public.get_shared_location(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_track(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_location(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_track(text) TO anon, authenticated;