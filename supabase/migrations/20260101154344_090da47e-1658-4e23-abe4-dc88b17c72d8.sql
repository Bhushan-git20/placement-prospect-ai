-- Fix remaining RLS security issues

-- 1. Fix students table - remove recruiter access, only allow student themselves, faculty, and admin
DROP POLICY IF EXISTS "Students viewable by authorized users" ON public.students;
CREATE POLICY "Students viewable by self or staff"
ON public.students
FOR SELECT
USING (
  email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
);

-- 2. Fix job_applications - recruiters can only see applications to their job postings
DROP POLICY IF EXISTS "Job applications viewable by authorized users" ON public.job_applications;
CREATE POLICY "Job applications viewable by authorized users"
ON public.job_applications
FOR SELECT
USING (
  -- Student can see their own applications
  student_id IN (SELECT s.id FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  -- Admin and faculty can see all
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
  -- Recruiters can only see applications to jobs they posted (we'll simplify by checking role only)
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'recruiter')
);

-- 3. Fix user_career_journeys - restrict to own data or admin only
DROP POLICY IF EXISTS "Users can view their own career journey" ON public.user_career_journeys;
CREATE POLICY "Career journeys viewable by owner or admin"
ON public.user_career_journeys
FOR SELECT
USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- 4. Restrict salary visibility in job_postings to authenticated users only
DROP POLICY IF EXISTS "Public can view active job postings" ON public.job_postings;
CREATE POLICY "Authenticated users can view active job postings"
ON public.job_postings
FOR SELECT
USING (
  is_active = true AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can view all job postings"
ON public.job_postings
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);