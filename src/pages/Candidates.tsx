import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Download, Mail, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCardSkeleton } from "@/components/ui/loading-skeletons";

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
  preferred_roles: string[];
  preferred_locations: string[];
}

export default function Candidates() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, departmentFilter, statusFilter, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('placement_readiness_score', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.placement_status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'in_process': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'not_placed': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportCandidates = () => {
    const csvContent = filteredStudents.map(s => 
      `${s.name},${s.student_id},${s.email},${s.department},${s.cgpa},${s.placement_status},${s.skills.join(';')}`
    ).join('\n');
    const header = 'Name,Student ID,Email,Department,CGPA,Status,Skills\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates.csv';
    a.click();
    toast({ title: "Export Complete", description: `Exported ${filteredStudents.length} candidates` });
  };

  const handleViewProfile = (student: Student) => {
    toast({ title: "Profile View", description: `Viewing ${student.name}'s profile` });
  };

  const handleContact = (student: Student) => {
    window.location.href = `mailto:${student.email}`;
  };

  const handleShortlist = (student: Student) => {
    toast({ title: "Shortlisted", description: `${student.name} has been added to your shortlist` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Candidate Search</h1>
          <p className="text-muted-foreground">Find and shortlist candidates for your job openings</p>
        </div>
        <Button className="gradient-primary" onClick={handleExportCandidates}>
          <Download className="w-4 h-4 mr-2" />
          Export Candidates
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_placed">Available</SelectItem>
                <SelectItem value="in_process">In Process</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} candidates
      </div>

      {/* Student Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))}
          </>
        ) : filteredStudents.length === 0 ? (
          <Card className="glass-card"><CardContent className="p-8 text-center text-muted-foreground">No candidates found</CardContent></Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="glass-card hover:glow-primary transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="gradient-primary text-white text-xl">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.student_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.placement_readiness_score && (
                          <Badge variant="outline" className="gradient-primary text-white">
                            Score: {student.placement_readiness_score}%
                          </Badge>
                        )}
                        <Badge variant="outline" className={getStatusColor(student.placement_status)}>
                          {student.placement_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span>{student.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>Year {student.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">CGPA:</span>
                        <span className="font-medium">{student.cgpa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {student.skills.slice(0, 6).map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                        {student.skills.length > 6 && (
                          <Badge variant="secondary">+{student.skills.length - 6} more</Badge>
                        )}
                      </div>
                    </div>

                    {student.preferred_roles.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Preferred Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {student.preferred_roles.map((role) => (
                            <Badge key={role} variant="outline">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="gradient-primary" onClick={() => handleViewProfile(student)}>
                        View Profile
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleContact(student)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShortlist(student)}>
                        Shortlist
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
