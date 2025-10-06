import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResumeParserDialogProps {
  studentId: string;
  onParsed?: () => void;
}

export function ResumeParserDialog({ studentId, onParsed }: ResumeParserDialogProps) {
  const [open, setOpen] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleParse = async () => {
    if (!resumeText.trim()) {
      toast.error("Please paste your resume text");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resume-parser', {
        body: { resumeText, studentId }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setParsedData(data.data);
      toast.success("Resume parsed successfully!");
      onParsed?.();
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      toast.error(error.message || "Failed to parse resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResumeText("");
    setParsedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Parse Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Resume Parser</DialogTitle>
          <DialogDescription>
            Paste your resume text below and let AI extract skills, education, and experience
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <Button onClick={handleParse} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing Resume...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse Resume with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Resume parsed successfully!</span>
            </div>

            {parsedData.skills && parsedData.skills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills Extracted:</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedData.education && parsedData.education.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Education:</h4>
                {parsedData.education.map((edu: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg mb-2">
                    <div className="font-medium">{edu.degree}</div>
                    <div className="text-sm text-muted-foreground">{edu.institution} • {edu.year}</div>
                  </div>
                ))}
              </div>
            )}

            {parsedData.experience && parsedData.experience.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Experience:</h4>
                {parsedData.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg mb-2">
                    <div className="font-medium">{exp.title}</div>
                    <div className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Parse Another Resume
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
