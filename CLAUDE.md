# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

JobSearcher: upload a resume (PDF/DOCX), scrape live job boards, and use the Claude API to score/rank each job against the resume. Two services: a FastAPI backend (`backend/`) and a Next.js 14 frontend (`frontend/`). No test suite or linter is currently configured in this repo.

## Commands

### Backend (FastAPI)
```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # or: conda create -n jobsearcher python=3.12
pip install -r requirements.txt
cp .env.example .env   # then set a real ANTHROPIC_API_KEY
python main.py                                      # runs on :8000 (uvicorn, host 0.0.0.0)
```
There is no test suite, linter, or formatter configured for the backend — don't invent `pytest`/`ruff` commands that aren't wired up.

**`cryptography` is pinned in `requirements.txt`.** `pdfplumber` → `pdfminer.six` depends on `cryptography>=36.0.0` with no upper bound. Unpinned, pip resolves to whatever is newest, which may ship no prebuilt wheel for this machine and fall back to compiling from source via Rust — which fails here because OpenSSL isn't discoverable for linking. Keep the explicit `cryptography==` pin in sync with a version known to have a wheel rather than removing it.

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev      # :3000, hot reload
npm run build
npm run start
```
No lint script is defined in `package.json`. Node is managed via `nvm` (`nvm use --lts`) — no `.nvmrc` is checked in.

**Config file must be `next.config.mjs`, not `.ts`.** The pinned Next.js version (14.2.5) doesn't support TypeScript config files (that landed in Next 15+); a `.ts` config throws at startup.

**`experimental.proxyTimeout` in `next.config.mjs` is set to 180000ms.** Next's rewrite proxy (used to forward `/api/*` to the FastAPI backend) hard-defaults to a 30s timeout (`node_modules/next/dist/server/lib/router-utils/proxy-request.js`), and job search (scraping + batched Claude scoring, up to 50 jobs) routinely exceeds that, which manifests as a "socket hang up"/ECONNRESET in the frontend logs even though the backend completed the request successfully. Don't remove this override without addressing the underlying request duration.

Both dev servers need to run simultaneously — the frontend proxies API calls to the backend (see Architecture).

## Architecture

**Request flow, resume upload:**
`ResumeUpload.tsx` → `POST /api/parse-resume` (multipart field name must be `file`) → Next.js rewrite (`next.config.mjs`) forwards to `http://localhost:8000/api/parse-resume` → `main.py` reads the file, calls `resume_parser.parse_resume()` (pdfplumber for PDF, python-docx for DOCX, sync work off-loaded to a shared `ThreadPoolExecutor`) to get raw text, then calls `main._extract_resume_metadata()` — a single Claude call that returns structured JSON (skills, experience_years, job_titles, education, summary). If metadata extraction fails, the endpoint degrades gracefully and returns the raw text with empty metadata rather than erroring.

**Request flow, job search:**
`SearchForm.tsx` → `POST /api/search-jobs` with the parsed resume's raw text + search params → same rewrite → `main.py`:
1. `job_scraper.scrape_jobs()` — uses `python-jobspy` to query LinkedIn/Indeed/Glassdoor/ZipRecruiter/Google concurrently; if the combined multi-site call fails/returns nothing, it retries site-by-site and merges results. `python-jobspy` only exposes a boolean `is_remote` filter with **no concept of "hybrid"** — so `work_arrangements` (remote/hybrid/onsite, any combination) is only passed to jobspy as `is_remote=True` when the selection is remote-only; otherwise the scrape is unfiltered and `_classify_arrangement()` buckets each result locally via keyword heuristics on title/location/description, then filters to the requested set.
2. `job_matcher.match_jobs()` — splits jobs into batches of `BATCH_SIZE=5`, fans them out across a `ThreadPoolExecutor` (max 3 concurrent), and asks Claude to score each job 0–100 against the resume with reasons + missing skills. On a batch failure or unparseable response, it fills in neutral fallback scores (50) rather than dropping jobs. Results are merged and sorted by `match_score` descending.

**Frontend structure (Next.js App Router):** single page (`src/app/page.tsx`) drives a linear wizard (`upload` → `search` → `loading` → `results`) via local `useState`, rendering one top-level component per step (`ResumeUpload`, `SearchForm`, `LoadingState`, `JobResults`). No routing between pages, no global state manager — everything lives in `page.tsx` state and is passed down as props/callbacks.

**Model version:** `claude-sonnet-4-6` is hardcoded in two places — `main.py:_extract_resume_metadata` and `job_matcher.py:_score_batch`. Keep both in sync if it changes.

**CORS is wide open (`allow_origins=["*"]`)** in `main.py` — intentional for this portfolio project, not an oversight.

**`ANTHROPIC_API_KEY`** is required for both resume metadata extraction and job matching; both call sites raise/handle a missing key explicitly rather than silently no-op-ing.
