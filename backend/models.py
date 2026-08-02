from pydantic import BaseModel, Field
from typing import List, Optional


class ParsedResume(BaseModel):
    raw_text: str
    skills: List[str]
    experience_years: float
    job_titles: List[str]
    education: List[str]
    summary: str  # AI-extracted summary


class JobSearchRequest(BaseModel):
    resume_text: str
    job_title: str = ""
    location: str = "United States"
    work_arrangements: List[str] = Field(default_factory=list)
    min_salary: Optional[float] = None
    job_type: Optional[str] = None
    distance: int = 50
    num_results: int = 30
    hours_old: int = 72


class JobMatch(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str
    source: str
    date_posted: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    match_score: float = Field(ge=0, le=100)
    match_reasons: List[str]
    missing_skills: List[str]


class SearchResponse(BaseModel):
    jobs: List[JobMatch]
    total_found: int
    search_params: dict
