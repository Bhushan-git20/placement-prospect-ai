-- Enable realtime for job_applications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;

-- Enable realtime for assessments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessments;

-- Set REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.job_applications REPLICA IDENTITY FULL;
ALTER TABLE public.assessments REPLICA IDENTITY FULL;