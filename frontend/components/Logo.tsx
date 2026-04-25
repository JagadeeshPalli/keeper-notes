export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Note body */}
      <rect x="3" y="5" width="22" height="26" rx="4" fill="url(#logoGrad)" />
      {/* Folded corner */}
      <path d="M21 5 L25 5 L25 9 Z" fill="rgba(255,255,255,0.15)" />
      <path d="M21 5 L25 9 L21 9 Z" fill="rgba(0,0,0,0.2)" />
      {/* Text lines */}
      <rect x="8" y="13" width="12" height="2" rx="1" fill="white" fillOpacity="0.85" />
      <rect x="8" y="18" width="9"  height="2" rx="1" fill="white" fillOpacity="0.60" />
      <rect x="8" y="23" width="11" height="2" rx="1" fill="white" fillOpacity="0.40" />
      {/* Pen accent */}
      <rect x="22" y="18" width="7" height="3" rx="1.5" fill="#a78bfa" transform="rotate(-45 22 18)" />
      <polygon points="24,26 26,24 27,27" fill="#c4b5fd" />
    </svg>
  )
}
