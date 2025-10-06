import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlacementReadinessCardProps {
  studentId: string;
  currentScore?: number | null;
  onCalculated?: () => void;
}

export function PlacementReadinessCard({ studentId, currentScore, onCalculated }: PlacementReadinessCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('placement-readiness', {
        body: { studentId }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.result);
      toast.success("Placement readiness calculated!");
      onCalculated?.();
    } catch (error: any) {
      console.error('Error calculating placement readiness:', error);
      toast.error(error.message || "Failed to calculate placement readiness");
    } finally {
      setIsLoading(false);
    }
  };

  const displayScore = result?.readiness_score || currentScore || 0;
  const scoreColor = displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-orange-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Placement Readiness Score
        </CardTitle>
        <CardDescription>
          AI-powered assessment of your job market readiness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readiness Score</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{displayScore}/100</span>
          </div>
          <Progress value={displayScore} className="h-2" />
        </div>

        <Button onClick={handleCalculate} disabled={isLoading} className="w-full" variant="outline">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              Recalculate Score
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 mt-4">
            {result.strengths && result.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="text-sm space-y-1">
                  {result.strengths.slice(0, 3).map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.areas_for_improvement && result.areas_for_improvement.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  Areas for Improvement
                </h4>
                <ul className="text-sm space-y-1">
                  {result.areas_for_improvement.slice(0, 3).map((area: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600 dark:text-orange-400">→</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
