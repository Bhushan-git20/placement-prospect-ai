import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart3,
  Brain,
  Sparkles
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SkillAnalysis {
  id: string;
  skill_name: string;
  category: string;
  current_demand: number;
  predicted_demand: number;
  growth_rate: number;
  trend: string;
  job_count: number;
  average_salary_impact: number;
  industry_focus: string[];
}

export default function Skills() {
  const [skills, setSkills] = useState<SkillAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSkillsAnalysis();
  }, []);

  const fetchSkillsAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_analysis')
        .select('*')
        .order('current_demand', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills analysis:', error);
      toast({
        title: "Error",
        description: "Failed to load skills analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Rising': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Rising': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'Declining': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const topSkills = skills.slice(0, 10);
  const risingSkills = skills.filter(s => s.trend === 'Rising').slice(0, 5);
  const emergingSkills = skills.filter(s => s.growth_rate > 20).slice(0, 5);

  const demandChartData = topSkills.map(skill => ({
    name: skill.skill_name,
    current: skill.current_demand,
    predicted: skill.predicted_demand
  }));

  const categoryData = skills.reduce((acc: any, skill) => {
    const existing = acc.find((item: any) => item.category === skill.category);
    if (existing) {
      existing.count += 1;
      existing.avgDemand += skill.current_demand;
    } else {
      acc.push({ 
        category: skill.category, 
        count: 1, 
        avgDemand: skill.current_demand 
      });
    }
    return acc;
  }, []).map((item: any) => ({
    ...item,
    avgDemand: Math.round(item.avgDemand / item.count)
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <Brain className="w-8 h-8" />
          Skill Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights into skill demand, trends, and market predictions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Skills Tracked</CardDescription>
            <CardTitle className="text-3xl gradient-text">{skills.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Rising Skills</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {skills.filter(s => s.trend === 'Rising').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>High Demand</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {skills.filter(s => s.current_demand > 70).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl gradient-text">
              {[...new Set(skills.map(s => s.category))].length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card glow-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>Top Skills Demand</CardTitle>
            </div>
            <CardDescription>Current vs Predicted demand</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Demand" />
                <Bar dataKey="predicted" fill="hsl(var(--chart-2))" name="Predicted Demand" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card glow-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>Skills by Category</CardTitle>
            </div>
            <CardDescription>Average demand per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="avgDemand" fill="hsl(var(--chart-3))" name="Avg. Demand" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rising Skills */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <CardTitle>Rising Skills</CardTitle>
          </div>
          <CardDescription>Skills with the highest growth potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {risingSkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-smooth">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{skill.skill_name}</h3>
                    <Badge className={getTrendColor(skill.trend)}>
                      {getTrendIcon(skill.trend)}
                      <span className="ml-1">{skill.trend}</span>
                    </Badge>
                    <Badge variant="outline">{skill.category}</Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Demand: {skill.current_demand}%
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Growth: +{skill.growth_rate?.toFixed(1) ?? '0'}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {skill.job_count} jobs
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Salary Impact</p>
                  <p className="text-lg font-bold gradient-text">
                    +₹{skill.average_salary_impact?.toFixed(1) ?? '0'}L
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Skills Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Complete Skill Analysis</CardTitle>
          </div>
          <CardDescription>Comprehensive breakdown of all tracked skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div 
                key={skill.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-smooth"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h4 className="font-medium">{skill.skill_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                      {skill.industry_focus.slice(0, 2).map((industry, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{industry}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="font-semibold">{skill.current_demand}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Predicted</p>
                    <p className="font-semibold text-primary">{skill.predicted_demand}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Jobs</p>
                    <p className="font-semibold">{skill.job_count}</p>
                  </div>
                </div>
                <Badge className={getTrendColor(skill.trend)}>
                  {getTrendIcon(skill.trend)}
                  <span className="ml-1">+{skill.growth_rate?.toFixed(0) ?? '0'}%</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
