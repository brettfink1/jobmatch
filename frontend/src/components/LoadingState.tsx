"use client";

import { useEffect, useState } from "react";

const LOADING_STEPS = [
  { label: "Connecting to job boards", duration: 3000 },
  { label: "Searching LinkedIn", duration: 8000 },
  { label: "Searching Indeed", duration: 8000 },
  { label: "Searching Glassdoor", duration: 6000 },
  { label: "Collecting job listings", duration: 5000 },
  { label: "Analyzing with AI", duration: 10000 },
  { label: "Scoring matches", duration: 8000 },
  { label: "Ranking results", duration: 5000 },
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    const scheduleNext = () => {
      if (stepIndex >= LOADING_STEPS.length) return;
      const delay = LOADING_STEPS[stepIndex].duration;
      setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));
        stepIndex++;
        if (stepIndex < LOADING_STEPS.length) {
          setCurrentStep(stepIndex);
          scheduleNext();
        }
      }, delay);
    };
    scheduleNext();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(
    ((completedSteps.size / LOADING_STEPS.length) * 100),
    95
  );

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-2">
            <svg
              className="w-8 h-8 text-indigo-400 animate-spin-slow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Finding Your Best Matches</h2>
          <p className="text-slate-400 text-sm">
            This may take up to 60 seconds while we search across multiple job boards
          </p>
          <p className="text-slate-500 text-xs">
            {elapsedSeconds < 60
              ? `${elapsedSeconds}s elapsed`
              : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s elapsed`}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep && !isCompleted;
            const isPending = index > currentStep;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : isCompleted
                    ? "opacity-60"
                    : "opacity-30"
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5">
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-emerald-400"
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
                  ) : isCurrent ? (
                    <svg
                      className="w-5 h-5 text-indigo-400 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-slate-400 line-through"
                      : isCurrent
                      ? "text-indigo-300"
                      : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-xs text-indigo-400 animate-pulse">
                    In progress...
                  </span>
                )}
                {isCompleted && (
                  <span className="ml-auto text-xs text-emerald-500">Done</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 space-y-2 animate-pulse-slow"
              style={{ animationDelay: `${i * 300}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-700/80 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-700/50 rounded w-1/2" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-700/60 flex-shrink-0" />
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-slate-700/40 rounded w-full" />
                <div className="h-2 bg-slate-700/40 rounded w-5/6" />
                <div className="h-2 bg-slate-700/40 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
