'use client';

interface EchoLogoProps {
  size?: number;
  className?: string;
}

export function EchoLogo({ size = 36, className = '' }: EchoLogoProps) {
  return (
    <svg
      className={`block drop-shadow-md ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="echoCore" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#b88bff" />
          <stop offset="55%" stopColor="#9b5cff" />
          <stop offset="100%" stopColor="#ff5fb8" />
        </radialGradient>
        <linearGradient id="echoRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <filter id="echoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"
          />
        </filter>
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#echoRing)" strokeWidth="2.2" opacity="0.45" filter="url(#echoGlow)" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="url(#echoRing)" strokeWidth="2.4" opacity="0.65" filter="url(#echoGlow)" />
      <circle cx="60" cy="60" r="22" fill="url(#echoCore)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize="26"
        fontFamily="'Manrope', 'Segoe UI', sans-serif"
        fontWeight="600"
        fill="#ffffff"
      >
        E.
      </text>
    </svg>
  );
}
