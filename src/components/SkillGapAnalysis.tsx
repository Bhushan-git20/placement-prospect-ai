import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SkillGapAnalysisProps {
  studentId: string;
  onAnalyzed?: () => void;
}

export function SkillGapAnalysis({ studentId, onAnalyzed }: SkillGapAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('skill-gap-analysis', {
        body: { studentId }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data.analysis);
      toast.success("Skill gap analysis completed!");
      onAnalyzed?.();
    } catch (error: any) {
      console.error('Error analyzing skill gaps:', error);
      toast.error(error.message || "Failed to analyze skill gaps");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Compare your skills with current market demand
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Skills...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run AI Analysis
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4 mt-4">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  Your Strengths
                </h4>
                <div className="space-y-1">
                  {analysis.strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.skill_gaps && analysis.skill_gaps.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  Skill Gaps
                </h4>
                <div className="space-y-1">
                  {analysis.skill_gaps.map((gap: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-600 dark:text-orange-400">!</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 dark:text-blue-400">→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
