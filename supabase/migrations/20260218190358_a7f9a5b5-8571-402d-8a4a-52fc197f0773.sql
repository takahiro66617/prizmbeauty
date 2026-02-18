
ALTER TABLE public.influencer_profiles
  ADD COLUMN line_user_id TEXT UNIQUE;

ALTER TABLE public.influencer_profiles
  ALTER COLUMN user_id DROP NOT NULL;
