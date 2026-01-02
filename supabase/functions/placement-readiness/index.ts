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
  studentId: z.string().uuid('Invalid student ID format')
});

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

    const { studentId } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calculating placement readiness for student:', studentId);

    // Verify user has access
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdminOrFaculty = userRoles?.some(r => r.role === 'admin' || r.role === 'faculty');

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get student data first to get student_id for assessments
    const { data: student, error: studentError } = await serviceClient
      .from('students')
      .select('id, student_id, name, email, cgpa, year, department, skills, skill_gaps, resume_url')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Verify user has access to this student
    if (!isAdminOrFaculty && student.email !== user.email) {
      console.error('User does not have permission to access this student');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only access your own student record' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch assessments in parallel after getting student_id
    const { data: assessments } = await serviceClient
      .from('assessments')
      .select('score')
      .eq('student_id', student.student_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const avgScore = assessments?.length 
      ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length).toFixed(0)
      : 'N/A';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `Placement analyst. Score 0-100. Return ONLY JSON: {"readiness_score":85,"strengths":[],"areas_for_improvement":[],"recommendations":[],"confidence":"high"}`
          },
          {
            role: 'user',
            content: `CGPA:${student.cgpa || 'N/A'}, Year:${student.year}, Dept:${student.department}, Skills:${(student.skills || []).length}, Gaps:${(student.skill_gaps || []).length}, Tests:${assessments?.length || 0}, AvgScore:${avgScore}, Resume:${student.resume_url ? 'Yes' : 'No'}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;
    const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultContent);

    // Update student record asynchronously
    serviceClient
      .from('students')
      .update({
        placement_readiness_score: result.readiness_score || 0,
        strengths: result.strengths || [],
        recommendations: result.recommendations || [],
        last_analysis_date: new Date().toISOString(),
      })
      .eq('id', studentId)
      .then(({ error }) => {
        if (error) console.error('Error updating student:', error);
      });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in placement-readiness function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
