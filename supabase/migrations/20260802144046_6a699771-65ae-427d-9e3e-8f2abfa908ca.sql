CREATE TABLE public.medai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New consultation',
  language text NOT NULL DEFAULT 'en',
  urgency text,
  specialist text,
  shared_medical_history boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medai_conversations TO authenticated;
GRANT ALL ON public.medai_conversations TO service_role;
ALTER TABLE public.medai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medai conversations" ON public.medai_conversations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.medai_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.medai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  has_image boolean NOT NULL DEFAULT false,
  urgency text,
  specialist text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medai_messages TO authenticated;
GRANT ALL ON public.medai_messages TO service_role;
ALTER TABLE public.medai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medai messages" ON public.medai_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX medai_messages_conversation_idx ON public.medai_messages (conversation_id, created_at);
CREATE INDEX medai_conversations_user_idx ON public.medai_conversations (user_id, updated_at DESC);

CREATE TRIGGER medai_conversations_updated_at
  BEFORE UPDATE ON public.medai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();