import { useEffect, useState } from "react";
// AppLayout removed - will be added via route
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Network, TrendingUp, Users, Zap, BarChart3 } from "lucide-react";
import { BERTSkillExtractor } from "@/components/BERTSkillExtractor";
import { SkillGraphVisualizer } from "@/components/SkillGraphVisualizer";
import { CareerPathRecommendations } from "@/components/CareerPathRecommendations";
import { MarketTrendsPredictor } from "@/components/MarketTrendsPredictor";
import { PlacementAnalyticsDashboard } from "@/components/PlacementAnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";

const AdvancedAnalytics = () => {
  const [studentId, setStudentId] = useState<string>("");
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchCurrentStudent();
  }, []);

  const fetchCurrentStudent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to find student record
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .limit(1)
        .single();

      if (students) {
        setStudentId(students.id);
        setStudentSkills(students.skills || []);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 relative">
      {/* Page Background Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%)]/20 via-transparent to-[hsl(191,91%,55%)]/20"></div>
      </div>
      <div className="relative z-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground text-lg">
            AI-powered career intelligence using NLP, GNN, and Predictive Analytics
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="bert" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              BERT NER
            </TabsTrigger>
            <TabsTrigger value="gnn" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Skill Graph
            </TabsTrigger>
            <TabsTrigger value="collab" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Career Paths
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-r-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <BarChart3 className="h-5 w-5" />
                Placement Analytics Dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive analytics with placement trends, department comparisons, and success metrics.
              </p>
            </div>
            <PlacementAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="bert" className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-r-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <Brain className="h-5 w-5" />
                NLP for Skill Extraction
              </h3>
              <p className="text-sm text-muted-foreground">
                State-of-the-art Named Entity Recognition (NER) extracts skills and roles from job postings 
                and user resumes, identifying precise requirements and gaps with confidence scores.
              </p>
            </div>
            <BERTSkillExtractor />
          </TabsContent>

          <TabsContent value="gnn" className="space-y-4">
            <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-4 rounded-r-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <Network className="h-5 w-5" />
                Graph Neural Networks (GNNs)
              </h3>
              <p className="text-sm text-muted-foreground">
                Visualize and reason about the complex network of skills, qualifications, and transitions 
                between roles. Dynamic modeling of career trajectories suggests targeted upskilling.
              </p>
            </div>
            <SkillGraphVisualizer studentSkills={studentSkills} />
          </TabsContent>

          <TabsContent value="collab" className="space-y-4">
            <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded-r-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <Users className="h-5 w-5" />
                Collaborative Filtering Recommendations
              </h3>
              <p className="text-sm text-muted-foreground">
                Career paths and relevant job opportunities recommended by matching your skill profile 
                with similar users and successful trajectories, providing personalized guidance.
              </p>
            </div>
            {studentId ? (
              <CareerPathRecommendations studentId={studentId} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Please create a student profile to access career recommendations
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4 rounded-r-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5" />
                Predictive Job Market Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Labor market data feeds time-series forecasting models, predicting emerging job trends 
                and in-demand skills for the next 12 months using AI-powered analysis.
              </p>
            </div>
            <MarketTrendsPredictor />
          </TabsContent>
        </Tabs>

        {/* Feature Summary */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">Resume Optimization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Streamlined resume analyzer highlights missing skills using NLP, and recommends learning 
              resources to increase candidate competitiveness.
            </p>
          </div>

          <div className="border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">Expected Impact</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Reduce unemployment by 15-20%</li>
              <li>Align workforce skills with market trends</li>
              <li>Support inclusive growth and reduce inequalities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
