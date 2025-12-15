-- Fix RLS policies for students table - restrict to faculty, admin, recruiter, or own record
DROP POLICY IF EXISTS "Users can view students" ON public.students;
DROP POLICY IF EXISTS "Students viewable by authenticated users" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;

CREATE POLICY "Students viewable by authorized roles or self"
ON public.students
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR check_user_role(auth.uid(), 'admin')
  OR check_user_role(auth.uid(), 'faculty')
  OR check_user_role(auth.uid(), 'recruiter')
);

-- Fix RLS policies for profiles table - only own profile or admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Profiles viewable by owner or admin"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR check_user_role(auth.uid(), 'admin')
);

-- Fix RLS policies for assessments - only own assessments or faculty/admin
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Authenticated users can view assessments" ON public.assessments;

CREATE POLICY "Assessments viewable by owner or faculty/admin"
ON public.assessments
FOR SELECT
USING (
  user_id = auth.uid()
  OR check_user_role(auth.uid(), 'admin')
  OR check_user_role(auth.uid(), 'faculty')
);

-- Fix RLS policies for job_applications - student can see own, recruiters/faculty/admin can see all
DROP POLICY IF EXISTS "Users can view job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Authenticated users can view job applications" ON public.job_applications;

CREATE POLICY "Job applications viewable by authorized users"
ON public.job_applications
FOR SELECT
USING (
  student_id IN (SELECT id FROM public.students WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR check_user_role(auth.uid(), 'admin')
  OR check_user_role(auth.uid(), 'faculty')
  OR check_user_role(auth.uid(), 'recruiter')
);

-- Fix update_updated_at_column function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;