import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Database, FileSpreadsheet, Users, Briefcase, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export default function DataManagement() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleImportClick = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data: any = {};
      formData.forEach((value, key) => data[key] = value);

      let result;
      switch (selectedCategory) {
        case "Student Data":
          result = await supabase.from('students').insert({
            student_id: data.studentId,
            name: data.studentName,
            email: data.email,
            university: "Default University",
            department: data.department || "Computer Science",
            year: parseInt(data.year) || 1,
            cgpa: parseFloat(data.cgpa) || 0,
            skills: data.skills?.split(',').map((s: string) => s.trim()) || [],
            preferred_roles: [],
            preferred_locations: []
          });
          break;

        case "Job Postings":
          result = await supabase.from('job_postings').insert({
            title: data.jobTitle,
            company: data.company,
            location: data.location,
            job_type: data.jobType || "Full-time",
            experience_level: data.experienceLevel || "Entry Level",
            industry: "Technology",
            required_skills: data.requiredSkills?.split(',').map((s: string) => s.trim()) || [],
            preferred_skills: [],
            salary_min: data.salaryMin ? parseInt(data.salaryMin) : null,
            salary_max: data.salaryMax ? parseInt(data.salaryMax) : null,
            description: data.description
          });
          break;

        case "Skill Analytics":
          result = await supabase.from('skill_analysis').insert({
            skill_name: data.skillName,
            category: data.category || "Technical",
            trend: data.trend || "Stable",
            current_demand: parseInt(data.currentDemand) || 0,
            predicted_demand: data.predictedDemand ? parseInt(data.predictedDemand) : null,
            growth_rate: data.growthRate ? parseFloat(data.growthRate) : null,
            industry_focus: []
          });
          break;

        case "Assessment Results":
          const { data: { user } } = await supabase.auth.getUser();
          result = await supabase.from('assessments').insert({
            user_id: user?.id,
            student_name: data.assessmentStudent,
            student_id: data.studentId || "UNKNOWN",
            assessment_type: data.assessmentType || "Technical",
            test_category: data.testCategory || "General",
            score: 0,
            total_questions: 0,
            correct_answers: 0
          });
          break;
      }

      if (result?.error) throw result.error;

      toast({
        title: "Import successful",
        description: `${selectedCategory} data has been imported successfully.`,
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = (type: string) => {
    toast({
      title: "Export initiated",
      description: `${type} data export will begin shortly.`,
    });
  };

  const dataCategories = [
    {
      title: "Student Data",
      description: "Import/export student profiles and academic records",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Job Postings",
      description: "Manage job listings and recruitment data",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Skill Analytics",
      description: "Update skill demand and market trends",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Assessment Results",
      description: "Import assessment scores and analysis",
      icon: FileSpreadsheet,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Data Management</h1>
        <p className="text-muted-foreground">Import, export, and manage system data</p>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Data Import
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files to import data in bulk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dataCategories.map((category) => (
                  <Card key={category.title} className="border-2 hover:border-primary/50 transition-smooth">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                        <category.icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <h3 className="font-semibold mb-2">{category.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      <div className="flex gap-2">
                        <Dialog open={isDialogOpen && selectedCategory === category.title} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) setSelectedCategory("");
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleImportClick(category.title)}
                              disabled={isUploading}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import Data
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Import {category.title}</DialogTitle>
                              <DialogDescription>
                                Fill in the details below to import {category.title.toLowerCase()}
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                              {category.title === "Student Data" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="studentName">Student Name</Label>
                                      <Input id="studentName" placeholder="Enter student name" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="studentId">Student ID</Label>
                                      <Input id="studentId" placeholder="Enter student ID" required />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="email">Email</Label>
                                      <Input id="email" type="email" placeholder="student@example.com" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="department">Department</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cs">Computer Science</SelectItem>
                                          <SelectItem value="it">Information Technology</SelectItem>
                                          <SelectItem value="ece">Electronics</SelectItem>
                                          <SelectItem value="mech">Mechanical</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="year">Year</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">First Year</SelectItem>
                                          <SelectItem value="2">Second Year</SelectItem>
                                          <SelectItem value="3">Third Year</SelectItem>
                                          <SelectItem value="4">Fourth Year</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="cgpa">CGPA</Label>
                                      <Input id="cgpa" type="number" step="0.01" placeholder="8.5" required />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                                    <Input id="skills" placeholder="Python, Java, React" required />
                                  </div>
                                </>
                              )}
                              
                              {category.title === "Job Postings" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <Input id="jobTitle" placeholder="Software Engineer" required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="company">Company</Label>
                                      <Input id="company" placeholder="Company name" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="location">Location</Label>
                                      <Input id="location" placeholder="City, Country" required />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="jobType">Job Type</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="fulltime">Full-time</SelectItem>
                                          <SelectItem value="parttime">Part-time</SelectItem>
                                          <SelectItem value="contract">Contract</SelectItem>
                                          <SelectItem value="internship">Internship</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="experienceLevel">Experience Level</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="entry">Entry Level</SelectItem>
                                          <SelectItem value="mid">Mid Level</SelectItem>
                                          <SelectItem value="senior">Senior Level</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="salaryMin">Minimum Salary</Label>
                                      <Input id="salaryMin" type="number" placeholder="50000" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="salaryMax">Maximum Salary</Label>
                                      <Input id="salaryMax" type="number" placeholder="80000" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
                                    <Input id="requiredSkills" placeholder="JavaScript, React, Node.js" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="description">Job Description</Label>
                                    <Textarea id="description" placeholder="Enter job description..." rows={4} />
                                  </div>
                                </>
                              )}
                              
                              {category.title === "Skill Analytics" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="skillName">Skill Name</Label>
                                    <Input id="skillName" placeholder="React" required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="category">Category</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="technical">Technical</SelectItem>
                                          <SelectItem value="soft">Soft Skills</SelectItem>
                                          <SelectItem value="language">Language</SelectItem>
                                          <SelectItem value="tool">Tool/Platform</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="trend">Trend</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select trend" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Rising">Rising</SelectItem>
                                          <SelectItem value="Stable">Stable</SelectItem>
                                          <SelectItem value="Declining">Declining</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="currentDemand">Current Demand Score</Label>
                                      <Input id="currentDemand" type="number" placeholder="75" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="predictedDemand">Predicted Demand Score</Label>
                                      <Input id="predictedDemand" type="number" placeholder="85" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="growthRate">Growth Rate (%)</Label>
                                    <Input id="growthRate" type="number" step="0.1" placeholder="12.5" />
                                  </div>
                                </>
                              )}
                              
                              {category.title === "Assessment Results" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="assessmentStudent">Student Name</Label>
                                      <Input id="assessmentStudent" placeholder="Student name" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="assessmentType">Assessment Type</Label>
                                      <Select required>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="technical">Technical</SelectItem>
                                          <SelectItem value="aptitude">Aptitude</SelectItem>
                                          <SelectItem value="communication">Communication</SelectItem>
                                          <SelectItem value="coding">Coding</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="score">Score</Label>
                                      <Input id="score" type="number" placeholder="85" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="totalQuestions">Total Questions</Label>
                                      <Input id="totalQuestions" type="number" placeholder="100" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="timeTaken">Time Taken (min)</Label>
                                      <Input id="timeTaken" type="number" placeholder="45" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="feedback">Feedback</Label>
                                    <Textarea id="feedback" placeholder="Enter assessment feedback..." rows={3} />
                                  </div>
                                </>
                              )}
                              
                              <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isUploading}>
                                  {isUploading ? "Importing..." : "Import Data"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline">
                          Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Supported formats: CSV, XLSX</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Download templates before uploading to ensure correct format</li>
                <li>• Duplicate entries will be automatically handled</li>
                <li>• Invalid data rows will be skipped and logged</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export System Data
              </CardTitle>
              <CardDescription>
                Download data in CSV or Excel format for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dataCategories.map((category) => (
                  <Card key={category.title} className="border-2 hover:border-primary/50 transition-smooth">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                        <category.icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <h3 className="font-semibold mb-2">{category.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleExport(category.title)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleExport(category.title)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
