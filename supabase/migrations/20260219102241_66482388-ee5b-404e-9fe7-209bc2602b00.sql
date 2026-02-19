-- Add application_id to messages for threaded conversations
ALTER TABLE public.messages ADD COLUMN application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE;

-- Index for fast thread lookups
CREATE INDEX idx_messages_application_id ON public.messages(application_id);

-- Update RLS: allow company users to view messages related to their applications
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR application_id IN (
      SELECT a.id FROM applications a
      JOIN companies c ON a.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Allow sending messages within application threads
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());