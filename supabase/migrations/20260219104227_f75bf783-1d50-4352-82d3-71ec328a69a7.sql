-- Create storage bucket for thread message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('thread-attachments', 'thread-attachments', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload thread attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thread-attachments' AND auth.role() = 'authenticated');

-- Allow public read
CREATE POLICY "Thread attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'thread-attachments');

-- Allow owners to delete their uploads
CREATE POLICY "Users can delete own thread attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'thread-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_url column to messages for attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;

-- Add message_type column to distinguish regular messages, post submissions, etc.
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';
