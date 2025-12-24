/**
 * Destiny Tricorn Logo SVG Component
 * The iconic three-pointed logo representing Destiny's Guardians
 */

interface TricornLogoProps {
  className?: string;
}

export const TricornLogo = ({ className = "w-8 h-8" }: TricornLogoProps) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);

export default TricornLogo;
