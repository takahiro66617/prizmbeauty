-- Drop the existing SELECT policy that only works for authenticated users
DROP POLICY "Public campaigns viewable" ON public.campaigns;

-- Recreate it to also allow anon users to see recruiting/in_progress/completed campaigns
CREATE POLICY "Public campaigns viewable" ON public.campaigns
FOR SELECT
USING (
  (status = ANY (ARRAY['recruiting'::text, 'in_progress'::text, 'completed'::text]))
  OR (company_id IN (SELECT c.id FROM companies c WHERE c.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also fix companies SELECT policy to allow anon (needed for the join)
DROP POLICY "Companies viewable by authenticated" ON public.companies;
CREATE POLICY "Companies viewable by all" ON public.companies
FOR SELECT
USING (true);