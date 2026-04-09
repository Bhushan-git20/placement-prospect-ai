import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  jobTitle: z.string().min(1).max(500),
  jobDescription: z.string().max(5000).optional().default(''),
  userSkills: z.array(z.string()).optional().default([]),
  userExperience: z.string().max(5000).optional().default(''),
  focusArea: z.enum(['behavioral', 'technical', 'situational', 'all']).optional().default('all'),
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

    const { jobTitle, jobDescription, userSkills, userExperience, focusArea } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

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
            content: `You are an expert interview coach. Generate interview preparation material using the STAR framework (Situation, Task, Action, Result). Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Tell me about a time...",
      "category": "behavioral|technical|situational",
      "difficulty": "easy|medium|hard",
      "why_asked": "What the interviewer is looking for",
      "star_story": {
        "situation": "Set the scene...",
        "task": "What was your responsibility...",
        "action": "What did you do...",
        "result": "What was the outcome..."
      },
      "tips": ["tip1", "tip2"],
      "follow_ups": ["follow-up question 1"]
    }
  ],
  "general_tips": ["tip1", "tip2"],
  "company_research_points": ["point1", "point2"],
  "questions_to_ask_interviewer": ["question1", "question2"]
}
Generate 6-8 questions covering the requested focus area.`
          },
          {
            role: 'user',
            content: `Prepare interview material for:

Job Title: ${jobTitle}
Job Description: ${jobDescription || 'Not provided'}
Focus Area: ${focusArea}

Candidate Skills: ${userSkills.join(', ') || 'Not specified'}
Candidate Experience: ${userExperience || 'Not specified'}`
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

    return new Response(JSON.stringify({ success: true, prep: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in interview-prep:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
