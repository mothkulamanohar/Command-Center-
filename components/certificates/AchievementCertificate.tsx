"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Hourglass,
  Star,
  Globe,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export interface AchievementCertificateProps {
  recipientName?: string;
  trainingName?: string;
  attendancePercent?: string;
  presentDays?: number | string;
  lateArrivals?: number | string;
  halfDays?: number | string;
  avgInTime?: string;
  totalHours?: string;
  awardedDate?: string;
  certNumber?: string;
  certCode?: string;
  signatoryTitle?: string;
  signatorySubtitle?: string;
  tagline?: string;
  collegeName?: string;
  collegeUrl?: string;
  verifyUrl?: string;
  className?: string;
}

export function AchievementCertificate({
  recipientName = "Sri Ram",
  trainingName = "Attendance / Office Management Training",
  attendancePercent = "96.5%",
  presentDays = 20,
  lateArrivals = 2,
  halfDays = 1,
  avgInTime = "09:08",
  totalHours = "172.5h",
  awardedDate = "29 September 2026",
  certNumber = "ICC-ACH-2026-0001",
  certCode = "K7Q2M9XA4D",
  signatoryTitle = "System Administrator",
  signatorySubtitle = "Command Center",
  tagline = "Better Monitoring for a Smoother Tomorrow",
  collegeName = "St. Mary's Group of Institutions",
  collegeUrl = "https://smru.edu.in",
  verifyUrl,
  className = "",
}: AchievementCertificateProps) {
  const publicVerifyUrl = verifyUrl || `/verify/${certCode}`;
  const effectiveCollegeUrl = collegeUrl || "https://smru.edu.in";
  const displayCollegeHost = effectiveCollegeUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  return (
    <div
      className={`relative w-full bg-white text-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans ${className}`}
      style={{
        boxShadow:
          "0 15px 35px -10px rgba(30, 58, 138, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)",
      }}
    >
      {/* Decorative organic background waves */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 pointer-events-none opacity-40">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="360" cy="40" r="220" fill="url(#gradTopRight)" />
          <path
            d="M200 0 C280 80, 320 180, 400 200 L400 0 Z"
            fill="#DBEAFE"
            fillOpacity="0.4"
          />
          <defs>
            <radialGradient id="gradTopRight" cx="0.8" cy="0.2" r="0.8">
              <stop stopColor="#93C5FD" stopOpacity="0.3" />
              <stop offset="1" stopColor="#EFF6FF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 pointer-events-none opacity-40">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="360" r="200" fill="url(#gradBottomLeft)" />
          <path
            d="M0 200 C80 220, 160 300, 200 400 L0 400 Z"
            fill="#DBEAFE"
            fillOpacity="0.35"
          />
          <defs>
            <radialGradient id="gradBottomLeft" cx="0.2" cy="0.8" r="0.8">
              <stop stopColor="#93C5FD" stopOpacity="0.25" />
              <stop offset="1" stopColor="#EFF6FF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Left Hanging Ribbon Banner (compact) */}
      <div className="absolute top-0 left-3 sm:left-6 z-20 drop-shadow-sm pointer-events-none">
        <svg
          width="36"
          height="80"
          viewBox="0 0 48 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 sm:w-7 md:w-8 h-auto"
        >
          <path d="M0 0 H48 V96 L24 82 L0 96 V0 Z" fill="#1D4ED8" />
          <path d="M0 0 H3.5 V94.5 L0 96 V0 Z" fill="#1E40AF" opacity="0.4" />
          <g transform="translate(24, 42)">
            <path
              d="M-11 -13 H11 V-2 C11 7 0 14 0 14 C0 14 -11 7 -11 -2 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M0 -9 L2.1 -3.8 L7.4 -3.8 L3.2 -0.8 L4.8 4.3 L0 1.4 L-4.8 4.3 L-3.2 -0.8 L-7.4 -3.8 L-2.1 -3.8 Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>

      {/* Main Card Content (compact vertical rhythm) */}
      <div className="relative z-10 p-3.5 sm:p-5 md:p-6 lg:p-7">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          {/* Logo & Header Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 pl-7 sm:pl-9">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center tracking-wider shadow-xs shrink-0">
              ICC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base font-bold text-slate-900 tracking-tight">
                  Command Center
                </span>
                <span className="px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold tracking-wider rounded bg-blue-100 text-blue-700 font-mono">
                  DAMS
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">IT Command Center</p>
            </div>
          </div>

          {/* College Web Application Direct Link Chip */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={effectiveCollegeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/90 hover:bg-blue-100 text-blue-700 border border-blue-200/90 text-[10px] font-semibold transition-all group cursor-pointer shadow-2xs"
              title={`Open College Web Application (${effectiveCollegeUrl})`}
            >
              <Globe className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="hidden sm:inline text-slate-600 font-medium">College:</span>
              <span className="font-bold underline decoration-blue-300 group-hover:decoration-blue-600">
                {displayCollegeHost}
              </span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 shrink-0" />
            </a>

            {/* Right Top Tagline & Seal Rosette */}
            <div className="hidden md:block text-right pt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                Monitor • Manage • Resolve
              </span>
            </div>

            {/* Rosette Seal Badge (scaled to fit short card) */}
            <div className="relative -mt-1 sm:-mt-1.5 -mr-1 sm:-mr-2 shrink-0 pointer-events-none">
              <svg
                width="72"
                height="88"
                viewBox="0 0 110 135"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-14 sm:w-16 md:w-[72px] h-auto"
              >
                {/* Ribbon Tails */}
                <polygon points="32,70 18,128 35,116 48,128 42,70" fill="#1D4ED8" />
                <polygon points="68,70 62,128 75,116 92,128 78,70" fill="#1E40AF" />
                {/* Outer Scalloped Circular Rosette */}
                <g transform="translate(55,50)">
                  <circle r="46" fill="#2563EB" />
                  <circle r="43" fill="#1D4ED8" />
                  {/* Inner Dark Navy Disk with crisp border */}
                  <circle r="36" fill="#0B1E4A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <circle r="33" fill="none" stroke="#60A5FA" strokeWidth="0.8" strokeDasharray="2 2" />
                  {/* Top Star */}
                  <path
                    d="M 0 -22 L 2 -17 L 7 -17 L 3 -14 L 5 -9 L 0 -12 L -5 -9 L -3 -14 L -7 -17 L -2 -17 Z"
                    fill="#FFFFFF"
                  />
                  {/* Text */}
                  <text
                    x="0"
                    y="-3"
                    fontFamily="system-ui, sans-serif"
                    fontSize="7.5"
                    fontWeight="800"
                    fill="#FFFFFF"
                    textAnchor="middle"
                    letterSpacing="0.8"
                  >
                    CERTIFIED
                  </text>
                  <text
                    x="0"
                    y="7"
                    fontFamily="system-ui, sans-serif"
                    fontSize="7.5"
                    fontWeight="800"
                    fill="#FFFFFF"
                    textAnchor="middle"
                    letterSpacing="0.8"
                  >
                    USER
                  </text>
                  {/* 3 Stars */}
                  <text
                    x="0"
                    y="17"
                    fontFamily="system-ui, sans-serif"
                    fontSize="7"
                    fill="#93C5FD"
                    textAnchor="middle"
                    letterSpacing="2"
                  >
                    ★★★
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Certificate Title (compact) */}
        <div className="text-center pt-0.5 sm:pt-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B1E4A] tracking-tight leading-tight">
            Certificate
          </h1>
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#1E3A8A] mt-0.5">
            of Achievement
          </h2>

          {/* Star Ornament Divider */}
          <div className="flex items-center justify-center gap-2.5 my-1.5 sm:my-2">
            <div className="h-[1px] bg-blue-200 w-12 sm:w-20"></div>
            <div className="p-0.5 rounded-sm border border-blue-400 bg-white">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 fill-blue-500" />
            </div>
            <div className="h-[1px] bg-blue-200 w-12 sm:w-20"></div>
          </div>
        </div>

        {/* Presentation & Recipient Details */}
        <div className="text-center space-y-0.5 max-w-xl mx-auto">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
            This is to certify that
          </p>
          <div className="text-lg sm:text-2xl md:text-[26px] font-extrabold text-[#0B1E4A] tracking-tight py-0.5 break-words leading-snug">
            {recipientName}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-snug font-normal">
            has successfully completed the{" "}
            <span className="font-semibold text-slate-800">{trainingName}</span>
            <br className="hidden sm:inline" /> and demonstrated excellent performance in the Command Center system.
          </p>
        </div>

        {/* 6-Column Metrics Box (compact height) */}
        <div className="mt-2.5 sm:mt-3 mb-2 max-w-3xl mx-auto bg-slate-50/90 border border-slate-200/80 rounded-xl p-1.5 sm:p-2.5 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-0 sm:divide-x divide-slate-200 text-center">
            {/* Metric 1: Attendance */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Calendar className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Attendance</span>
              <span className="text-xs sm:text-sm font-black text-blue-600 mt-0.5">{attendancePercent}</span>
            </div>

            {/* Metric 2: Present Days */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Calendar className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Present Days</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{presentDays}</span>
            </div>

            {/* Metric 3: Late Arrivals */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Clock className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Late Arrivals</span>
              <span className="text-xs sm:text-sm font-black text-amber-500 mt-0.5">{lateArrivals}</span>
            </div>

            {/* Metric 4: Half Days */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Clock className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Half Days</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{halfDays}</span>
            </div>

            {/* Metric 5: Avg. In-Time */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Clock className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Avg. In-Time</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{avgInTime}</span>
            </div>

            {/* Metric 6: Total Hours */}
            <div className="p-1 sm:px-1.5 flex flex-col items-center bg-white/70 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200/50 sm:border-0">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-0.5">
                <Hourglass className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Total Hours</span>
              <span className="text-xs sm:text-sm font-black text-blue-600 mt-0.5">{totalHours}</span>
            </div>
          </div>
        </div>

        {/* Award Date & Direct Verification Link */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-semibold text-slate-500 mb-2">
          <span>
            Awarded on <strong className="text-slate-800 font-bold">{awardedDate}</strong>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <a
            href={publicVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded transition-colors group cursor-pointer"
            title={`Verify this credential on the college portal (${publicVerifyUrl})`}
          >
            <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Cert No: {certNumber}</span>
            <span className="text-slate-300">|</span>
            <span>Code: <strong className="font-bold">{certCode}</strong></span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
          </a>
        </div>

        {/* Footer Section */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-100">
          {/* Left Signatory */}
          <div className="text-left w-full sm:w-auto flex flex-col items-center sm:items-start">
            {/* Signature SVG */}
            <div className="h-7 flex items-center">
              <svg width="105" height="30" viewBox="0 0 140 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 32C25 15 35 12 40 28C43 36 30 38 25 35C20 32 28 10 50 15C72 20 60 40 80 25C95 15 110 22 130 20"
                  stroke="#0F172A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="border-b border-slate-300 w-28 sm:w-32 mb-0.5"></div>
            <div className="text-[11px] font-bold text-slate-900">{signatoryTitle}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500">{signatorySubtitle}</div>
          </div>

          {/* Center Motto */}
          <div className="flex items-center gap-2 text-center my-1 sm:my-0">
            <div className="h-px bg-slate-200 w-6 sm:w-10"></div>
            <div className="text-[9px] uppercase font-semibold text-slate-400 tracking-[0.16em]">
              {tagline}
            </div>
            <div className="h-px bg-slate-200 w-6 sm:w-10"></div>
          </div>

          {/* Right Bottom Logo & Clickable College Portal Link */}
          <a
            href={collegeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group hover:opacity-95 transition-all cursor-pointer p-1 -m-1 rounded-lg hover:bg-blue-50/50"
            title={`Visit College Web Application: ${collegeName} (${collegeUrl})`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-black text-[10px] sm:text-xs flex items-center justify-center tracking-wider shadow-sm shrink-0 group-hover:ring-2 ring-blue-300 transition-all">
              ICC
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1 leading-tight">
                <span>{collegeName}</span>
                <ExternalLink className="w-2.5 h-2.5 text-blue-600 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[9px] font-semibold text-blue-600 tracking-wider font-mono flex items-center gap-1">
                <span>{displayCollegeHost}</span>
                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.1 rounded font-bold uppercase">
                  College App
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
