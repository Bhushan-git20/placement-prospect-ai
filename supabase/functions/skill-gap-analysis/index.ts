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

    console.log('Analyzing skill gaps for student:', studentId);

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

    // Get top trending skills from job market
    const { data: trendingSkills, error: skillsError } = await supabaseClient
      .from('skill_analysis')
      .select('skill_name, trend, current_demand')
      .order('current_demand', { ascending: false })
      .limit(20);

    if (skillsError) throw skillsError;

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
            content: `You are a career advisor analyzing skill gaps. Compare student skills with market demand.
Return ONLY a valid JSON object:
{
  "skill_gaps": ["skill1", "skill2", ...],
  "strengths": ["strength1", "strength2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "priority_skills": ["skill1", "skill2", ...]
}`
          },
          {
            role: 'user',
            content: `Student Skills: ${JSON.stringify(student.skills || [])}
Student Roles: ${JSON.stringify(student.preferred_roles || [])}
Trending Market Skills: ${JSON.stringify(trendingSkills.map(s => s.skill_name))}

Analyze skill gaps and provide recommendations.`
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

    // Update student record
    const { error: updateError } = await supabaseClient
      .from('students')
      .update({
        skill_gaps: analysis.skill_gaps || [],
        strengths: analysis.strengths || [],
        recommendations: analysis.recommendations || [],
        last_analysis_date: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error updating student:', updateError);
    }

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
