# JobMatch

Upload your resume, and let Claude AI score and rank live job listings against it. JobMatch scrapes multiple job boards in real time, then uses the Claude API to evaluate each listing's fit for your background — skills, experience level, and more — with a match score and explanation for every result.

## Features

- **Resume parsing** — upload a PDF or DOCX; Claude extracts skills, experience, job titles, and a summary
- **Live job scraping** — pulls from LinkedIn, Indeed, Glassdoor, ZipRecruiter, and Google Jobs concurrently
- **AI match scoring** — every job gets a 0–100 fit score with specific reasons and missing-skill callouts
- **Filters** — job title, location, work arrangement (remote/hybrid/onsite, any combination), minimum salary, job type, search radius, and posting recency

## Tech Stack

- **Backend:** FastAPI (Python), [`python-jobspy`](https://github.com/speedyapply/JobSpy) for scraping, `pdfplumber`/`python-docx` for resume parsing, Anthropic SDK for AI matching
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18.17+ (managed via [nvm](https://github.com/nvm-sh/nvm) recommended)
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your real ANTHROPIC_API_KEY
python main.py          # runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # runs on http://localhost:3000
```

Run both at the same time — the frontend proxies `/api/*` requests to the backend.

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Required for resume parsing and job matching |

## Notes

- CORS on the backend is intentionally open (`allow_origins=["*"]`) for local/portfolio use.
- `python-jobspy` has no native concept of "hybrid" work arrangements, so hybrid/onsite classification is done locally via keyword matching on each listing.
