import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";

interface TailoredResult {
  tailored_summary: string;
  highlighted_skills: string[];
  keyword_additions: string[];
  experience_rewrites: { original_point: string; tailored_point: string }[];
  sections_to_add: string[];
  sections_to_remove: string[];
  ats_score_before: number;
  ats_score_after: number;
  tailored_resume_text: string;
  tips: string[];
}

export default function ResumeTailor() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [currentResume, setCurrentResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TailoredResult | null>(null);
  const { toast } = useToast();

  const handleTailor = async () => {
    if (!jobTitle.trim() || !currentResume.trim()) {
      toast({ title: "Error", description: "Please fill in job title and current resume.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resume-tailor', {
        body: { jobTitle, jobDescription, requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean), currentResume },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.tailored);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to tailor resume.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Resume Tailor</h1>
        <p className="text-muted-foreground">AI-powered resume customization for each job application</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Job & Resume</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Job Title *</label>
                <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Developer" />
              </div>
              <div>
                <label className="text-sm font-medium">Job Description</label>
                <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description..." rows={4} />
              </div>
              <div>
                <label className="text-sm font-medium">Required Skills (comma-separated)</label>
                <Input value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="React, TypeScript, CSS" />
              </div>
              <div>
                <label className="text-sm font-medium">Your Current Resume *</label>
                <Textarea value={currentResume} onChange={e => setCurrentResume(e.target.value)} placeholder="Paste your current resume text..." rows={8} />
              </div>
              <Button onClick={handleTailor} disabled={isLoading} className="w-full">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tailoring...</> : <><Sparkles className="w-4 h-4 mr-2" /> Tailor Resume</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (
          <div className="space-y-4">
            <Card className="glass-card glow-primary">
              <CardHeader><CardTitle>ATS Score Improvement</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Before</p>
                    <p className="text-3xl font-bold text-red-500">{result.ats_score_before}%</p>
                  </div>
                  <ArrowUp className="w-8 h-8 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">After</p>
                    <p className="text-3xl font-bold text-emerald-500">{result.ats_score_after}%</p>
                  </div>
                </div>
                <Progress value={result.ats_score_after} className="h-3" />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Tailored Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm bg-primary/5 p-3 rounded-lg">{result.tailored_summary}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Keywords to Add</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.keyword_additions?.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                </div>
              </CardContent>
            </Card>

            {result.experience_rewrites?.length > 0 && (
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg">Experience Rewrites</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {result.experience_rewrites.map((rw, i) => (
                    <div key={i} className="space-y-1 p-3 rounded-lg bg-secondary/20">
                      <p className="text-xs text-red-500 line-through">{rw.original_point}</p>
                      <p className="text-sm text-emerald-600 font-medium">{rw.tailored_point}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Tailored Resume</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-secondary/20 p-4 rounded-lg max-h-96 overflow-y-auto">{result.tailored_resume_text}</pre>
                <Button variant="outline" className="mt-3 w-full" onClick={() => { navigator.clipboard.writeText(result.tailored_resume_text); toast({ title: "Copied!" }); }}>
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>

            {result.tips?.length > 0 && (
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg">Tips</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{result.tips.map((t, i) => <li key={i} className="text-sm flex gap-2"><span className="text-primary">💡</span>{t}</li>)}</ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
