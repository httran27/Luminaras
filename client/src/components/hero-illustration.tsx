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

      {/* Main Character */}
      <g transform="translate(180, 60)">
        {/* Head */}
        <rect x="-15" y="-15" width="30" height="30" fill="hsl(270, 60%, 75%)" />
        {/* Eyes */}
        <rect x="-10" y="-8" width="6" height="6" fill="white" />
        <rect x="4" y="-8" width="6" height="6" fill="white" />
        {/* Smile */}
        <path d="M-8 5 L8 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* Headphones */}
        <path d="M-20 0 L-15 0 M15 0 L20 0" stroke="hsl(270, 60%, 55%)" strokeWidth="4" />
        <rect x="-23" y="-5" width="6" height="10" fill="hsl(270, 60%, 55%)" />
        <rect x="17" y="-5" width="6" height="10" fill="hsl(270, 60%, 55%)" />
      </g>

      {/* Pixel Art Game Elements */}
      <g transform="translate(100, 150)">
        {/* Retro Console */}
        <rect x="0" y="0" width="40" height="25" fill="hsl(270, 60%, 65%)" />
        <rect x="5" y="5" width="30" height="15" fill="hsl(270, 60%, 85%)" />
        <circle cx="10" cy="15" r="3" fill="hsl(270, 60%, 55%)" />
        <rect x="15" y="12" width="15" height="6" fill="hsl(270, 60%, 55%)" />
      </g>

      {/* Pixel Art Potion */}
      <g transform="translate(280, 160)">
        <rect x="0" y="0" width="20" height="25" fill="hsl(300, 60%, 75%)" />
        <rect x="5" y="-5" width="10" height="5" fill="hsl(300, 60%, 65%)" />
        <rect x="5" y="5" width="10" height="10" fill="hsl(300, 80%, 85%)" />
      </g>

      {/* Pixelated Stars */}
      <g>
        <rect x="50" y="50" width="4" height="4" fill="hsl(270, 60%, 70%)" />
        <rect x="150" y="30" width="4" height="4" fill="hsl(270, 60%, 70%)" />
        <rect x="250" y="40" width="4" height="4" fill="hsl(270, 60%, 70%)" />
        <rect x="350" y="60" width="4" height="4" fill="hsl(270, 60%, 70%)" />
      </g>

      {/* Pixel Hearts */}
      <g transform="translate(300, 200)">
        <path 
          d="M10,20 L0,10 L10,0 L20,10 L10,20" 
          fill="hsl(350, 80%, 75%)" 
        />
      </g>
    </svg>
  );
};