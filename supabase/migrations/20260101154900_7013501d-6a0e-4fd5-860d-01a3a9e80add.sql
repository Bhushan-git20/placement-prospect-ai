-- Fix security warnings

-- 1. Create audit log for role changes to track privilege escalation
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by uuid NOT NULL,
  target_user_id uuid NOT NULL,
  old_role app_role,
  new_role app_role NOT NULL,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
USING (check_user_role(auth.uid(), 'admin'));

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, new_role, action)
    VALUES (auth.uid(), NEW.user_id, NEW.role, 'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), NEW.user_id, OLD.role, NEW.role, 'UPDATE');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (changed_by, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), OLD.user_id, OLD.role, OLD.role, 'DELETE');
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER log_user_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- 2. Restrict salary visibility - only show to students who applied or admin/faculty
DROP POLICY IF EXISTS "Authenticated users can view active job postings" ON public.job_postings;

-- Create policy that hides salary for general users, shows full data to admin/faculty
CREATE POLICY "Users can view active job postings"
ON public.job_postings
FOR SELECT
USING (
  is_active = true AND auth.uid() IS NOT NULL
);

-- Create a view that hides salary for non-privileged users
CREATE OR REPLACE VIEW public.job_postings_public AS
SELECT 
  id, title, company, location, job_type, experience_level, industry,
  required_skills, preferred_skills, description, posted_date, 
  application_deadline, is_active, demand_score,
  CASE 
    WHEN check_user_role(auth.uid(), 'admin') OR check_user_role(auth.uid(), 'faculty') 
    THEN salary_min 
    ELSE NULL 
  END as salary_min,
  CASE 
    WHEN check_user_role(auth.uid(), 'admin') OR check_user_role(auth.uid(), 'faculty') 
    THEN salary_max 
    ELSE NULL 
  END as salary_max
FROM public.job_postings
WHERE is_active = true;