import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  studentId: z.string().uuid().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const studentId = parsed.data.studentId;

    // Fetch student data and their applications
    let studentData: any = null;
    let applications: any[] = [];

    if (studentId) {
      const [studentResult, appsResult] = await Promise.all([
        serviceClient.from('students').select('*').eq('id', studentId).single(),
        serviceClient.from('job_applications').select('*, job_postings(*)').eq('student_id', studentId),
      ]);
      studentData = studentResult.data;
      applications = appsResult.data || [];
    } else {
      // Fetch student linked to current user
      const studentResult = await serviceClient.from('students').select('*').eq('user_id', user.id).single();
      if (studentResult.data) {
        studentData = studentResult.data;
        const appsResult = await serviceClient.from('job_applications').select('*, job_postings(*)').eq('student_id', studentData.id);
        applications = appsResult.data || [];
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const rejectedApps = applications.filter(a => a.status === 'rejected');
    const totalApps = applications.length;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a career analytics expert specializing in rejection pattern analysis. Analyze the candidate's application history and identify patterns in rejections to provide actionable improvement strategies. Return ONLY valid JSON:
{
  "overview": {
    "total_applications": 0,
    "rejections": 0,
    "rejection_rate": 0,
    "trend": "improving|declining|stable"
  },
  "patterns": [
    {
      "pattern_name": "Skills Gap Pattern",
      "description": "...",
      "frequency": "high|medium|low",
      "affected_applications": 3,
      "root_cause": "..."
    }
  ],
  "skill_gaps_identified": ["skill1", "skill2"],
  "common_rejection_reasons": ["reason1", "reason2"],
  "improvement_plan": [
    {
      "priority": 1,
      "action": "...",
      "timeline": "1-2 weeks",
      "expected_impact": "high|medium|low"
    }
  ],
  "strengths_to_leverage": ["strength1"],
  "target_role_adjustments": ["suggestion1"],
  "confidence_score": 75
}`
          },
          {
            role: 'user',
            content: `Analyze rejection patterns for this candidate:

Student: ${studentData?.name || 'Unknown'}
Skills: ${(studentData?.skills || []).join(', ')}
CGPA: ${studentData?.cgpa || 'N/A'}
Department: ${studentData?.department || 'N/A'}
Preferred Roles: ${(studentData?.preferred_roles || []).join(', ')}

Total Applications: ${totalApps}
Rejected Applications: ${rejectedApps.length}

Application Details:
${applications.map(a => `- ${a.job_postings?.title || 'Unknown'} at ${a.job_postings?.company || 'Unknown'} | Status: ${a.status} | Required Skills: ${(a.job_postings?.required_skills || []).join(', ')}`).join('\n')}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(JSON.stringify({ success: true, analysis: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in rejection-analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
