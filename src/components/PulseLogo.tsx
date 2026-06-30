import React from "react";

interface PulseLogoProps {
  className?: string;
  iconClassName?: string;
  isNight?: boolean;
}

export default function PulseLogo({ className = "w-16 h-16 rounded-2xl", iconClassName = "", isNight = true }: PulseLogoProps) {
  return (
    <div className={`flex items-center justify-center shadow-lg transition-all duration-300 ${className} ${
      isNight 
        ? "bg-purple-950/40 border border-purple-900/40 text-[#E0A343]" 
        : "bg-[#E0A343]/10 border border-[#E0A343]/30 text-[#E0A343]"
    }`}>
      <svg 
        className={`w-3/5 h-3/5 stroke-current fill-none ${iconClassName}`} 
        viewBox="0 0 100 100" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M 15 50 L 35 50 L 42 25 L 50 75 L 58 15 L 66 60 L 72 50 L 85 50" />
      </svg>
    </div>
  );
}
