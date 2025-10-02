-- Fix roles system: Create separate user_roles table with proper security

-- Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'recruiter', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'faculty' THEN 2
      WHEN 'recruiter' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update profiles table to remove role column (keep for backwards compatibility for now)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'));

-- Fix assessments RLS to allow students to insert their results
DROP POLICY IF EXISTS "Students can insert their own assessments" ON public.assessments;
CREATE POLICY "Students can insert their own assessments"
ON public.assessments FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT students.student_id
    FROM students
    WHERE students.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Update other policies to use new role checking
DROP POLICY IF EXISTS "Faculty and admin can manage assessments" ON public.assessments;
CREATE POLICY "Faculty and admin can manage assessments"
ON public.assessments FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_role(auth.uid(), 'admin') OR 
  public.check_user_role(auth.uid(), 'faculty')
);

DROP POLICY IF EXISTS "Faculty and admin can view all assessments" ON public.assessments;
CREATE POLICY "Faculty and admin can view all assessments"
ON public.assessments FOR SELECT
TO authenticated
USING (
  public.check_user_role(auth.uid(), 'admin') OR 
  public.check_user_role(auth.uid(), 'faculty')
);

DROP POLICY IF EXISTS "Students can view their own assessments" ON public.assessments;
CREATE POLICY "Students can view their own assessments"
ON public.assessments FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT students.student_id
    FROM students
    WHERE students.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Update job_postings policies
DROP POLICY IF EXISTS "Recruiters and admin can manage job postings" ON public.job_postings;
CREATE POLICY "Recruiters and admin can manage job postings"
ON public.job_postings FOR ALL
TO authenticated
USING (
  public.check_user_role(auth.uid(), 'admin') OR 
  public.check_user_role(auth.uid(), 'recruiter')
);

-- Update students policies
DROP POLICY IF EXISTS "Faculty and admin can manage students" ON public.students;
CREATE POLICY "Faculty and admin can manage students"
ON public.students FOR ALL
TO authenticated
USING (
  public.check_user_role(auth.uid(), 'admin') OR 
  public.check_user_role(auth.uid(), 'faculty')
);

-- Update skill_analysis policies
DROP POLICY IF EXISTS "Admin and faculty can manage skill analysis" ON public.skill_analysis;
CREATE POLICY "Admin and faculty can manage skill analysis"
ON public.skill_analysis FOR ALL
TO authenticated
USING (
  public.check_user_role(auth.uid(), 'admin') OR 
  public.check_user_role(auth.uid(), 'faculty')
);

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'));

-- Create trigger to auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_role_assignment ON public.profiles;
CREATE TRIGGER on_user_role_assignment
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role();