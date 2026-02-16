
-- Fix the overly permissive INSERT policy
DROP POLICY "Service role can insert notifications" ON public.notifications;

-- Only allow users to insert notifications for themselves (edge functions use service role and bypass RLS)
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
