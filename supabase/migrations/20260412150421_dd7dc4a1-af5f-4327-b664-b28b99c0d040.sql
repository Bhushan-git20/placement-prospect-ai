
-- 1. Fix log_role_change function
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, new_role, action)
    VALUES (COALESCE(auth.uid(), NEW.user_id), NEW.user_id, NEW.role, 'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, old_role, new_role, action)
    VALUES (COALESCE(auth.uid(), NEW.user_id), NEW.user_id, OLD.role, NEW.role, 'UPDATE');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, old_role, new_role, action)
    VALUES (COALESCE(auth.uid(), OLD.user_id), OLD.user_id, OLD.role, OLD.role, 'DELETE');
    RETURN OLD;
  END IF;
END;
$$;

-- 2. Clean up data
DELETE FROM public.user_roles WHERE role IN ('faculty', 'recruiter');
DELETE FROM public.role_audit_log WHERE old_role IN ('faculty', 'recruiter') OR new_role IN ('faculty', 'recruiter');
UPDATE public.profiles SET role = 'user' WHERE role IN ('faculty', 'recruiter');

-- 3. Drop ALL policies on all tables
DROP POLICY IF EXISTS "Admins can view profile names only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view role audit logs" ON public.role_audit_log;
DROP POLICY IF EXISTS "Faculty and admin can manage assessments" ON public.assessments;
DROP POLICY IF EXISTS "Assessments viewable by authorized users" ON public.assessments;
DROP POLICY IF EXISTS "Faculty can insert students" ON public.students;
DROP POLICY IF EXISTS "Faculty can update students" ON public.students;
DROP POLICY IF EXISTS "Faculty can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Recruiters and admin can manage job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Admins can view all job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Faculty and admin can manage applications" ON public.job_applications;
DROP POLICY IF EXISTS "Job applications viewable by authorized users" ON public.job_applications;
DROP POLICY IF EXISTS "Students can create own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin and faculty can manage skill analysis" ON public.skill_analysis;
DROP POLICY IF EXISTS "Authenticated users can view skill analysis" ON public.skill_analysis;
DROP POLICY IF EXISTS "Admin can manage skill relationships" ON public.skill_relationships;
DROP POLICY IF EXISTS "Anyone can view skill relationships" ON public.skill_relationships;
DROP POLICY IF EXISTS "Admin can manage career transitions" ON public.career_transitions;
DROP POLICY IF EXISTS "Anyone can view career transitions" ON public.career_transitions;
DROP POLICY IF EXISTS "Admin can manage market trends" ON public.job_market_trends;
DROP POLICY IF EXISTS "Anyone can view market trends" ON public.job_market_trends;
DROP POLICY IF EXISTS "Admin and faculty can manage journeys" ON public.user_career_journeys;
DROP POLICY IF EXISTS "Career journeys viewable by owner or admin" ON public.user_career_journeys;

-- Drop storage policies that reference check_user_role
DROP POLICY IF EXISTS "Faculty and admin can view all resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume" ON storage.objects;

-- 4. Drop functions with CASCADE
DROP FUNCTION IF EXISTS public.check_user_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_primary_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_salary() CASCADE;

-- 5. Alter enum
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
ALTER TABLE public.role_audit_log ALTER COLUMN old_role TYPE text;
ALTER TABLE public.role_audit_log ALTER COLUMN new_role TYPE text;

DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

ALTER TABLE public.profiles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;
ALTER TABLE public.role_audit_log ALTER COLUMN old_role TYPE public.app_role USING old_role::public.app_role;
ALTER TABLE public.role_audit_log ALTER COLUMN new_role TYPE public.app_role USING new_role::public.app_role;

-- 6. Recreate functions
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'user' THEN 2 END LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.can_view_salary()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT check_user_role(auth.uid(), 'admin') $$;

-- 7. Recreate ALL RLS policies
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (auth.uid() IS NOT NULL AND check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view audit logs" ON public.role_audit_log FOR SELECT USING (check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Assessments viewable by authorized users" ON public.assessments FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = auth.uid() AND s.id::text = assessments.student_id) OR check_user_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view all students" ON public.students FOR SELECT TO authenticated USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own profile" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update students" ON public.students FOR UPDATE TO authenticated USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Students can update own profile" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can delete students" ON public.students FOR DELETE TO authenticated USING (check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage job postings" ON public.job_postings FOR ALL TO authenticated USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active job postings" ON public.job_postings FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage applications" ON public.job_applications FOR ALL USING (auth.uid() IS NOT NULL AND check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Job applications viewable by owner" ON public.job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM students s WHERE s.user_id = auth.uid() AND s.id = job_applications.student_id));
CREATE POLICY "Students can create own applications" ON public.job_applications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.user_id = auth.uid() AND s.id = job_applications.student_id));

CREATE POLICY "Admin can manage skill analysis" ON public.skill_analysis FOR ALL TO authenticated USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view skill analysis" ON public.skill_analysis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage skill relationships" ON public.skill_relationships FOR ALL USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view skill relationships" ON public.skill_relationships FOR SELECT USING (true);

CREATE POLICY "Admin can manage career transitions" ON public.career_transitions FOR ALL USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view career transitions" ON public.career_transitions FOR SELECT USING (true);

CREATE POLICY "Admin can manage market trends" ON public.job_market_trends FOR ALL USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view market trends" ON public.job_market_trends FOR SELECT USING (true);

CREATE POLICY "Admin can manage journeys" ON public.user_career_journeys FOR ALL USING (check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Career journeys viewable by owner" ON public.user_career_journeys FOR SELECT USING (
  student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()) OR check_user_role(auth.uid(), 'admin')
);

-- 8. Recreate storage policies
CREATE POLICY "Admins can view all resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND check_user_role(auth.uid(), 'admin'));
CREATE POLICY "Users can upload own resume" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own resume" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own resume" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own resume" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
