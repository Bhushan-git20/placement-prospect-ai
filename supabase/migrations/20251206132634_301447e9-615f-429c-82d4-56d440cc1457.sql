-- Fix RLS policies to require authenticated users instead of allowing anonymous access

-- Drop and recreate policies for assessments
DROP POLICY IF EXISTS "Faculty and admin can view all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;

CREATE POLICY "Faculty and admin can view all assessments" 
ON public.assessments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (check_user_role(auth.uid(), 'admin'::app_role) OR check_user_role(auth.uid(), 'faculty'::app_role))
);

CREATE POLICY "Users can view their own assessments" 
ON public.assessments 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Drop and recreate policies for job_applications
DROP POLICY IF EXISTS "Faculty and admin can manage applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;

CREATE POLICY "Faculty and admin can manage applications" 
ON public.job_applications 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  (check_user_role(auth.uid(), 'admin'::app_role) OR check_user_role(auth.uid(), 'faculty'::app_role))
);

CREATE POLICY "Users can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND check_user_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Drop and recreate policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND check_user_role(auth.uid(), 'admin'::app_role));