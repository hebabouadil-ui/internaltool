export function LogoMC({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0D060" />
          <stop offset="45%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      {/* M */}
      <path
        d="M4 38V10l9 16 9-16v28"
        stroke="url(#gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* C */}
      <path
        d="M44 17a13 13 0 1 0 0 14"
        stroke="url(#gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
