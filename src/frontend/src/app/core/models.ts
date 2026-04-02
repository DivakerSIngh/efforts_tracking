export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  user_id: number;
  full_name: string;
}

export interface CurrentUser {
  uid?: string;  // Firebase UID (optional for backward compatibility)
  user_id: number;  // SQL user ID from Firestore
  email: string;
  role: string;
  full_name: string;
}

// ─── Projects ───────────────────────────────────────────────────────────────
export interface Project {
  project_id: number;
  name: string;
  client_name?: string;
  description?: string;
  is_active: boolean;
  created_date?: string;
  candidate_count?: number;
}

export interface ProjectCreate {
  name: string;
  client_name?: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  client_name?: string;
  description?: string;
  is_active?: boolean;
}

// ─── Candidates ──────────────────────────────────────────────────────────────
export interface Candidate {
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  hourly_rate: number;
  fixed_amount: number;
  account_no?: string;
  ifsc_code?: string;
  is_active: boolean;
  created_date?: string;
}

export interface CandidateCreate {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  hourly_rate?: number;
  fixed_amount?: number;
  account_no?: string;
  ifsc_code?: string;
}

export interface CandidateUpdate {
  phone?: string;
  hourly_rate?: number;
  fixed_amount?: number;
  account_no?: string;
  ifsc_code?: string;
}

// ─── Timesheet ───────────────────────────────────────────────────────────────
export interface TimesheetEntry {
  entry_id: number;
  project_id: number;
  project_name: string;
  entry_date: string;    // YYYY-MM-DD
  hours: number;
  remarks?: string;
}

export interface TimesheetEntryCreate {
  project_id: number;
  entry_date: string;
  hours: number;
  remarks?: string;
}

export interface TimesheetEntryUpdate {
  hours?: number | null;
  remarks?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface ProjectBreakdown {
  project_id: number;
  project_name: string;
  hours: number;
}

export interface DashboardSummary {
  candidate_id: number;
  full_name: string;
  month: number;
  year: number;
  total_hours: number;
  hourly_rate: number;
  fixed_amount: number;
  total_payment: number;
  project_breakdown: ProjectBreakdown[];
}

export interface MonthlyTrend {
  year: number;
  month: number;
  total_hours: number;
}

// ─── Admin Reports ───────────────────────────────────────────────────────────
export interface CandidateReportRow {
  candidate_id: number;
  candidate_name: string;
  email: string;
  project_id: number;
  project_name: string;
  project_hours: number;
  total_hours: number;
  hourly_rate: number;
  fixed_amount: number;
  total_amount: number;
}

