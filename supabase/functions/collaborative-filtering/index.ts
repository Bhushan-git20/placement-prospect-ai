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
  studentId: z.string().uuid('Invalid student ID format'),
  targetRole: z.string().max(100).optional()
});

// Optimized Jaccard similarity calculation
function calculateSimilarity(skills1: string[], skills2: string[]): number {
  if (!skills1?.length || !skills2?.length) return 0;
  
  const set1 = new Set(skills1.map(s => s.toLowerCase()));
  const set2 = new Set(skills2.map(s => s.toLowerCase()));
  
  let intersection = 0;
  for (const skill of set1) {
    if (set2.has(skill)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

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

    const { studentId, targetRole } = validationResult.data;
    
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting collaborative filtering for student:', studentId);

    // Parallel fetch all required data
    const [studentResult, allStudentsResult, transitionsResult, skillRelationsResult] = await Promise.all([
      serviceClient
        .from('students')
        .select('id, name, email, skills, preferred_roles, placement_status, placed_role, placed_company, package_lpa')
        .eq('id', studentId)
        .single(),
      serviceClient
        .from('students')
        .select('id, name, skills, placement_status, placed_role, placed_company, package_lpa')
        .neq('id', studentId)
        .limit(100),
      serviceClient
        .from('career_transitions')
        .select('from_role, to_role, required_skills, success_rate, avg_time_months, salary_change_percent')
        .order('success_rate', { ascending: false })
        .limit(20),
      serviceClient
        .from('skill_relationships')
        .select('skill_from, skill_to, relationship_type')
        .limit(50)
    ]);

    if (studentResult.error || !studentResult.data) {
      throw new Error('Student not found');
    }

    const student = studentResult.data;

    // Verify user has access
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdminOrFaculty = userRoles?.some(r => r.role === 'admin' || r.role === 'faculty');
    
    if (!isAdminOrFaculty && student.email !== user.email) {
      console.error('User does not have permission to access this student');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only access your own student record' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allStudents = allStudentsResult.data || [];
    const transitions = transitionsResult.data || [];
    const skillRelations = skillRelationsResult.data || [];

    // Calculate similarity scores efficiently
    const similarStudents = allStudents
      .map(otherStudent => ({
        ...otherStudent,
        similarity: calculateSimilarity(student.skills || [], otherStudent.skills || [])
      }))
      .filter(s => s.similarity > 0.25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    // Find recommended career paths
    const recommendedPaths = similarStudents
      .filter(s => s.placement_status === 'placed' && s.placed_role)
      .map(s => ({
        role: s.placed_role,
        company: s.placed_company,
        skills: s.skills,
        package: s.package_lpa,
        similarity: s.similarity
      }));

    // Get skill recommendations
    const studentSkillsSet = new Set((student.skills || []).map((s: string) => s.toLowerCase()));
    const recommendedSkills = new Set<string>();
    
    transitions.forEach(t => {
      t.required_skills?.forEach((skill: string) => {
        if (!studentSkillsSet.has(skill.toLowerCase())) {
          recommendedSkills.add(skill);
        }
      });
    });

    // Build learning path
    const skillsToLearn = Array.from(recommendedSkills).slice(0, 10);
    const learningPath = skillsToLearn.map(skill => {
      const prerequisites = skillRelations
        .filter(r => r.skill_to === skill && r.relationship_type === 'prerequisite')
        .map(p => p.skill_from);
      
      return {
        skill,
        prerequisites,
        priority: prerequisites.length === 0 ? 'high' : 'medium'
      };
    }).sort((a, b) => a.priority === 'high' ? -1 : 1);

    // Calculate timeline
    const avgTime = transitions.length > 0
      ? transitions.reduce((sum, t) => sum + (t.avg_time_months || 0), 0) / transitions.length
      : 12;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          similarStudents: similarStudents.slice(0, 5).map(s => ({
            name: s.name,
            skills: s.skills,
            role: s.placed_role,
            similarity: Math.round(s.similarity * 100)
          })),
          recommendedPaths: recommendedPaths.slice(0, 5),
          recommendedSkills: Array.from(recommendedSkills).slice(0, 10),
          learningPath,
          careerTransitions: transitions.slice(0, 5).map(t => ({
            from: t.from_role,
            to: t.to_role,
            requiredSkills: t.required_skills,
            successRate: Math.round((t.success_rate || 0) * 100),
            avgTime: t.avg_time_months,
            salaryChange: t.salary_change_percent
          })),
          estimatedTimeline: Math.round(avgTime),
          confidenceScore: similarStudents.length > 0 ? Math.round(similarStudents[0].similarity * 100) : 50
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in collaborative-filtering:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
