'use client';

import React from 'react';
import { CatShushIcon } from './ProfileView';

interface TipJarProps {
  username: string;
  name: string;
  onClick: () => void;
  className?: string;
}

export default function TipJar({
  username,
  name,
  onClick,
  className = '',
}: TipJarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name}'s Tip Jar (3 starter coins • Tap to open)`}
      aria-label={`${name}'s Tip Jar`}
      className={`group relative -mt-4 sm:-mt-5 mb-2 w-10 sm:w-12 h-14 sm:h-16 flex flex-col items-center justify-end shrink-0 cursor-pointer select-none transition-transform duration-200 hover:scale-105 active:scale-95 z-10 ${className}`}
    >
      {/* Wooden / Cork Stopper with Coin Slot (crosses banner edge subtly) */}
      <div className="relative w-6 sm:w-7 h-2.5 sm:h-3 bg-gradient-to-b from-[#b8860b] via-[#8b5a2b] to-[#6b4226] rounded-t-sm shadow-xs border-t border-x border-[#d4af37]/40 flex items-center justify-center">
        {/* Coin Slot */}
        <div className="w-3.5 sm:w-4 h-0.5 bg-[#2b1810] rounded-full shadow-inner" />
      </div>

      {/* Jar Glass Neck */}
      <div className="w-7 sm:w-8 h-1 sm:h-1.5 bg-white/40 backdrop-blur-xs border-x border-white/70" />

      {/* Glass Body Vessel */}
      <div className="relative w-full h-11 sm:h-13 rounded-b-xl rounded-t-sm bg-gradient-to-b from-white/30 via-white/10 to-white/40 backdrop-blur-xs border-2 border-white/80 shadow-md overflow-hidden flex flex-col justify-end p-1">
        {/* Glass Specular Glare (Left highlight curve) */}
        <div className="absolute top-1 left-1 w-1 h-7 bg-white/60 rounded-full blur-[0.5px] pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-0.5 h-4 bg-white/30 rounded-full pointer-events-none" />

        {/* 3 Seed Coins Nested at the Base */}
        <div className="relative w-full h-7 flex items-end justify-center">
          {/* Coin 2: Silver Mutual Guilder (Bottom Left) */}
          <div 
            title="The Mutual Guilder (Silver)"
            className="absolute bottom-0 left-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-[#e0e6ed] via-[#b0b8c4] to-[#7f8894] border border-white shadow-xs flex items-center justify-center -rotate-12 transition-transform group-hover:-translate-x-0.5"
          >
            <span className="text-[7px] sm:text-[8px] font-black text-[#2f3542] leading-none">🤝</span>
          </div>

          {/* Coin 3: Copper Lucky Penny (Bottom Right) */}
          <div 
            title="The Lucky Penny (Copper)"
            className="absolute bottom-0 right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-[#e58e52] via-[#b85d19] to-[#803507] border border-[#ffb07c] shadow-xs flex items-center justify-center rotate-12 transition-transform group-hover:translate-x-0.5"
          >
            <span className="text-[6px] sm:text-[7px] font-black text-[#fff2eb] leading-none">★</span>
          </div>

          {/* Coin 1: Gold House Tip (Top Center, nestled above base coins) */}
          <div 
            title="House Tip from @oomfsorg (Gold)"
            className="absolute -top-1 sm:-top-1.5 left-1/2 -translate-x-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-[#ffe066] via-[#f59e0b] to-[#b45309] border border-[#fef08a] shadow-sm flex items-center justify-center z-10 transition-transform group-hover:-translate-y-0.5"
          >
            <span className="text-[7px] sm:text-[8px] font-black text-[#451a03] leading-none">🐱</span>
          </div>
        </div>

        {/* Subtle Glass Rim Bottom Glow */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/40 rounded-b-xl pointer-events-none" />
      </div>
    </button>
  );
}
