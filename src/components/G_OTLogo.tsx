/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GOTLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function G_OTLogo({ className = '', size = 'md' }: GOTLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64 md:w-80 md:h-80',
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`} id="got-embellished-logo">
      {/* Outer Glow Effect */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl opacity-75 animate-pulse" />
      
      {/* High-Fidelity SVG Replication of the Basra G&OT Chemical Engineering Logo */}
      <svg
        viewBox="0 0 400 400"
        className={`${sizeClasses[size]} drop-shadow-[0_10px_30px_rgba(20,83,136,0.25)] filter`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Triple Gradient for Flame Plume */}
          <linearGradient id="flameGrad_main" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" /> {/* Intense Blue */}
            <stop offset="35%" stopColor="#10b981" /> {/* Vibrant Green */}
            <stop offset="70%" stopColor="#fbbf24" /> {/* Sun Yellow */}
            <stop offset="100%" stopColor="#ef4444" /> {/* Crimson Red */}
          </linearGradient>

          {/* Golden Symmetrical Sweep Gradient */}
          <linearGradient id="goldSweeping" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          {/* Distillation Columns Metallic Gradients */}
          <linearGradient id="columnMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Ambient Lighting overlay */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Behind Glow Element */}
        <circle cx="200" cy="200" r="160" fill="url(#centerGlow)" className="opacity-60" />

        {/* 2. Main High-Gloss Teardrop/Oil Flame (Arabic Flame Shape) */}
        {/* Composed of double bezier sweeps for the beautiful fluid flame curve */}
        <path
          d="M 200 44 
             C 170 85, 95 180, 110 260 
             C 120 320, 170 350, 200 350 
             C 230 350, 280 320, 290 260 
             C 305 180, 230 85, 200 44 Z"
          fill="url(#flameGrad_main)"
          className="opacity-95"
        />

        {/* 3. Outer Sweeping Golden Accent Ribbon */}
        {/* This creates the beautiful sweeping arm that holds the refinery from left-bottom up to the right side */}
        <path
          d="M 85 240 
             C 65 310, 140 375, 220 370 
             C 310 365, 360 280, 310 210
             C 290 180, 250 160, 250 160
             C 250 160, 280 190, 290 220
             C 315 270, 270 340, 200 345
             C 140 350, 95 300, 115 240 Z"
          fill="url(#goldSweeping)"
        />

        {/* 4. Deep Refinery Industrial Background Silhouette */}
        {/* Inside the flame bubble, showing fractionators, heat loops & chimneys */}
        <g id="refinery-elements" transform="translate(0, 10)">
          {/* Main Boiler Chimney Tower */}
          <rect x="185" y="160" width="30" height="150" fill="url(#columnMetal)" rx="2" />
          {/* Scaffold Platforms */}
          <rect x="180" y="190" width="40" height="6" fill="#334155" rx="1" />
          <rect x="180" y="235" width="40" height="6" fill="#1e293b" rx="1" />
          <rect x="182" y="280" width="36" height="6" fill="#0f172a" rx="1" />
          
          {/* Fine Grid Hatching representing safety railings */}
          <line x1="180" y1="184" x2="220" y2="184" stroke="#64748b" strokeWidth="1.5" />
          <line x1="180" y1="229" x2="220" y2="229" stroke="#64748b" strokeWidth="1.5" />
          
          {/* Vertical safety cage */}
          <line x1="188" y1="160" x2="188" y2="310" stroke="#475569" strokeWidth="1" />
          <line x1="212" y1="160" x2="212" y2="310" stroke="#475569" strokeWidth="1" />

          {/* Right Secondary Catalyst Column */}
          <rect x="228" y="200" width="22" height="110" fill="url(#columnMetal)" rx="1.5" />
          {/* Domed top of fractionator */}
          <path d="M 228 200 C 228 185, 250 185, 250 200 Z" fill="#334155" />
          {/* Column Rings / Trays representation */}
          <line x1="228" y1="215" x2="250" y2="215" stroke="#1e293b" strokeWidth="2" />
          <line x1="228" y1="230" x2="250" y2="230" stroke="#1e293b" strokeWidth="2" />
          <line x1="228" y1="245" x2="250" y2="245" stroke="#1e293b" strokeWidth="2" />
          <line x1="228" y1="260" x2="250" y2="260" stroke="#1e293b" strokeWidth="2" />
          <line x1="228" y1="275" x2="250" y2="275" stroke="#1e293b" strokeWidth="2" />
          <line x1="228" y1="290" x2="250" y2="290" stroke="#1e293b" strokeWidth="2" />

          {/* Left Storage Tank Bulge & Piping */}
          <rect x="145" y="225" width="28" height="85" fill="url(#columnMetal)" rx="14" />
          <path d="M 173 250 H 185" stroke="#475569" strokeWidth="3" fill="none" />
          <path d="M 215 220 H 228" stroke="#475569" strokeWidth="3" fill="none" />
          
          {/* Flaring Beacon Light on Left Shield Tower */}
          <circle cx="239" cy="188" r="4" fill="#38bdf8" />
          <line x1="239" y1="180" x2="239" y2="196" stroke="#38bdf8" strokeWidth="1" />
          <line x1="231" y1="188" x2="247" y2="188" stroke="#38bdf8" strokeWidth="1" />
        </g>

        {/* 5. G&OT Basrah Shield Emblem (Mini coat of arms on bottom-left) */}
        {/* Composed of real shield geometry: Green/White/Blue vertical panels with elegant gold frame */}
        <g id="basra-shield" transform="translate(75, 275) scale(0.65)">
          {/* Shield Base Shape */}
          <path
            d="M 10 10 
               H 90 
               V 50 
               C 90 85, 50 105, 50 105 
               C 50 105, 10 85, 10 50 
               Z"
            fill="#0f172a"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Inner Vertical Striping */}
          {/* Green Panel (Left) */}
          <path d="M 12 12 H 38 V 60 C 38 78, 50 92, 50 92 C 50 92, 12 76, 12 50 Z" fill="#15803d" />
          {/* Blue Panel (Right) */}
          <path d="M 88 12 H 62 V 60 C 62 78, 50 92, 50 92 C 50 92, 88 76, 88 50 Z" fill="#1d4ed8" />
          {/* White Panel (Middle) */}
          <path d="M 38 12 H 62 V 65 L 50 95 L 38 65 Z" fill="#f8fafc" />
          
          {/* Refinery Chimney Icon inside the mini-shield */}
          <g transform="translate(42, 25)" fill="#1e293b">
            <rect x="5" y="5" width="6" height="30" />
            <rect x="3" y="2" width="10" height="3" fill="#a855f7" />
            <line x1="8" y1="5" x2="8" y2="35" stroke="#ffffff" strokeWidth="1" />
          </g>
        </g>
      </svg>
    </div>
  );
}
