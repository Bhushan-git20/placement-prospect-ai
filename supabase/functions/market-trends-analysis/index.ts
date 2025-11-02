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
    const { skillName, jobRole, months = 12 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Analyzing market trends for:', { skillName, jobRole, months });

    // Get historical trend data
    const { data: historicalData, error: histError } = await supabaseClient
      .from('job_market_trends')
      .select('*')
      .order('month_year', { ascending: false })
      .limit(100);

    if (histError) {
      console.error('Error fetching historical data:', histError);
    }

    // Get current job postings data
    const { data: jobPostings, error: jobsError } = await supabaseClient
      .from('job_postings')
      .select('*')
      .eq('is_active', true);

    if (jobsError) {
      console.error('Error fetching job postings:', jobsError);
    }

    // Calculate skill demand from active job postings
    const skillDemandMap: Record<string, number> = {};
    const roleDemandMap: Record<string, number> = {};
    
    jobPostings?.forEach(job => {
      const allSkills = [...(job.required_skills || []), ...(job.preferred_skills || [])];
      allSkills.forEach(skill => {
        skillDemandMap[skill] = (skillDemandMap[skill] || 0) + 1;
      });
      
      const title = job.title.toLowerCase();
      roleDemandMap[title] = (roleDemandMap[title] || 0) + 1;
    });

    // Use AI to predict future trends
    const trendData = skillName 
      ? historicalData?.filter(d => d.skill_name === skillName) 
      : historicalData?.filter(d => d.job_role.toLowerCase().includes(jobRole?.toLowerCase() || ''));

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
            content: `You are an expert job market analyst specializing in predicting technology trends and skill demands. 
Analyze historical data and provide predictions for the next ${months} months.
Return ONLY valid JSON with this structure:
{
  "predictions": [{"month": "YYYY-MM", "demandScore": number, "growthRate": number, "avgSalary": number}],
  "insights": ["insight1", "insight2", ...],
  "emergingSkills": ["skill1", "skill2", ...],
  "decliningSkills": ["skill1", "skill2", ...],
  "recommendation": "string"
}`
          },
          {
            role: 'user',
            content: `Historical trend data: ${JSON.stringify(trendData?.slice(0, 24))}
Current market data:
- Active job postings: ${jobPostings?.length || 0}
- Top skills in demand: ${Object.entries(skillDemandMap).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k}(${v})`).join(', ')}
- Top roles in demand: ${Object.entries(roleDemandMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}(${v})`).join(', ')}

Predict trends for: ${skillName ? `Skill: ${skillName}` : `Role: ${jobRole}`}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices[0].message.content;
    
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    const predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);

    // Calculate statistical metrics
    const recentTrends = trendData?.slice(0, 6) || [];
    const avgGrowth = recentTrends.length > 0 
      ? recentTrends.reduce((sum, t) => sum + (t.growth_rate || 0), 0) / recentTrends.length
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          currentDemand: skillName ? skillDemandMap[skillName] || 0 : Object.values(roleDemandMap).reduce((a, b) => a + b, 0),
          predictions: predictions.predictions,
          insights: predictions.insights,
          emergingSkills: predictions.emergingSkills,
          decliningSkills: predictions.decliningSkills,
          recommendation: predictions.recommendation,
          historicalGrowth: avgGrowth,
          dataPoints: recentTrends.length,
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
