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
import { jobPostingSchema } from "@/lib/validationSchemas";
import { z } from "zod";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
}

export function AddJobDialog({ open, onOpenChange, onJobAdded }: AddJobDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  const validateField = (field: string, value: string) => {
    try {
      const partialSchema = jobPostingSchema.pick({ [field]: true } as any);
      partialSchema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: "" }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || "" }));
      }
    }
  };

  const handleAddJob = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      const validatedData = jobPostingSchema.parse(newJob);
      
      const { error } = await supabase.from('job_postings').insert({
        title: validatedData.title,
        company: validatedData.company,
        location: validatedData.location,
        job_type: validatedData.job_type,
        experience_level: validatedData.experience_level,
        industry: validatedData.industry,
        salary_min: validatedData.salary_min,
        salary_max: validatedData.salary_max,
        required_skills: validatedData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: validatedData.preferred_skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
        description: validatedData.description || null,
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
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to post job",
          variant: "destructive",
        });
      }
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
                onChange={(e) => {
                  setNewJob({...newJob, title: e.target.value});
                  validateField("title", e.target.value);
                }}
                placeholder="Software Engineer"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={newJob.company}
                onChange={(e) => {
                  setNewJob({...newJob, company: e.target.value});
                  validateField("company", e.target.value);
                }}
                placeholder="Tech Corp"
                className={errors.company ? "border-destructive" : ""}
              />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={newJob.location}
                onChange={(e) => {
                  setNewJob({...newJob, location: e.target.value});
                  validateField("location", e.target.value);
                }}
                placeholder="Bangalore, India"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={newJob.industry}
                onChange={(e) => {
                  setNewJob({...newJob, industry: e.target.value});
                  validateField("industry", e.target.value);
                }}
                placeholder="Technology"
                className={errors.industry ? "border-destructive" : ""}
              />
              {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
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
              onChange={(e) => {
                setNewJob({...newJob, required_skills: e.target.value});
                validateField("required_skills", e.target.value);
              }}
              placeholder="React, TypeScript, Node.js"
              rows={2}
              className={errors.required_skills ? "border-destructive" : ""}
            />
            {errors.required_skills && <p className="text-xs text-destructive">{errors.required_skills}</p>}
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
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleAddJob}
            disabled={isSaving}
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
