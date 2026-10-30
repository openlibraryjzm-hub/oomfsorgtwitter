'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Coins, Upload, RotateCcw, Camera, Layers, Check } from 'lucide-react';
import { Supporter, DEFAULT_SUPPORTERS } from '@/lib/mockData';
import { formatTwitterAvatar, compressImageFile } from '@/lib/utils';

interface SupporterModalProps {
  isOpen: boolean;
  name: string;
  username: string;
  supporters: Supporter[];
  onClose: () => void;
  onScenarioChange?: (newSupporters: Supporter[]) => void;
  onAddTip?: (newSupporter: Supporter) => void;
}

export default function SupporterModal({
  isOpen,
  name,
  username,
  supporters = [],
  onClose,
  onScenarioChange,
}: SupporterModalProps) {
  // Target slot being edited ('left' | 'right' | null)
  const [activeSlot, setActiveSlot] = useState<'left' | 'right' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize coins from incoming supporters or defaults
  const [leftCoin, setLeftCoin] = useState<Supporter>(() => {
    return supporters?.[0] || DEFAULT_SUPPORTERS[0];
  });
  const [rightCoin, setRightCoin] = useState<Supporter>(() => {
    return supporters?.[1] || DEFAULT_SUPPORTERS[1];
  });

  // Re-sync coins when modal opens or supporters change
  useEffect(() => {
    if (isOpen) {
      setLeftCoin(supporters?.[0] || DEFAULT_SUPPORTERS[0]);
      setRightCoin(supporters?.[1] || DEFAULT_SUPPORTERS[1]);
    }
  }, [isOpen, supporters]);

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

  // Trigger file selection for a specific coin slot
  const handleTriggerUpload = (slot: 'left' | 'right') => {
    setActiveSlot(slot);
    fileInputRef.current?.click();
  };

  // Process uploaded image file into lightweight data URL
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = activeSlot;
    if (!file || !slot) return;

    try {
      let dataUrl: string;
      try {
        dataUrl = await compressImageFile(file, 400, 0.9);
      } catch {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (loadEvt) => resolve(loadEvt.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      if (dataUrl) {
        if (slot === 'left') {
          const updatedLeft: Supporter = {
            ...leftCoin,
            avatar: dataUrl,
          };
          setLeftCoin(updatedLeft);
          onScenarioChange?.([updatedLeft, rightCoin]);
        } else {
          const updatedRight: Supporter = {
            ...rightCoin,
            avatar: dataUrl,
          };
          setRightCoin(updatedRight);
          onScenarioChange?.([leftCoin, updatedRight]);
        }
      }
    } catch (err) {
      console.warn('Failed to load coin image:', err);
    } finally {
      e.target.value = '';
      setActiveSlot(null);
    }
  };

  // Reset a specific slot to default
  const handleResetSlot = (slot: 'left' | 'right') => {
    if (slot === 'left') {
      const resetLeft: Supporter = {
        ...DEFAULT_SUPPORTERS[0],
      };
      setLeftCoin(resetLeft);
      onScenarioChange?.([resetLeft, rightCoin]);
    } else {
      const resetRight: Supporter = {
        ...DEFAULT_SUPPORTERS[1],
      };
      setRightCoin(resetRight);
      onScenarioChange?.([leftCoin, resetRight]);
    }
  };

  // Reset both slots to default
  const handleResetBoth = () => {
    const d0 = { ...DEFAULT_SUPPORTERS[0] };
    const d1 = { ...DEFAULT_SUPPORTERS[1] };
    setLeftCoin(d0);
    setRightCoin(d1);
    onScenarioChange?.([d0, d1]);
  };

  const isLeftCustomized = leftCoin.avatar !== DEFAULT_SUPPORTERS[0].avatar;
  const isRightCustomized = rightCoin.avatar !== DEFAULT_SUPPORTERS[1].avatar;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#eff3f4] flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Temporary Image Uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eff3f4] bg-[#f7f9f9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#0d8bd9] flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f1419] leading-tight">
                Twin Coin Customizer
              </h3>
              <p className="text-xs text-[#536471]">
                Temporary style tester • Left coin overlaps right coin
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col items-center gap-5">
          {/* ============================================================== */}
          {/* THE TWIN COIN LIVE PREVIEW ARENA                               */}
          {/* ============================================================== */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border-4 border-white shadow-inner flex items-center justify-center select-none overflow-hidden shrink-0">
            {/* Ambient Celestial Orbit Lines */}
            <div className="absolute w-36 h-36 sm:w-42 sm:h-42 rounded-full border border-dashed border-[#1d9bf0]/25 pointer-events-none" />
            <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-dashed border-[#cbd5e1]/40 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#1d9bf0]/5 to-[#1d9bf0]/10 pointer-events-none" />

            {/* Twin Coins Container (fitted cleanly inside arena) */}
            <div className="relative w-full h-full flex items-center justify-center scale-[0.82]">
              {/* Left Coin (z-20: overlaps on top of right coin with permanent black outline) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('left')}
                title="Left Coin (Top Layer • Overlaps Right) - Click to upload temp image"
                style={{
                  left: '32.2%',
                  top: '50%',
                  width: '63.4%',
                  height: '63.4%',
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute rounded-full shadow-md overflow-hidden z-20 outline outline-1 outline-black group/left cursor-pointer transition-transform duration-150 hover:scale-102 focus:outline-none"
              >
                <img
                  src={formatTwitterAvatar(leftCoin.avatar)}
                  alt={leftCoin.name || 'Left Coin'}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/left:opacity-100 transition-opacity text-white text-[10px] font-bold z-20">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Left (Top)</span>
                </div>
              </button>

              {/* Right Coin (z-10: sits underneath left coin with very slight overlap with permanent black outline) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('right')}
                title="Right Coin (Base Layer • Underneath Left) - Click to upload temp image"
                style={{
                  left: '88%',
                  top: '50%',
                  width: '63.4%',
                  height: '63.4%',
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute rounded-full shadow-sm overflow-hidden z-10 outline outline-1 outline-black group/right cursor-pointer transition-transform duration-150 hover:scale-102 focus:outline-none"
              >
                <img
                  src={formatTwitterAvatar(rightCoin.avatar)}
                  alt={rightCoin.name || 'Right Coin'}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/right:opacity-100 transition-opacity text-white text-[10px] font-bold z-20">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Right (Base)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Layer Hierarchy Clarification Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f3f4] border border-[#cfd9de]/60 text-xs font-semibold text-[#536471]">
            <Layers className="w-3.5 h-3.5 text-[#1d9bf0]" />
            <span>Layering: <strong>Left Coin</strong> overlaps <strong>Right Coin</strong></span>
          </div>

          {/* ============================================================== */}
          {/* COIN SLOTS UPLOADER CARDS (2 SLOTS)                            */}
          {/* ============================================================== */}
          <div className="w-full flex flex-col gap-2.5">
            {/* Slot 1: Left Coin (Top Layer) */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#cfd9de]/80 bg-[#f7f9f9] shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTriggerUpload('left')}
                  className="relative w-11 h-11 rounded-full overflow-hidden outline outline-1 outline-black shadow-xs shrink-0 group/cardleft cursor-pointer"
                  title="Upload image for Left Coin"
                >
                  <img
                    src={formatTwitterAvatar(leftCoin.avatar)}
                    alt="Left Coin"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cardleft:opacity-100 transition-opacity text-white z-20">
                    <Camera className="w-4 h-4" />
                  </div>
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-[#0f1419]">Slot 1: Left Coin</span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#1d9bf0]/10 text-[#1d9bf0]">
                      TOP LAYER
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536471]">
                    Overlaps right coin (z-20)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isLeftCustomized && (
                  <button
                    type="button"
                    onClick={() => handleResetSlot('left')}
                    className="p-1.5 text-[#536471] hover:text-[#0f1419] hover:bg-[#eff3f4] rounded-lg transition-colors cursor-pointer"
                    title="Reset to default Amb Coin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTriggerUpload('left')}
                  className="px-3 py-1.5 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Slot 2: Right Coin (Base Layer) */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#cfd9de]/80 bg-[#f7f9f9] shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTriggerUpload('right')}
                  className="relative w-11 h-11 rounded-full overflow-hidden outline outline-1 outline-black shadow-xs shrink-0 group/cardright cursor-pointer"
                  title="Upload image for Right Coin"
                >
                  <img
                    src={formatTwitterAvatar(rightCoin.avatar)}
                    alt="Right Coin"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cardright:opacity-100 transition-opacity text-white z-20">
                    <Camera className="w-4 h-4" />
                  </div>
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-[#0f1419]">Slot 2: Right Coin</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#536471]/10 text-[#536471]">
                      BASE LAYER
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536471]">
                    Rests underneath left (z-10)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isRightCustomized && (
                  <button
                    type="button"
                    onClick={() => handleResetSlot('right')}
                    className="p-1.5 text-[#536471] hover:text-[#0f1419] hover:bg-[#eff3f4] rounded-lg transition-colors cursor-pointer"
                    title="Reset to default My Coin"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTriggerUpload('right')}
                  className="px-3 py-1.5 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Help text */}
          <div className="w-full flex items-center justify-between pt-1 border-t border-[#eff3f4]">
            {(isLeftCustomized || isRightCustomized) ? (
              <button
                type="button"
                onClick={handleResetBoth}
                className="text-xs font-bold text-[#536471] hover:text-[#0f1419] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Both to Defaults</span>
              </button>
            ) : (
              <span className="text-[11px] text-[#536471]">
                Session testing mode (non-persistent)
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
