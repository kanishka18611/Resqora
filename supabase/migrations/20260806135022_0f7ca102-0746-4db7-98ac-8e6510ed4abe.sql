
CREATE TABLE IF NOT EXISTS public.guardian_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  guardian_session_id uuid REFERENCES public.guardian_sessions(id) ON DELETE SET NULL,
  guardian_name text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guardian_notes TO authenticated;
GRANT ALL ON public.guardian_notes TO service_role;
ALTER TABLE public.guardian_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their guardian notes" ON public.guardian_notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read guardian notes" ON public.guardian_notes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.guardian_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task_key text NOT NULL,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (emergency_id, task_key)
);
GRANT SELECT ON public.guardian_tasks TO authenticated;
GRANT ALL ON public.guardian_tasks TO service_role;
ALTER TABLE public.guardian_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their guardian tasks" ON public.guardian_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read guardian tasks" ON public.guardian_tasks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Validates a Guardian link and returns the matching session, or NULL.
CREATE OR REPLACE FUNCTION public.guardian_session_for(_emergency_id uuid, _token text)
RETURNS public.guardian_sessions
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.* FROM public.guardian_sessions s
  WHERE _token IS NOT NULL AND length(_token) >= 32 AND _emergency_id IS NOT NULL
    AND s.token = _token AND s.emergency_id = _emergency_id
    AND s.active = true AND (s.expires_at IS NULL OR s.expires_at > now())
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.guardian_session_for(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_guardian_note(_emergency_id uuid, _token text, _note text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess public.guardian_sessions;
  row public.guardian_notes;
BEGIN
  sess := public.guardian_session_for(_emergency_id, _token);
  IF sess.id IS NULL THEN RAISE EXCEPTION 'Guardian link is not valid'; END IF;
  IF _note IS NULL OR length(btrim(_note)) = 0 THEN RAISE EXCEPTION 'Note cannot be empty'; END IF;

  INSERT INTO public.guardian_notes (emergency_id, user_id, guardian_session_id, guardian_name, note)
  VALUES (sess.emergency_id, sess.user_id, sess.id, sess.guardian_name, left(btrim(_note), 500))
  RETURNING * INTO row;

  INSERT INTO public.emergency_events (emergency_id, user_id, label, detail)
  VALUES (sess.emergency_id, sess.user_id, 'Guardian note added', left(btrim(_note), 200));

  RETURN jsonb_build_object(
    'id', row.id, 'note', row.note,
    'guardian_name', row.guardian_name, 'created_at', row.created_at
  );
END; $$;
REVOKE EXECUTE ON FUNCTION public.add_guardian_note(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_guardian_note(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_guardian_task(_emergency_id uuid, _token text, _task_key text, _label text, _done boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess public.guardian_sessions;
  row public.guardian_tasks;
BEGIN
  sess := public.guardian_session_for(_emergency_id, _token);
  IF sess.id IS NULL THEN RAISE EXCEPTION 'Guardian link is not valid'; END IF;
  IF _task_key IS NULL OR length(_task_key) = 0 OR length(_task_key) > 60 THEN
    RAISE EXCEPTION 'Invalid task';
  END IF;

  INSERT INTO public.guardian_tasks (emergency_id, user_id, task_key, label, done, completed_by, completed_at)
  VALUES (
    sess.emergency_id, sess.user_id, _task_key, left(COALESCE(_label, _task_key), 120),
    COALESCE(_done, false),
    CASE WHEN _done THEN sess.guardian_name END,
    CASE WHEN _done THEN now() END
  )
  ON CONFLICT (emergency_id, task_key) DO UPDATE
    SET done = COALESCE(_done, false),
        completed_by = CASE WHEN _done THEN sess.guardian_name END,
        completed_at = CASE WHEN _done THEN now() END
  RETURNING * INTO row;

  RETURN jsonb_build_object('task_key', row.task_key, 'done', row.done,
    'completed_by', row.completed_by, 'completed_at', row.completed_at);
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_guardian_task(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_guardian_task(uuid, text, text, text, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_guardian_view(_emergency_id uuid, _token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sess public.guardian_sessions;
  em public.emergencies;
  prof public.profiles;
BEGIN
  sess := public.guardian_session_for(_emergency_id, _token);
  IF sess.id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO em FROM public.emergencies WHERE id = sess.emergency_id;
  IF em IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = sess.user_id;

  RETURN jsonb_build_object(
    'guardian_name', sess.guardian_name,
    'guardian_phone', sess.guardian_phone,
    'guardian_email_on_file', sess.guardian_email IS NOT NULL,
    'full_name', COALESCE(prof.full_name, 'RESQORA user'),
    'avatar_url', prof.avatar_url,
    'user_phone', prof.phone,
    'blood_group', prof.blood_group,
    'age', CASE WHEN prof.date_of_birth IS NULL THEN NULL
      ELSE floor(extract(epoch FROM (now() - prof.date_of_birth::timestamptz)) / 31557600)::int END,
    'allergies', prof.allergies,
    'medical_conditions', prof.medical_conditions,
    'medications', prof.medications,
    'preferred_hospital', prof.preferred_hospital,
    'preferred_language', prof.language,
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
    'ai_summary', em.ai_summary,
    'ai_recommendation', em.ai_recommendation,
    'ai_first_aid', COALESCE(to_jsonb(em.ai_first_aid), '[]'::jsonb),
    'email_delivered', EXISTS (
      SELECT 1 FROM public.emergency_alert_deliveries d
      WHERE d.emergency_id = em.id AND d.kind = 'guardian' AND d.status = 'sent'
    ),
    'contacts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', c.name, 'relationship', c.relationship, 'phone', c.phone,
        'is_guardian', c.is_guardian
      ) ORDER BY c.is_guardian DESC, c.position)
      FROM public.emergency_contacts c WHERE c.user_id = sess.user_id
    ), '[]'::jsonb),
    'medical_notes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('title', n.title, 'category', n.category, 'content', n.content)
             ORDER BY n.created_at)
      FROM public.emergency_notes n WHERE n.user_id = sess.user_id
    ), '[]'::jsonb),
    'guardian_notes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', g.id, 'note', g.note, 'guardian_name', g.guardian_name, 'created_at', g.created_at
      ) ORDER BY g.created_at DESC)
      FROM public.guardian_notes g WHERE g.emergency_id = em.id
    ), '[]'::jsonb),
    'tasks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'task_key', t.task_key, 'label', t.label, 'done', t.done,
        'completed_by', t.completed_by, 'completed_at', t.completed_at
      ) ORDER BY t.created_at)
      FROM public.guardian_tasks t WHERE t.emergency_id = em.id
    ), '[]'::jsonb),
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
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_guardian_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guardian_view(uuid, text) TO anon, authenticated;
