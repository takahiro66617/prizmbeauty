-- Drop the existing restrictive SELECT policy and replace with one that allows all roles
DROP POLICY IF EXISTS "IF profiles viewable by authenticated" ON public.influencer_profiles;

CREATE POLICY "IF profiles viewable by all"
ON public.influencer_profiles
FOR SELECT
USING (true);