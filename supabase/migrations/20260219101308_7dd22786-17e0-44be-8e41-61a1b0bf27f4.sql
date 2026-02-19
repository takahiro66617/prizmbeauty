-- 1. Drop old CHECK constraint and add one with all workflow statuses
ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
  CHECK (status = ANY (ARRAY['applied', 'reviewing', 'approved', 'rejected', 'in_progress', 'post_submitted', 'post_confirmed', 'payment_pending', 'completed']));

-- 2. Allow companies (client role) to insert notifications for influencers
DROP POLICY IF EXISTS "System/admin can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);