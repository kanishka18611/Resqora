-- 1. Approval fields on profiles
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

CREATE INDEX IF NOT EXISTS profiles_approval_status_idx ON public.profiles (approval_status);

-- Existing accounts keep working: grandfather them in as approved.
UPDATE public.profiles SET approval_status = 'approved', approved_at = now()
WHERE approval_status = 'pending';

-- 2. Admins can approve / reject
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Approval metadata may only ever name the acting admin.
CREATE OR REPLACE FUNCTION public.guard_profile_approval()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can change approval status';
    END IF;
    NEW.approved_by = auth.uid();
    NEW.approved_at = now();
  ELSE
    NEW.approved_by = OLD.approved_by;
    NEW.approved_at = OLD.approved_at;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_guard_approval ON public.profiles;
CREATE TRIGGER profiles_guard_approval
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_approval();

-- 3. Super admin bootstrap + admin notification on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_super boolean := lower(COALESCE(NEW.email, '')) = 'mdr.gemini@gmail.com';
  display_name text := NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), '');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, approval_status, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(display_name, ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''), ''),
    CASE WHEN is_super THEN 'approved'::public.approval_status ELSE 'pending'::public.approval_status END,
    CASE WHEN is_super THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_super THEN 'admin'::app_role ELSE 'user'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF is_super THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.notifications (user_id, category, title, body)
  VALUES (
    NEW.id,
    'system',
    'Welcome to RESQORA',
    CASE WHEN is_super
      THEN 'Administrator access is active.'
      ELSE 'Your account is awaiting administrator approval. You will get full access once approved.' END
  );

  -- Notify every admin about the new registration.
  IF NOT is_super THEN
    INSERT INTO public.notifications (user_id, category, title, body)
    SELECT ur.user_id, 'system', 'New user registration',
           COALESCE(display_name, NEW.email, 'A new user') || ' — awaiting approval'
    FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id <> NEW.id;
  END IF;

  RETURN NEW;
END; $$;

-- Existing super admin account (if it already signed up) gets admin + approved.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'mdr.gemini@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Admin read access for dashboard reports & analytics
DROP POLICY IF EXISTS "Admins read all activity" ON public.activity_logs;
CREATE POLICY "Admins read all activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read all medai conversations" ON public.medai_conversations;
CREATE POLICY "Admins read all medai conversations" ON public.medai_conversations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read all resqr ids" ON public.resqr_ids;
CREATE POLICY "Admins read all resqr ids" ON public.resqr_ids
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
