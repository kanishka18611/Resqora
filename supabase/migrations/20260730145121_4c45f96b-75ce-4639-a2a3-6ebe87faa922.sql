-- 1. Stop bulk exposure of donor phone numbers
DROP POLICY IF EXISTS "Signed in users read available donors" ON public.blood_donors;

CREATE OR REPLACE FUNCTION public.search_blood_donors(_group text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS TABLE (id uuid, full_name text, blood_group text, city text, available boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.full_name, d.blood_group, d.city, d.available
  FROM public.blood_donors d
  WHERE auth.uid() IS NOT NULL
    AND d.available = true
    AND (_group IS NULL OR _group = 'all' OR d.blood_group = _group)
    AND (_city IS NULL OR _city = '' OR d.city ILIKE '%' || _city || '%')
  ORDER BY d.updated_at DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.get_donor_phone(_donor_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.blood_donors;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT * INTO target FROM public.blood_donors WHERE id = _donor_id AND available = true;
  IF target IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.activity_logs (user_id, action, detail)
  VALUES (auth.uid(), 'Donor contact revealed', target.full_name || ' (' || target.blood_group || ')');
  RETURN target.phone;
END;
$$;

-- 2. Tighten EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_shared_profile(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_location(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_location(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.search_blood_donors(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_donor_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_blood_donors(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_donor_phone(uuid) TO authenticated;