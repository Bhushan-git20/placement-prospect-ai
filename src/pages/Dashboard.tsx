import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Target,
  BookOpen,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface DashboardStats {
  totalStudents: number;
  placementRate: number;
  activeJobs: number;
  averageReadiness: number;
  totalAssessments: number;
  totalCandidates: number;
  applicationReceived: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    placementRate: 0,
    activeJobs: 0,
    averageReadiness: 0,
    totalAssessments: 0,
    totalCandidates: 0,
    applicationReceived: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const fetchUserAndStats = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      }

      // Get dashboard stats
      const [studentsCount, jobsCount, assessmentsCount] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('assessments').select('*', { count: 'exact', head: true }),
      ]);

      // Calculate placement rate and average readiness
      const { data: placedStudents } = await supabase
        .from('students')
        .select('placement_readiness_score')
        .eq('placement_status', 'placed');

      const { data: allStudentsReadiness } = await supabase
        .from('students')
        .select('placement_readiness_score')
        .not('placement_readiness_score', 'is', null);

      const placementRate = studentsCount.count 
        ? Math.round((placedStudents?.length || 0) / studentsCount.count * 100)
        : 0;

      const averageReadiness = allStudentsReadiness?.length
        ? Math.round(allStudentsReadiness.reduce((sum, student) => 
            sum + (student.placement_readiness_score || 0), 0) / allStudentsReadiness.length)
        : 0;

      setStats({
        totalStudents: studentsCount.count || 0,
        placementRate,
        activeJobs: jobsCount.count || 0,
        averageReadiness,
        totalAssessments: assessmentsCount.count || 0,
        totalCandidates: studentsCount.count || 0,
        applicationReceived: Math.floor((studentsCount.count || 0) * 2.3), // Mock calculation
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBasedStats = () => {
    switch (user?.role) {
      case 'user':
        return [
          { 
            title: "Readiness Score", 
            value: "78%", 
            icon: <Target className="w-5 h-5" />, 
            description: "Your placement readiness",
            variant: "primary" as const
          },
          { 
            title: "Assessments Taken", 
            value: "12", 
            icon: <BookOpen className="w-5 h-5" />, 
            description: "Completed this month"
          },
          { 
            title: "Jobs Applied", 
            value: "8", 
            icon: <Briefcase className="w-5 h-5" />, 
            description: "Applications submitted"
          },
        ];
      case 'faculty':
        return [
          { 
            title: "Total Students", 
            value: stats.totalStudents, 
            icon: <Users className="w-5 h-5" />, 
            description: "Under supervision",
            variant: "primary" as const
          },
          { 
            title: "Placement Rate", 
            value: `${stats.placementRate}%`, 
            icon: <TrendingUp className="w-5 h-5" />, 
            description: "Students placed",
            variant: "success" as const
          },
          { 
            title: "Data Records", 
            value: stats.totalStudents + stats.activeJobs, 
            icon: <BarChart3 className="w-5 h-5" />, 
            description: "Total managed records"
          },
        ];
      case 'recruiter':
        return [
          { 
            title: "Total Candidates", 
            value: stats.totalCandidates, 
            icon: <Users className="w-5 h-5" />, 
            description: "Available for recruitment",
            variant: "primary" as const
          },
          { 
            title: "Active Job Postings", 
            value: stats.activeJobs, 
            icon: <Briefcase className="w-5 h-5" />, 
            description: "Currently hiring"
          },
          { 
            title: "Applications Received", 
            value: stats.applicationReceived, 
            icon: <TrendingUp className="w-5 h-5" />, 
            description: "This month",
            variant: "info" as const
          },
          { 
            title: "Avg. Readiness Score", 
            value: `${stats.averageReadiness}%`, 
            icon: <Award className="w-5 h-5" />, 
            description: "Candidate quality"
          },
        ];
      default: // admin
        return [
          { 
            title: "Total Students", 
            value: stats.totalStudents, 
            icon: <Users className="w-5 h-5" />, 
            description: "Registered users",
            variant: "primary" as const
          },
          { 
            title: "Placement Rate", 
            value: `${stats.placementRate}%`, 
            icon: <TrendingUp className="w-5 h-5" />, 
            description: "Overall success rate",
            variant: "success" as const
          },
          { 
            title: "Active Jobs", 
            value: stats.activeJobs, 
            icon: <Briefcase className="w-5 h-5" />, 
            description: "Available positions"
          },
          { 
            title: "Total Assessments", 
            value: stats.totalAssessments, 
            icon: <BookOpen className="w-5 h-5" />, 
            description: "Completed tests",
            variant: "info" as const
          },
        ];
    }
  };

  const getQuickActions = () => {
    const actions: Array<{title: string, description: string, icon: any, action: () => void, variant?: string}> = [];
    
    switch (user?.role) {
      case 'user':
        actions.push(
          { 
            title: "Take Assessment", 
            description: "Improve your readiness score", 
            icon: <BookOpen className="w-5 h-5" />,
            action: () => navigate('/assessments')
          },
          { 
            title: "AI Career Coach", 
            description: "Get personalized advice", 
            icon: <MessageSquare className="w-5 h-5" />,
            action: () => navigate('/career-coach'),
            variant: "primary"
          }
        );
        break;
      case 'faculty':
        actions.push(
          { 
            title: "Manage Students", 
            description: "View and update student profiles", 
            icon: <Users className="w-5 h-5" />,
            action: () => navigate('/students')
          },
          { 
            title: "Data Management", 
            description: "Manage system data", 
            icon: <BarChart3 className="w-5 h-5" />,
            action: () => navigate('/data'),
            variant: "primary"
          }
        );
        break;
      case 'recruiter':
        actions.push(
          { 
            title: "Search Candidates", 
            description: "Find qualified talent", 
            icon: <Target className="w-5 h-5" />,
            action: () => navigate('/candidates')
          },
          { 
            title: "Manage Jobs", 
            description: "Post and manage job openings", 
            icon: <Briefcase className="w-5 h-5" />,
            action: () => navigate('/jobs'),
            variant: "primary"
          }
        );
        break;
      default: // admin
        actions.push(
          { 
            title: "System Analytics", 
            description: "View comprehensive insights", 
            icon: <BarChart3 className="w-5 h-5" />,
            action: () => navigate('/skills')
          },
          { 
            title: "User Management", 
            description: "Manage all user accounts", 
            icon: <Users className="w-5 h-5" />,
            action: () => navigate('/students'),
            variant: "primary"
          }
        );
    }
    
    return actions;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const roleBasedStats = getRoleBasedStats();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card glow-hover">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative p-8 lg:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <Badge variant="secondary" className="text-xs">
                AI-Powered Insights
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-4">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {user?.role === 'user' && "Track your placement readiness and discover career opportunities with AI-powered insights."}
              {user?.role === 'faculty' && "Monitor student progress and manage placement data with comprehensive analytics."}
              {user?.role === 'recruiter' && "Find qualified candidates and manage your hiring process efficiently."}
              {user?.role === 'admin' && "Oversee the entire placement ecosystem with advanced analytics and insights."}
            </p>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.variant === "primary" ? "default" : "outline"}
                  className={`${action.variant === "primary" 
                    ? "gradient-primary glow-hover" 
                    : "glass-card hover:bg-secondary/50"
                  } transition-smooth`}
                >
                  {action.icon}
                  <span className="ml-2">{action.title}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roleBasedStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            variant={stat.variant}
            className="animate-fade-in"
            
          />
        ))}
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <Card 
            key={index} 
            className="glass-card card-hover cursor-pointer transition-smooth"
            onClick={action.action}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  action.variant === "primary" 
                    ? "gradient-primary text-white" 
                    : "bg-secondary/50"
                }`}>
                  {action.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
            </CardHeader>
          </Card>
        ))}
        
        {/* AI Insights Card */}
        <Card className="glass-card glow-primary lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg gradient-primary text-white animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="gradient-text">AI-Powered Insights</CardTitle>
                <CardDescription>Real-time analytics and predictions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">94%</div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-500">+23%</div>
                <div className="text-sm text-muted-foreground">Placement Improvement</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-500">15k+</div>
                <div className="text-sm text-muted-foreground">Career Recommendations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}