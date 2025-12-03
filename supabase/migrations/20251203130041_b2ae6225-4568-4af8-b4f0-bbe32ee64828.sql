-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_students_placement_status ON students(placement_status);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_skills ON students USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_required_skills ON job_postings USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_assessments_student_id ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_analysis_current_demand ON skill_analysis(current_demand DESC);
CREATE INDEX IF NOT EXISTS idx_job_market_trends_month_year ON job_market_trends(month_year DESC);
CREATE INDEX IF NOT EXISTS idx_career_transitions_success_rate ON career_transitions(success_rate DESC);