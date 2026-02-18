
-- Storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true);

CREATE POLICY "Campaign images publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update campaign images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');
