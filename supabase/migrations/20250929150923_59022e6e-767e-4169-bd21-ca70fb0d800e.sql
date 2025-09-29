-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'recruiter', 'user');

-- Create enum for placement status
CREATE TYPE public.placement_status AS ENUM ('placed', 'in_process', 'not_placed');

-- Create enum for skill trend
CREATE TYPE public.skill_trend AS ENUM ('Rising', 'Stable', 'Declining');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    university TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1 AND year <= 5),
    cgpa NUMERIC(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
    skills TEXT[] NOT NULL DEFAULT '{}',
    preferred_roles TEXT[] NOT NULL DEFAULT '{}',
    preferred_locations TEXT[] NOT NULL DEFAULT '{}',
    resume_url TEXT,
    placement_readiness_score INTEGER CHECK (placement_readiness_score >= 0 AND placement_readiness_score <= 100),
    last_analysis_date TIMESTAMP WITH TIME ZONE,
    placement_status placement_status DEFAULT 'not_placed',
    placed_company TEXT,
    placed_role TEXT,
    package_lpa NUMERIC(5,2),
    skill_gaps TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    target_companies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_postings table
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    industry TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    preferred_skills TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_deadline TIMESTAMP WITH TIME ZONE,
    source TEXT,
    is_active BOOLEAN DEFAULT true,
    demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skill_analysis table
CREATE TABLE public.skill_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    current_demand INTEGER CHECK (current_demand >= 0 AND current_demand <= 100),
    predicted_demand INTEGER CHECK (predicted_demand >= 0 AND predicted_demand <= 100),
    growth_rate NUMERIC(5,2),
    industry_focus TEXT[] DEFAULT '{}',
    average_salary_impact NUMERIC(10,2),
    job_count INTEGER DEFAULT 0,
    trend skill_trend DEFAULT 'Stable',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    assessment_type TEXT NOT NULL,
    test_category TEXT NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    total_questions INTEGER,
    correct_answers INTEGER,
    time_taken_minutes INTEGER,
    time_limit_minutes INTEGER,
    difficulty_level TEXT,
    areas_of_improvement TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    feedback TEXT,
    recommendations TEXT[] DEFAULT '{}',
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_focus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Authenticated users can view students"
ON public.students FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Faculty and admin can manage students"
ON public.students FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'faculty')
);

-- RLS Policies for job_postings
CREATE POLICY "Everyone can view active job postings"
ON public.job_postings FOR SELECT
USING (is_active = true);

CREATE POLICY "Recruiters and admin can manage job postings"
ON public.job_postings FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'recruiter')
);

-- RLS Policies for skill_analysis
CREATE POLICY "Authenticated users can view skill analysis"
ON public.skill_analysis FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and faculty can manage skill analysis"
ON public.skill_analysis FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'faculty')
);

-- RLS Policies for assessments
CREATE POLICY "Students can view their own assessments"
ON public.assessments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'user') AND 
  student_id IN (
    SELECT student_id FROM public.students 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Faculty and admin can view all assessments"
ON public.assessments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'faculty')
);

CREATE POLICY "Faculty and admin can manage assessments"
ON public.assessments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'faculty')
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();