-- Add user_id column to assessments table to link directly to auth users
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can insert their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.assessments;

-- Create simplified policies based on user_id
CREATE POLICY "Users can insert their own assessments"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep admin/faculty policies as is