interface LogoProps {
  size?: number
  /** Unique suffix for the gradient id so multiple logos on one page don't collide. */
  idSuffix?: string
  className?: string
}

export default function Logo({ size = 24, idSuffix = 'default', className }: LogoProps) {
  const gradId = `logo-bg-${idSuffix}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="开发者工具箱"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="15" fill={`url(#${gradId})`} />
      <path
        d="M14 42 L26 24 L36 34 L50 18"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="42" r="4" fill="#ffffff" />
      <circle cx="36" cy="34" r="4" fill="#ffffff" />
      <circle cx="50" cy="18" r="4" fill="#ffffff" />
    </svg>
  )
}
