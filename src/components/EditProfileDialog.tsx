import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    preferred_roles: string[];
    preferred_locations: string[];
    target_companies: string[] | null;
  };
  onSaved: () => void;
}

export function EditProfileDialog({ open, onOpenChange, student, onSaved }: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    skills: student.skills,
    preferred_roles: student.preferred_roles,
    preferred_locations: student.preferred_locations,
    target_companies: student.target_companies || [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        skills: student.skills,
        preferred_roles: student.preferred_roles,
        preferred_locations: student.preferred_locations,
        target_companies: student.target_companies || [],
      });
    }
  }, [open, student]);

  const addItem = (field: keyof typeof formData, value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !formData[field].includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], trimmed]
      }));
      setter("");
    }
  };

  const removeItem = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent, 
    field: keyof typeof formData, 
    value: string, 
    setter: (v: string) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(field, value, setter);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          skills: formData.skills,
          preferred_roles: formData.preferred_roles,
          preferred_locations: formData.preferred_locations,
          target_companies: formData.target_companies,
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
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
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your skills, career preferences, and target companies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Skills */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Skills</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (press Enter)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'skills', newSkill, setNewSkill)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => addItem('skills', newSkill, setNewSkill)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {formData.skills.length === 0 ? (
                <span className="text-sm text-muted-foreground">No skills added</span>
              ) : (
                formData.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeItem('skills', skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Preferred Roles */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Roles</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a role (press Enter)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'preferred_roles', newRole, setNewRole)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => addItem('preferred_roles', newRole, setNewRole)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {formData.preferred_roles.length === 0 ? (
                <span className="text-sm text-muted-foreground">No roles specified</span>
              ) : (
                formData.preferred_roles.map((role, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    {role}
                    <button
                      type="button"
                      onClick={() => removeItem('preferred_roles', role)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Locations</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a location (press Enter)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'preferred_locations', newLocation, setNewLocation)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => addItem('preferred_locations', newLocation, setNewLocation)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {formData.preferred_locations.length === 0 ? (
                <span className="text-sm text-muted-foreground">No locations specified</span>
              ) : (
                formData.preferred_locations.map((loc, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    {loc}
                    <button
                      type="button"
                      onClick={() => removeItem('preferred_locations', loc)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Target Companies */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Target Companies</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a company (press Enter)"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'target_companies', newCompany, setNewCompany)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => addItem('target_companies', newCompany, setNewCompany)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {formData.target_companies.length === 0 ? (
                <span className="text-sm text-muted-foreground">No companies specified</span>
              ) : (
                formData.target_companies.map((company, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1 border-primary/50">
                    {company}
                    <button
                      type="button"
                      onClick={() => removeItem('target_companies', company)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
