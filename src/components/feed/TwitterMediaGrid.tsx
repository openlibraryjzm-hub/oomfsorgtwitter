'use client';

import React from 'react';

interface TwitterMediaGridProps {
  images: string[];
  onImageClick?: (e: React.MouseEvent, index: number) => void;
  className?: string;
}

export default function TwitterMediaGrid({ images, onImageClick, className = '' }: TwitterMediaGridProps) {
  if (!images || images.length === 0) return null;

  const validImages = images.slice(0, 4);
  const count = validImages.length;

  const handleClick = (e: React.MouseEvent, idx: number) => {
    if (onImageClick) {
      e.stopPropagation();
      onImageClick(e, idx);
    }
  };

  // 1 Image: single responsive frame
  if (count === 1) {
    return (
      <div className={`mt-2.5 w-full rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] max-h-[510px] ${className}`}>
        <img
          src={validImages[0]}
          alt="Post attachment"
          onClick={(e) => handleClick(e, 0)}
          className="w-full h-full max-h-[510px] object-cover hover:opacity-95 transition-opacity cursor-pointer block"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 Images: 2 equal side-by-side columns
  if (count === 2) {
    return (
      <div className={`mt-2.5 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-64 sm:h-72 ${className}`}>
        {validImages.map((img, idx) => (
          <div key={idx} className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
            <img
              src={img}
              alt={`Attachment ${idx + 1}`}
              onClick={(e) => handleClick(e, idx)}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 Images: Left half 1st image, Right half stacked 2nd and 3rd
  if (count === 3) {
    return (
      <div className={`mt-2.5 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-72 sm:h-80 ${className}`}>
        {/* Left half: Image 1 */}
        <div className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
          <img
            src={validImages[0]}
            alt="Attachment 1"
            onClick={(e) => handleClick(e, 0)}
            className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
            loading="lazy"
          />
        </div>
        {/* Right half: 2 stacked images */}
        <div className="grid grid-rows-2 gap-0.5 w-full h-full">
          <div className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
            <img
              src={validImages[1]}
              alt="Attachment 2"
              onClick={(e) => handleClick(e, 1)}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
              loading="lazy"
            />
          </div>
          <div className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
            <img
              src={validImages[2]}
              alt="Attachment 3"
              onClick={(e) => handleClick(e, 2)}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4 Images: 2x2 grid
  return (
    <div className={`mt-2.5 grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4] h-72 sm:h-80 ${className}`}>
      {validImages.map((img, idx) => (
        <div key={idx} className="relative w-full h-full bg-[#f7f9f9] overflow-hidden">
          <img
            src={img}
            alt={`Attachment ${idx + 1}`}
            onClick={(e) => handleClick(e, idx)}
            className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
