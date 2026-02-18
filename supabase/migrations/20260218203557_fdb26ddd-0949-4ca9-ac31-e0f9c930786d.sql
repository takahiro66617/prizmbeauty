
-- Add payment_date to campaigns for tracking payment deadlines
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;

-- Add max_applicants to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS max_applicants integer DEFAULT 0;

-- Add deliverables to campaigns  
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS deliverables text;
