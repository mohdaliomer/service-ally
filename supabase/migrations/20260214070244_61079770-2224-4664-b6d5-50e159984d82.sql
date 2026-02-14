
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'CMP-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.complaint_id_seq')::TEXT, 3, '0')
$$;
