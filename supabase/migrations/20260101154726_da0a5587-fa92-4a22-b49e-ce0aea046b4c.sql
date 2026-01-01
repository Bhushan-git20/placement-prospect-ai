-- Fix warning-level security issues

-- 1. Remove public access to job_postings - require authentication
DROP POLICY IF EXISTS "Everyone can view active job postings" ON public.job_postings;

-- 2. Fix recruiter access to job_applications - they should only see applications for jobs at their company
-- First, we need to track which company a recruiter belongs to. For now, restrict to only admin/faculty + students viewing their own
DROP POLICY IF EXISTS "Job applications viewable by authorized users" ON public.job_applications;
CREATE POLICY "Job applications viewable by authorized users"
ON public.job_applications
FOR SELECT
USING (
  -- Student can see their own applications
  student_id IN (SELECT s.id FROM public.students s WHERE s.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text)
  -- Admin and faculty can see all
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'faculty'))
);