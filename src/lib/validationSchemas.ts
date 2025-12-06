import { z } from "zod";

// Common validation patterns
const emailSchema = z.string().email("Invalid email address").max(255, "Email too long");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim();
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long");

// Auth schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["user", "faculty", "recruiter", "admin"]),
});

// Job posting schema
export const jobPostingSchema = z.object({
  title: z.string().min(2, "Job title is required").max(100, "Title too long").trim(),
  company: z.string().min(2, "Company name is required").max(100, "Company name too long").trim(),
  location: z.string().min(2, "Location is required").max(100, "Location too long").trim(),
  job_type: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
  experience_level: z.enum(["Entry", "Mid", "Senior"]),
  industry: z.string().min(2, "Industry is required").max(50, "Industry too long").trim(),
  salary_min: z.string().optional().transform(val => val ? parseInt(val) : null),
  salary_max: z.string().optional().transform(val => val ? parseInt(val) : null),
  required_skills: z.string().min(1, "At least one required skill is needed"),
  preferred_skills: z.string().optional(),
  description: z.string().max(2000, "Description too long").optional(),
});

// Assessment schema
export const assessmentSchema = z.object({
  student_name: nameSchema,
  student_id: z.string().min(1, "Student ID is required").max(50, "Student ID too long").trim(),
  assessment_type: z.enum(["Technical", "Aptitude", "Behavioral"]),
  test_category: z.enum(["Coding", "Problem Solving", "Communication", "Leadership", "Technical Skills", "DSA", "Mock Interview"]),
  difficulty_level: z.enum(["Easy", "Medium", "Hard"]),
  total_questions: z.string().min(1, "Total questions required").transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, "Questions must be between 1 and 100"),
  time_limit_minutes: z.string().min(1, "Time limit required").transform(val => parseInt(val)).refine(val => val > 0 && val <= 180, "Time limit must be between 1 and 180 minutes"),
});

// Student schema
export const studentSchema = z.object({
  student_id: z.string().min(1, "Student ID is required").max(50, "Student ID too long").trim(),
  name: nameSchema,
  email: emailSchema,
  university: z.string().min(2, "University is required").max(100, "University name too long").trim(),
  department: z.string().min(2, "Department is required").max(100, "Department too long").trim(),
  year: z.number().int().min(1, "Year must be at least 1").max(6, "Year cannot exceed 6"),
  cgpa: z.number().min(0, "CGPA cannot be negative").max(10, "CGPA cannot exceed 10").optional(),
  skills: z.array(z.string()).default([]),
  preferred_roles: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
});

// Contact/message schema
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message too long").trim(),
});

// Search/filter schema
export const searchSchema = z.object({
  query: z.string().max(200, "Search query too long").trim(),
  department: z.string().optional(),
  status: z.string().optional(),
  minCgpa: z.number().min(0).max(10).optional(),
  maxCgpa: z.number().min(0).max(10).optional(),
});

// Type exports
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
export type AssessmentFormData = z.infer<typeof assessmentSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
