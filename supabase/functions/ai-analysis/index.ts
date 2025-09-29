import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "student_analysis":
        systemPrompt = `You are an AI career advisor specializing in placement analysis. Analyze student profiles and provide actionable insights for career readiness.`;
        userPrompt = `Analyze this student profile and provide:
1. A placement readiness score (0-100)
2. Key skill gaps
3. Specific recommendations
4. Top 3 strengths
5. Target companies that match their profile

Student Data: ${JSON.stringify(data)}

Respond in JSON format:
{
  "placement_readiness_score": number,
  "skill_gaps": ["skill1", "skill2"],
  "recommendations": ["rec1", "rec2"],
  "strengths": ["strength1", "strength2"],
  "target_companies": ["company1", "company2"]
}`;
        break;

      case "career_chat":
        systemPrompt = `You are PlacePredict AI, a friendly and knowledgeable career advisor specializing in student placement guidance. You help students with career advice, skill development, resume feedback, and interview preparation. Keep responses conversational, encouraging, and actionable.`;
        userPrompt = data.message;
        break;

      case "assessment_feedback":
        systemPrompt = `You are an assessment expert providing detailed feedback on student performance. Generate constructive feedback and improvement recommendations.`;
        userPrompt = `Generate feedback for this assessment:
Type: ${data.assessment_type}
Category: ${data.test_category}
Score: ${data.score}/100
Difficulty: ${data.difficulty_level}

Provide:
1. Areas for improvement (2-3 specific areas)
2. Strengths (2-3 strengths based on performance)
3. Detailed feedback paragraph
4. Specific recommendations for improvement

Respond in JSON format:
{
  "areas_of_improvement": ["area1", "area2"],
  "strengths": ["strength1", "strength2"],
  "feedback": "detailed feedback paragraph",
  "recommendations": ["rec1", "rec2"]
}`;
        break;

      default:
        throw new Error("Invalid analysis type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    // For JSON responses, try to parse
    if (type !== "career_chat") {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ success: true, data: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // If parsing fails, return raw content
        return new Response(JSON.stringify({ success: true, data: { response: content } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // For chat responses, return as text
    return new Response(JSON.stringify({ success: true, response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-analysis function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});