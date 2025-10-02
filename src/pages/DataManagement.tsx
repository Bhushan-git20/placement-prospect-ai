import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Database, FileSpreadsheet, Users, Briefcase, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataManagement() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (type: string) => {
    setIsUploading(true);
    // TODO: Implement file upload logic
    setTimeout(() => {
      toast({
        title: "Upload successful",
        description: `${type} data has been imported successfully.`,
      });
      setIsUploading(false);
    }, 2000);
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
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleFileUpload(category.title)}
                          disabled={isUploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </Button>
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
