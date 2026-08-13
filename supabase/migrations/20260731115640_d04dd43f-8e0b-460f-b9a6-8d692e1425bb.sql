ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.emergency_alert_deliveries ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.emergency_alert_deliveries ALTER COLUMN contact_phone DROP NOT NULL;