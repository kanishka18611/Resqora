
CREATE OR REPLACE FUNCTION public.log_guardian_access(_emergency_id uuid, _token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess public.guardian_sessions;
BEGIN
  sess := public.guardian_session_for(_emergency_id, _token);
  IF sess.id IS NULL THEN RETURN; END IF;

  INSERT INTO public.security_events (user_id, event, detail, metadata)
  VALUES (
    sess.user_id,
    'Guardian access',
    sess.guardian_name || ' opened the Guardian dashboard',
    jsonb_build_object('emergency_id', sess.emergency_id, 'guardian_session', sess.id)
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.emergency_events e
    WHERE e.emergency_id = sess.emergency_id
      AND e.label = 'Guardian opened dashboard'
      AND e.created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.emergency_events (emergency_id, user_id, label, detail)
    VALUES (sess.emergency_id, sess.user_id, 'Guardian opened dashboard', sess.guardian_name);
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_guardian_access(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_guardian_access(uuid, text) TO anon, authenticated;
