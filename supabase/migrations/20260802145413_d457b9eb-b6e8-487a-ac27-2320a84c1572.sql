GRANT SELECT, INSERT, UPDATE, DELETE ON public.medai_conversations TO authenticated;
GRANT ALL ON public.medai_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medai_messages TO authenticated;
GRANT ALL ON public.medai_messages TO service_role;