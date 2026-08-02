"use client";

import { useState } from "react";
import { JobType, SearchConfig, WorkArrangement } from "@/types";

interface SearchFormProps {
  onSearch: (config: SearchConfig) => void;
  isLoading: boolean;
}

const ARRANGEMENT_OPTIONS: { value: WorkArrangement; label: string; desc: string }[] = [
  { value: "remote", label: "Remote", desc: "Fully remote" },
  { value: "hybrid", label: "Hybrid", desc: "Mix of remote & office" },
  { value: "onsite", label: "On-site", desc: "In-office" },
];

const JOB_TYPE_OPTIONS: { value: JobType | ""; label: string }[] = [
  { value: "", label: "Any" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const POSTED_WITHIN_OPTIONS: { value: number; label: string }[] = [
  { value: 24, label: "Past 24 hours" },
  { value: 72, label: "Past 3 days" },
  { value: 168, label: "Past 7 days" },
  { value: 720, label: "Past 30 days" },
];

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workArrangements, setWorkArrangements] = useState<WorkArrangement[]>([]);
  const [minSalary, setMinSalary] = useState("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [distance, setDistance] = useState(50);
  const [hoursOld, setHoursOld] = useState(72);
  const [numResults, setNumResults] = useState(20);

  const toggleArrangement = (value: WorkArrangement) => {
    setWorkArrangements((current) =>
      current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value]
    );
  };

  // Location doesn't matter if the only arrangement selected is fully remote
  const remoteOnly = workArrangements.length === 1 && workArrangements[0] === "remote";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      jobTitle,
      location,
      workArrangements,
      minSalary: minSalary.trim() ? Number(minSalary) : null,
      jobType: jobType || null,
      distance,
      hoursOld,
      numResults,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto animate-slide-up"
    >
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-slate-100 font-semibold text-lg">Configure Your Job Search</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="jobTitle" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Job Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full bg-slate-900/70 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
              </div>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                disabled={remoteOnly}
                className={`w-full bg-slate-900/70 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 ${
                  remoteOnly ? "opacity-40 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="jobType" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Job Type
            </label>
            <select
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType | "")}
              className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
            >
              {JOB_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="minSalary" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Minimum Salary
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                $
              </div>
              <input
                id="minSalary"
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="e.g. 90000"
                className="w-full bg-slate-900/70 border border-slate-600 rounded-xl pl-7 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-xl border border-slate-700 px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-200 text-sm font-medium">Work Arrangement</p>
              <p className="text-slate-500 text-xs">
                Select any combination — leave blank to include all
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARRANGEMENT_OPTIONS.map(({ value, label, desc }) => {
              const isSelected = workArrangements.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleArrangement(value)}
                  title={desc}
                  aria-pressed={isSelected}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300"
                      : "bg-slate-800/60 border-slate-600 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="distance" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Search Radius
              </label>
              <span className="text-xs font-semibold text-indigo-400">
                {distance} mi
              </span>
            </div>
            <input
              id="distance"
              type="range"
              min={5}
              max={100}
              step={5}
              value={distance}
              disabled={remoteOnly}
              onChange={(e) => setDistance(Number(e.target.value))}
              className={`w-full ${remoteOnly ? "opacity-40 cursor-not-allowed" : ""}`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hoursOld" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Posted Within
            </label>
            <select
              id="hoursOld"
              value={hoursOld}
              onChange={(e) => setHoursOld(Number(e.target.value))}
              className="w-full bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
            >
              {POSTED_WITHIN_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Number of Results
            </label>
            <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-0.5">
              {numResults} jobs
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={numResults}
            onChange={(e) => setNumResults(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-600">
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all ${
            isLoading
              ? "bg-slate-600 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Searching...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Find Matching Jobs
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
