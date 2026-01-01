-- Fix RLS security issues found in security scan

-- 1. Fix user_career_journeys - restrict to own records only
DROP POLICY IF EXISTS "Users can view their own journey" ON public.user_career_journeys;
CREATE POLICY "Users can view their own career journey"
ON public.user_career_journeys
FOR SELECT
USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
);

-- 2. Fix job_applications INSERT - ensure students can only create applications for themselves
DROP POLICY IF EXISTS "Students can create applications" ON public.job_applications;
CREATE POLICY "Students can create own applications"
ON public.job_applications
FOR INSERT
WITH CHECK (
  student_id IN (SELECT s.id FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
);

-- 3. Fix duplicate job_applications SELECT policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;

-- 4. Fix assessments - remove user self-insert to prevent score manipulation
DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.assessments;

-- 5. Consolidate assessments SELECT policies
DROP POLICY IF EXISTS "Faculty and admin can view all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Assessments viewable by owner or faculty/admin" ON public.assessments;
CREATE POLICY "Assessments viewable by authorized users"
ON public.assessments
FOR SELECT
USING (
  user_id = auth.uid()
  OR student_id::text IN (SELECT s.id::text FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
);

-- 6. Fix students table - recruiters should only see students who applied to their jobs
DROP POLICY IF EXISTS "Students viewable by authorized roles or self" ON public.students;
CREATE POLICY "Students viewable by authorized users"
ON public.students
FOR SELECT
USING (
  email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
  OR (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'recruiter')
    AND id IN (SELECT ja.student_id FROM public.job_applications ja)
  )
);

-- 7. Fix profiles table - restrict email visibility
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by owner"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can view profile names only"
ON public.profiles
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);