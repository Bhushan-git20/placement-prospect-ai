-- Add user_id column to students table to link to auth.users
ALTER TABLE public.students 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_students_user_id ON public.students(user_id);

-- Update existing students to link with auth.users based on email
UPDATE public.students s
SET user_id = u.id
FROM auth.users u
WHERE s.email = u.email;

-- Drop old email-based RLS policies
DROP POLICY IF EXISTS "Students viewable by self or staff" ON public.students;
DROP POLICY IF EXISTS "Assessments viewable by authorized users" ON public.assessments;
DROP POLICY IF EXISTS "Job applications viewable by authorized users" ON public.job_applications;
DROP POLICY IF EXISTS "Students can create own applications" ON public.job_applications;

-- Create new user_id-based RLS policy for students
CREATE POLICY "Students viewable by self or staff" 
ON public.students 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR check_user_role(auth.uid(), 'admin'::app_role) 
  OR check_user_role(auth.uid(), 'faculty'::app_role)
);

-- Create new user_id-based RLS policy for assessments
CREATE POLICY "Assessments viewable by authorized users" 
ON public.assessments 
FOR SELECT 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = auth.uid() 
    AND s.id::text = assessments.student_id
  )
  OR check_user_role(auth.uid(), 'admin'::app_role) 
  OR check_user_role(auth.uid(), 'faculty'::app_role)
);

-- Create new user_id-based RLS policy for viewing job applications
CREATE POLICY "Job applications viewable by authorized users" 
ON public.job_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = auth.uid() 
    AND s.id = job_applications.student_id
  )
  OR check_user_role(auth.uid(), 'admin'::app_role) 
  OR check_user_role(auth.uid(), 'faculty'::app_role)
);

-- Create new user_id-based RLS policy for creating job applications
CREATE POLICY "Students can create own applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.user_id = auth.uid() 
    AND s.id = job_applications.student_id
  )
);

-- Create a trigger to automatically link new students to their auth user
CREATE OR REPLACE FUNCTION public.link_student_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to find matching auth user by email
  NEW.user_id := (
    SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1
  );
  RETURN NEW;
END;
$$;

-- Create trigger on insert
DROP TRIGGER IF EXISTS link_student_user_on_insert ON public.students;
CREATE TRIGGER link_student_user_on_insert
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.link_student_to_user();