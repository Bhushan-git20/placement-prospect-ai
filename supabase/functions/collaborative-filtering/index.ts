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
    const { studentId, targetRole } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting collaborative filtering for student:', studentId);

    // Get student data
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Find similar students based on skills overlap
    const { data: allStudents, error: studentsError } = await supabaseClient
      .from('students')
      .select('*')
      .neq('id', studentId);

    if (studentsError) {
      throw new Error('Error fetching students');
    }

    // Calculate similarity scores using Jaccard similarity
    const similarStudents = allStudents.map(otherStudent => {
      const studentSkills = new Set(student.skills || []);
      const otherSkills = new Set(otherStudent.skills || []);
      
      const intersection = new Set([...studentSkills].filter(x => otherSkills.has(x)));
      const union = new Set([...studentSkills, ...otherSkills]);
      
      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      
      return {
        ...otherStudent,
        similarity
      };
    }).filter(s => s.similarity > 0.3) // Only keep students with >30% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 similar students

    // Get career transitions data
    const currentRole = student.preferred_roles?.[0] || 'Junior Developer';
    const { data: transitions, error: transitionsError } = await supabaseClient
      .from('career_transitions')
      .select('*')
      .or(`from_role.eq.${currentRole},to_role.eq.${targetRole || ''}`)
      .order('success_rate', { ascending: false });

    if (transitionsError) {
      console.error('Error fetching transitions:', transitionsError);
    }

    // Find recommended career paths based on similar students
    const recommendedPaths = similarStudents
      .filter(s => s.placement_status === 'placed' && s.placed_role)
      .map(s => ({
        role: s.placed_role,
        company: s.placed_company,
        skills: s.skills,
        package: s.package_lpa,
        similarity: s.similarity
      }));

    // Get skill recommendations based on career transitions
    const recommendedSkills = new Set<string>();
    transitions?.forEach(t => {
      t.required_skills?.forEach((skill: string) => {
        if (!student.skills?.includes(skill)) {
          recommendedSkills.add(skill);
        }
      });
    });

    // Get skill relationships for learning path
    const { data: skillRelations, error: relationsError } = await supabaseClient
      .from('skill_relationships')
      .select('*')
      .in('skill_from', student.skills || []);

    if (relationsError) {
      console.error('Error fetching skill relations:', relationsError);
    }

    // Build learning path based on GNN-style relationships
    const learningPath: any[] = [];
    const skillsToLearn = Array.from(recommendedSkills);
    
    skillsToLearn.forEach(skill => {
      const prerequisites = skillRelations?.filter(
        r => r.skill_to === skill && r.relationship_type === 'prerequisite'
      ) || [];
      
      learningPath.push({
        skill,
        prerequisites: prerequisites.map(p => p.skill_from),
        priority: prerequisites.length === 0 ? 'high' : 'medium'
      });
    });

    // Calculate recommended timeline
    const avgTransitionTime = transitions?.reduce((sum, t) => sum + (t.avg_time_months || 0), 0) / (transitions?.length || 1);

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
          recommendedPaths,
          recommendedSkills: Array.from(recommendedSkills),
          learningPath: learningPath.sort((a, b) => 
            a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
          ),
          careerTransitions: transitions?.slice(0, 5).map(t => ({
            from: t.from_role,
            to: t.to_role,
            requiredSkills: t.required_skills,
            successRate: Math.round((t.success_rate || 0) * 100),
            avgTime: t.avg_time_months,
            salaryChange: t.salary_change_percent
          })),
          estimatedTimeline: Math.round(avgTransitionTime || 12),
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
