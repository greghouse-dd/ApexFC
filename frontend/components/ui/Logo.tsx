"use client";

import React from "react";

interface LogoProps {
  className?: string;
  glow?: boolean;
}

export default function Logo({ className = "w-6 h-6", glow = true }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${glow ? "shadow-glow" : ""}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Shield Outer Border */}
        <path 
          d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z" 
          stroke="url(#apex-logo-grad)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Geometrical bolt inside shield representing dynamic metrics */}
        <path 
          d="M12 6L7 11.5H11.5V18L17 12.5H12.5L12 6Z" 
          fill="url(#apex-logo-grad)"
          stroke="url(#apex-logo-grad)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="apex-logo-grad" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
