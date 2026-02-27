
-- Create debug_reports table
CREATE TABLE public.debug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_url text NOT NULL,
  user_agent text,
  comment text,
  status text DEFAULT 'open',
  screenshot_url text,
  error_logs jsonb DEFAULT '[]'::jsonb,
  console_logs jsonb DEFAULT '[]'::jsonb,
  network_logs jsonb DEFAULT '[]'::jsonb,
  interaction_logs jsonb DEFAULT '[]'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debug_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert
CREATE POLICY "Anyone can insert debug reports"
ON public.debug_reports FOR INSERT
WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Authenticated users can read debug reports"
ON public.debug_reports FOR SELECT
TO authenticated
USING (true);

-- Admin can manage all
CREATE POLICY "Admin can manage debug reports"
ON public.debug_reports FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_debug_reports_updated_at
BEFORE UPDATE ON public.debug_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create debug-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('debug-screenshots', 'debug-screenshots', true);

-- Anyone can upload screenshots
CREATE POLICY "Anyone can upload debug screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'debug-screenshots');

-- Public read access
CREATE POLICY "Debug screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'debug-screenshots');
