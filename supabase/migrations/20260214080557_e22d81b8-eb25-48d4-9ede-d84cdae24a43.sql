
-- Update the SELECT policy to handle 'ALL' store assignment
DROP POLICY "Users can view store complaints or admin all" ON public.complaints;

CREATE POLICY "Users can view store complaints or admin all"
ON public.complaints
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.get_user_store(auth.uid()) = 'ALL'
  OR store = public.get_user_store(auth.uid())
);

-- Update the UPDATE policy similarly
DROP POLICY "Admins or store users can update complaints" ON public.complaints;

CREATE POLICY "Admins or store users can update complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.get_user_store(auth.uid()) = 'ALL'
  OR store = public.get_user_store(auth.uid())
);
