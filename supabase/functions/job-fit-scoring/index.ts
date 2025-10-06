import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, studentIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calculating job fit scores for job:', jobId, 'students:', studentIds?.length);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get job posting
    const { data: job, error: jobError } = await supabaseClient
      .from('job_postings')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Get students
    const { data: students, error: studentsError } = await supabaseClient
      .from('students')
      .select('*')
      .in('id', studentIds || []);

    if (studentsError) throw studentsError;

    const rankings = [];

    for (const student of students || []) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an AI recruiter. Calculate job fit score (0-100) based on skill match.
Return ONLY a valid JSON object:
{
  "fit_score": 85,
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "reasoning": "Brief explanation"
}`
            },
            {
              role: 'user',
              content: `Job Requirements:
Title: ${job.title}
Required Skills: ${JSON.stringify(job.required_skills || [])}
Preferred Skills: ${JSON.stringify(job.preferred_skills || [])}
Experience Level: ${job.experience_level}

Candidate Profile:
Name: ${student.name}
Skills: ${JSON.stringify(student.skills || [])}
Year: ${student.year}
CGPA: ${student.cgpa}
Placement Readiness: ${student.placement_readiness_score || 'N/A'}

Calculate job fit score.`
            }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const resultContent = data.choices[0].message.content;
        const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultContent);

        rankings.push({
          student_id: student.id,
          student_name: student.name,
          fit_score: result.fit_score || 0,
          matching_skills: result.matching_skills || [],
          missing_skills: result.missing_skills || [],
          reasoning: result.reasoning || '',
        });
      }
    }

    // Sort by fit score
    rankings.sort((a, b) => b.fit_score - a.fit_score);

    return new Response(JSON.stringify({ success: true, rankings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in job-fit-scoring function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
