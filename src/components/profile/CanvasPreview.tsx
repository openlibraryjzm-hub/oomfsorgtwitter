'use client';

import React, { useMemo, useState } from 'react';

interface CanvasPreviewProps {
  username: string;
  bannerUrl?: string | null;
  mode: 'main' | 'mini' | 'fullscreen';
  isMutual?: boolean;
  className?: string;
  onClick?: () => void;
}

interface DoodleItem {
  id: string;
  author: string;
  authorHandle: string;
  timeAgo: string;
}

export default function CanvasPreview({
  username,
  bannerUrl,
  mode,
  isMutual = true,
  className = '',
  onClick,
}: CanvasPreviewProps) {
  const [selectedDoodle, setSelectedDoodle] = useState<DoodleItem | null>(null);

  // Deterministic seed generation from username for unique community canvas art per user
  const seed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }, [username]);

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full select-none overflow-hidden bg-[#cfd9de] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Base Layer: The User's Underlying Profile Banner */}
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt={`${username}'s base banner`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
      )}

      {/* Subtle vellum / dark scrim over banner so doodles stand out vividly */}
      <div className="absolute inset-0 bg-black/20 backdrop-brightness-95 pointer-events-none" />

      {/* Authentic r/place subtle pixel grid overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: mode === 'mini' ? '4px 4px' : '12px 12px',
        }}
      />

      {/* SVG Doodle Overlay Layer (Drawn by mutual OOMFs) */}
      <svg
        viewBox="0 0 1500 500"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Doodle 1: Cute Angel Wings & Halo over the Avatar Area (Bottom-Left) */}
        <g 
          transform="translate(80, 220)"
          className={mode === 'fullscreen' ? 'cursor-pointer group' : ''}
          onClick={(e) => {
            if (mode === 'fullscreen') {
              e.stopPropagation();
              setSelectedDoodle({
                id: 'd1',
                author: 'Dev Kyle',
                authorHandle: 'dev_kyle',
                timeAgo: '2h ago'
              });
            }
          }}
        >
          {/* Angel Halo */}
          <ellipse cx="140" cy="40" rx="45" ry="12" fill="none" stroke="#ffd400" strokeWidth="6" strokeDasharray="6 3" />
          
          {/* Left Wing */}
          <path
            d="M50,110 C20,80 10,40 50,20 C70,40 80,70 100,100 Z"
            fill="#ffffff"
            fillOpacity="0.85"
            stroke="#1d9bf0"
            strokeWidth="3"
          />
          {/* Right Wing */}
          <path
            d="M230,110 C260,80 270,40 230,20 C210,40 200,70 180,100 Z"
            fill="#ffffff"
            fillOpacity="0.85"
            stroke="#1d9bf0"
            strokeWidth="3"
          />
          <text x="140" y="150" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">
            😇 OOMF
          </text>
        </g>

        {/* Doodle 2: Mutual Friend Signature Tag (Center-Top) */}
        <g 
          transform="translate(560, 80)"
          className={mode === 'fullscreen' ? 'cursor-pointer group' : ''}
          onClick={(e) => {
            if (mode === 'fullscreen') {
              e.stopPropagation();
              setSelectedDoodle({
                id: 'd2',
                author: 'Sarah Jenkins',
                authorHandle: 'sarah_j',
                timeAgo: '4h ago'
              });
            }
          }}
        >
          <rect x="0" y="0" width="380" height="60" rx="30" fill="#0f1419" fillOpacity="0.8" stroke="#1d9bf0" strokeWidth="2.5" />
          <text x="25" y="38" fill="#ffffff" fontSize="22" fontWeight="800" fontFamily="system-ui">
            ✍️ @sarah_j was here! ✨
          </text>
        </g>

        {/* Doodle 3: Retro 88x31 Mini Web Badge Sticker (Top-Right) */}
        <g 
          transform="translate(1180, 60)"
          className={mode === 'fullscreen' ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (mode === 'fullscreen') {
              e.stopPropagation();
              setSelectedDoodle({
                id: 'd3',
                author: 'PixelCat',
                authorHandle: 'pixel_cat',
                timeAgo: '1d ago'
              });
            }
          }}
        >
          <rect x="0" y="0" width="220" height="70" rx="8" fill="#f91880" stroke="#ffffff" strokeWidth="3" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
          <rect x="8" y="8" width="204" height="54" rx="4" fill="#000000" fillOpacity="0.6" />
          <text x="110" y="42" fill="#ffd400" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            ★ #1 OOMF ★
          </text>
        </g>

        {/* Doodle 4: Pixel Heart Stamp with Arrow (Center-Right) */}
        <g 
          transform="translate(980, 240)"
          className={mode === 'fullscreen' ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (mode === 'fullscreen') {
              e.stopPropagation();
              setSelectedDoodle({
                id: 'd4',
                author: 'Elena Gomez',
                authorHandle: 'elena_g',
                timeAgo: '6h ago'
              });
            }
          }}
        >
          {/* Pixel Heart */}
          <path
            d="M20,10 A15,15 0 0,0 0,35 C0,55 35,75 35,75 C35,75 70,55 70,35 A15,15 0 0,0 50,10 Q35,20 20,10 Z"
            fill="#f91880"
            stroke="#ffffff"
            strokeWidth="2"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
          />
          <text x="85" y="48" fill="#ffffff" fontSize="20" fontWeight="bold" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.9))">
            &lt;3 best mutual
          </text>
        </g>

        {/* Doodle 5: Simulated active pen cursor in fullscreen/main mode */}
        {mode !== 'mini' && (
          <g transform="translate(420, 280)">
            <path d="M0,0 L0,24 L6,18 L14,24 L18,20 L10,14 L18,14 Z" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            <rect x="22" y="10" width="105" height="22" rx="4" fill="#0f1419" stroke="#00ba7c" strokeWidth="1.5" />
            <text x="28" y="25" fill="#00ba7c" fontSize="11" fontWeight="bold" fontFamily="monospace">
              🖋️ drawing now...
            </text>
          </g>
        )}
      </svg>

      {/* Attribution Popup Card in Fullscreen Mode */}
      {mode === 'fullscreen' && selectedDoodle && (
        <div 
          className="absolute top-4 right-4 bg-black/85 backdrop-blur-md border border-[#1d9bf0]/50 rounded-xl p-3 text-white shadow-xl z-20 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/10 text-xs">
            <span className="font-bold text-[#1d9bf0]">Doodle Attribution</span>
            <button 
              onClick={() => setSelectedDoodle(null)}
              className="text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-semibold pt-1">
            Signed by <span className="text-[#1d9bf0]">@{selectedDoodle.authorHandle}</span> ({selectedDoodle.author})
          </p>
          <p className="text-[10px] text-white/50">{selectedDoodle.timeAgo} • Verified Mutual OOMF</p>
        </div>
      )}

      {/* Mini Mode micro-label indicator */}
      {mode === 'mini' && (
        <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-black text-white flex items-center gap-1 leading-none shadow-xs pointer-events-none">
          <span className="text-[10px]">🎨</span>
          <span className="tracking-tight text-white font-bold">DOODLES</span>
        </div>
      )}
    </div>
  );
}
