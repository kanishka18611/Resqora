CREATE TABLE public.emergency_alert_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  contact_id uuid,
  contact_name text NOT NULL,
  contact_phone text,
  channel text NOT NULL DEFAULT 'sms',
  status text NOT NULL DEFAULT 'pending',
  error text,
  kind text NOT NULL DEFAULT 'alert',
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_alert_deliveries TO authenticated;
GRANT ALL ON public.emergency_alert_deliveries TO service_role;

ALTER TABLE public.emergency_alert_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alert deliveries"
  ON public.emergency_alert_deliveries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all alert deliveries"
  ON public.emergency_alert_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_emergency_alert_deliveries_updated_at
  BEFORE UPDATE ON public.emergency_alert_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX emergency_alert_deliveries_emergency_idx
  ON public.emergency_alert_deliveries (emergency_id, created_at DESC);

ALTER TABLE public.emergencies
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommendation text,
  ADD COLUMN IF NOT EXISTS ai_first_aid text[];