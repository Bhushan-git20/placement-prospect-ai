import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendData {
  currentDemand: number;
  predictions: any[];
  insights: string[];
  emergingSkills: string[];
  decliningSkills: string[];
  recommendation: string;
  historicalGrowth: number;
}

export const MarketTrendsPredictor = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [trendData, setTrendData] = useState<TrendData | null>(null);

  const analyzeTrends = async () => {
    if (!skillName && !jobRole) {
      toast({
        title: "Input Required",
        description: "Please enter either a skill name or job role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-trends-analysis' as any, {
        body: { skillName, jobRole, months: 12 }
      });

      if (error) throw error;

      setTrendData(data.data);
      toast({
        title: "Success",
        description: "Market trends predicted using time-series analysis",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Predictive Job Market Analytics
        </CardTitle>
        <CardDescription>
          AI-powered forecasting of job market trends and skill demands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Skill Name</label>
            <Input
              placeholder="e.g., React, Python"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Role</label>
            <Input
              placeholder="e.g., Full Stack Developer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={analyzeTrends} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analyze Market Trends
        </Button>

        {trendData && (
          <>
            {/* Current Demand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Current Demand</div>
                <div className="text-2xl font-bold">{trendData.currentDemand}</div>
                <div className="text-xs text-muted-foreground">active job postings</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Historical Growth</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {trendData.historicalGrowth > 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      +{trendData.historicalGrowth.toFixed(1)}%
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      {trendData.historicalGrowth.toFixed(1)}%
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">6-month average</div>
              </div>
            </div>

            {/* Predictions Chart */}
            {trendData.predictions && trendData.predictions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">12-Month Demand Forecast</h3>
                <div className="border rounded-lg p-4 bg-muted/10">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData.predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="demandScore" 
                        stroke="#3b82f6" 
                        name="Demand Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgSalary" 
                        stroke="#10b981" 
                        name="Avg Salary (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Insights */}
            {trendData.insights && trendData.insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Key Insights</h3>
                <div className="space-y-2">
                  {trendData.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-2 text-sm border rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emerging & Declining Skills */}
            <div className="grid grid-cols-2 gap-4">
              {trendData.emergingSkills && trendData.emergingSkills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Emerging Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendData.emergingSkills.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-500/10 text-green-700 border-green-500/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {trendData.decliningSkills && trendData.decliningSkills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Declining Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendData.decliningSkills.map((skill, idx) => (
                      <Badge key={idx} className="bg-red-500/10 text-red-700 border-red-500/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {trendData.recommendation && (
              <div className="border rounded-lg p-4 bg-primary/5">
                <div className="text-sm font-semibold mb-2">AI Recommendation</div>
                <div className="text-sm">{trendData.recommendation}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
