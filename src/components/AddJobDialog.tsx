import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
}

export function AddJobDialog({ open, onOpenChange, onJobAdded }: AddJobDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    experience_level: "Entry",
    industry: "",
    salary_min: "",
    salary_max: "",
    required_skills: "",
    preferred_skills: "",
    description: ""
  });

  const handleAddJob = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('job_postings').insert({
        title: newJob.title,
        company: newJob.company,
        location: newJob.location,
        job_type: newJob.job_type,
        experience_level: newJob.experience_level,
        industry: newJob.industry,
        salary_min: newJob.salary_min ? parseInt(newJob.salary_min) : null,
        salary_max: newJob.salary_max ? parseInt(newJob.salary_max) : null,
        required_skills: newJob.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: newJob.preferred_skills.split(',').map(s => s.trim()).filter(Boolean),
        description: newJob.description || null,
        is_active: true,
        source: 'Internal Posting'
      });

      if (error) throw error;

      toast({
        title: "Job posted successfully",
        description: `${newJob.title} at ${newJob.company} has been posted.`,
      });

      onOpenChange(false);
      setNewJob({
        title: "", company: "", location: "", job_type: "Full-time",
        experience_level: "Entry", industry: "", salary_min: "", salary_max: "",
        required_skills: "", preferred_skills: "", description: ""
      });
      onJobAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post job",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
          <DialogDescription>Add a new job posting to attract candidates</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={newJob.title}
                onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={newJob.company}
                onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                placeholder="Tech Corp"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={newJob.location}
                onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                placeholder="Bangalore, India"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={newJob.industry}
                onChange={(e) => setNewJob({...newJob, industry: e.target.value})}
                placeholder="Technology"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type *</Label>
              <Select value={newJob.job_type} onValueChange={(value) => setNewJob({...newJob, job_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select value={newJob.experience_level} onValueChange={(value) => setNewJob({...newJob, experience_level: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry">Entry Level</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Min Salary (LPA)</Label>
              <Input
                id="salary_min"
                type="number"
                value={newJob.salary_min}
                onChange={(e) => setNewJob({...newJob, salary_min: e.target.value})}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Max Salary (LPA)</Label>
              <Input
                id="salary_max"
                type="number"
                value={newJob.salary_max}
                onChange={(e) => setNewJob({...newJob, salary_max: e.target.value})}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="required_skills">Required Skills (comma-separated) *</Label>
            <Textarea
              id="required_skills"
              value={newJob.required_skills}
              onChange={(e) => setNewJob({...newJob, required_skills: e.target.value})}
              placeholder="React, TypeScript, Node.js"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_skills">Preferred Skills (comma-separated)</Label>
            <Textarea
              id="preferred_skills"
              value={newJob.preferred_skills}
              onChange={(e) => setNewJob({...newJob, preferred_skills: e.target.value})}
              placeholder="AWS, Docker, GraphQL"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={newJob.description}
              onChange={(e) => setNewJob({...newJob, description: e.target.value})}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleAddJob}
            disabled={isSaving || !newJob.title || !newJob.company || !newJob.location || !newJob.required_skills}
            className="gradient-primary"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Post Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
