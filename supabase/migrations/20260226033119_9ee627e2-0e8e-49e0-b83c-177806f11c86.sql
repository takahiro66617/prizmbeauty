-- Allow anyone to upload to thread-attachments (the bucket is public anyway and edge functions handle auth)
DROP POLICY IF EXISTS "Authenticated users can upload thread attachments" ON storage.objects;
CREATE POLICY "Anyone can upload thread attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thread-attachments');

-- Also allow anyone to upload to campaign-images for client logo uploads
DROP POLICY IF EXISTS "Authenticated can upload campaign images" ON storage.objects;
CREATE POLICY "Anyone can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images');