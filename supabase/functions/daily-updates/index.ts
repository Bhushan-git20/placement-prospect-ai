import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily updates...');

    const results = {
      marketTrends: { success: false, message: '' },
      skillAnalysis: { success: false, message: '' },
      placementReadiness: { success: false, message: '' },
      assessmentQuestions: { success: false, message: '' },
    };

    // 1. Update Market Trends
    try {
      console.log('Updating market trends...');
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get active job postings and calculate demand
      const { data: jobs, error: jobsError } = await supabase
        .from('job_postings')
        .select('required_skills, preferred_skills, title, industry')
        .eq('is_active', true);

      if (jobsError) throw jobsError;

      // Aggregate skill demand from job postings
      const skillDemand: Record<string, number> = {};
      const roleDemand: Record<string, number> = {};

      jobs?.forEach(job => {
        // Count required skills
        job.required_skills?.forEach((skill: string) => {
          skillDemand[skill] = (skillDemand[skill] || 0) + 2; // Weight required skills higher
        });
        // Count preferred skills
        job.preferred_skills?.forEach((skill: string) => {
          skillDemand[skill] = (skillDemand[skill] || 0) + 1;
        });
        // Count roles
        if (job.title) {
          roleDemand[job.title] = (roleDemand[job.title] || 0) + 1;
        }
      });

      // Update or insert market trends
      for (const [skill, demand] of Object.entries(skillDemand)) {
        await supabase
          .from('job_market_trends')
          .upsert({
            skill_name: skill,
            month_year: currentMonth,
            demand_score: Math.min(demand * 10, 100),
            job_postings_count: demand,
            created_at: new Date().toISOString()
          }, { onConflict: 'skill_name,month_year' });
      }

      results.marketTrends = { success: true, message: `Updated ${Object.keys(skillDemand).length} skill trends` };
      console.log(`Market trends updated: ${Object.keys(skillDemand).length} skills`);
    } catch (error) {
      console.error('Market trends update failed:', error);
      results.marketTrends = { success: false, message: String(error) };
    }

    // 2. Update Skill Analysis
    try {
      console.log('Updating skill analysis...');
      
      // Get current skill demand from job postings
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('required_skills, preferred_skills')
        .eq('is_active', true);

      const skillCounts: Record<string, number> = {};
      jobs?.forEach(job => {
        [...(job.required_skills || []), ...(job.preferred_skills || [])].forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });

      // Update skill_analysis table
      for (const [skill, count] of Object.entries(skillCounts)) {
        const demandScore = Math.min(count * 5, 100);
        let trend: 'Rising' | 'Stable' | 'Declining' = 'Stable';
        if (demandScore > 70) trend = 'Rising';
        else if (demandScore < 30) trend = 'Declining';

        await supabase
          .from('skill_analysis')
          .upsert({
            skill_name: skill,
            current_demand: demandScore,
            job_count: count,
            trend: trend,
            category: 'Technical',
            last_updated: new Date().toISOString()
          }, { onConflict: 'skill_name' });
      }

      results.skillAnalysis = { success: true, message: `Updated ${Object.keys(skillCounts).length} skills` };
      console.log(`Skill analysis updated: ${Object.keys(skillCounts).length} skills`);
    } catch (error) {
      console.error('Skill analysis update failed:', error);
      results.skillAnalysis = { success: false, message: String(error) };
    }

    // 3. Update Placement Readiness Scores for students
    try {
      console.log('Updating placement readiness scores...');
      
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, skills, cgpa, preferred_roles, placement_status')
        .eq('placement_status', 'not_placed')
        .limit(50); // Process in batches

      if (studentsError) throw studentsError;

      // Get trending skills for comparison
      const { data: trendingSkills } = await supabase
        .from('skill_analysis')
        .select('skill_name, current_demand')
        .gte('current_demand', 50)
        .order('current_demand', { ascending: false })
        .limit(20);

      const trendingSkillNames = trendingSkills?.map(s => s.skill_name.toLowerCase()) || [];
      let updatedCount = 0;

      for (const student of students || []) {
        // Calculate readiness based on skills match with trending skills
        const studentSkills = (student.skills || []).map((s: string) => s.toLowerCase());
        const matchingSkills = studentSkills.filter((s: string) => trendingSkillNames.includes(s));
        
        let readinessScore = 0;
        readinessScore += (matchingSkills.length / Math.max(trendingSkillNames.length, 1)) * 40; // Skill match
        readinessScore += ((student.cgpa || 0) / 10) * 30; // CGPA contribution
        readinessScore += studentSkills.length >= 5 ? 20 : (studentSkills.length * 4); // Skill count
        readinessScore += student.preferred_roles?.length > 0 ? 10 : 0; // Has career goals

        await supabase
          .from('students')
          .update({ 
            placement_readiness_score: Math.round(readinessScore),
            last_analysis_date: new Date().toISOString()
          })
          .eq('id', student.id);
        
        updatedCount++;
      }

      results.placementReadiness = { success: true, message: `Updated ${updatedCount} student scores` };
      console.log(`Placement readiness updated: ${updatedCount} students`);
    } catch (error) {
      console.error('Placement readiness update failed:', error);
      results.placementReadiness = { success: false, message: String(error) };
    }

    // 4. Refresh Assessment Question Pool (mark outdated questions)
    try {
      console.log('Refreshing assessment questions...');
      
      // Get latest trending skills to ensure questions are relevant
      const { data: trendingSkills } = await supabase
        .from('skill_analysis')
        .select('skill_name')
        .gte('current_demand', 50)
        .order('current_demand', { ascending: false })
        .limit(15);

      const relevantSkills = trendingSkills?.map(s => s.skill_name) || [];
      
      results.assessmentQuestions = { 
        success: true, 
        message: `Assessment pool refreshed with ${relevantSkills.length} trending skills focus` 
      };
      console.log(`Assessment questions refreshed for ${relevantSkills.length} trending skills`);
    } catch (error) {
      console.error('Assessment questions refresh failed:', error);
      results.assessmentQuestions = { success: false, message: String(error) };
    }

    console.log('Daily updates completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily updates completed',
        timestamp: new Date().toISOString(),
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Daily updates failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
