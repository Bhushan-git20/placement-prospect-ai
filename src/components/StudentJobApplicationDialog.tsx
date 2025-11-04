import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[];
  description: string;
  posted_date: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  applied_date: string;
  notes: string | null;
  job_postings: Job;
}

interface StudentJobApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function StudentJobApplicationDialog({ open, onOpenChange, studentId, studentName }: StudentJobApplicationDialogProps) {
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, studentId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch available jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch student's applications
      const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select('*, job_postings(*)')
        .eq('student_id', studentId);

      if (appsError) throw appsError;

      setAvailableJobs(jobs || []);
      setApplications(apps || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const { error } = await supabase.from('job_applications').insert({
        student_id: studentId,
        job_id: jobId,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully.",
      });

      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const isAlreadyApplied = (jobId: string) => {
    return applications.some(app => app.job_id === jobId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const JobCard = ({ job, showApplyButton = false }: { job: Job; showApplyButton?: boolean }) => (
    <Card className="glass-card hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <Badge variant="outline">{job.experience_level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            {job.job_type}
          </div>
          {job.salary_min && job.salary_max && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ₹{job.salary_min}L - ₹{job.salary_max}L
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="secondary">{skill}</Badge>
            ))}
            {job.required_skills.length > 5 && (
              <Badge variant="secondary">+{job.required_skills.length - 5} more</Badge>
            )}
          </div>
        </div>

        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Posted {new Date(job.posted_date).toLocaleDateString()}
          </div>
          {showApplyButton && (
            <Button
              onClick={() => handleApply(job.id)}
              disabled={isAlreadyApplied(job.id) || applyingJobId === job.id}
              size="sm"
              className="gradient-primary"
            >
              {applyingJobId === job.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAlreadyApplied(job.id) ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Applied
                </>
              ) : (
                'Apply Now'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Job Applications - {studentName}</DialogTitle>
          <DialogDescription>
            View available jobs and track your applications
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="available" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              Available Jobs ({availableJobs.length})
            </TabsTrigger>
            <TabsTrigger value="applied">
              My Applications ({applications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No jobs available at the moment</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableJobs.map((job) => (
                  <JobCard key={job.id} job={job} showApplyButton />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">You haven't applied to any jobs yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <Card key={app.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-1">{app.job_postings.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{app.job_postings.company}</p>
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {app.job_postings.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(app.applied_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {app.job_postings.required_skills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      {app.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{app.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
