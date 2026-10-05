import React from "react";
import { useSchool } from "../context/SchoolContext";

interface MaagalimLogoProps {
  className?: string;
  variant?: "full" | "compact" | "icon" | "banner";
  theme?: "light" | "dark";
  customLogoUrl?: string;
}

export const MaagalimLogo: React.FC<MaagalimLogoProps> = ({
  className = "",
  variant = "full",
  theme = "light",
  customLogoUrl,
}) => {
  const schoolContext = useSchool();
  const effectiveLogoUrl =
    customLogoUrl ||
    schoolContext?.currentSchool?.logoUrl ||
    schoolContext?.customGlobalLogoUrl;
  const [imgError, setImgError] = React.useState(false);

  // Always reset imgError whenever the target logo URL changes
  React.useEffect(() => {
    setImgError(false);
  }, [effectiveLogoUrl]);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* If custom image logo is provided and loaded without error */}
      {effectiveLogoUrl && !imgError ? (
        <img
          src={effectiveLogoUrl}
          alt="לוגו מעגלים חבל מודיעין"
          onError={() => setImgError(true)}
          className="h-10 sm:h-12 w-auto max-w-[140px] sm:max-w-[180px] object-contain rounded-lg drop-shadow-xs"
        />
      ) : (
        /* Official Maagalim Brand Emblem (3 Cyclic Overlapping Organic Petals) */
        <svg
          viewBox="0 0 160 140"
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Petal - Cyan/Teal */}
            <linearGradient
              id="maagalimCyan"
              x1="20%"
              y1="0%"
              x2="80%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0096c7" />
            </linearGradient>
            {/* Bottom Left Petal - Magenta/Pink */}
            <linearGradient
              id="maagalimPink"
              x1="0%"
              y1="20%"
              x2="100%"
              y2="80%"
            >
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            {/* Bottom Right Petal - Warm Yellow/Amber */}
            <linearGradient
              id="maagalimYellow"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* 3 Interlocking Curved Organic Shapes of Maagalim */}
          {/* Top Arc (Cyan) */}
          <path
            d="M 80 18 C 115 18, 140 45, 138 78 C 130 60, 105 45, 80 48 C 58 50, 42 62, 32 75 C 38 42, 58 18, 80 18 Z"
            fill="url(#maagalimCyan)"
            opacity="0.95"
          />

          {/* Left/Bottom Arc (Magenta) */}
          <path
            d="M 32 75 C 18 100, 35 130, 68 132 C 60 115, 65 90, 85 75 C 102 62, 120 65, 134 68 C 112 90, 85 125, 55 128 C 30 120, 20 95, 32 75 Z"
            fill="url(#maagalimPink)"
            opacity="0.95"
          />

          {/* Right/Bottom Arc (Amber/Yellow) */}
          <path
            d="M 134 68 C 148 95, 128 130, 95 134 C 105 118, 105 92, 85 75 C 70 62, 50 62, 38 68 C 60 48, 92 38, 118 50 C 130 58, 135 60, 134 68 Z"
            fill="url(#maagalimYellow)"
            opacity="0.95"
          />

          {/* Central Dynamic Convergence */}
          <circle cx="80" cy="72" r="14" fill="#ffffff" fillOpacity="0.85" />
          <path
            d="M 74 66 Q 80 60 86 66 Q 90 74 80 80 Q 70 74 74 66 Z"
            fill="#1e293b"
            opacity="0.9"
          />
        </svg>
      )}

      {/* Typography: "מעגלים - עשייה סובבת חבל" */}
      {variant !== "icon" && !effectiveLogoUrl && (
        <div className="flex flex-col text-right justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`text-lg sm:text-xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-950"} font-sans`}
            >
              מעגלים
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 border border-amber-500/25">
              חוגי שישי
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-[11px] font-bold ${theme === "dark" ? "text-teal-400" : "text-teal-700"} tracking-tight`}
            >
              עשייה סובבת חבל
            </span>
            <span className="text-[10px] text-slate-400">•</span>
            <span
              className={`text-[10px] font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
            >
              חבל מודיעין
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
