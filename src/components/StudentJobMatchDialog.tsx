import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  skills: string[];
  preferred_roles: string[];
  cgpa: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  required_skills: string[];
  experience_level: string;
}

interface StudentJobMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentJobMatchDialog({ open, onOpenChange }: StudentJobMatchDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Array<{student: Student, jobs: Array<{job: Job, score: number}>}>>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsResult, jobsResult] = await Promise.all([
        supabase.from('students').select('*').eq('placement_status', 'not_placed'),
        supabase.from('job_postings').select('*').eq('is_active', true)
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (jobsResult.error) throw jobsResult.error;

      setStudents(studentsResult.data || []);
      setJobs(jobsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load students and jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMatch = (student: Student, job: Job): number => {
    let score = 0;
    
    // Skill match (0-50 points)
    const studentSkills = student.skills.map(s => s.toLowerCase());
    const requiredSkills = job.required_skills.map(s => s.toLowerCase());
    const matchingSkills = studentSkills.filter(skill => 
      requiredSkills.some(req => req.includes(skill) || skill.includes(req))
    );
    score += (matchingSkills.length / requiredSkills.length) * 50;

    // Role preference match (0-30 points)
    const preferredRoles = student.preferred_roles.map(r => r.toLowerCase());
    if (preferredRoles.some(role => job.title.toLowerCase().includes(role) || role.includes(job.title.toLowerCase()))) {
      score += 30;
    }

    // CGPA bonus (0-20 points)
    if (student.cgpa >= 8.5) score += 20;
    else if (student.cgpa >= 7.5) score += 15;
    else if (student.cgpa >= 6.5) score += 10;

    return Math.round(score);
  };

  const generateMatches = () => {
    const matchResults = students.map(student => {
      const jobMatches = jobs
        .map(job => ({
          job,
          score: calculateMatch(student, job)
        }))
        .filter(match => match.score >= 40) // Only show matches above 40%
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 matches per student

      return { student, jobs: jobMatches };
    }).filter(match => match.jobs.length > 0);

    setMatches(matchResults);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student-Job Matching</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Found {students.length} students and {jobs.length} active jobs
            </p>
            <Button onClick={generateMatches}>Generate Matches</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map(({ student, jobs: jobMatches }) => (
              <div key={student.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{student.name}</h3>
                <div className="flex gap-2 mb-3">
                  {student.skills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                
                <div className="space-y-2">
                  {jobMatches.map(({ job, score }) => (
                    <div key={job.id} className="flex items-center justify-between bg-muted p-3 rounded">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      <Badge variant={score >= 70 ? "default" : "outline"}>
                        {score}% Match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
