-- Remove implicit EXECUTE granted to PUBLIC on all privileged helpers
REVOKE ALL ON FUNCTION public.get_resqr_summary(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_guardian_view(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_location(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_profile(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_track(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_guardian_access(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_donor_phone(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_blood_donors(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_security_event(text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Signed-in-only helpers: no anon access
REVOKE EXECUTE ON FUNCTION public.get_donor_phone(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_blood_donors(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, jsonb, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Internal-only helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_guardian_access(uuid, text) FROM authenticated;

-- Explicitly re-grant only what the app needs
GRANT EXECUTE ON FUNCTION public.get_resqr_summary(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guardian_view(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_location(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_track(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_guardian_access(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_donor_phone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_blood_donors(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;