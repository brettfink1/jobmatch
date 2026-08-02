"use client";

import { useState } from "react";
import { JobMatch } from "@/types";

interface JobCardProps {
  job: JobMatch;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? { stroke: "#34d399", text: "text-emerald-400", bg: "bg-emerald-400/10" }
      : score >= 60
      ? { stroke: "#fbbf24", text: "text-amber-400", bg: "bg-amber-400/10" }
      : { stroke: "#f87171", text: "text-red-400", bg: "bg-red-400/10" };

  return (
    <div
      className={`relative flex-shrink-0 w-16 h-16 rounded-full ${color.bg} flex items-center justify-center`}
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-700"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <span className={`text-sm font-bold leading-none ${color.text}`}>{score}</span>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const normalized = source.toLowerCase();
  let style = "bg-slate-700/60 text-slate-400 border-slate-600";

  if (normalized.includes("linkedin")) {
    style = "bg-blue-500/10 text-blue-400 border-blue-500/30";
  } else if (normalized.includes("indeed")) {
    style = "bg-violet-500/10 text-violet-400 border-violet-500/30";
  } else if (normalized.includes("glassdoor")) {
    style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (normalized.includes("ziprecruiter")) {
    style = "bg-orange-500/10 text-orange-400 border-orange-500/30";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${style}`}>
      {source}
    </span>
  );
}

export default function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const descriptionPreview =
    job.description.length > 150 && !expanded
      ? job.description.slice(0, 150).trimEnd() + "..."
      : job.description;

  const hasSalary = job.salary_min != null || job.salary_max != null;

  const formatSalary = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="group rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 overflow-hidden animate-slide-up">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <ScoreGauge score={job.match_score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-slate-100 font-semibold text-base leading-tight group-hover:text-indigo-300 transition-colors">
                  {job.title}
                </h3>
                <p className="text-slate-300 text-sm mt-0.5 font-medium">{job.company}</p>
              </div>
              <SourceBadge source={job.source} />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {job.location}
              </div>

              {hasSalary && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {job.salary_min && job.salary_max
                    ? `${formatSalary(job.salary_min)} – ${formatSalary(job.salary_max)}`
                    : job.salary_min
                    ? `From ${formatSalary(job.salary_min)}`
                    : `Up to ${formatSalary(job.salary_max!)}`}
                </div>
              )}

              {job.date_posted && (
                <span className="text-slate-500 text-xs">{job.date_posted}</span>
              )}
            </div>
          </div>
        </div>

        {job.description && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm leading-relaxed">{descriptionPreview}</p>
            {job.description.length > 150 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium mt-1"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {job.match_reasons.length > 0 && (
          <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Why you&apos;re a match
            </p>
            {job.match_reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate-300 text-xs leading-snug">{reason}</span>
              </div>
            ))}
          </div>
        )}

        {job.missing_skills.length > 0 && (
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Skills to develop
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.missing_skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-slate-700/60 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Match score:{" "}
          <span
            className={`font-semibold ${
              job.match_score >= 80
                ? "text-emerald-400"
                : job.match_score >= 60
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {job.match_score}/100
          </span>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 text-xs font-semibold transition-all"
        >
          View Job
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
