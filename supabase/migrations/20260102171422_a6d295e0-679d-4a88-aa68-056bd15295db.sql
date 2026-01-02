-- Fix RLS policies on students table to properly protect sensitive data
-- Drop existing policies and recreate with correct PERMISSIVE type

-- Drop existing policies
DROP POLICY IF EXISTS "Faculty and admin can manage students" ON public.students;
DROP POLICY IF EXISTS "Students viewable by self or staff" ON public.students;

-- Create proper PERMISSIVE policies for students table

-- 1. Students can only view their own profile
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Faculty can view all students
CREATE POLICY "Faculty can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (check_user_role(auth.uid(), 'faculty'::app_role));

-- 3. Admins can view all students
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (check_user_role(auth.uid(), 'admin'::app_role));

-- 4. Only faculty can insert new students
CREATE POLICY "Faculty can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (check_user_role(auth.uid(), 'faculty'::app_role) OR check_user_role(auth.uid(), 'admin'::app_role));

-- 5. Students can update their own non-sensitive data
CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Faculty and admin can update any student
CREATE POLICY "Faculty can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (check_user_role(auth.uid(), 'faculty'::app_role) OR check_user_role(auth.uid(), 'admin'::app_role));

-- 7. Only admins can delete students
CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (check_user_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled (it should already be, but verify)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.students FORCE ROW LEVEL SECURITY;