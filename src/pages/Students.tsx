import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, Filter, TrendingUp, Award, Mail, Phone, MapPin, Briefcase, Target, BookOpen, Plus, Loader2, GitMerge, Clipboard, Upload } from "lucide-react";
import { StudentJobMatchDialog } from "@/components/StudentJobMatchDialog";
import { StudentJobApplicationDialog } from "@/components/StudentJobApplicationDialog";
import { BulkStudentImportDialog } from "@/components/BulkStudentImportDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPlacementStatusColor, getReadinessScoreColor, getDepartmentColor, getPlacementStatusLabel, getReadinessScoreLabel } from "@/lib/colorCoding";

interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  placement_status: string;
  placement_readiness_score: number | null;
  placed_company: string | null;
  placed_role: string | null;
  package_lpa: number | null;
  strengths: string[];
  skill_gaps: string[];
  preferred_roles: string[];
  resume_url: string | null;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showJobApplicationDialog, setShowJobApplicationDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState("");
  const {
    toast
  } = useToast();
  const [newStudent, setNewStudent] = useState({
    student_id: "",
    name: "",
    email: "",
    department: "",
    year: 1,
    cgpa: 0,
    skills: "",
    university: "",
    preferred_roles: "",
    preferred_locations: ""
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  useEffect(() => {
    fetchUserRole();
    fetchStudents();
  }, []);
  const fetchUserRole = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) {
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      setUserRole(roleData?.role || '');
    }
  };
  useEffect(() => {
    filterStudents();
  }, [searchQuery, departmentFilter, statusFilter, students]);
  const fetchStudents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('students').select('*').order('placement_readiness_score', {
        ascending: false,
        nullsFirst: false
      });
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const filterStudents = () => {
    let filtered = [...students];
    if (searchQuery) {
      filtered = filtered.filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (departmentFilter !== "all") {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(student => student.placement_status === statusFilter);
    }
    setFilteredStudents(filtered);
  };
  const departments = [...new Set(students.map(s => s.department))];
  const handleAddStudent = async () => {
    setIsSaving(true);
    try {
      let resume_url = null;

      // Upload resume if provided - use user folder for proper RLS isolation
      if (resumeFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${newStudent.student_id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const {
          error: uploadError,
          data
        } = await supabase.storage.from('resumes').upload(filePath, resumeFile);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('resumes').getPublicUrl(filePath);
        resume_url = publicUrl;
      }
      const {
        error
      } = await supabase.from('students').insert({
        student_id: newStudent.student_id,
        name: newStudent.name,
        email: newStudent.email,
        department: newStudent.department,
        year: newStudent.year,
        cgpa: newStudent.cgpa,
        skills: newStudent.skills.split(',').map(s => s.trim()).filter(Boolean),
        university: newStudent.university,
        preferred_roles: newStudent.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
        preferred_locations: newStudent.preferred_locations.split(',').map(s => s.trim()).filter(Boolean),
        placement_status: 'not_placed',
        strengths: [],
        skill_gaps: [],
        recommendations: [],
        target_companies: [],
        resume_url
      });
      if (error) throw error;
      toast({
        title: "Student added successfully",
        description: `${newStudent.name} has been added to the system.`
      });
      setShowAddDialog(false);
      setNewStudent({
        student_id: "",
        name: "",
        email: "",
        department: "",
        year: 1,
        cgpa: 0,
        skills: "",
        university: "",
        preferred_roles: "",
        preferred_locations: ""
      });
      setResumeFile(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>;
  }
  return <div className="space-y-6 animate-fade-in relative">
      {/* Page Background Gradient - Cyan */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(191,91%,55%)]/20 via-transparent to-[hsl(199,89%,48%)]/20"></div>
      </div>
      <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Users className="w-8 h-8" />
            Student Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track student profiles, placement readiness, and career progress
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'faculty') && <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowMatchDialog(true)}>
              <GitMerge className="w-4 h-4 mr-2" />
              Match Students
            </Button>
            <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary glow-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter student details to add them to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID *</Label>
                    <Input id="student_id" value={newStudent.student_id} onChange={e => setNewStudent({
                      ...newStudent,
                      student_id: e.target.value
                    })} placeholder="e.g., ST2024001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={newStudent.name} onChange={e => setNewStudent({
                      ...newStudent,
                      name: e.target.value
                    })} placeholder="John Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={newStudent.email} onChange={e => setNewStudent({
                    ...newStudent,
                    email: e.target.value
                  })} placeholder="john@university.edu" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input id="department" value={newStudent.department} onChange={e => setNewStudent({
                      ...newStudent,
                      department: e.target.value
                    })} placeholder="Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University *</Label>
                    <Input id="university" value={newStudent.university} onChange={e => setNewStudent({
                      ...newStudent,
                      university: e.target.value
                    })} placeholder="ABC University" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Select value={newStudent.year.toString()} onValueChange={value => setNewStudent({
                      ...newStudent,
                      year: parseInt(value)
                    })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cgpa">CGPA *</Label>
                    <Input id="cgpa" type="number" step="0.01" min="0" max="10" value={newStudent.cgpa} onChange={e => setNewStudent({
                      ...newStudent,
                      cgpa: parseFloat(e.target.value)
                    })} placeholder="8.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea id="skills" value={newStudent.skills} onChange={e => setNewStudent({
                    ...newStudent,
                    skills: e.target.value
                  })} placeholder="React, Python, Machine Learning" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_roles">Preferred Roles (comma-separated)</Label>
                  <Input id="preferred_roles" value={newStudent.preferred_roles} onChange={e => setNewStudent({
                    ...newStudent,
                    preferred_roles: e.target.value
                  })} placeholder="Software Engineer, Data Analyst" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_locations">Preferred Locations (comma-separated)</Label>
                  <Input id="preferred_locations" value={newStudent.preferred_locations} onChange={e => setNewStudent({
                    ...newStudent,
                    preferred_locations: e.target.value
                  })} placeholder="Bangalore, Mumbai, Remote" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume (PDF/DOC)</Label>
                  <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                  {resumeFile && <p className="text-xs text-muted-foreground">
                      Selected: {resumeFile.name}
                    </p>}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddStudent} disabled={isSaving || !newStudent.student_id || !newStudent.name || !newStudent.email} className="gradient-primary">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Add Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>}

      <StudentJobMatchDialog open={showMatchDialog} onOpenChange={setShowMatchDialog} />
      <BulkStudentImportDialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog} onImported={fetchStudents} />

      {selectedStudent && <StudentJobApplicationDialog open={showJobApplicationDialog} onOpenChange={setShowJobApplicationDialog} studentId={selectedStudent.id} studentName={selectedStudent.name} />}
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="in_process">In Process</SelectItem>
                <SelectItem value="not_placed">Not Placed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl gradient-text">{students.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Placed</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {students.filter(s => s.placement_status === 'placed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>In Process</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {students.filter(s => s.placement_status === 'in_process').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Readiness</CardDescription>
            <CardTitle className="text-3xl gradient-text">
              {Math.round(students.reduce((sum, s) => sum + (s.placement_readiness_score || 0), 0) / students.length)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.map(student => <Card key={student.id} className="glass-card card-hover transition-smooth">
            <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="gradient-primary text-white text-lg">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{student.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {student.student_id}
                        </Badge>
                        <span className="text-muted-foreground text-xs">•</span>
                        <Badge variant={getDepartmentColor(student.department)} className="text-xs bg-amber-600">
                          {student.department}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getPlacementStatusColor(student.placement_status)} className="bg-emerald-500">
                    {getPlacementStatusLabel(student.placement_status)}
                  </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Academic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">Year {student.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CGPA</p>
                  <p className="font-medium">{student.cgpa}</p>
                </div>
              </div>

              {/* Readiness Score */}
              {student.placement_readiness_score && <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Readiness Score
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getReadinessScoreColor(student.placement_readiness_score)}>
                        {getReadinessScoreLabel(student.placement_readiness_score)}
                      </Badge>
                      <span className="font-bold gradient-text">{student.placement_readiness_score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="gradient-primary h-2 rounded-full transition-all" style={{
                  width: `${student.placement_readiness_score}%`
                }} />
                  </div>
                </div>}

              {/* Placement Info */}
              {student.placement_status === 'placed' && student.placed_company && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600">{student.placed_company}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.placed_role}</p>
                  {student.package_lpa && <p className="text-sm font-medium mt-1">₹{student.package_lpa} LPA</p>}
                </div>}

              {/* Skills */}
              {student.skills.length > 0 && <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Top Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.slice(0, 5).map((skill, idx) => <Badge key={idx} variant="secondary" className="text-xs bg-lime-400">
                        {skill}
                      </Badge>)}
                    {student.skills.length > 5 && <Badge variant="outline" className="text-xs">
                        +{student.skills.length - 5} more
                      </Badge>}
                  </div>
                </div>}

              {/* Contact & Resume */}
              <div className="pt-3 border-t border-border space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  {student.email}
                </Button>
                {student.resume_url ? <Button variant="outline" className="w-full" size="sm" onClick={() => window.open(student.resume_url!, '_blank')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Resume
                  </Button> : <Button variant="outline" className="w-full" size="sm" disabled>
                    <BookOpen className="w-4 h-4 mr-2" />
                    No Resume
                  </Button>}
                <Button variant="default" className="w-full gradient-primary" size="sm" onClick={() => {
                setSelectedStudent({
                  id: student.id,
                  name: student.name
                });
                setShowJobApplicationDialog(true);
              }}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Apply for Jobs
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {filteredStudents.length === 0 && <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No students found matching your filters</p>
          </CardContent>
        </Card>}
      </div>
    </div>;
}