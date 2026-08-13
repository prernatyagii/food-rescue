import React from "react";

// Rounded bowl + leaf/heart mark, used in the navbar (and can be exported
// as a standalone favicon/social-share asset later).
const Logo = ({ size = 36, showText = true, textClass = "" }) => (
  <div className="flex items-center gap-2">
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fr-bowl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      {/* bowl */}
      <path
        d="M6 22C6 22 6 34 24 34C42 34 42 22 42 22H6Z"
        fill="url(#fr-bowl)"
      />
      <rect x="4" y="19" width="40" height="4" rx="2" fill="url(#fr-bowl)" />
      {/* steam / leaf accent */}
      <path
        d="M24 6C24 6 19 10 24 14C29 10 24 6 24 6Z"
        fill="url(#fr-bowl)"
        opacity="0.85"
      />
      <path
        d="M17 8C17 8 14 11 17 14"
        stroke="url(#fr-bowl)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M31 8C31 8 34 11 31 14"
        stroke="url(#fr-bowl)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
    {showText && (
      <span className={`font-bold text-lg tracking-tight text-gray-900 ${textClass}`}>
        Food Rescue
      </span>
    )}
  </div>
);

export default Logo;
