import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar,
  Building2,
  TrendingUp,
  Users,
  Clock,
  ExternalLink,
  Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddJobDialog } from "@/components/AddJobDialog";
import { 
  getIndustryColor, 
  getJobTypeColor, 
  getExperienceLevelColor 
} from "@/lib/colorCoding";

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  industry: string;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[];
  preferred_skills: string[];
  description: string | null;
  posted_date: string;
  application_deadline: string | null;
  demand_score: number | null;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userRole, setUserRole] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchJobs();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role || '');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, industryFilter, experienceFilter, jobs]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load job postings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.required_skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(job => job.industry === industryFilter);
    }

    if (experienceFilter !== "all") {
      filtered = filtered.filter(job => job.experience_level === experienceFilter);
    }

    setFilteredJobs(filtered);
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const industries = [...new Set(jobs.map(j => j.industry))];

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Briefcase className="w-8 h-8" />
            Job Market
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore current job opportunities and market trends
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'recruiter') && (
          <Button className="gradient-primary glow-hover" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        )}
      </div>

      <AddJobDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onJobAdded={fetchJobs}
      />

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search jobs, companies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Entry">Entry Level</SelectItem>
                <SelectItem value="Mid">Mid Level</SelectItem>
                <SelectItem value="Senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Active Positions</CardDescription>
            <CardTitle className="text-3xl gradient-text">{jobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Industries</CardDescription>
            <CardTitle className="text-3xl gradient-text">{industries.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>New This Week</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {jobs.filter(j => {
                const posted = new Date(j.posted_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return posted >= weekAgo;
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="glass-card card-hover transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                        <span>•</span>
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={getJobTypeColor(job.job_type)}>
                      {job.job_type}
                    </Badge>
                    <Badge variant={getExperienceLevelColor(job.experience_level)}>
                      {job.experience_level}
                    </Badge>
                    <Badge variant={getIndustryColor(job.industry)}>
                      {job.industry}
                    </Badge>
                    {job.demand_score && job.demand_score > 70 && (
                      <Badge variant="success">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        High Demand
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getDaysAgo(job.posted_date)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Salary */}
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 text-lg font-semibold gradient-text">
                  <DollarSign className="w-5 h-5" />
                  {job.salary_min && job.salary_max 
                    ? `₹${job.salary_min} - ₹${job.salary_max} LPA`
                    : job.salary_min 
                    ? `₹${job.salary_min}+ LPA`
                    : `Up to ₹${job.salary_max} LPA`
                  }
                </div>
              )}

              {/* Description */}
              {job.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {job.description}
                </p>
              )}

              {/* Required Skills */}
              {job.required_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {job.preferred_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preferred Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.preferred_skills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.preferred_skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.preferred_skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Deadline */}
              {job.application_deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Application deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button className="flex-1 gradient-primary glow-hover">
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
