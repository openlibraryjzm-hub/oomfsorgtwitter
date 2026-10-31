'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface BoardCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
  aspectRatio?: number; // default 2.0 (2:1 landscape)
}

export default function BoardCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  aspectRatio = 2.0
}: BoardCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewSize, setViewSize] = useState({ width: 520, height: 260 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container viewport on mount and resize
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          const width = Math.min(rect.width, 540);
          const height = width / aspectRatio;
          setViewSize({ width, height });
        }
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isOpen, aspectRatio]);

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

  // Calculate base dimensions that cover the viewfinder at zoom = 1
  const { baseWidth, baseHeight } = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !viewSize.width || !viewSize.height) {
      return { baseWidth: viewSize.width, baseHeight: viewSize.height };
    }

    const imgAspect = naturalSize.width / naturalSize.height;

    if (imgAspect >= aspectRatio) {
      // Image is wider than crop box -> cover by height
      const h = viewSize.height;
      const w = h * imgAspect;
      return { baseWidth: w, baseHeight: h };
    } else {
      // Image is taller than crop box -> cover by width
      const w = viewSize.width;
      const h = w / imgAspect;
      return { baseWidth: w, baseHeight: h };
    }
  }, [naturalSize, viewSize, aspectRatio]);

  // Compute maximum allowable pan so empty space never appears
  const currentWidth = baseWidth * zoom;
  const currentHeight = baseHeight * zoom;
  const maxPanX = Math.max(0, (currentWidth - viewSize.width) / 2);
  const maxPanY = Math.max(0, (currentHeight - viewSize.height) / 2);

  // Clamp pan when zoom changes or pan updates
  const clampPan = useCallback(
    (p: { x: number; y: number }, z: number) => {
      const curW = baseWidth * z;
      const curH = baseHeight * z;
      const maxX = Math.max(0, (curW - viewSize.width) / 2);
      const maxY = Math.max(0, (curH - viewSize.height) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y))
      };
    },
    [baseWidth, baseHeight, viewSize]
  );

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev, clampedZoom));
  };

  // Drag handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setPan(clampPan({ x: rawX, y: rawY }, zoom));
    },
    [isDragging, dragStart, clampPan, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const rawX = e.touches[0].clientX - dragStart.x;
    const rawY = e.touches[0].clientY - dragStart.y;
    setPan(clampPan({ x: rawX, y: rawY }, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    handleZoomChange(zoom * zoomFactor);
  };

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

  // Apply crop: Render to canvas and export full-res 2:1 JPEG
  const handleApply = () => {
    if (!naturalSize.width || !naturalSize.height) return;

    const exportWidth = 1200;
    const exportHeight = exportWidth / aspectRatio;

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = currentWidth / naturalSize.width;
    const sViewWidth = viewSize.width / scale;
    const sViewHeight = viewSize.height / scale;

    const sCenterX = naturalSize.width / 2 - pan.x / scale;
    const sCenterY = naturalSize.height / 2 - pan.y / scale;

    const sx = Math.max(0, sCenterX - sViewWidth / 2);
    const sy = Math.max(0, sCenterY - sViewHeight / 2);
    const sWidth = Math.min(naturalSize.width - sx, sViewWidth);
    const sHeight = Math.min(naturalSize.height - sy, sViewHeight);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, exportWidth, exportHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onApply(dataUrl);
      onClose();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-[#0f1419]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-sm sm:text-base text-[#0f1419]">
              Frame Cover Photo
            </h2>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </div>

        {/* Viewfinder Area */}
        <div
          ref={containerRef}
          className="relative bg-black flex items-center justify-center py-6 px-4 select-none overflow-hidden"
          onWheel={handleWheel}
        >
          {/* Viewport Box (Strictly matches 2:1 aspect ratio) */}
          <div
            style={{ width: viewSize.width, height: viewSize.height }}
            className="relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing border-2 border-white/80 shadow-2xl"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image being panned and zoomed */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${currentWidth}px`,
                  height: `${currentHeight}px`,
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Subtle Rule-of-Thirds Grid Lines while dragging */}
            {isDragging && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-white border-t border-[#eff3f4]">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.15)}
            className="p-1.5 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-48 sm:w-64 accent-[#1d9bf0] cursor-pointer"
          />
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.15)}
            className="p-1.5 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Hint */}
        <div className="px-4 pb-3 pt-0 text-center bg-white text-[11px] text-[#536471]">
          Drag to position your focal subject · Zoom to frame
        </div>
      </div>
    </div>
  );
}
