CREATE OR REPLACE FUNCTION public.get_shared_track(_token text)
RETURNS TABLE(latitude double precision, longitude double precision, accuracy double precision, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.latitude, p.longitude, p.accuracy, p.created_at
  FROM public.location_pings p
  JOIN public.share_links l ON l.emergency_id = p.emergency_id
  WHERE l.token = _token
    AND l.active = true
    AND l.kind = 'live'
    AND (l.expires_at IS NULL OR l.expires_at > now())
  ORDER BY p.created_at DESC
  LIMIT 25;
$$;

REVOKE ALL ON FUNCTION public.get_shared_track(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_track(text) TO anon, authenticated;