'use client';

import React, { useMemo } from 'react';
import { Supporter, DEFAULT_SUPPORTERS } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';
import { CatShushIcon } from './ProfileView';
import { packSupporterCircles } from '@/lib/circlePacking';

interface TipCircleProps {
  username: string;
  name: string;
  supporters: Supporter[];
  onClick: () => void;
  className?: string;
}

export default function TipCircle({
  username,
  name,
  supporters = [],
  onClick,
  className = '',
}: TipCircleProps) {
  const effectiveSupporters = supporters && supporters.length > 0 ? supporters : DEFAULT_SUPPORTERS;

  // Dynamically pack supporter avatars with ZERO overlapping and maximum fullness (touching outer edge)
  const packedCircles = useMemo(
    () => packSupporterCircles(effectiveSupporters, { containerRadius: 49.5, minGap: 1.2, targetFillDensity: 0.84 }),
    [effectiveSupporters]
  );

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name}'s Tip Circle (${effectiveSupporters.length} supporter${effectiveSupporters.length === 1 ? '' : 's'} • Tap to inspect scenarios)`}
      aria-label={`${name}'s Tip Circle`}
      className={`group relative -mt-16 sm:-mt-20 shrink-0 cursor-pointer select-none focus:outline-none z-10 ${className}`}
    >
      {/* Outer Circle Container: Borderless and transparent, avatars float seamlessly across banner shelf */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
        {effectiveSupporters.length > 0 ? (
          /* ============================================================== */
          /* POPULATED SUPPORTER ORBIT (Transparent Background, No Scale)    */
          /* ============================================================== */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Packed Supporter Avatars */}
            {packedCircles.map((pc, idx) => {
              const isCoin = pc.item.id.startsWith('coin_') || pc.item.avatar.includes('coin') || pc.item.avatar.includes('Coin');
              const isTopHero = !isCoin && idx === 0 && pc.item.amount >= 25;
              const borderClass = isCoin
                ? 'border border-white/60 group-hover:border-[#1d9bf0]'
                : pc.item.amount >= 50
                ? 'border-2 border-amber-400 group-hover:border-[#1d9bf0]'
                : pc.item.amount >= 20
                ? 'border border-[#1d9bf0]'
                : 'border border-white group-hover:border-[#1d9bf0]/60';

              return (
                <div
                  key={pc.item.id}
                  title={`${pc.item.name} • $${pc.item.amount}`}
                  style={{
                    left: `${pc.x}%`,
                    top: `${pc.y}%`,
                    width: `${pc.diameter}%`,
                    height: `${pc.diameter}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute rounded-full shadow-2xs overflow-hidden z-10 transition-colors duration-150 ${borderClass} group-hover:ring-1 group-hover:ring-[#1d9bf0]`}
                >
                  <img
                    src={formatTwitterAvatar(pc.item.avatar)}
                    alt={pc.item.name}
                    className="w-full h-full object-cover"
                  />
                  {isTopHero && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 text-[#451a03] flex items-center justify-center text-[7px] sm:text-[9px] font-black shadow-xs pointer-events-none">
                      👑
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================== */
          /* COLD-START EMPTY STATE (@oomfsorg Starter Orbit)                */
          /* ============================================================== */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-white/20 backdrop-blur-2xs">
            {/* Cat Mascot Sparkle Center */}
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#ffe066] via-[#f59e0b] to-[#b45309] border-2 border-[#fef08a] shadow-sm flex items-center justify-center mb-1 transition-colors group-hover:border-[#1d9bf0]">
              <CatShushIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#451a03]" />
              <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
            </div>

            {/* Call to action label */}
            <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0f1419]/80 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-extrabold tracking-wide uppercase transition-colors group-hover:bg-[#1d9bf0]">
              <span>+ Be 1st</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
