import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Entity {
  text: string;
  category: string;
  confidence: number;
  context: string;
}

interface ExtractionData {
  entities: Entity[];
  summary: {
    technicalSkills: string[];
    softSkills: string[];
    qualifications: string[];
    domains: string[];
  };
  totalEntitiesFound: number;
  highConfidenceCount: number;
}

export const BERTSkillExtractor = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState<'resume' | 'job_posting'>('resume');
  const [extractedData, setExtractedData] = useState<ExtractionData | null>(null);

  const extractSkills = async () => {
    if (!text.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bert-skill-extraction' as any, {
        body: { text, type }
      });

      if (error) throw error;

      setExtractedData(data.data);
      toast({
        title: "Success",
        description: `Extracted ${data.data.highConfidenceCount} skills using NER`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TECHNICAL_SKILLS':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'SOFT_SKILLS':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'QUALIFICATIONS':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'DOMAINS':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          BERT-Style NER Skill Extraction
        </CardTitle>
        <CardDescription>
          Advanced Named Entity Recognition for extracting skills from text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={type === 'resume' ? 'default' : 'outline'}
            onClick={() => setType('resume')}
            size="sm"
          >
            Resume
          </Button>
          <Button
            variant={type === 'job_posting' ? 'default' : 'outline'}
            onClick={() => setType('job_posting')}
            size="sm"
          >
            Job Posting
          </Button>
        </div>

        <Textarea
          placeholder={`Paste ${type === 'resume' ? 'resume' : 'job posting'} text here...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />

        <Button onClick={extractSkills} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Extract Skills with NER
        </Button>

        {extractedData && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Total Entities</div>
                <div className="text-2xl font-bold">{extractedData.totalEntitiesFound}</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">High Confidence</div>
                <div className="text-2xl font-bold text-green-600">
                  {extractedData.highConfidenceCount}
                </div>
              </div>
            </div>

            {/* Summary Sections */}
            <div className="space-y-4">
              {extractedData.summary.technicalSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.summary.technicalSkills.map((skill, idx) => (
                      <Badge key={idx} className={getCategoryColor('TECHNICAL_SKILLS')}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.summary.softSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.summary.softSkills.map((skill, idx) => (
                      <Badge key={idx} className={getCategoryColor('SOFT_SKILLS')}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.summary.qualifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    Qualifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.summary.qualifications.map((qual, idx) => (
                      <Badge key={idx} className={getCategoryColor('QUALIFICATIONS')}>
                        {qual}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.summary.domains.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-500" />
                    Domains
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.summary.domains.map((domain, idx) => (
                      <Badge key={idx} className={getCategoryColor('DOMAINS')}>
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Entities with Confidence */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Extracted Entities (High Confidence)</h3>
              <div className="space-y-2">
                {extractedData.entities.slice(0, 10).map((entity, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge className={getCategoryColor(entity.category)}>
                        {entity.text}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(entity.confidence * 100)}%
                        </span>
                        <Progress value={entity.confidence * 100} className="w-16 h-2" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground italic">
                      "{entity.context}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
