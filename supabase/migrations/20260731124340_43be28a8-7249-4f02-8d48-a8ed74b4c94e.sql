ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guardian';

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event text NOT NULL,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS security_events_user_created_idx
  ON public.security_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_security_event(
  _event text,
  _detail text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _user_agent text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event IS NULL OR length(_event) = 0 OR length(_event) > 120 THEN
    RAISE EXCEPTION 'Invalid security event';
  END IF;
  INSERT INTO public.security_events (user_id, event, detail, metadata, user_agent)
  VALUES (
    auth.uid(),
    left(_event, 120),
    left(_detail, 500),
    COALESCE(_metadata, '{}'::jsonb),
    left(_user_agent, 300)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, jsonb, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_guardian_access(_emergency_id uuid, _token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess public.guardian_sessions;
BEGIN
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
$$;

REVOKE ALL ON FUNCTION public.log_guardian_access(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_guardian_access(uuid, text) TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS share_links_token_key ON public.share_links (token);
CREATE UNIQUE INDEX IF NOT EXISTS guardian_sessions_token_key ON public.guardian_sessions (token);

CREATE OR REPLACE FUNCTION public.enforce_strong_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.token IS NULL OR length(NEW.token) < 32 THEN
    RAISE EXCEPTION 'Share token must be at least 32 characters';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS share_links_strong_token ON public.share_links;
CREATE TRIGGER share_links_strong_token
  BEFORE INSERT OR UPDATE OF token ON public.share_links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_strong_token();

DROP TRIGGER IF EXISTS guardian_sessions_strong_token ON public.guardian_sessions;
CREATE TRIGGER guardian_sessions_strong_token
  BEFORE INSERT OR UPDATE OF token ON public.guardian_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_strong_token();