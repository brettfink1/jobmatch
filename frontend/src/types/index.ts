export interface ParsedResume {
  raw_text: string;
  skills: string[];
  experience_years: number;
  job_titles: string[];
  education: string[];
  summary: string;
}

export type WorkArrangement = "remote" | "hybrid" | "onsite";

export type JobType = "fulltime" | "parttime" | "contract" | "internship";

export interface JobSearchRequest {
  resume_text: string;
  job_title?: string;
  location?: string;
  work_arrangements?: WorkArrangement[];
  min_salary?: number;
  job_type?: JobType;
  distance?: number;
  num_results?: number;
  hours_old?: number;
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  work_arrangement: WorkArrangement;
  date_posted?: string;
  salary_min?: number;
  salary_max?: number;
  match_score: number;
  match_reasons: string[];
  missing_skills: string[];
}

export interface SearchResponse {
  jobs: JobMatch[];
  total_found: number;
  search_params: Record<string, unknown>;
}

export interface SearchConfig {
  jobTitle: string;
  location: string;
  workArrangements: WorkArrangement[];
  minSalary: number | null;
  jobType: JobType | null;
  distance: number;
  hoursOld: number;
  numResults: number;
}

export type AppStep = "upload" | "search" | "loading" | "results";
