import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { assessmentSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Loader2 } from "lucide-react";

interface CreateAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAssessmentDialog({ open, onOpenChange }: CreateAssessmentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    student_name: "",
    student_id: "",
    assessment_type: "Technical",
    test_category: "Coding",
    difficulty_level: "Medium",
    total_questions: "",
    time_limit_minutes: "",
  });

  const validateField = (field: string, value: string) => {
    try {
      if (field === "total_questions" || field === "time_limit_minutes") {
        if (value && !isNaN(parseInt(value))) {
          setErrors(prev => ({ ...prev, [field]: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, [field]: "" }));
      }
    } catch {
      // Ignore validation errors during typing
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = assessmentSchema.parse(formData);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('assessments').insert({
        user_id: user?.id,
        student_name: validatedData.student_name,
        student_id: validatedData.student_id,
        assessment_type: validatedData.assessment_type,
        test_category: validatedData.test_category,
        difficulty_level: validatedData.difficulty_level,
        total_questions: validatedData.total_questions,
        time_limit_minutes: validatedData.time_limit_minutes,
        score: 0,
        correct_answers: 0,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
      
      onOpenChange(false);
      setFormData({
        student_name: "",
        student_id: "",
        assessment_type: "Technical",
        test_category: "Coding",
        difficulty_level: "Medium",
        total_questions: "",
        time_limit_minutes: "",
      });
    } catch (error) {
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
        console.error('Error creating assessment:', error);
        toast({
          title: "Error",
          description: "Failed to create assessment",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assessment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_name">Student Name *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => {
                  setFormData({ ...formData, student_name: e.target.value });
                  validateField("student_name", e.target.value);
                }}
                className={errors.student_name ? "border-destructive" : ""}
                placeholder="Enter student name"
              />
              {errors.student_name && <p className="text-xs text-destructive">{errors.student_name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID *</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => {
                  setFormData({ ...formData, student_id: e.target.value });
                  validateField("student_id", e.target.value);
                }}
                className={errors.student_id ? "border-destructive" : ""}
                placeholder="Enter student ID"
              />
              {errors.student_id && <p className="text-xs text-destructive">{errors.student_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment_type">Assessment Type *</Label>
              <Select 
                value={formData.assessment_type} 
                onValueChange={(value) => setFormData({ ...formData, assessment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Aptitude">Aptitude</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_category">Test Category *</Label>
              <Select 
                value={formData.test_category} 
                onValueChange={(value) => setFormData({ ...formData, test_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coding">Coding</SelectItem>
                  <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                  <SelectItem value="DSA">DSA</SelectItem>
                  <SelectItem value="Mock Interview">Mock Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Difficulty *</Label>
              <Select 
                value={formData.difficulty_level} 
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_questions">Total Questions *</Label>
              <Input
                id="total_questions"
                type="number"
                min="1"
                max="100"
                value={formData.total_questions}
                onChange={(e) => {
                  setFormData({ ...formData, total_questions: e.target.value });
                  validateField("total_questions", e.target.value);
                }}
                className={errors.total_questions ? "border-destructive" : ""}
                placeholder="1-100"
              />
              {errors.total_questions && <p className="text-xs text-destructive">{errors.total_questions}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_limit_minutes">Time Limit (min) *</Label>
              <Input
                id="time_limit_minutes"
                type="number"
                min="1"
                max="180"
                value={formData.time_limit_minutes}
                onChange={(e) => {
                  setFormData({ ...formData, time_limit_minutes: e.target.value });
                  validateField("time_limit_minutes", e.target.value);
                }}
                className={errors.time_limit_minutes ? "border-destructive" : ""}
                placeholder="1-180"
              />
              {errors.time_limit_minutes && <p className="text-xs text-destructive">{errors.time_limit_minutes}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Assessment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
