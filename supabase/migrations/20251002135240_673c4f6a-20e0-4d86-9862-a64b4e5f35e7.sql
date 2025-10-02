-- Create security definer function to get user email safely
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can insert their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.assessments;

-- Create new policies using the security definer function
CREATE POLICY "Students can insert their own assessments"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT students.student_id
    FROM students
    WHERE students.email = public.get_user_email(auth.uid())
  )
);

CREATE POLICY "Students can view their own assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT students.student_id
    FROM students
    WHERE students.email = public.get_user_email(auth.uid())
  )
);