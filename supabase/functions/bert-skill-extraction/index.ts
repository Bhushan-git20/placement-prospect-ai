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
    const { text, type } = await req.json(); // type: 'resume' or 'job_posting'
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Extracting skills using NER for type:', type);

    // Enhanced prompt for BERT-like NER extraction
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
            content: `You are an advanced Named Entity Recognition (NER) system specialized in extracting technical skills, tools, frameworks, and qualifications from text.
Act like a BERT model with custom NER layers trained on job market data.

Extract and categorize entities into:
- TECHNICAL_SKILLS: Programming languages, frameworks, libraries, tools
- SOFT_SKILLS: Communication, leadership, teamwork, etc.
- QUALIFICATIONS: Degrees, certifications, experience levels
- DOMAINS: Industries, business domains, specializations

Return ONLY valid JSON with this structure:
{
  "entities": [
    {
      "text": "extracted entity",
      "category": "TECHNICAL_SKILLS|SOFT_SKILLS|QUALIFICATIONS|DOMAINS",
      "confidence": 0.0-1.0,
      "context": "surrounding text for verification"
    }
  ],
  "summary": {
    "technicalSkills": ["skill1", "skill2", ...],
    "softSkills": ["skill1", "skill2", ...],
    "qualifications": ["qual1", "qual2", ...],
    "domains": ["domain1", "domain2", ...]
  }
}`
          },
          {
            role: 'user',
            content: `Analyze this ${type === 'resume' ? 'resume' : 'job posting'} text and extract all relevant entities using NER:

${text}

Perform Named Entity Recognition and extract all skills, qualifications, and domains with confidence scores.`
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

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    // Filter entities by confidence threshold (similar to BERT confidence)
    const highConfidenceEntities = extractedData.entities.filter(
      (e: any) => e.confidence >= 0.7
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          entities: highConfidenceEntities,
          summary: extractedData.summary,
          totalEntitiesFound: extractedData.entities.length,
          highConfidenceCount: highConfidenceEntities.length,
          extractionMethod: 'NER (BERT-style)',
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in bert-skill-extraction:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
