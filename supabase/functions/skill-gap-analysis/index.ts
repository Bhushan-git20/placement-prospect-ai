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

    console.log('Analyzing skill gaps for student:', studentId);

    // Verify user has access to this student
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdminOrFaculty = userRoles?.some(r => r.role === 'admin' || r.role === 'faculty');

    // Use service role for data access after authorization check
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parallel fetch student and trending skills
    const [studentResult, skillsResult] = await Promise.all([
      serviceClient
        .from('students')
        .select('id, name, email, skills, preferred_roles, department')
        .eq('id', studentId)
        .single(),
      serviceClient
        .from('skill_analysis')
        .select('skill_name, trend, current_demand')
        .order('current_demand', { ascending: false })
        .limit(15)
    ]);

    if (studentResult.error) throw studentResult.error;
    if (skillsResult.error) throw skillsResult.error;

    const student = studentResult.data;

    // Verify user has access to this student (either admin/faculty or owns the record)
    if (!isAdminOrFaculty && student.email !== user.email) {
      console.error('User does not have permission to access this student');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only access your own student record' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trendingSkills = skillsResult.data;

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
            content: `Career advisor. Compare skills with market. Return ONLY JSON: {"skill_gaps":[],"strengths":[],"recommendations":[],"priority_skills":[]}`
          },
          {
            role: 'user',
            content: `Skills: ${(student.skills || []).join(',')}
Roles: ${(student.preferred_roles || []).join(',')}
Trending: ${trendingSkills.map(s => s.skill_name).join(',')}`
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
    const analysisContent = data.choices[0].message.content;
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisContent);

    // Update student record asynchronously (don't wait)
    serviceClient
      .from('students')
      .update({
        skill_gaps: analysis.skill_gaps || [],
        strengths: analysis.strengths || [],
        recommendations: analysis.recommendations || [],
        last_analysis_date: new Date().toISOString(),
      })
      .eq('id', studentId)
      .then(({ error }) => {
        if (error) console.error('Error updating student:', error);
      });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in skill-gap-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
