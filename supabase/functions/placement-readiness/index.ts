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

    // Get student data
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Get student's assessment history
    const { data: assessments, error: assessError } = await supabaseClient
      .from('assessments')
      .select('*')
      .eq('student_id', student.student_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (assessError) throw assessError;

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
            content: `You are an AI placement analyst. Calculate a placement readiness score (0-100).
Consider: CGPA, skills, assessments, experience, and market demand.
Return ONLY a valid JSON object:
{
  "readiness_score": 85,
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "confidence": "high|medium|low"
}`
          },
          {
            role: 'user',
            content: `Student Profile:
CGPA: ${student.cgpa || 'N/A'}
Year: ${student.year}
Department: ${student.department}
Skills: ${JSON.stringify(student.skills || [])}
Skill Gaps: ${JSON.stringify(student.skill_gaps || [])}
Assessment Count: ${assessments?.length || 0}
Average Assessment Score: ${assessments?.length ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length).toFixed(1) : 'N/A'}
Resume Available: ${student.resume_url ? 'Yes' : 'No'}

Calculate placement readiness score.`
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

    // Update student record
    const { error: updateError } = await supabaseClient
      .from('students')
      .update({
        placement_readiness_score: result.readiness_score || 0,
        strengths: result.strengths || [],
        recommendations: result.recommendations || [],
        last_analysis_date: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error updating student:', updateError);
    }

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
