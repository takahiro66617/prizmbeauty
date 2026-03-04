
-- Add revision_requested to applications status check constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (status = ANY (ARRAY['applied'::text, 'screening'::text, 'approved'::text, 'rejected'::text, 'in_progress'::text, 'post_submitted'::text, 'revision_requested'::text, 'post_confirmed'::text, 'payment_pending'::text, 'completed'::text, 'cancelled'::text]));
