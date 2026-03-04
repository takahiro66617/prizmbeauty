
-- Allow anon users to view public campaigns (LINE-auth users don't have Supabase sessions)
DROP POLICY IF EXISTS "Public campaigns viewable" ON public.campaigns;
CREATE POLICY "Public campaigns viewable" ON public.campaigns
FOR SELECT
USING (
  (status = ANY (ARRAY['recruiting'::text, 'closed'::text, 'in_progress'::text, 'completed'::text]))
  OR (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);
