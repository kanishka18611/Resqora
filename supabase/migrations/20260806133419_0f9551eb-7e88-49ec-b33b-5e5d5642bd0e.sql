CREATE OR REPLACE FUNCTION public.get_resqr_summary(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec public.resqr_ids;
  prof public.profiles;
  guardian public.emergency_contacts;
  em public.emergencies;
BEGIN
  IF _code IS NULL OR length(_code) < 16 OR length(_code) > 64 THEN RETURN NULL; END IF;

  SELECT * INTO rec FROM public.resqr_ids WHERE code = _code AND active = true LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = rec.user_id;
  IF prof IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO guardian FROM public.emergency_contacts
    WHERE user_id = rec.user_id
    ORDER BY is_guardian DESC, position ASC
    LIMIT 1;

  SELECT * INTO em FROM public.emergencies
    WHERE user_id = rec.user_id
      AND status NOT IN ('resolved', 'cancelled')
    ORDER BY started_at DESC
    LIMIT 1;

  RETURN jsonb_build_object(
    'code', rec.code,
    'full_name', prof.full_name,
    'blood_group', prof.blood_group,
    'age', CASE WHEN prof.date_of_birth IS NULL THEN NULL
      ELSE floor(extract(epoch FROM (now() - prof.date_of_birth::timestamptz)) / 31557600)::int END,
    'allergies', prof.allergies,
    'medications', prof.medications,
    'medical_conditions', prof.medical_conditions,
    'guardian_name', guardian.name,
    'guardian_phone', guardian.phone,
    'preferred_hospital', prof.preferred_hospital,
    'preferred_language', prof.language,
    'active_emergency', CASE WHEN em IS NULL THEN NULL ELSE jsonb_build_object(
      'reference', upper(substring(em.id::text, 1, 8)),
      'type', em.type,
      'severity', em.severity,
      'status', em.status,
      'live_status', em.live_status,
      'address', em.address,
      'latitude', em.latitude,
      'longitude', em.longitude,
      'started_at', em.started_at,
      'location_updated_at', em.location_updated_at
    ) END
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_resqr_summary(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_resqr_summary(text) TO anon, authenticated;