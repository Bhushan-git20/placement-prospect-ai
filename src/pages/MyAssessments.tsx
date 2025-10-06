import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default function MyAssessments() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: any) {
      console.error('Error loading assessments:', error);
      toast.error("Failed to load assessments");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const averageScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length)
    : 0;

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Assessments</h1>
        <p className="text-muted-foreground">View your test results and performance analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assessments completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {assessments.length > 0
                ? Math.round((assessments.filter(a => (a.score || 0) >= 60).length / assessments.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tests passed (≥60%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Assessments</h2>
        
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No assessments completed yet</p>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{assessment.assessment_type}</CardTitle>
                    <CardDescription>
                      {assessment.test_category} • {new Date(assessment.assessment_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={assessment.score >= 60 ? "default" : "destructive"}>
                    {assessment.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className={`font-semibold ${getScoreColor(assessment.score)}`}>
                      {assessment.correct_answers}/{assessment.total_questions} correct
                    </span>
                  </div>
                  <Progress value={assessment.score} className="h-2" />
                </div>

                {/* Test Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {assessment.difficulty_level && (
                    <div>
                      <span className="text-muted-foreground">Difficulty:</span>
                      <p className="font-medium capitalize">{assessment.difficulty_level}</p>
                    </div>
                  )}
                  {assessment.time_taken_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{assessment.time_taken_minutes} minutes</span>
                    </div>
                  )}
                </div>

                {/* Strengths */}
                {assessment.strengths && assessment.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assessment.strengths.map((strength: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas of Improvement */}
                {assessment.areas_of_improvement && assessment.areas_of_improvement.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      Areas for Improvement
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assessment.areas_of_improvement.map((area: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {assessment.feedback && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Feedback</h4>
                    <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                  </div>
                )}

                {/* Recommendations */}
                {assessment.recommendations && assessment.recommendations.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {assessment.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">→</span>
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
