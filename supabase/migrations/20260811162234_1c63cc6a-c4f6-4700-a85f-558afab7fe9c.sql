CREATE TABLE IF NOT EXISTS public.accident_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  incident_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo','video')),
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('pending','uploaded','failed')),
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accident_media_user_idx ON public.accident_media(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accident_media TO authenticated;
GRANT ALL ON public.accident_media TO service_role;

ALTER TABLE public.accident_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own accident media" ON public.accident_media;
CREATE POLICY "Users manage own accident media" ON public.accident_media
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accident media own read" ON storage.objects;
CREATE POLICY "accident media own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'accident-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "accident media own insert" ON storage.objects;
CREATE POLICY "accident media own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'accident-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "accident media own delete" ON storage.objects;
CREATE POLICY "accident media own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'accident-media' AND (storage.foldername(name))[1] = auth.uid()::text);