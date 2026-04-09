import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface Evaluation {
  overall_grade: string;
  category_grades: Record<string, { grade: string; reasoning: string }>;
  strengths: string[];
  weaknesses: string[];
  action_items: string[];
  summary: string;
  application_recommendation: string;
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-emerald-500', 'A': 'bg-emerald-500', 'A-': 'bg-emerald-400',
  'B+': 'bg-blue-500', 'B': 'bg-blue-500', 'B-': 'bg-blue-400',
  'C+': 'bg-yellow-500', 'C': 'bg-yellow-500', 'C-': 'bg-yellow-400',
  'D': 'bg-orange-500', 'F': 'bg-red-500',
};

export default function JobEvaluation() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [userExperience, setUserExperience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const { toast } = useToast();

  const handleEvaluate = async () => {
    if (!jobTitle.trim()) {
      toast({ title: "Error", description: "Please enter a job title.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('job-evaluation', {
        body: {
          jobTitle,
          jobDescription,
          requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
          userSkills: userSkills.split(',').map(s => s.trim()).filter(Boolean),
          userExperience,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEvaluation(data.evaluation);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to evaluate.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeClass = (grade: string) => gradeColors[grade] || 'bg-muted';
  const recColor = (rec: string) => {
    if (rec?.includes('Strong')) return 'text-emerald-600';
    if (rec?.includes('Apply')) return 'text-blue-600';
    if (rec?.includes('Consider')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Job Evaluation Scoring</h1>
        <p className="text-muted-foreground">Get an A-F grade on how well you fit a job</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Job Title *</label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="text-sm font-medium">Job Description</label>
              <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium">Required Skills (comma-separated)</label>
              <Input value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <label className="text-sm font-medium">Your Skills (comma-separated)</label>
              <Input value={userSkills} onChange={e => setUserSkills(e.target.value)} placeholder="JavaScript, Python, SQL" />
            </div>
            <div>
              <label className="text-sm font-medium">Your Experience</label>
              <Textarea value={userExperience} onChange={e => setUserExperience(e.target.value)} placeholder="Brief summary of your experience..." rows={3} />
            </div>
            <Button onClick={handleEvaluate} disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</> : 'Evaluate Job Fit'}
            </Button>
          </CardContent>
        </Card>

        {evaluation && (
          <div className="space-y-4">
            <Card className="glass-card glow-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Grade</p>
                    <div className={`text-5xl font-bold text-white ${getGradeClass(evaluation.overall_grade)} w-20 h-20 rounded-xl flex items-center justify-center`}>
                      {evaluation.overall_grade}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Recommendation</p>
                    <p className={`text-lg font-bold ${recColor(evaluation.application_recommendation)}`}>
                      {evaluation.application_recommendation}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Category Grades</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(evaluation.category_grades || {}).map(([cat, data]) => (
                  <div key={cat} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                    <Badge className={`${getGradeClass(data.grade)} text-white`}>{data.grade}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{cat.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{data.reasoning}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{evaluation.strengths?.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Weaknesses</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{evaluation.weaknesses?.map((w, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span>{w}</li>)}</ul>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Action Items</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">{evaluation.action_items?.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-primary/5">
                    <Badge variant="outline" className="mt-0.5 shrink-0">{i + 1}</Badge>{a}
                  </li>
                ))}</ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
