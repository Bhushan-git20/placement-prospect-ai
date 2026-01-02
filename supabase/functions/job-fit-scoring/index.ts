import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
  studentIds: z.array(z.string().uuid('Invalid student ID format')).max(50, 'Too many students')
});

// Process students in parallel batches for faster scoring
async function processStudentBatch(
  students: any[],
  job: any,
  apiKey: string
): Promise<any[]> {
  const promises = students.map(async (student) => {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: `Calculate job fit score (0-100). Return ONLY JSON: {"fit_score":85,"matching_skills":[],"missing_skills":[],"reasoning":"brief"}`
            },
            {
              role: 'user',
              content: `Job: ${job.title}, Required: ${(job.required_skills || []).join(',')}, Preferred: ${(job.preferred_skills || []).join(',')}
Student: ${student.name}, Skills: ${(student.skills || []).join(',')}, CGPA: ${student.cgpa}`
            }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const resultContent = data.choices[0].message.content;
        const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultContent);

        return {
          student_id: student.id,
          student_name: student.name,
          fit_score: result.fit_score || 0,
          matching_skills: result.matching_skills || [],
          missing_skills: result.missing_skills || [],
          reasoning: result.reasoning || '',
        };
      }
      return null;
    } catch (error) {
      console.error(`Error processing student ${student.id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Validate input
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { jobId, studentIds } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calculating job fit scores for job:', jobId, 'students:', studentIds?.length);

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parallel fetch job and students
    const [jobResult, studentsResult] = await Promise.all([
      serviceClient
        .from('job_postings')
        .select('id, title, required_skills, preferred_skills, experience_level')
        .eq('id', jobId)
        .single(),
      serviceClient
        .from('students')
        .select('id, name, skills, cgpa, placement_readiness_score')
        .in('id', studentIds || [])
    ]);

    if (jobResult.error) throw jobResult.error;
    if (studentsResult.error) throw studentsResult.error;

    const job = jobResult.data;
    const students = studentsResult.data || [];

    // Process all students in parallel (batch size of 5 for rate limiting)
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < students.length; i += batchSize) {
      batches.push(students.slice(i, i + batchSize));
    }

    const allRankings: any[] = [];
    for (const batch of batches) {
      const batchResults = await processStudentBatch(batch, job, LOVABLE_API_KEY);
      allRankings.push(...batchResults);
    }

    // Sort by fit score
    allRankings.sort((a, b) => b.fit_score - a.fit_score);

    return new Response(JSON.stringify({ success: true, rankings: allRankings }), {
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
