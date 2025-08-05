export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Company {
    id: number;
    name: string;
    website?: string;
    industry?: string;
    location?: string;
    description?: string;
    notes?: string;
    _count?: {
      applications: number;
    };
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Application {
    id: number;
    positionTitle: string;
    status: 'applied' | 'reviewing' | 'interview_scheduled' | 'interviewed' | 'offer' | 'rejected' | 'withdrawn';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    applicationDate?: string;
    jobDescription?: string;
    requirements?: string;
    location?: string;
    salaryRange?: string;
    applicationUrl?: string;
    referralSource?: string;
    notes?: string;
    company: Company;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface DashboardStats {
    overview: {
      totalApplications: number;
      totalCompanies: number;
      responseRate: number;
      interviewRate: number;
    };
    statusBreakdown: {
      applied: number;
      interview: number;
      offer: number;
      rejected: number;
    };
    recentApplications: Application[];
    monthlyTrends: any[];
  }