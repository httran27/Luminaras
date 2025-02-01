import { FC } from "react";

export const HeroIllustration: FC = () => {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[500px] h-auto"
    >
      {/* Gaming Setup */}
      <rect x="50" y="100" width="300" height="150" rx="10" fill="hsl(270, 60%, 85%)" />
      <rect x="70" y="120" width="260" height="110" rx="5" fill="hsl(270, 60%, 95%)" />
      
      {/* Gaming Character */}
      <circle cx="200" cy="80" r="30" fill="hsl(270, 60%, 75%)" />
      <circle cx="190" cy="75" r="5" fill="white" />
      <circle cx="210" cy="75" r="5" fill="white" />
      <path d="M190 90 Q200 95 210 90" stroke="white" strokeWidth="2" />
      
      {/* Controller Icons */}
      <circle cx="100" cy="175" r="15" fill="hsl(270, 60%, 65%)" />
      <circle cx="300" cy="175" r="15" fill="hsl(270, 60%, 65%)" />
      
      {/* Decorative Elements */}
      <circle cx="150" cy="50" r="5" fill="hsl(270, 60%, 70%)" />
      <circle cx="250" cy="60" r="8" fill="hsl(270, 60%, 70%)" />
      <circle cx="50" cy="150" r="6" fill="hsl(270, 60%, 70%)" />
      <circle cx="350" cy="130" r="7" fill="hsl(270, 60%, 70%)" />
    </svg>
  );
};
