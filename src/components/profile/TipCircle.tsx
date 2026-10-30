'use client';

import React from 'react';
import { Supporter, DEFAULT_SUPPORTERS } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';

interface TipCircleProps {
  username?: string;
  name?: string;
  supporters?: Supporter[];
  onClick: () => void;
  className?: string;
}

export default function TipCircle({
  name = 'Profile',
  supporters = [],
  onClick,
  className = '',
}: TipCircleProps) {
  const effectiveSupporters = supporters && supporters.length > 0 ? supporters : DEFAULT_SUPPORTERS;
  const leftCoin = effectiveSupporters[0] || DEFAULT_SUPPORTERS[0];
  const rightCoin = effectiveSupporters[1] || DEFAULT_SUPPORTERS[1];

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name}'s Twin Coins (Tap to test coin styles)`}
      aria-label={`${name}'s Twin Coins`}
      className={`group relative -mt-16 sm:-mt-20 shrink-0 cursor-pointer select-none focus:outline-none z-10 ${className}`}
    >
      {/* Outer Circle Container: Borderless and transparent, twin coins float seamlessly across banner shelf */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-visible flex items-center justify-center bg-transparent">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Left Coin (z-20: strictly overlaps on top of the right coin with permanent black outline) */}
          <div
            title={`${leftCoin.name || 'Left Coin'} • Top Layer`}
            style={{
              left: '32.2%',
              top: '50%',
              width: '63.4%',
              height: '63.4%',
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full shadow-sm overflow-hidden z-20 outline outline-1 outline-black"
          >
            <img
              src={formatTwitterAvatar(leftCoin.avatar)}
              alt={leftCoin.name || 'Left Coin'}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Coin (z-10: sits underneath the left coin with very slight overlap with permanent black outline) */}
          <div
            title={`${rightCoin.name || 'Right Coin'} • Base Layer`}
            style={{
              left: '88%',
              top: '50%',
              width: '63.4%',
              height: '63.4%',
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full shadow-2xs overflow-hidden z-10 outline outline-1 outline-black"
          >
            <img
              src={formatTwitterAvatar(rightCoin.avatar)}
              alt={rightCoin.name || 'Right Coin'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </button>
  );
}
