
-- Drop the existing SELECT policy on complaints
DROP POLICY "Users can view own complaints or admin all" ON public.complaints;

-- Create a function to get the user's assigned store (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_store(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store FROM public.profiles WHERE id = _user_id
$$;

-- New SELECT policy: admin sees all, others see complaints from their assigned store
CREATE POLICY "Users can view store complaints or admin all"
ON public.complaints
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR store = public.get_user_store(auth.uid())
);

-- Also update UPDATE policy to allow store-level updates (not just own complaints)
DROP POLICY "Admins can update any complaint" ON public.complaints;

CREATE POLICY "Admins or store users can update complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR store = public.get_user_store(auth.uid())
);
