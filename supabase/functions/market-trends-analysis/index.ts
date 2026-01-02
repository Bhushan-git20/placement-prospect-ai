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
  skillName: z.string().max(100).optional(),
  jobRole: z.string().max(100).optional(),
  months: z.number().min(1).max(24).optional().default(12)
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

    const { skillName, jobRole, months } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Analyzing market trends for:', { skillName, jobRole, months });

    // Parallel fetch historical and job data
    const [historicalResult, jobsResult] = await Promise.all([
      serviceClient
        .from('job_market_trends')
        .select('month_year, skill_name, job_role, demand_score, growth_rate, avg_salary')
        .order('month_year', { ascending: false })
        .limit(50),
      serviceClient
        .from('job_postings')
        .select('title, required_skills, preferred_skills')
        .eq('is_active', true)
        .limit(100)
    ]);

    const historicalData = historicalResult.data || [];
    const jobPostings = jobsResult.data || [];

    // Calculate skill demand efficiently
    const skillDemandMap: Record<string, number> = {};
    const roleDemandMap: Record<string, number> = {};
    
    jobPostings.forEach(job => {
      [...(job.required_skills || []), ...(job.preferred_skills || [])].forEach(skill => {
        skillDemandMap[skill] = (skillDemandMap[skill] || 0) + 1;
      });
      roleDemandMap[job.title.toLowerCase()] = (roleDemandMap[job.title.toLowerCase()] || 0) + 1;
    });

    // Filter relevant trend data
    const trendData = skillName 
      ? historicalData.filter(d => d.skill_name === skillName).slice(0, 12)
      : historicalData.filter(d => d.job_role?.toLowerCase().includes(jobRole?.toLowerCase() || '')).slice(0, 12);

    // Get top skills for context
    const topSkills = Object.entries(skillDemandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k, v]) => `${k}(${v})`).join(',');

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
            content: `Job market analyst. Predict ${months} months. Return ONLY JSON: {"predictions":[{"month":"YYYY-MM","demandScore":0,"growthRate":0}],"insights":[],"emergingSkills":[],"decliningSkills":[],"recommendation":""}`
          },
          {
            role: 'user',
            content: `History: ${JSON.stringify(trendData.slice(0, 6))}
Jobs: ${jobPostings.length}, TopSkills: ${topSkills}
Predict: ${skillName ? `Skill:${skillName}` : `Role:${jobRole}`}`
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

    const aiData = await response.json();
    const aiContent = aiData.choices[0].message.content;
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    const predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);

    // Calculate average growth
    const avgGrowth = trendData.length > 0 
      ? trendData.reduce((sum, t) => sum + (t.growth_rate || 0), 0) / trendData.length
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          currentDemand: skillName ? skillDemandMap[skillName] || 0 : Object.values(roleDemandMap).reduce((a, b) => a + b, 0),
          predictions: predictions.predictions || [],
          insights: predictions.insights || [],
          emergingSkills: predictions.emergingSkills || [],
          decliningSkills: predictions.decliningSkills || [],
          recommendation: predictions.recommendation || '',
          historicalGrowth: avgGrowth,
          dataPoints: trendData.length,
          lastUpdated: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in market-trends-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
