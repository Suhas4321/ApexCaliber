import React from 'react';
import { useLocation } from 'react-router-dom';

interface ApexCaliberLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'lockup' | 'icon-only';
}

// Realm-specific chromatic accents for dynamic logo adaptation
const CITADEL_THEMES: Record<
  string,
  {
    glow: string;
    border: string;
    textGradientLight: string;
    textGradientDark: string;
  }
> = {
  dsa: {
    // Citadel I: Emerald / Verdigris
    glow: 'from-emerald-600/40 via-teal-500/30 to-amber-400/25',
    border: 'border-emerald-500/40 dark:border-emerald-400/30',
    textGradientLight: 'from-emerald-700 via-teal-700 to-amber-700',
    textGradientDark: 'from-emerald-300 via-teal-200 to-amber-200',
  },
  python_data: {
    // Citadel II: Solar Amber / Python Gold
    glow: 'from-amber-600/40 via-yellow-500/30 to-orange-400/25',
    border: 'border-amber-500/40 dark:border-amber-400/30',
    textGradientLight: 'from-amber-700 via-yellow-700 to-orange-700',
    textGradientDark: 'from-amber-300 via-yellow-200 to-orange-200',
  },
  sql_dbms: {
    // Citadel III: Cyan / Deep Ocean
    glow: 'from-cyan-600/40 via-sky-500/30 to-teal-400/25',
    border: 'border-cyan-500/40 dark:border-cyan-400/30',
    textGradientLight: 'from-cyan-700 via-sky-700 to-teal-700',
    textGradientDark: 'from-cyan-300 via-sky-200 to-teal-200',
  },
  os_concurrency: {
    // Citadel IV: Orange / Concurrency Flare
    glow: 'from-orange-600/40 via-amber-500/30 to-red-400/25',
    border: 'border-orange-500/40 dark:border-orange-400/30',
    textGradientLight: 'from-orange-700 via-amber-700 to-red-700',
    textGradientDark: 'from-orange-300 via-amber-200 to-red-200',
  },
  backend_apis: {
    // Citadel V: Crimson / API Oxide
    glow: 'from-rose-600/40 via-pink-500/30 to-amber-400/25',
    border: 'border-rose-500/40 dark:border-rose-400/30',
    textGradientLight: 'from-rose-700 via-pink-700 to-amber-700',
    textGradientDark: 'from-rose-300 via-pink-200 to-amber-200',
  },
  ai_resume: {
    // Citadel VI: Sky & Plasma Violet
    glow: 'from-sky-600/40 via-indigo-500/30 to-purple-400/25',
    border: 'border-sky-500/40 dark:border-indigo-400/30',
    textGradientLight: 'from-sky-700 via-indigo-700 to-purple-700',
    textGradientDark: 'from-sky-300 via-indigo-200 to-purple-200',
  },
  system_design: {
    // Citadel VII: Architecture Violet
    glow: 'from-violet-600/40 via-purple-500/30 to-indigo-400/25',
    border: 'border-violet-500/40 dark:border-violet-400/30',
    textGradientLight: 'from-violet-700 via-purple-700 to-indigo-700',
    textGradientDark: 'from-violet-300 via-purple-200 to-indigo-200',
  },
};

export const ApexCaliberLogo: React.FC<ApexCaliberLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const { pathname } = useLocation();

  // Detect active realm from URL
  let realm = 'dsa';
  if (pathname.startsWith('/system-design')) {
    realm = 'system_design';
  } else {
    const match = /^\/citadel\/([^/]+)/.exec(pathname);
    if (match && CITADEL_THEMES[match[1]]) {
      realm = match[1];
    }
  }

  const theme = CITADEL_THEMES[realm] || CITADEL_THEMES.dsa;

  // Dimension maps
  const dimensions = {
    sm: {
      img: 'h-7 w-7',
      text: 'text-base',
      gap: 'gap-2',
      badge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      img: 'h-8 w-8',
      text: 'text-lg',
      gap: 'gap-2.5',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      img: 'h-11 w-11',
      text: 'text-2xl',
      gap: 'gap-3.5',
      badge: 'text-xs px-2 py-0.5',
    },
  }[size];

  return (
    <div className={`flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* Emblem: Neural Nodes + Golden Apex Peak */}
      <div className="relative flex shrink-0 items-center justify-center">
        {/* Ambient backlight glow dynamically reactive to current Citadel realm */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-t ${theme.glow} blur-sm pointer-events-none opacity-80 dark:opacity-100 transition-all duration-700`}
          aria-hidden="true"
        />
        <div
          className={`relative overflow-hidden rounded-lg bg-[#0B0814] p-0.5 border ${theme.border} shadow-sm transition-all duration-500 hover:scale-105`}
        >
          <img
            src="/apex-emblem.png"
            alt="ApexCaliber Emblem"
            className={`${dimensions.img} relative object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]`}
          />
        </div>
      </div>

      {/* Precision typography: APEX (constant) + CALIBER (reactive realm gradient) */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none">
          <span className={`font-sans font-black text-chalk ${dimensions.text} tracking-wider`}>
            APEX
          </span>
          <span
            className={`font-sans font-black ${dimensions.text} tracking-wider bg-gradient-to-r ${theme.textGradientLight} dark:${theme.textGradientDark} bg-clip-text text-transparent ml-1 transition-all duration-700`}
          >
            CALIBER
          </span>
        </div>
      )}
    </div>
  );
};

export default ApexCaliberLogo;
