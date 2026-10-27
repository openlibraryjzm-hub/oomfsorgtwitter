'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PostAttachment } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';

interface TwitterMediaGridProps {
  images?: string[];
  attachments?: PostAttachment[];
  onImageClick?: (e: React.MouseEvent, index: number) => void;
  className?: string;
}

export default function TwitterMediaGrid({ 
  images, 
  attachments, 
  onImageClick, 
  className = '' 
}: TwitterMediaGridProps) {
  const router = useRouter();

  const items: PostAttachment[] = useMemo(() => {
    if (attachments && attachments.length > 0) {
      return attachments.slice(0, 4);
    }
    if (images && images.length > 0) {
      return images.slice(0, 4).map((url) => ({ type: 'image' as const, url }));
    }
    return [];
  }, [attachments, images]);

  if (items.length === 0) return null;

  const count = items.length;

  const handleClick = (e: React.MouseEvent, idx: number) => {
    if (onImageClick) {
      e.stopPropagation();
      onImageClick(e, idx);
    }
  };

  const renderCell = (item: PostAttachment, idx: number) => {
    if (item.type === 'image') {
      return (
        <div key={idx} className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
          <img
            src={item.url}
            alt={`Attachment ${idx + 1}`}
            onClick={(e) => handleClick(e, idx)}
            className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer block"
            loading="lazy"
          />
        </div>
      );
    }

    // User Avatar Attachment
    return (
      <div
        key={idx}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/${item.username}`);
        }}
        className="relative w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] hover:bg-blue-50/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer group/user-cell transition-colors select-none"
      >
        <div className="relative">
          <img
            src={formatTwitterAvatar(item.avatar)}
            alt={item.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-black/10 group-hover/user-cell:ring-[#1d9bf0] group-hover/user-cell:scale-105 transition-all shadow-xs"
          />
        </div>
        <div className="mt-2 min-w-0 max-w-full px-2">
          <span className="font-bold text-sm sm:text-base text-[#0f1419] group-hover/user-cell:text-[#1d9bf0] transition-colors truncate block">
            {item.name}
          </span>
          <span className="text-xs text-[#536471] truncate block">
            @{item.username}
          </span>
        </div>
      </div>
    );
  };

  // 1 Item
  if (count === 1) {
    const item = items[0];
    if (item.type === 'image') {
      return (
        <div className={`mt-2.5 w-full rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] max-h-[510px] ${className}`}>
          <img
            src={item.url}
            alt="Post attachment"
            onClick={(e) => handleClick(e, 0)}
            className="w-full h-full max-h-[510px] object-cover hover:opacity-95 transition-opacity cursor-pointer block"
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div className={`mt-2.5 w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#eff3f4] ${className}`}>
        {renderCell(item, 0)}
      </div>
    );
  }

  // 2 Items: 2 equal side-by-side columns
  if (count === 2) {
    return (
      <div className={`mt-2.5 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-64 sm:h-72 ${className}`}>
        {items.map((item, idx) => renderCell(item, idx))}
      </div>
    );
  }

  // 3 Items: Left half 1st item, Right half stacked 2nd and 3rd
  if (count === 3) {
    return (
      <div className={`mt-2.5 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-72 sm:h-80 ${className}`}>
        {renderCell(items[0], 0)}
        <div className="grid grid-rows-2 gap-0.5 w-full h-full">
          {renderCell(items[1], 1)}
          {renderCell(items[2], 2)}
        </div>
      </div>
    );
  }

  // 4 Items: 2x2 grid
  return (
    <div className={`mt-2.5 grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-72 sm:h-80 ${className}`}>
      {items.map((item, idx) => renderCell(item, idx))}
    </div>
  );
}
