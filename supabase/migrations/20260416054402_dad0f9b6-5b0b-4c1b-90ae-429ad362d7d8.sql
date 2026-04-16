
CREATE TABLE public.line_message_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id uuid REFERENCES public.influencer_profiles(id) ON DELETE SET NULL,
  line_user_id text NOT NULL,
  message_type text NOT NULL DEFAULT 'manual',
  message_content text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_detail text,
  sent_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.line_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage line_message_logs"
  ON public.line_message_logs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can insert line_message_logs via service role"
  ON public.line_message_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_line_message_logs_influencer ON public.line_message_logs(influencer_id);
CREATE INDEX idx_line_message_logs_created ON public.line_message_logs(created_at DESC);
