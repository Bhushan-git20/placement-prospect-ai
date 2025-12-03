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
    const { studentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calculating placement readiness for student:', studentId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get student data first to get student_id for assessments
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id, student_id, name, cgpa, year, department, skills, skill_gaps, resume_url')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch assessments in parallel after getting student_id
    const { data: assessments } = await supabaseClient
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
        model: 'google/gemini-2.5-flash-lite', // Faster model
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
    supabaseClient
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
