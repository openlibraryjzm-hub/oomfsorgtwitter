'use client';

import React, { useEffect, useState } from 'react';
import { X, Share2, Check } from 'lucide-react';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  bannerUrl?: string | null;
  name: string;
  username: string;
  onClose: () => void;
}

export default function FullscreenMediaModal({
  isOpen,
  bannerUrl,
  name,
  username,
  onClose,
}: FullscreenMediaModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/92 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fullscreen view"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col text-white">
            <span className="font-bold text-sm sm:text-base leading-tight">
              {name}&apos;s Header Banner
            </span>
            <span className="text-xs text-white/60">
              @{username} on oomfs.org
            </span>
          </div>
        </div>

        {/* Share Action */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Link' : 'Share'}</span>
        </button>
      </div>

      {/* Main Focal Media Container */}
      <div 
        className="w-full max-w-5xl my-auto aspect-[3/1] max-h-[70vh] rounded-xl overflow-hidden shadow-2xl relative border border-white/10 flex items-center justify-center bg-[#0f1419]"
        onClick={(e) => e.stopPropagation()}
      >
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${name}'s banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de] flex items-center justify-center text-[#536471] font-semibold">
            No custom banner uploaded
          </div>
        )}
      </div>

      {/* Bottom Bar: Dismiss hint */}
      <div 
        className="w-full max-w-xl z-10 flex flex-col items-center gap-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-white/50">
          Tap anywhere outside or press Esc to return to profile
        </p>
      </div>
    </div>
  );
}
