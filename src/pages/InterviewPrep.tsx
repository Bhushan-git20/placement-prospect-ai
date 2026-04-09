import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Loader2, Lightbulb, HelpCircle } from "lucide-react";

interface StarStory { situation: string; task: string; action: string; result: string; }
interface Question {
  question: string; category: string; difficulty: string;
  why_asked: string; star_story: StarStory; tips: string[]; follow_ups: string[];
}
interface PrepResult {
  questions: Question[];
  general_tips: string[];
  company_research_points: string[];
  questions_to_ask_interviewer: string[];
}

const diffColor: Record<string, string> = { easy: 'bg-emerald-100 text-emerald-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };

export default function InterviewPrep() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [userExperience, setUserExperience] = useState("");
  const [focusArea, setFocusArea] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PrepResult | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      toast({ title: "Error", description: "Please enter a job title.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: {
          jobTitle, jobDescription,
          userSkills: userSkills.split(',').map(s => s.trim()).filter(Boolean),
          userExperience, focusArea,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.prep);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Interview Prep & Story Bank</h1>
        <p className="text-muted-foreground">AI-generated STAR framework stories and practice questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Setup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Job Title *</label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Product Manager" />
            </div>
            <div>
              <label className="text-sm font-medium">Job Description</label>
              <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={3} placeholder="Paste job description..." />
            </div>
            <div>
              <label className="text-sm font-medium">Your Skills</label>
              <Input value={userSkills} onChange={e => setUserSkills(e.target.value)} placeholder="React, Leadership, SQL" />
            </div>
            <div>
              <label className="text-sm font-medium">Experience Summary</label>
              <Textarea value={userExperience} onChange={e => setUserExperience(e.target.value)} rows={3} placeholder="Brief summary..." />
            </div>
            <div>
              <label className="text-sm font-medium">Focus Area</label>
              <Select value={focusArea} onValueChange={setFocusArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : 'Generate Prep Material'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card">
              <CardHeader><CardTitle>Practice Questions & STAR Stories</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {result.questions?.map((q, i) => (
                    <AccordionItem key={i} value={`q-${i}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <Badge variant="outline" className="capitalize shrink-0">{q.category}</Badge>
                          <Badge className={`${diffColor[q.difficulty] || ''} shrink-0`}>{q.difficulty}</Badge>
                          <span className="text-sm">{q.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-2">
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Why this is asked:</p>
                          <p className="text-sm">{q.why_asked}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(['situation', 'task', 'action', 'result'] as const).map(key => (
                            <div key={key} className="p-3 rounded-lg border">
                              <p className="text-xs font-bold uppercase text-primary mb-1">{key}</p>
                              <p className="text-sm">{q.star_story?.[key]}</p>
                            </div>
                          ))}
                        </div>
                        {q.tips?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Tips:</p>
                            <ul className="space-y-1">{q.tips.map((t, j) => <li key={j} className="text-sm flex gap-1"><Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />{t}</li>)}</ul>
                          </div>
                        )}
                        {q.follow_ups?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Possible Follow-ups:</p>
                            <ul className="space-y-1">{q.follow_ups.map((f, j) => <li key={j} className="text-sm text-muted-foreground">• {f}</li>)}</ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-4 h-4" /> General Tips</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{result.general_tips?.map((t, i) => <li key={i} className="text-sm">💡 {t}</li>)}</ul>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Questions to Ask</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">{result.questions_to_ask_interviewer?.map((q, i) => <li key={i} className="text-sm">❓ {q}</li>)}</ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
