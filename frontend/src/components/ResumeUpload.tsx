"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { ParsedResume } from "@/types";

interface ResumeUploadProps {
  onUploadComplete: (resume: ParsedResume) => void;
}

export default function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      const validExtensions = [".pdf", ".docx", ".doc"];
      const hasValidType = validTypes.includes(file.type);
      const hasValidExt = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidType && !hasValidExt) {
        setError("Please upload a PDF or DOCX file.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10 MB.");
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadedFile(file.name);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Server error: ${response.status}`);
        }

        const data: ParsedResume = await response.json();
        setParsedResume(data);
        onUploadComplete(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse resume. Please try again."
        );
        setUploadedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleReset = () => {
    setUploadedFile(null);
    setParsedResume(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (parsedResume) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-slide-up">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                  Resume Parsed Successfully
                </h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
                >
                  Change file
                </button>
              </div>
              <p className="mt-1 text-slate-200 font-medium truncate">{uploadedFile}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {parsedResume.experience_years > 0 && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-xs">Experience</span>
                    <p className="text-slate-100 font-semibold">
                      {parsedResume.experience_years} years
                    </p>
                  </div>
                )}
                {parsedResume.job_titles.length > 0 && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-xs">Latest Role</span>
                    <p className="text-slate-100 font-semibold truncate">
                      {parsedResume.job_titles[0]}
                    </p>
                  </div>
                )}
              </div>

              {parsedResume.skills.length > 0 && (
                <div className="mt-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Skills Detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedResume.skills.slice(0, 12).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedResume.skills.length > 12 && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-400 text-xs font-medium">
                        +{parsedResume.skills.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {parsedResume.summary && (
                <div className="mt-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {parsedResume.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
              : "border-slate-600 hover:border-indigo-500/60 hover:bg-slate-800/50"
          }
          ${isUploading ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-400 animate-spin"
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
              </div>
              <div>
                <p className="text-slate-200 font-semibold text-lg">Parsing your resume...</p>
                <p className="text-slate-400 text-sm mt-1">{uploadedFile}</p>
              </div>
            </>
          ) : (
            <>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isDragging ? "bg-indigo-500/30" : "bg-slate-700/60"
                }`}
              >
                <svg
                  className={`w-8 h-8 transition-colors ${
                    isDragging ? "text-indigo-400" : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-slate-200 font-semibold text-lg">
                  {isDragging ? "Drop it here!" : "Drop your resume here"}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  or{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 font-medium">
                    click to browse
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-slate-400 text-xs font-medium">
                  PDF
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-slate-400 text-xs font-medium">
                  DOCX
                </span>
                <span className="text-slate-600 text-xs">up to 10 MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
