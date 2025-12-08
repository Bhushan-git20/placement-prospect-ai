// Color-coded category system for jobs, students, and assessments

export type BadgeVariant = 
  | "default" 
  | "secondary" 
  | "destructive" 
  | "outline" 
  | "success" 
  | "warning" 
  | "info" 
  | "cyan" 
  | "pink" 
  | "orange";

// Job Industry Color Mapping
export const getIndustryColor = (industry: string): BadgeVariant => {
  const industryMap: Record<string, BadgeVariant> = {
    "Technology": "cyan",
    "IT": "cyan",
    "Software": "cyan",
    "Finance": "success",
    "Banking": "success",
    "Healthcare": "pink",
    "Medical": "pink",
    "Education": "info",
    "Manufacturing": "orange",
    "Retail": "warning",
    "E-commerce": "warning",
    "Consulting": "default",
    "Media": "destructive",
    "Entertainment": "destructive",
  };
  
  return industryMap[industry] || "secondary";
};

// Job Type Color Mapping
export const getJobTypeColor = (jobType: string): BadgeVariant => {
  const jobTypeMap: Record<string, BadgeVariant> = {
    "Full-time": "success",
    "Part-time": "info",
    "Contract": "warning",
    "Internship": "cyan",
    "Freelance": "pink",
    "Remote": "default",
  };
  
  return jobTypeMap[jobType] || "secondary";
};

// Experience Level Color Mapping
export const getExperienceLevelColor = (level: string): BadgeVariant => {
  const levelMap: Record<string, BadgeVariant> = {
    "Entry": "cyan",
    "Junior": "info",
    "Mid": "warning",
    "Senior": "orange",
    "Lead": "destructive",
    "Executive": "success",
  };
  
  return levelMap[level] || "secondary";
};

// Student Placement Status Color Mapping
export const getPlacementStatusColor = (status: string): BadgeVariant => {
  const statusMap: Record<string, BadgeVariant> = {
    "placed": "success",
    "interviewing": "warning",
    "applied": "info",
    "not_placed": "secondary",
    "offer_received": "cyan",
    "rejected": "destructive",
  };
  
  return statusMap[status] || "secondary";
};

// Readiness Score Color Mapping
export const getReadinessScoreColor = (score: number): BadgeVariant => {
  if (score >= 90) return "success";
  if (score >= 80) return "cyan";
  if (score >= 70) return "info";
  if (score >= 60) return "warning";
  if (score >= 50) return "orange";
  return "destructive";
};

// Assessment Score Color Mapping
export const getAssessmentScoreColor = (score: number): BadgeVariant => {
  if (score >= 90) return "success";
  if (score >= 80) return "cyan";
  if (score >= 70) return "info";
  if (score >= 60) return "warning";
  if (score >= 50) return "orange";
  return "destructive";
};

// Assessment Type Color Mapping
export const getAssessmentTypeColor = (type: string): BadgeVariant => {
  const typeMap: Record<string, BadgeVariant> = {
    "Technical": "cyan",
    "Aptitude": "info",
    "Behavioral": "pink",
    "Communication": "warning",
    "Domain": "orange",
    "Coding": "success",
    "System Design": "default",
  };
  
  return typeMap[type] || "secondary";
};

// Department Color Mapping
export const getDepartmentColor = (department: string): BadgeVariant => {
  const deptMap: Record<string, BadgeVariant> = {
    "Computer Science": "cyan",
    "CSE": "cyan",
    "Information Technology": "info",
    "IT": "info",
    "Electronics": "orange",
    "ECE": "orange",
    "Mechanical": "warning",
    "Civil": "success",
    "Electrical": "pink",
    "EEE": "pink",
  };
  
  return deptMap[department] || "secondary";
};

// Skill Category Color Mapping
export const getSkillCategoryColor = (category: string): BadgeVariant => {
  const categoryMap: Record<string, BadgeVariant> = {
    "Programming": "cyan",
    "Web Development": "info",
    "Mobile Development": "pink",
    "Data Science": "success",
    "Machine Learning": "warning",
    "DevOps": "orange",
    "Cloud": "default",
    "Database": "destructive",
  };
  
  return categoryMap[category] || "secondary";
};

// Get label for readiness score
export const getReadinessScoreLabel = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  if (score >= 50) return "Below Average";
  return "Needs Improvement";
};

// Get label for placement status
export const getPlacementStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    "placed": "Placed",
    "interviewing": "Interviewing",
    "applied": "Applied",
    "not_placed": "Not Placed",
    "offer_received": "Offer Received",
    "rejected": "Rejected",
  };
  
  return labels[status] || status;
};

// Difficulty Level Color Mapping
export const getDifficultyColor = (difficulty: string): BadgeVariant => {
  const diffMap: Record<string, BadgeVariant> = {
    "Easy": "success",
    "easy": "success",
    "Medium": "warning",
    "medium": "warning",
    "Hard": "destructive",
    "hard": "destructive",
  };
  
  return diffMap[difficulty] || "secondary";
};

// Score Color CSS Class Mapping (for text color)
export const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};
