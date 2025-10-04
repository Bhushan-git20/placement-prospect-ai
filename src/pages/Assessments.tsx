import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Trophy,
  Clock,
  Target,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  BarChart3,
  Plus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TakeTestDialog } from "@/components/TakeTestDialog";
import { CreateAssessmentDialog } from "@/components/CreateAssessmentDialog";

interface Assessment {
  id: string;
  student_name: string;
  student_id: string;
  assessment_type: string;
  test_category: string;
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  time_taken_minutes: number | null;
  time_limit_minutes: number | null;
  difficulty_level: string | null;
  assessment_date: string;
  strengths: string[];
  areas_of_improvement: string[];
  feedback: string | null;
  recommendations: string[];
}

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserAndAssessments();
  }, []);

  const fetchUserAndAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role || '');

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load assessments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length)
    : 0;

  const totalTests = assessments.length;
  const passedTests = assessments.filter(a => (a.score || 0) >= 60).length;

  const handleStartTest = (category: string) => {
    setSelectedCategory(category);
    setShowTestDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Assessment Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Take tests, track progress, and improve your placement readiness
          </p>
        </div>
        <div className="flex gap-2">
          {userRole === 'user' && (
            <Button className="gradient-primary glow-hover" onClick={() => handleStartTest("Technical Skills")}>
              <Play className="w-4 h-4 mr-2" />
              Start New Test
            </Button>
          )}
          {(userRole === 'admin' || userRole === 'faculty') && (
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          )}
        </div>
      </div>

      <TakeTestDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        category={selectedCategory}
        onTestCompleted={fetchUserAndAssessments}
      />

      <CreateAssessmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Assessments</CardDescription>
            <CardTitle className="text-3xl gradient-text">{totalTests}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className={`text-3xl ${getScoreColor(avgScore)}`}>
              {avgScore}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Passed Tests</CardDescription>
            <CardTitle className="text-3xl text-green-600">{passedTests}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl gradient-text">
              {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Available Tests (for students) */}
      {userRole === 'user' && (
        <Card className="glass-card glow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Available Assessments
            </CardTitle>
            <CardDescription>Choose a test to improve your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Technical Skills', 'Aptitude', 'Communication'].map((category, idx) => (
                <Card key={idx} className="border-2 border-primary/20 hover:border-primary/40 transition-smooth cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <CardDescription>5 questions • 30 minutes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleStartTest(category)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Assessment History
          </CardTitle>
          <CardDescription>Your past performance and feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="border-2 hover:border-primary/40 transition-smooth">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{assessment.assessment_type}</h3>
                        <Badge variant="outline">{assessment.test_category}</Badge>
                        {assessment.difficulty_level && (
                          <Badge className={getDifficultyColor(assessment.difficulty_level)}>
                            {assessment.difficulty_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assessment.student_name} ({assessment.student_id})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(assessment.assessment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold gradient-text mb-1">
                        {assessment.score}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assessment.correct_answers}/{assessment.total_questions} correct
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {assessment.score !== null && (
                    <div className="mb-4">
                      <Progress value={assessment.score} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-lg bg-secondary/30">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">{assessment.correct_answers}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <XCircle className="w-4 h-4" />
                        <span className="font-semibold">
                          {(assessment.total_questions || 0) - (assessment.correct_answers || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Wrong</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">{assessment.time_taken_minutes}m</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Time Taken</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  {assessment.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1 text-green-600">
                        <Award className="w-4 h-4" />
                        Strengths
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.strengths.map((strength, idx) => (
                          <Badge key={idx} className="bg-green-500/20 text-green-600 border-green-500/30">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Areas of Improvement */}
                  {assessment.areas_of_improvement.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1 text-yellow-600">
                        <Target className="w-4 h-4" />
                        Areas to Improve
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.areas_of_improvement.map((area, idx) => (
                          <Badge key={idx} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {assessment.feedback && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {assessment.recommendations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {assessment.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {assessments.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assessments taken yet</p>
                {userRole === 'user' && (
                  <Button className="mt-4 gradient-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Take Your First Assessment
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
