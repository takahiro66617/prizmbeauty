-- Add image_urls array column to campaigns
ALTER TABLE public.campaigns ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing image_url data to image_urls
UPDATE public.campaigns SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';