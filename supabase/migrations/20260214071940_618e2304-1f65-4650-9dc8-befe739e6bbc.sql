
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  city TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view stores" ON public.stores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage stores" ON public.stores
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stores" ON public.stores
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stores" ON public.stores
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Seed with existing stores
INSERT INTO public.stores (name, city) VALUES
  ('Retail Store – Mumbai', 'Mumbai'),
  ('Retail Store – Delhi', 'Delhi'),
  ('Retail Store – Bangalore', 'Bangalore'),
  ('Retail Store – Chennai', 'Chennai'),
  ('Retail Store – Hyderabad', 'Hyderabad'),
  ('Retail Store – Kolkata', 'Kolkata'),
  ('Warehouse – Pune', 'Pune'),
  ('Head Office – Mumbai', 'Mumbai');
