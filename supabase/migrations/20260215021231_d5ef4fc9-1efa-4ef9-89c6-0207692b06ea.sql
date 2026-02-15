
-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view departments" ON public.departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert departments" ON public.departments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update departments" ON public.departments FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete departments" ON public.departments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed existing departments
INSERT INTO public.departments (name) VALUES
  ('Sales Floor'), ('Back Office'), ('Warehouse'), ('Customer Service'),
  ('Admin'), ('IT'), ('Security'), ('Facilities');

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view categories" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed existing categories
INSERT INTO public.categories (name) VALUES
  ('Electrical'), ('IT Support'), ('Plumbing'), ('Carpentry'),
  ('Interior Works'), ('Exterior Works'), ('Masonry'), ('Painting'),
  ('Flooring'), ('HVAC'), ('Network'), ('Building Construction'), ('Other');
