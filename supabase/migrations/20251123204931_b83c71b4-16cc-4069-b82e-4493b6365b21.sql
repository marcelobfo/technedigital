-- Add unique constraint to url column in seo_indexing_status table
ALTER TABLE seo_indexing_status ADD CONSTRAINT seo_indexing_status_url_key UNIQUE (url);