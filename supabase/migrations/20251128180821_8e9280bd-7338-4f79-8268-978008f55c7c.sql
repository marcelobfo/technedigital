-- Create newsletter_logs table
CREATE TABLE public.newsletter_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  send_type TEXT NOT NULL DEFAULT 'welcome',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  api_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.newsletter_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view newsletter logs"
ON public.newsletter_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs (for edge functions)
CREATE POLICY "Service role can insert newsletter logs"
ON public.newsletter_logs
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_newsletter_logs_subscriber ON public.newsletter_logs(subscriber_id);
CREATE INDEX idx_newsletter_logs_post ON public.newsletter_logs(post_id);
CREATE INDEX idx_newsletter_logs_status ON public.newsletter_logs(status);
CREATE INDEX idx_newsletter_logs_send_type ON public.newsletter_logs(send_type);