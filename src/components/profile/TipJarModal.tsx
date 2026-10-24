'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Heart, DollarSign, Check, Coins } from 'lucide-react';

interface TipJarModalProps {
  isOpen: boolean;
  name: string;
  username: string;
  onClose: () => void;
}

interface SeedCoin {
  id: string;
  metal: 'gold' | 'silver' | 'copper';
  title: string;
  subtitle: string;
  lore: string;
  icon: string;
  gradient: string;
  border: string;
}

export default function TipJarModal({
  isOpen,
  name,
  username,
  onClose,
}: TipJarModalProps) {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('c1');
  const [isTipping, setIsTipping] = useState(false);

  const seedCoins: SeedCoin[] = [
    {
      id: 'c1',
      metal: 'gold',
      title: 'The House Tip',
      subtitle: 'Tipped by @oomfsorg ($1.00)',
      lore: '"Here\'s $1 on the house to get your jar rolling. Every great citizen starts with a foundation coin from the house!"',
      icon: '🐱',
      gradient: 'from-[#ffe066] via-[#f59e0b] to-[#b45309]',
      border: 'border-[#fef08a]',
    },
    {
      id: 'c2',
      metal: 'silver',
      title: 'The Mutual Guilder',
      subtitle: 'Tribute to Mutual Friends',
      lore: '"Minted in honor of OOMFs everywhere. Two accounts following each other create an unbreakable bond. Follow back to earn the badge!"',
      icon: '🤝',
      gradient: 'from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]',
      border: 'border-white',
    },
    {
      id: 'c3',
      metal: 'copper',
      title: 'The Lucky Penny',
      subtitle: 'Ancient Folklore Superstition',
      lore: '"Find a penny, pick it up, all day long you\'ll have good luck. Never leave a jar empty—this penny ensures endless good fortune."',
      icon: '★',
      gradient: 'from-[#f97316] via-[#c2410c] to-[#7c2d12]',
      border: 'border-[#fdba74]',
    },
  ];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCoin = seedCoins.find((c) => c.id === selectedCoinId) || seedCoins[0];

  const handleDropTip = () => {
    setIsTipping(true);
    setTimeout(() => {
      setIsTipping(false);
      alert(`Tip portal ready! In production, this launches direct creator support for @${username}.`);
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#eff3f4] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eff3f4] bg-[#f7f9f9]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏺</span>
            <div>
              <h3 className="font-extrabold text-base text-[#0f1419] leading-tight">
                {name}&apos;s Glass Tip Jar
              </h3>
              <p className="text-xs text-[#536471]">
                3 starter seed coins • Tap a coin to view its lore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#536471] hover:bg-[#0f1419]/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Jar Showcase & Coins */}
        <div className="p-6 flex flex-col items-center gap-5">
          {/* Interactive Jar Display */}
          <div className="relative w-28 h-36 flex flex-col items-center justify-end select-none">
            {/* Cork Stopper */}
            <div className="relative w-16 h-5 bg-gradient-to-b from-[#b8860b] via-[#8b5a2b] to-[#6b4226] rounded-t-md shadow-sm border-t border-x border-[#d4af37]/40 flex items-center justify-center">
              <div className="w-8 h-1 bg-[#2b1810] rounded-full shadow-inner" />
            </div>

            {/* Neck */}
            <div className="w-18 h-2 bg-white/40 backdrop-blur-xs border-x border-white/70" />

            {/* Glass Body */}
            <div className="relative w-full h-28 rounded-b-2xl rounded-t-sm bg-gradient-to-b from-white/40 via-white/10 to-white/50 backdrop-blur-xs border-2 border-white shadow-xl overflow-hidden flex flex-col justify-end p-2.5">
              {/* Glass Specular Glare */}
              <div className="absolute top-2 left-2 w-2 h-16 bg-white/70 rounded-full blur-[0.5px] pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-1 h-10 bg-white/40 rounded-full pointer-events-none" />

              {/* 3 Seed Coins inside Jar */}
              <div className="relative w-full h-14 flex items-end justify-center">
                {/* Silver Coin */}
                <button
                  type="button"
                  onClick={() => setSelectedCoinId('c2')}
                  title="The Mutual Guilder (Silver)"
                  className={`absolute bottom-1 left-2 w-9 h-9 rounded-full bg-gradient-to-br from-[#f1f5f9] via-[#cbd5e1] to-[#64748b] border-2 border-white shadow-md flex items-center justify-center -rotate-12 cursor-pointer transition-all ${
                    selectedCoinId === 'c2' ? 'scale-115 ring-2 ring-[#1d9bf0] z-20' : 'hover:scale-105'
                  }`}
                >
                  <span className="text-sm font-black">🤝</span>
                </button>

                {/* Copper Coin */}
                <button
                  type="button"
                  onClick={() => setSelectedCoinId('c3')}
                  title="The Lucky Penny (Copper)"
                  className={`absolute bottom-1 right-2 w-9 h-9 rounded-full bg-gradient-to-br from-[#f97316] via-[#c2410c] to-[#7c2d12] border-2 border-[#fdba74] shadow-md flex items-center justify-center rotate-12 cursor-pointer transition-all ${
                    selectedCoinId === 'c3' ? 'scale-115 ring-2 ring-[#1d9bf0] z-20' : 'hover:scale-105'
                  }`}
                >
                  <span className="text-sm font-black text-[#fff2eb]">★</span>
                </button>

                {/* Gold Coin */}
                <button
                  type="button"
                  onClick={() => setSelectedCoinId('c1')}
                  title="The House Tip (Gold)"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#ffe066] via-[#f59e0b] to-[#b45309] border-2 border-[#fef08a] shadow-lg flex items-center justify-center cursor-pointer transition-all ${
                    selectedCoinId === 'c1' ? 'scale-115 ring-2 ring-[#1d9bf0] z-30' : 'hover:scale-105 z-10'
                  }`}
                >
                  <span className="text-sm font-black">🐱</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Coin Lore Details Card */}
          <div className="w-full bg-[#f7f9f9] border border-[#eff3f4] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${activeCoin.gradient} border ${activeCoin.border} shadow-xs flex items-center justify-center shrink-0`}
                >
                  <span className="text-xs">{activeCoin.icon}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0f1419] leading-tight">
                    {activeCoin.title}
                  </h4>
                  <p className="text-[11px] text-[#536471] font-medium">
                    {activeCoin.subtitle}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#cfd9de] text-[#0f1419] uppercase tracking-wider">
                {activeCoin.metal}
              </span>
            </div>

            <p className="text-xs text-[#0f1419] italic leading-relaxed pt-1 border-t border-[#eff3f4]">
              {activeCoin.lore}
            </p>
          </div>

          {/* Action Button: Drop a tip */}
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDropTip}
              disabled={isTipping}
              className="w-full bg-[#0f1419] hover:bg-[#272c30] active:scale-98 text-white font-extrabold text-sm py-3 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <Coins className="w-4 h-4 text-[#ffd400]" />
              <span>{isTipping ? 'Opening Tip Counter...' : `Drop a Tip for @${username}`}</span>
            </button>
            <p className="text-[11px] text-[#536471] text-center">
              Your avatar will be immortalized as a coin in this jar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
