/**
 * App Icon Component
 * 
 * SVG icon for the Kgotla app, used in various sizes throughout the application
 * and for PWA icons.
 */

interface AppIconProps {
  size?: number;
  className?: string;
}

export default function AppIcon({ size = 24, className = "" }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Traditional African Tree (Baobab) */}
      <g>
        {/* Tree trunk */}
        <rect x="42" y="60" width="16" height="30" rx="2" fill="#8B4513" />
        
        {/* Tree canopy - main circle */}
        <circle cx="50" cy="45" r="28" fill="#059669" />
        
        {/* Branches */}
        <circle cx="30" cy="35" r="12" fill="#047857" />
        <circle cx="70" cy="35" r="12" fill="#047857" />
        <circle cx="35" cy="55" r="10" fill="#047857" />
        <circle cx="65" cy="55" r="10" fill="#047857" />
        
        {/* Meeting circle around tree */}
        <circle cx="50" cy="50" r="38" stroke="#D97706" strokeWidth="2" fill="none" strokeDasharray="4 4" />
        
        {/* People sitting in circle - represented as dots */}
        <circle cx="50" cy="12" r="3" fill="#DC2626" />
        <circle cx="72" cy="22" r="3" fill="#DC2626" />
        <circle cx="82" cy="50" r="3" fill="#DC2626" />
        <circle cx="72" cy="78" r="3" fill="#DC2626" />
        <circle cx="50" cy="88" r="3" fill="#DC2626" />
        <circle cx="28" cy="78" r="3" fill="#DC2626" />
        <circle cx="18" cy="50" r="3" fill="#DC2626" />
        <circle cx="28" cy="22" r="3" fill="#DC2626" />
      </g>
    </svg>
  );
}