import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, 
  Download, Loader2, FileText
} from "lucide-react";

interface BulkStudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

interface ParsedStudent {
  student_id: string;
  name: string;
  email: string;
  university: string;
  department: string;
  year: number;
  cgpa: number;
  skills: string[];
  preferred_roles: string[];
  preferred_locations: string[];
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export function BulkStudentImportDialog({ open, onOpenChange, onImported }: BulkStudentImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  const resetState = () => {
    setFile(null);
    setParsedStudents([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setStep('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = async (csvFile: File) => {
    const text = await csvFile.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      toast({
        title: "Invalid CSV",
        description: "CSV must have a header row and at least one data row",
        variant: "destructive",
      });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredHeaders = ['student_id', 'name', 'email', 'university', 'department', 'year'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      toast({
        title: "Missing required columns",
        description: `Please include: ${missingHeaders.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const students: ParsedStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const errors: string[] = [];
      
      const getValue = (header: string) => {
        const idx = headers.indexOf(header);
        return idx >= 0 ? values[idx]?.trim().replace(/"/g, '') || '' : '';
      };

      const student_id = getValue('student_id');
      const name = getValue('name');
      const email = getValue('email');
      const university = getValue('university');
      const department = getValue('department');
      const yearStr = getValue('year');
      const cgpaStr = getValue('cgpa');
      const skillsStr = getValue('skills');
      const rolesStr = getValue('preferred_roles');
      const locationsStr = getValue('preferred_locations');

      // Validation
      if (!student_id) errors.push('Missing student_id');
      if (!name) errors.push('Missing name');
      if (!email) errors.push('Missing email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');
      if (!university) errors.push('Missing university');
      if (!department) errors.push('Missing department');
      
      const year = parseInt(yearStr);
      if (isNaN(year) || year < 1 || year > 6) errors.push('Invalid year (1-6)');
      
      const cgpa = cgpaStr ? parseFloat(cgpaStr) : 0;
      if (cgpaStr && (isNaN(cgpa) || cgpa < 0 || cgpa > 10)) errors.push('Invalid CGPA (0-10)');

      students.push({
        student_id,
        name,
        email,
        university,
        department,
        year: isNaN(year) ? 1 : year,
        cgpa: isNaN(cgpa) ? 0 : cgpa,
        skills: skillsStr ? skillsStr.split(';').map(s => s.trim()).filter(Boolean) : [],
        preferred_roles: rolesStr ? rolesStr.split(';').map(s => s.trim()).filter(Boolean) : [],
        preferred_locations: locationsStr ? locationsStr.split(';').map(s => s.trim()).filter(Boolean) : [],
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedStudents(students);
    setStep('preview');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleImport = async () => {
    const validStudents = parsedStudents.filter(s => s.isValid);
    if (validStudents.length === 0) {
      toast({
        title: "No valid students",
        description: "Please fix the errors and try again",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const batchSize = 10;

    for (let i = 0; i < validStudents.length; i += batchSize) {
      const batch = validStudents.slice(i, i + batchSize);
      
      const insertData = batch.map(s => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        university: s.university,
        department: s.department,
        year: s.year,
        cgpa: s.cgpa,
        skills: s.skills,
        preferred_roles: s.preferred_roles,
        preferred_locations: s.preferred_locations,
        placement_status: 'not_placed' as const,
        strengths: [],
        skill_gaps: [],
        recommendations: [],
        target_companies: [],
      }));

      const { error } = await supabase.from('students').insert(insertData);

      if (error) {
        result.failed += batch.length;
        result.errors.push({ 
          row: i + 2, 
          message: error.message.includes('duplicate') 
            ? 'Duplicate student_id or email' 
            : error.message 
        });
      } else {
        result.success += batch.length;
      }

      setImportProgress(Math.round(((i + batch.length) / validStudents.length) * 100));
    }

    setImportResult(result);
    setStep('result');
    setIsImporting(false);

    if (result.success > 0) {
      onImported();
    }
  };

  const downloadTemplate = () => {
    const headers = 'student_id,name,email,university,department,year,cgpa,skills,preferred_roles,preferred_locations';
    const example = 'ST2024001,John Doe,john@university.edu,ABC University,Computer Science,3,8.5,React;Python;SQL,Software Engineer;Data Analyst,Bangalore;Remote';
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedStudents.filter(s => s.isValid).length;
  const invalidCount = parsedStudents.filter(s => !s.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple students at once
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <Card 
              className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Click to upload CSV</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or drag and drop your file here
                </p>
              </CardContent>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download our CSV template with all required columns
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Required columns:</p>
              <p>student_id, name, email, university, department, year</p>
              <p className="font-medium mt-2">Optional columns:</p>
              <p>cgpa, skills, preferred_roles, preferred_locations</p>
              <p className="text-xs mt-2">
                Note: For multiple values (skills, roles, locations), separate with semicolons (;)
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {invalidCount} invalid
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={resetState}>
                Choose different file
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Student ID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStudents.map((student, idx) => (
                    <tr key={idx} className={!student.isValid ? 'bg-destructive/10' : ''}>
                      <td className="p-2">
                        {student.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive truncate max-w-[100px]" title={student.errors.join(', ')}>
                              {student.errors[0]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-2">{student.student_id || '-'}</td>
                      <td className="p-2">{student.name || '-'}</td>
                      <td className="p-2 truncate max-w-[150px]">{student.email || '-'}</td>
                      <td className="p-2">{student.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Importing... {importProgress}%
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || validCount === 0}
                className="gradient-primary"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {validCount} Students</>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4 py-4">
            <div className="text-center py-6">
              {importResult.success > 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              )}
              <h3 className="text-xl font-semibold">Import Complete</h3>
              <p className="text-muted-foreground mt-2">
                {importResult.success} students imported successfully
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div className="border rounded-lg p-4 bg-destructive/5">
                <h4 className="font-medium text-destructive mb-2">Errors</h4>
                <ul className="text-sm space-y-1">
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-muted-foreground">
                      ...and {importResult.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => { resetState(); onOpenChange(false); }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
