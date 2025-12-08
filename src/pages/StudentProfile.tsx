import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, GraduationCap, Mail, MapPin, Building2, FileText, 
  Briefcase, Target, TrendingUp, Award, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, BookOpen, Pencil
} from "lucide-react";
import { CareerPathRecommendations } from "@/components/CareerPathRecommendations";
import { PlacementReadinessCard } from "@/components/PlacementReadinessCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { getPlacementStatusColor, getScoreColor } from "@/lib/colorCoding";

interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  university: string;
  department: string;
  year: number;
  cgpa: number | null;
  skills: string[];
  preferred_roles: string[];
  preferred_locations: string[];
  placement_status: string | null;
  placement_readiness_score: number | null;
  resume_url: string | null;
  placed_company: string | null;
  placed_role: string | null;
  skill_gaps: string[] | null;
  recommendations: string[] | null;
  strengths: string[] | null;
  target_companies: string[] | null;
}

interface Assessment {
  id: string;
  assessment_type: string;
  test_category: string;
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  difficulty_level: string | null;
  assessment_date: string | null;
  strengths: string[] | null;
  areas_of_improvement: string[] | null;
  feedback: string | null;
}

interface JobApplication {
  id: string;
  status: string;
  applied_date: string;
  notes: string | null;
  job_postings: {
    title: string;
    company: string;
    location: string;
    job_type: string;
  } | null;
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch student data linked to user email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        toast({
          title: "Profile not found",
          description: "No student profile linked to your account. Please contact your faculty.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch assessments and applications in parallel
      const [assessmentRes, applicationRes] = await Promise.all([
        supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('assessment_date', { ascending: false }),
        supabase
          .from('job_applications')
          .select(`
            *,
            job_postings (title, company, location, job_type)
          `)
          .eq('student_id', studentData.id)
          .order('applied_date', { ascending: false })
      ]);

      if (assessmentRes.data) setAssessments(assessmentRes.data);
      if (applicationRes.data) setApplications(applicationRes.data as JobApplication[]);

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

  const getApplicationStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hired':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'shortlisted':
      case 'interview':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hired':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'shortlisted':
      case 'interview':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not linked to any student profile. Please contact your faculty or administrator.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <Card className="flex-1 glass-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4" />
                  {student.department} • Year {student.year}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getPlacementStatusColor(student.placement_status || 'not_placed')}>
                    {student.placement_status?.replace('_', ' ').toUpperCase() || 'NOT PLACED'}
                  </Badge>
                  {student.cgpa && (
                    <Badge variant="outline">CGPA: {student.cgpa}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {student.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {student.university}
              </div>
              {student.preferred_locations.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="h-4 w-4" />
                  {student.preferred_locations.join(', ')}
                </div>
              )}
            </div>

            {student.resume_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={student.resume_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </a>
              </Button>
            )}

            {student.placed_company && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Placed at {student.placed_company}
                </div>
                {student.placed_role && (
                  <p className="text-sm text-green-600 mt-1">Role: {student.placed_role}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness Score Card */}
        <div className="w-full md:w-80">
          <PlacementReadinessCard 
            studentId={student.id} 
            currentScore={student.placement_readiness_score}
            onCalculated={fetchStudentProfile}
          />
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {student && (
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          student={student}
          onSaved={fetchStudentProfile}
        />
      )}

      {/* Skills Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skills & Goals
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Current Skills</h4>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary">{skill}</Badge>
              ))}
              {student.skills.length === 0 && (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Preferred Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {student.preferred_roles.map((role, idx) => (
                  <Badge key={idx} variant="outline">{role}</Badge>
                ))}
                {student.preferred_roles.length === 0 && (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            {student.target_companies && student.target_companies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Target Companies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {student.target_companies.map((company, idx) => (
                    <Badge key={idx} variant="outline">{company}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {student.skill_gaps && student.skill_gaps.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-orange-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {student.skill_gaps.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="border-orange-300 text-orange-700">{skill}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {student.strengths && student.strengths.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-1">
                  {student.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Assessments, Applications, Recommendations */}
      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Career AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>Your test scores and performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length > 0 ? (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{assessment.test_category}</h4>
                          <p className="text-sm text-muted-foreground">{assessment.assessment_type}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(assessment.score || 0)}`}>
                            {assessment.score || 0}%
                          </div>
                          {assessment.correct_answers !== null && assessment.total_questions !== null && (
                            <p className="text-xs text-muted-foreground">
                              {assessment.correct_answers}/{assessment.total_questions} correct
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {assessment.difficulty_level && (
                          <Badge variant="outline">{assessment.difficulty_level}</Badge>
                        )}
                        {assessment.assessment_date && (
                          <Badge variant="secondary">
                            {new Date(assessment.assessment_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>

                      {assessment.feedback && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                          {assessment.feedback}
                        </p>
                      )}

                      {assessment.strengths && assessment.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assessment.strengths.slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-green-600 border-green-300">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No assessments taken yet</p>
                  <Button variant="link" onClick={() => navigate('/my-assessments')}>
                    Take your first assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>Track your application status</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getApplicationStatusIcon(app.status)}
                        <div>
                          <h4 className="font-medium">{app.job_postings?.title || 'Unknown Position'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {app.job_postings?.company} • {app.job_postings?.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getApplicationStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.applied_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No applications yet</p>
                  <Button variant="link" onClick={() => navigate('/jobs')}>
                    Browse available jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="space-y-6">
            {student.recommendations && student.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {student.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <CareerPathRecommendations studentId={student.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
