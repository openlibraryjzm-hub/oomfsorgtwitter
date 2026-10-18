'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';

interface BannerCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string, croppedBlob: Blob) => void;
}

export default function BannerCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
}: BannerCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewSize, setViewSize] = useState({ width: 540, height: 180 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Measure container viewport on mount and resize
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setViewSize({ width: rect.width, height: rect.height });
        }
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isOpen]);

  // Reset state when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageSrc]);

  // Load natural image size
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Calculate base dimensions that cover the 3:1 viewfinder at zoom = 1 (identical to Twitter/X)
  const { baseWidth, baseHeight } = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !viewSize.width || !viewSize.height) {
      return { baseWidth: viewSize.width, baseHeight: viewSize.height };
    }

    const imgAspect = naturalSize.width / naturalSize.height;
    const viewAspect = viewSize.width / viewSize.height; // Exactly 3.0

    if (imgAspect >= viewAspect) {
      // Image is wider than 3:1 -> cover by height
      const h = viewSize.height;
      const w = h * imgAspect;
      return { baseWidth: w, baseHeight: h };
    } else {
      // Image is taller than 3:1 -> cover by width
      const w = viewSize.width;
      const h = w / imgAspect;
      return { baseWidth: w, baseHeight: h };
    }
  }, [naturalSize, viewSize]);

  // Compute maximum allowable pan so empty space never appears
  const currentWidth = baseWidth * zoom;
  const currentHeight = baseHeight * zoom;
  const maxPanX = Math.max(0, (currentWidth - viewSize.width) / 2);
  const maxPanY = Math.max(0, (currentHeight - viewSize.height) / 2);

  // Clamp pan when zoom changes or pan updates
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      const cW = baseWidth * currentZoom;
      const cH = baseHeight * currentZoom;
      const mX = Math.max(0, (cW - viewSize.width) / 2);
      const mY = Math.max(0, (cH - viewSize.height) / 2);
      return {
        x: Math.max(-mX, Math.min(mX, x)),
        y: Math.max(-mY, Math.min(mY, y)),
      };
    },
    [baseWidth, baseHeight, viewSize]
  );

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const nextX = e.clientX - dragStart.x;
      const nextY = e.clientY - dragStart.y;
      setPan(clampPan(nextX, nextY, zoom));
    },
    [isDragging, dragStart, clampPan, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const nextX = e.touches[0].clientX - dragStart.x;
    const nextY = e.touches[0].clientY - dragStart.y;
    setPan(clampPan(nextX, nextY, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler on the viewport (desktop smooth scrolling)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(3.0, Math.max(1.0, +(prevZoom + delta).toFixed(3)));
        setPan((prevPan) => clampPan(prevPan.x, prevPan.y, nextZoom));
        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clampPan]);

  // Window drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle zoom slider change
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3.0, Math.max(1.0, newZoom));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
  };

  // Apply crop: Exact 1:1 mathematical projection to 1500x500
  const handleApply = async () => {
    if (!naturalSize.width || !naturalSize.height) return;

    const TARGET_WIDTH = 1500;
    const TARGET_HEIGHT = 500;

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Relative crop box inside the scaled image
    // Center of scaled image is at (viewSize.width / 2 + pan.x, viewSize.height / 2 + pan.y)
    const scaledImgLeft = viewSize.width / 2 + pan.x - currentWidth / 2;
    const scaledImgTop = viewSize.height / 2 + pan.y - currentHeight / 2;

    const cropBoxXInScaled = 0 - scaledImgLeft;
    const cropBoxYInScaled = 0 - scaledImgTop;

    // Scale factor from scaled preview image to original full-resolution image
    const scaleFactor = naturalSize.width / currentWidth; // equals naturalSize.height / currentHeight

    const sourceCropX = Math.max(0, cropBoxXInScaled * scaleFactor);
    const sourceCropY = Math.max(0, cropBoxYInScaled * scaleFactor);
    const sourceCropWidth = Math.min(naturalSize.width - sourceCropX, viewSize.width * scaleFactor);
    const sourceCropHeight = Math.min(naturalSize.height - sourceCropY, viewSize.height * scaleFactor);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sourceImg = new Image();
    sourceImg.crossOrigin = 'anonymous';
    sourceImg.src = imageSrc;

    await new Promise((resolve) => {
      if (sourceImg.complete) {
        resolve(null);
      } else {
        sourceImg.onload = () => resolve(null);
      }
    });

    ctx.drawImage(
      sourceImg,
      sourceCropX,
      sourceCropY,
      sourceCropWidth,
      sourceCropHeight,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    canvas.toBlob(
      (blob) => {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        if (blob) {
          onApply(dataUrl, blob);
        } else {
          fetch(dataUrl)
            .then((r) => r.blob())
            .then((fallbackBlob) => onApply(dataUrl, fallbackBlob));
        }
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#000000] text-white rounded-2xl max-w-xl w-full border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header: 1:1 X "Edit media" */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Cancel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-lg text-white">Edit media</h3>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="bg-white hover:bg-neutral-200 text-black font-bold text-sm px-5 py-1.5 rounded-full cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>

        {/* 3:1 Viewport Viewfinder */}
        <div className="p-4 sm:p-6 flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full aspect-[3/1] max-w-[540px] bg-neutral-950 relative overflow-hidden rounded-xs border-2 border-white/70 cursor-${
              isDragging ? 'grabbing' : 'grab'
            } flex items-center justify-center shadow-lg`}
          >
            {/* Viewfinder crosshairs / grid */}
            <div className="absolute inset-0 pointer-events-none border border-white/20 z-10" />

            {/* Target Image: Scaled to cover 100% of the 3:1 area at zoom = 1 */}
            {naturalSize.width > 0 && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                style={{
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                }}
                className="pointer-events-none select-none"
                draggable={false}
              />
            )}
          </div>

          <p className="text-xs text-neutral-400 mt-3 text-center">
            Drag to reposition. Scroll or use slider to zoom (1500×500 3:1).
          </p>
        </div>

        {/* Zoom Controls Slider: 1:1 X Zoom Slider */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleZoomChange(+(zoom - 0.15).toFixed(2))}
            disabled={zoom <= 1.0}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-48 sm:w-64 accent-[#1d9bf0] cursor-pointer h-1.5 bg-neutral-700 rounded-lg appearance-none"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(+(zoom + 0.15).toFixed(2))}
            disabled={zoom >= 3.0}
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
