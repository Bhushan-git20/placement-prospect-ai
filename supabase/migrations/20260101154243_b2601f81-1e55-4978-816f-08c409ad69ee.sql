-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add unique constraint for market trends upsert
ALTER TABLE public.job_market_trends 
ADD CONSTRAINT job_market_trends_skill_month_unique 
UNIQUE (skill_name, month_year);

-- Add unique constraint for skill analysis upsert
ALTER TABLE public.skill_analysis
ADD CONSTRAINT skill_analysis_skill_name_unique 
UNIQUE (skill_name);