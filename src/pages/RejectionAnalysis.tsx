import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Loader2, AlertTriangle, Target, ArrowRight, BarChart3 } from "lucide-react";

interface Pattern {
  pattern_name: string; description: string; frequency: string;
  affected_applications: number; root_cause: string;
}
interface ImprovementAction {
  priority: number; action: string; timeline: string; expected_impact: string;
}
interface Analysis {
  overview: { total_applications: number; rejections: number; rejection_rate: number; trend: string };
  patterns: Pattern[];
  skill_gaps_identified: string[];
  common_rejection_reasons: string[];
  improvement_plan: ImprovementAction[];
  strengths_to_leverage: string[];
  target_role_adjustments: string[];
  confidence_score: number;
}

const freqColor: Record<string, string> = { high: 'destructive', medium: 'secondary', low: 'outline' };
const impactColor: Record<string, string> = { high: 'text-red-600', medium: 'text-yellow-600', low: 'text-emerald-600' };

export default function RejectionAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rejection-analysis', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to analyze.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Rejection Pattern Analysis</h1>
          <p className="text-muted-foreground">Understand why applications get rejected and how to improve</p>
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading} size="lg">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><BarChart3 className="w-4 h-4 mr-2" /> Analyze My Applications</>}
        </Button>
      </div>

      {!analysis && !isLoading && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center py-16">
            <TrendingDown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground mb-4">Click "Analyze My Applications" to identify patterns in your application rejections and get actionable improvement strategies.</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card"><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Applications</p>
              <p className="text-3xl font-bold">{analysis.overview.total_applications}</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Rejections</p>
              <p className="text-3xl font-bold text-red-500">{analysis.overview.rejections}</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Rejection Rate</p>
              <p className="text-3xl font-bold">{analysis.overview.rejection_rate}%</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className="text-3xl font-bold capitalize">{trendIcon(analysis.overview.trend)} {analysis.overview.trend}</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patterns */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Rejection Patterns</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analysis.patterns?.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{p.pattern_name}</p>
                      <Badge variant={freqColor[p.frequency] as any}>{p.frequency}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{p.description}</p>
                    <p className="text-xs"><span className="font-medium">Root cause:</span> {p.root_cause}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Improvement Plan */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Improvement Plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analysis.improvement_plan?.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <Badge variant="outline" className="shrink-0">#{a.priority}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.action}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">⏱️ {a.timeline}</span>
                        <span className={`text-xs font-medium ${impactColor[a.expected_impact]}`}>Impact: {a.expected_impact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Skill Gaps</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">{analysis.skill_gaps_identified?.map((s, i) => <Badge key={i} variant="destructive">{s}</Badge>)}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Strengths to Leverage</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">{analysis.strengths_to_leverage?.map((s, i) => <Badge key={i} className="bg-emerald-500 text-white">{s}</Badge>)}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Role Adjustments</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">{analysis.target_role_adjustments?.map((r, i) => <li key={i} className="text-sm flex gap-2"><ArrowRight className="w-3 h-3 mt-1 shrink-0 text-primary" />{r}</li>)}</ul>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Analysis Confidence</p>
                <p className="text-sm font-bold">{analysis.confidence_score}%</p>
              </div>
              <Progress value={analysis.confidence_score} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Based on the amount and quality of application data available</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
