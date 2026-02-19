-- Drop FK constraints on messages and notifications that prevent sending to LINE-auth users
-- These tables use UUIDs that can reference either auth.users or influencer_profiles
ALTER TABLE public.messages DROP CONSTRAINT messages_receiver_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT messages_sender_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;