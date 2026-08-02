import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from job_matcher import match_jobs
from job_scraper import scrape_jobs
from models import JobSearchRequest, ParsedResume, SearchResponse
from resume_parser import parse_resume

# Load .env before anything else
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JobSearcher API",
    description="AI-powered job search that matches your resume to the best opportunities.",
    version="1.0.0",
)

# Allow all origins for portfolio use — tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared thread pool for running sync work from async endpoints
_executor = ThreadPoolExecutor(max_workers=4)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Resume parsing
# ---------------------------------------------------------------------------

@app.post("/api/parse-resume", response_model=ParsedResume)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Accept a PDF or DOCX resume upload and return parsed text plus metadata.

    The metadata (skills, job_titles, education, experience_years, summary) is
    extracted by asking Claude to analyse the raw text, so ANTHROPIC_API_KEY
    must be set.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type and file.content_type not in allowed_types:
        lower_name = file.filename.lower()
        if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx")):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and DOCX files are supported.",
            )

    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {exc}")

    # Parse raw text (sync I/O — run in thread pool)
    loop = asyncio.get_event_loop()
    try:
        raw_text = await loop.run_in_executor(
            _executor, parse_resume, file_bytes, file.filename
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Resume parsing error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {exc}")

    # Ask Claude to extract structured metadata from the raw text
    try:
        parsed = await loop.run_in_executor(
            _executor, _extract_resume_metadata, raw_text
        )
    except Exception as exc:
        logger.warning("Metadata extraction failed, returning raw text only: %s", exc)
        # Graceful degradation — return minimal structure
        parsed = ParsedResume(
            raw_text=raw_text,
            skills=[],
            experience_years=0.0,
            job_titles=[],
            education=[],
            summary="",
        )

    return parsed


def _extract_resume_metadata(raw_text: str) -> ParsedResume:
    """
    Use Claude to extract structured metadata from raw resume text.
    Runs synchronously (called via thread pool from the async endpoint).
    """
    import json
    import re

    import anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set.")

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Extract structured information from the following resume text.

Return ONLY a JSON object with these fields:
- "skills": array of technical skills (programming languages, frameworks, tools, platforms)
- "experience_years": total years of professional experience as a float (0 if unknown)
- "job_titles": array of job titles the candidate has held or is targeting
- "education": array of education entries (e.g. "B.S. Computer Science, Stanford University")
- "summary": 2-3 sentence professional summary of the candidate

RESUME TEXT:
{raw_text[:4000]}

Respond ONLY with valid JSON, no other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = ""
    for block in response.content:
        if block.type == "text":
            response_text = block.text
            break

    # Strip markdown code fences if present
    text = response_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse metadata JSON: %s\nResponse: %s", exc, text[:300])
        raise ValueError(f"Claude returned invalid JSON for resume metadata: {exc}")

    return ParsedResume(
        raw_text=raw_text,
        skills=[str(s) for s in data.get("skills", [])],
        experience_years=float(data.get("experience_years", 0.0)),
        job_titles=[str(t) for t in data.get("job_titles", [])],
        education=[str(e) for e in data.get("education", [])],
        summary=str(data.get("summary", "")),
    )


# ---------------------------------------------------------------------------
# Job search + matching
# ---------------------------------------------------------------------------

@app.post("/api/search-jobs", response_model=SearchResponse)
async def search_jobs_endpoint(request: JobSearchRequest):
    """
    Search multiple job boards for the given criteria and score each result
    against the provided resume text using Claude AI.
    """
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text must not be empty.")

    search_term = request.job_title.strip() or "software engineer"
    loop = asyncio.get_event_loop()

    # Scrape jobs (sync pandas/HTTP work — run in thread pool)
    logger.info("Starting job scrape for %r in %r", search_term, request.location)
    try:
        jobs = await loop.run_in_executor(
            _executor,
            lambda: scrape_jobs(
                search_term=search_term,
                location=request.location,
                work_arrangements=request.work_arrangements,
                min_salary=request.min_salary,
                job_type=request.job_type,
                distance=request.distance,
                hours_old=request.hours_old,
                results_wanted=request.num_results,
            ),
        )
    except Exception as exc:
        logger.error("Job scraping failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Job scraping failed: {exc}")

    if not jobs:
        logger.warning("No jobs found for search term %r", search_term)
        return SearchResponse(
            jobs=[],
            total_found=0,
            search_params={
                "job_title": search_term,
                "location": request.location,
                "work_arrangements": request.work_arrangements,
                "min_salary": request.min_salary,
                "job_type": request.job_type,
                "distance": request.distance,
                "hours_old": request.hours_old,
                "num_results": request.num_results,
            },
        )

    logger.info("Scraped %d jobs, now matching against resume.", len(jobs))

    # Match jobs against resume (sync Claude calls — run in thread pool)
    try:
        matched_jobs = await loop.run_in_executor(
            _executor,
            lambda: match_jobs(request.resume_text, jobs),
        )
    except ValueError as exc:
        # Missing API key or other config error
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.error("Job matching failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Job matching failed: {exc}")

    return SearchResponse(
        jobs=matched_jobs,
        total_found=len(matched_jobs),
        search_params={
            "job_title": search_term,
            "location": request.location,
            "work_arrangements": request.work_arrangements,
            "min_salary": request.min_salary,
            "job_type": request.job_type,
            "distance": request.distance,
            "hours_old": request.hours_old,
            "num_results": request.num_results,
        },
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
