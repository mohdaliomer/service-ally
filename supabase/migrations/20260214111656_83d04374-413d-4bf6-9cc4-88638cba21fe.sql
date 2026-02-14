
-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaint-attachments' AND auth.uid() IS NOT NULL);

-- Anyone authenticated can view/download
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-attachments' AND auth.uid() IS NOT NULL);

-- Users can delete their own uploads (by folder path = user id)
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create complaint_attachments table to track files per complaint
CREATE TABLE public.complaint_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view attachments for complaints they can see
CREATE POLICY "Authenticated can view complaint attachments"
ON public.complaint_attachments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert their own attachments
CREATE POLICY "Users can insert own attachments"
ON public.complaint_attachments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON public.complaint_attachments FOR DELETE
USING (uploaded_by = auth.uid());
