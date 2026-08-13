ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_hospital text;

CREATE TABLE public.resqr_ids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  regenerated_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX resqr_ids_active_user_idx ON public.resqr_ids (user_id) WHERE active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resqr_ids TO authenticated;
GRANT ALL ON public.resqr_ids TO service_role;

ALTER TABLE public.resqr_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own resqr id" ON public.resqr_ids
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_resqr_ids_updated_at BEFORE UPDATE ON public.resqr_ids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_resqr_summary(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec public.resqr_ids;
  prof public.profiles;
  guardian public.emergency_contacts;
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
    'preferred_language', prof.language
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_resqr_summary(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_resqr_summary(text) TO anon, authenticated, service_role;