
-- Update RLS policy to also show 'closed' campaigns to public
DROP POLICY IF EXISTS "Public campaigns viewable" ON public.campaigns;
CREATE POLICY "Public campaigns viewable" ON public.campaigns
FOR SELECT TO authenticated
USING (
  (status = ANY (ARRAY['recruiting'::text, 'closed'::text, 'in_progress'::text, 'completed'::text]))
  OR (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);
