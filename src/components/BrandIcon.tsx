export const BrandIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="14" fill="#E8743A" />
    <path
      d="M32 16 C23.2 16 16 23.2 16 32 C16 40.8 23.2 48 32 48 C38.4 48 43.9 44.3 46.6 38.9"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M46.6 38.9 L50 32 L43 34.5 Z" fill="white" />
    <path d="M35 22 L28 33 L33 33 L29 42 L38 29 L33 29 Z" fill="white" opacity="0.95" />
  </svg>
);
