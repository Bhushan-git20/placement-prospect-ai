-- Fix security definer view issue by dropping the view and using RLS instead
DROP VIEW IF EXISTS public.job_postings_public;

-- Instead, we'll use a function to check if user can see salary
CREATE OR REPLACE FUNCTION public.can_view_salary()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_user_role(auth.uid(), 'admin') OR check_user_role(auth.uid(), 'faculty')
$$;