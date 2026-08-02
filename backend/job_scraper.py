import logging
import uuid
from typing import List, Optional

logger = logging.getLogger(__name__)

# Sites to scrape — if a site blocks or errors, we skip it gracefully
SCRAPE_SITES = ["linkedin", "indeed", "glassdoor", "zip_recruiter", "google"]


def _safe_str(value) -> str:
    """Convert a value to string, returning empty string for None/NaN."""
    if value is None:
        return ""
    try:
        import math
        if isinstance(value, float) and math.isnan(value):
            return ""
    except Exception:
        pass
    return str(value).strip()


def _safe_float(value) -> Optional[float]:
    """Convert a value to float, returning None on failure."""
    if value is None:
        return None
    try:
        import math
        fval = float(value)
        if math.isnan(fval):
            return None
        return fval
    except (ValueError, TypeError):
        return None


VALID_ARRANGEMENTS = {"remote", "hybrid", "onsite"}


def _classify_arrangement(title: str, location: str, description: str, is_remote) -> str:
    """
    Bucket a job into remote/hybrid/onsite. jobspy only exposes a boolean
    is_remote flag with no concept of hybrid, so we fall back to keyword
    matching against the title/location/description for that distinction.
    """
    text = f"{title} {location} {description}".lower()
    if "hybrid" in text:
        return "hybrid"
    if is_remote or "remote" in text:
        return "remote"
    return "onsite"


def _row_to_dict(row) -> dict:
    """Convert a DataFrame row (pandas Series) to a normalized job dict."""
    job_id = _safe_str(row.get("id")) or str(uuid.uuid4())
    title = _safe_str(row.get("title"))
    company = _safe_str(row.get("company"))
    location = _safe_str(row.get("location"))
    description = _safe_str(row.get("description"))
    url = _safe_str(row.get("job_url"))
    source = _safe_str(row.get("site"))
    date_posted = _safe_str(row.get("date_posted")) or None

    # Salary fields — jobspy uses min_amount / max_amount
    salary_min = _safe_float(row.get("min_amount"))
    salary_max = _safe_float(row.get("max_amount"))

    arrangement = _classify_arrangement(
        title, location, description, bool(row.get("is_remote"))
    )

    return {
        "id": job_id,
        "title": title,
        "company": company,
        "location": location,
        "description": description,
        "url": url,
        "source": source,
        "date_posted": date_posted,
        "min_amount": salary_min,
        "max_amount": salary_max,
        "arrangement": arrangement,
    }


def _meets_salary_min(min_amount, max_amount, min_salary) -> bool:
    """
    A job passes the salary filter if its listed range reaches min_salary,
    using whichever bound is available. Jobs with no salary data at all are
    included rather than excluded — most scraped listings omit salary, and
    hiding them would drop a lot of otherwise-good matches.
    """
    if min_salary is None:
        return True
    if min_amount is None and max_amount is None:
        return True
    effective = max_amount if max_amount is not None else min_amount
    return effective >= min_salary


def scrape_jobs(
    search_term: str,
    location: str = "United States",
    work_arrangements: Optional[List[str]] = None,
    min_salary: Optional[float] = None,
    job_type: Optional[str] = None,
    distance: int = 50,
    hours_old: int = 72,
    results_wanted: int = 30,
) -> List[dict]:
    """
    Scrape jobs from multiple job boards using python-jobspy.

    Args:
        search_term: Job title or keywords to search for.
        location: Location string (city, state, or "United States").
        work_arrangements: Subset of {"remote", "hybrid", "onsite"} to filter
            for. Empty/None means any arrangement is accepted.
        min_salary: Minimum annual salary to filter for. Jobs with no salary
            listed are still included (see _meets_salary_min).
        job_type: One of jobspy's job type strings (e.g. "fulltime",
            "parttime", "contract", "internship"), or None for any.
        distance: Search radius in miles around `location`.
        hours_old: Only return jobs posted within this many hours.
        results_wanted: Approximate number of results to fetch.

    Returns:
        List of normalized job dicts with consistent fields.
    """
    from jobspy import scrape_jobs as jobspy_scrape

    arrangements = {a for a in (work_arrangements or []) if a in VALID_ARRANGEMENTS}
    # jobspy's is_remote query param only makes sense to narrow the search
    # when the user wants remote-only results — otherwise we need the full
    # (unfiltered) result set so hybrid/onsite jobs aren't excluded upstream,
    # and we filter locally afterwards using _classify_arrangement.
    remote_only = arrangements == {"remote"}

    logger.info(
        "Scraping jobs: term=%r, location=%r, work_arrangements=%s, min_salary=%s, "
        "job_type=%s, distance=%d, hours_old=%d, results_wanted=%d",
        search_term,
        location,
        sorted(arrangements) or "any",
        min_salary,
        job_type,
        distance,
        hours_old,
        results_wanted,
    )

    jobs_df = None
    last_error = None

    # Try all sites together first; fall back to site-by-site if it fails
    try:
        jobs_df = jobspy_scrape(
            site_name=SCRAPE_SITES,
            search_term=search_term,
            location=location,
            is_remote=remote_only,
            job_type=job_type,
            distance=distance,
            hours_old=hours_old,
            results_wanted=results_wanted,
            country_indeed="USA",
            enforce_annual_salary=True,
        )
        logger.info("Scraped %d jobs total from all sites", len(jobs_df) if jobs_df is not None else 0)
    except Exception as exc:
        logger.warning("Bulk scrape failed (%s), retrying site-by-site.", exc)
        last_error = exc
        jobs_df = None

    # If bulk failed, attempt each site individually and combine
    if jobs_df is None or (hasattr(jobs_df, "__len__") and len(jobs_df) == 0):
        import pandas as pd

        frames = []
        for site in SCRAPE_SITES:
            try:
                df = jobspy_scrape(
                    site_name=[site],
                    search_term=search_term,
                    location=location,
                    is_remote=remote_only,
                    job_type=job_type,
                    distance=distance,
                    hours_old=hours_old,
                    results_wanted=max(results_wanted // len(SCRAPE_SITES), 5),
                    country_indeed="USA",
                    enforce_annual_salary=True,
                )
                if df is not None and len(df) > 0:
                    frames.append(df)
                    logger.info("Site %s returned %d jobs", site, len(df))
            except Exception as site_exc:
                logger.warning("Site %s failed: %s", site, site_exc)
                continue

        if frames:
            jobs_df = pd.concat(frames, ignore_index=True)
            logger.info("Combined %d jobs from individual site scrapes", len(jobs_df))
        else:
            logger.error("All sites failed. Last error: %s", last_error)
            return []

    if jobs_df is None or len(jobs_df) == 0:
        return []

    results = []
    for _, row in jobs_df.iterrows():
        try:
            job_dict = _row_to_dict(row)
            # Skip jobs without a title or URL — they're not useful
            if not job_dict["title"] or not job_dict["url"]:
                continue
            if arrangements and job_dict["arrangement"] not in arrangements:
                continue
            if not _meets_salary_min(
                job_dict["min_amount"], job_dict["max_amount"], min_salary
            ):
                continue
            results.append(job_dict)
        except Exception as exc:
            logger.warning("Failed to convert row to dict: %s", exc)
            continue

    logger.info("Returning %d valid jobs after filtering", len(results))
    return results
