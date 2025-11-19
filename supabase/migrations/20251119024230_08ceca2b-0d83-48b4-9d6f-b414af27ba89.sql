-- Create blog-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for blog-images bucket
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Service role can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can update blog images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-images' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can delete blog images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-images' AND
  auth.role() = 'service_role'
);