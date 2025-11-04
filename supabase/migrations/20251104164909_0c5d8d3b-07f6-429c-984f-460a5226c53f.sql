-- Enable RLS on new tables if they exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skill_relationships') THEN
        -- Create skill_relationships table for GNN
        CREATE TABLE public.skill_relationships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            skill_from TEXT NOT NULL,
            skill_to TEXT NOT NULL,
            relationship_type TEXT NOT NULL, -- 'prerequisite', 'complementary', 'advanced'
            strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
            created_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(skill_from, skill_to, relationship_type)
        );

        ALTER TABLE public.skill_relationships ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Anyone can view skill relationships"
            ON public.skill_relationships FOR SELECT
            USING (true);

        CREATE POLICY "Admin can manage skill relationships"
            ON public.skill_relationships FOR ALL
            USING (check_user_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'career_transitions') THEN
        -- Create career_transitions table for collaborative filtering
        CREATE TABLE public.career_transitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            from_role TEXT NOT NULL,
            to_role TEXT NOT NULL,
            required_skills TEXT[] DEFAULT '{}',
            avg_time_months INTEGER,
            success_rate NUMERIC(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
            salary_change_percent NUMERIC(5,2),
            sample_size INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.career_transitions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Anyone can view career transitions"
            ON public.career_transitions FOR SELECT
            USING (true);

        CREATE POLICY "Admin can manage career transitions"
            ON public.career_transitions FOR ALL
            USING (check_user_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_market_trends') THEN
        -- Create job_market_trends table for predictive analytics
        CREATE TABLE public.job_market_trends (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            skill_name TEXT,
            job_role TEXT,
            month_year DATE NOT NULL,
            demand_score INTEGER DEFAULT 0,
            job_postings_count INTEGER DEFAULT 0,
            avg_salary NUMERIC(10,2),
            growth_rate NUMERIC(5,2),
            region TEXT DEFAULT 'Global',
            created_at TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT skill_or_role_required CHECK (skill_name IS NOT NULL OR job_role IS NOT NULL)
        );

        ALTER TABLE public.job_market_trends ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Anyone can view market trends"
            ON public.job_market_trends FOR SELECT
            USING (true);

        CREATE POLICY "Admin can manage market trends"
            ON public.job_market_trends FOR ALL
            USING (check_user_role(auth.uid(), 'admin'));

        -- Create index for better query performance
        CREATE INDEX idx_job_market_trends_skill ON public.job_market_trends(skill_name);
        CREATE INDEX idx_job_market_trends_role ON public.job_market_trends(job_role);
        CREATE INDEX idx_job_market_trends_date ON public.job_market_trends(month_year);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_career_journeys') THEN
        -- Create user_career_journeys table to track career progression
        CREATE TABLE public.user_career_journeys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
            from_role TEXT,
            to_role TEXT NOT NULL,
            transition_date DATE NOT NULL,
            skills_acquired TEXT[] DEFAULT '{}',
            time_invested_months INTEGER,
            success_metrics JSONB,
            created_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.user_career_journeys ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own journey"
            ON public.user_career_journeys FOR SELECT
            USING (true);

        CREATE POLICY "Admin and faculty can manage journeys"
            ON public.user_career_journeys FOR ALL
            USING (check_user_role(auth.uid(), 'admin') OR check_user_role(auth.uid(), 'faculty'));
    END IF;
END $$;

-- Insert sample data for skill relationships
INSERT INTO public.skill_relationships (skill_from, skill_to, relationship_type, strength)
VALUES 
    ('JavaScript', 'React', 'prerequisite', 0.9),
    ('JavaScript', 'Node.js', 'prerequisite', 0.8),
    ('React', 'Next.js', 'prerequisite', 0.85),
    ('Python', 'Django', 'prerequisite', 0.8),
    ('Python', 'Machine Learning', 'prerequisite', 0.9),
    ('SQL', 'PostgreSQL', 'complementary', 0.7),
    ('HTML', 'CSS', 'complementary', 0.95),
    ('CSS', 'Tailwind CSS', 'prerequisite', 0.6),
    ('Git', 'GitHub', 'complementary', 0.8),
    ('TypeScript', 'JavaScript', 'advanced', 0.85)
ON CONFLICT (skill_from, skill_to, relationship_type) DO NOTHING;

-- Insert sample data for career transitions
INSERT INTO public.career_transitions (from_role, to_role, required_skills, avg_time_months, success_rate, salary_change_percent, sample_size)
VALUES 
    ('Junior Developer', 'Senior Developer', ARRAY['Advanced JavaScript', 'System Design', 'Leadership'], 24, 0.75, 45.5, 150),
    ('Frontend Developer', 'Full Stack Developer', ARRAY['Node.js', 'Database Design', 'API Development'], 18, 0.82, 35.2, 200),
    ('Backend Developer', 'DevOps Engineer', ARRAY['Docker', 'Kubernetes', 'CI/CD', 'AWS'], 20, 0.68, 40.0, 120),
    ('Data Analyst', 'Data Scientist', ARRAY['Machine Learning', 'Python', 'Statistics', 'Deep Learning'], 24, 0.65, 55.8, 180),
    ('QA Engineer', 'Test Automation Engineer', ARRAY['Selenium', 'Python', 'CI/CD'], 15, 0.78, 28.5, 95)
ON CONFLICT DO NOTHING;

-- Insert sample market trends data
INSERT INTO public.job_market_trends (skill_name, month_year, demand_score, job_postings_count, avg_salary, growth_rate)
VALUES 
    ('React', '2024-01-01', 850, 1200, 95000, 12.5),
    ('Python', '2024-01-01', 920, 1500, 105000, 15.8),
    ('JavaScript', '2024-01-01', 880, 1350, 92000, 10.2),
    ('TypeScript', '2024-01-01', 780, 980, 98000, 18.5),
    ('Machine Learning', '2024-01-01', 720, 850, 125000, 22.3),
    ('AWS', '2024-01-01', 810, 1100, 115000, 16.7),
    ('Docker', '2024-01-01', 690, 820, 102000, 14.2),
    ('Kubernetes', '2024-01-01', 650, 750, 118000, 20.5)
ON CONFLICT DO NOTHING;