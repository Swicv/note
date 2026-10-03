import React from 'react';

interface CosmoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  className?: string;
}

export const CosmoLogo: React.FC<CosmoLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 24, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 32, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', sub: 'text-xs' },
    hero: { icon: 72, text: 'text-4xl', sub: 'text-sm' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Celestial Orbit Icon */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 hover:rotate-12"
        >
          <defs>
            <linearGradient id="cosmo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="cosmo-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Orbit Rings */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            stroke="url(#cosmo-grad)"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            transform="rotate(-30 50 50)"
            opacity="0.6"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            stroke="url(#cosmo-grad)"
            strokeWidth="2.5"
            transform="rotate(35 50 50)"
            opacity="0.85"
          />

          {/* Central Pulsar Star */}
          <circle cx="50" cy="50" r="11" fill="url(#cosmo-grad)" filter="url(#cosmo-glow)" />
          <circle cx="50" cy="50" r="4.5" fill="#ffffff" />

          {/* Orbiting Stardust Particles */}
          <circle cx="16" cy="38" r="3" fill="#00f2fe" filter="url(#cosmo-glow)" />
          <circle cx="84" cy="62" r="3.5" fill="#ec4899" filter="url(#cosmo-glow)" />
          <circle cx="70" cy="26" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${text}`}>
              Cosmo
            </span>
            <span className={`font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 uppercase ${sub}`}>
              Note
            </span>
          </div>
          <span className="text-[10px] tracking-widest text-slate-400 dark:text-zinc-500 font-mono -mt-1 uppercase">
            Personal Nexus
          </span>
        </div>
      )}
    </div>
  );
};
