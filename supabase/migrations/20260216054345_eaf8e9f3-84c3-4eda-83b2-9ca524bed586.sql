
-- Add columns to track where a request was sent back from
ALTER TABLE public.complaints
ADD COLUMN sent_back_from_status text DEFAULT NULL,
ADD COLUMN sent_back_from_stage integer DEFAULT NULL;
