import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Users, Zap, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RecommendationData {
  similarStudents: any[];
  recommendedPaths: any[];
  recommendedSkills: string[];
  learningPath: any[];
  careerTransitions: any[];
  estimatedTimeline: number;
  confidenceScore: number;
}

export const CareerPathRecommendations = ({ studentId }: { studentId: string }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('collaborative-filtering' as any, {
        body: { studentId }
      });

      if (error) throw error;

      setRecommendations(data.data);
      toast({
        title: "Success",
        description: "Career recommendations generated using collaborative filtering",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              AI Career Path Recommendations
            </CardTitle>
            <CardDescription>
              Collaborative filtering based on similar successful students
            </CardDescription>
          </div>
          <Button onClick={fetchRecommendations} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Recommendations
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations ? (
          <>
            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Recommendation Confidence</span>
                <span className="text-muted-foreground">{recommendations.confidenceScore}%</span>
              </div>
              <Progress value={recommendations.confidenceScore} />
            </div>

            {/* Similar Students */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Similar Successful Students
              </h3>
              <div className="space-y-2">
                {recommendations.similarStudents.map((student, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{student.name}</span>
                      <Badge variant="secondary">{student.similarity}% match</Badge>
                    </div>
                    {student.role && (
                      <div className="text-sm text-muted-foreground">
                        Placed as: {student.role}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {student.skills?.slice(0, 5).map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Career Paths */}
            {recommendations.recommendedPaths.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recommended Career Paths
                </h3>
                <div className="space-y-2">
                  {recommendations.recommendedPaths.slice(0, 3).map((path, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{path.role}</div>
                          <div className="text-sm text-muted-foreground">{path.company}</div>
                        </div>
                        {path.package && (
                          <Badge variant="secondary">₹{path.package} LPA</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {path.skills?.slice(0, 4).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Path */}
            {recommendations.learningPath.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Personalized Learning Path
                </h3>
                <div className="space-y-2">
                  {recommendations.learningPath.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={item.priority === 'high' ? 'default' : 'secondary'}
                        >
                          {item.priority}
                        </Badge>
                        <span className="font-medium">{item.skill}</span>
                      </div>
                      {item.prerequisites.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Prerequisites: {item.prerequisites.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Transitions */}
            {recommendations.careerTransitions && recommendations.careerTransitions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Possible Career Transitions</h3>
                <div className="space-y-2">
                  {recommendations.careerTransitions.map((transition, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{transition.from}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-sm font-medium">{transition.to}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>Success: {transition.successRate}%</div>
                        <div>Time: {transition.avgTime}mo</div>
                        <div>Salary: +{transition.salaryChange}%</div>
                      </div>
                      {transition.requiredSkills && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {transition.requiredSkills.slice(0, 3).map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="text-sm font-medium mb-1">Estimated Timeline</div>
              <div className="text-2xl font-bold text-primary">
                {recommendations.estimatedTimeline} months
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on similar successful career transitions
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click "Get Recommendations" to see personalized career paths based on collaborative filtering
          </div>
        )}
      </CardContent>
    </Card>
  );
};
