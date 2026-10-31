'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Pencil, Eraser, PaintBucket, Undo2, Redo2, Trash2, Pipette, Sparkles, Check, Image as ImageIcon, Upload } from 'lucide-react';

interface DoodleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doodleDataUrl: string) => void;
  initialImage?: string | null;
}

const STROKE_SIZES = [
  { size: 2, label: 'Fine', dotSize: 4 },
  { size: 5, label: 'Medium', dotSize: 7 },
  { size: 10, label: 'Thick', dotSize: 11 },
  { size: 20, label: 'Chunky', dotSize: 16 },
];

const PRESET_COLORS = [
  '#000000', // Black
  '#536471', // Charcoal / Pencil
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#facc15', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#1d9bf0', // Twitter Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [0, 0, 0, 255];
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
    255,
  ];
}

export default function DoodleModal({ isOpen, onClose, onSave, initialImage }: DoodleModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<'pen' | 'eraser' | 'bucket'>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [strokeSize, setStrokeSize] = useState<number>(5);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [hasBackgroundPhoto, setHasBackgroundPhoto] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // History stack for undo/redo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Drawing state refs
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Save current canvas state to history
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snapshot);

    // Limit history stack size to 30 steps
    if (newHistory.length > 30) {
      newHistory.shift();
    }

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setHasDrawn(historyIndexRef.current > 0);
  }, []);

  // Draw an image onto the canvas (scaled with aspect-fit contain and centered)
  const drawImageOnCanvas = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clear with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale to fit (contain) inside 600x450
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );

      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [snapshot];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      setHasDrawn(true);
      setHasBackgroundPhoto(true);
    };
    img.src = src;
  }, []);

  // Initialize blank canvas with white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill solid white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial snapshot
    const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [initialSnapshot];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setHasDrawn(false);
    setHasBackgroundPhoto(false);
  }, []);

  // Re-initialize or load initial background when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (initialImage) {
          drawImageOnCanvas(initialImage);
        } else {
          initCanvas();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialImage, initCanvas, drawImageOnCanvas]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        drawImageOnCanvas(result);
      }
    };
    reader.readAsDataURL(file);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          drawImageOnCanvas(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    ctx.putImageData(snapshot, 0, 0);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setHasDrawn(historyIndexRef.current > 0);
  }, []);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    ctx.putImageData(snapshot, 0, 0);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setHasDrawn(historyIndexRef.current > 0);
  }, []);

  // Clear Canvas (Undoable)
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  // Coordinates helper mapping screen pointer coords to canvas internal resolution
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bucket Tool: Flood Fill
    if (tool === 'bucket') {
      const coords = getCanvasCoords(e);
      const startX = Math.floor(coords.x);
      const startY = Math.floor(coords.y);
      if (startX < 0 || startX >= canvas.width || startY < 0 || startY >= canvas.height) return;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const width = canvas.width;
      const height = canvas.height;

      const startIdx = (startY * width + startX) * 4;
      const targetR = data[startIdx];
      const targetG = data[startIdx + 1];
      const targetB = data[startIdx + 2];
      const targetA = data[startIdx + 3];

      const [fillR, fillG, fillB, fillA] = hexToRgba(color);

      // If the clicked pixel already matches the fill color, return
      if (
        Math.abs(targetR - fillR) <= 2 &&
        Math.abs(targetG - fillG) <= 2 &&
        Math.abs(targetB - fillB) <= 2 &&
        Math.abs(targetA - fillA) <= 2
      ) {
        return;
      }

      const tolerance = 32;
      const colorMatch = (idx: number) => {
        return (
          Math.abs(data[idx] - targetR) <= tolerance &&
          Math.abs(data[idx + 1] - targetG) <= tolerance &&
          Math.abs(data[idx + 2] - targetB) <= tolerance &&
          Math.abs(data[idx + 3] - targetA) <= tolerance
        );
      };

      const totalPixels = width * height;
      const visited = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels);
      let qHead = 0;
      let qTail = 0;

      const startPos = startX + startY * width;
      queue[qTail++] = startPos;
      visited[startPos] = 1;

      while (qHead < qTail) {
        const pos = queue[qHead++];
        const x = pos % width;
        const y = (pos / width) | 0;
        const idx = pos << 2;

        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;

        if (x > 0) {
          const next = pos - 1;
          if (!visited[next] && colorMatch(next << 2)) {
            visited[next] = 1;
            queue[qTail++] = next;
          }
        }
        if (x < width - 1) {
          const next = pos + 1;
          if (!visited[next] && colorMatch(next << 2)) {
            visited[next] = 1;
            queue[qTail++] = next;
          }
        }
        if (y > 0) {
          const next = pos - width;
          if (!visited[next] && colorMatch(next << 2)) {
            visited[next] = 1;
            queue[qTail++] = next;
          }
        }
        if (y < height - 1) {
          const next = pos + width;
          if (!visited[next] && colorMatch(next << 2)) {
            visited[next] = 1;
            queue[qTail++] = next;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      pushHistory();
      return;
    }

    // Capture pointer for smooth drawing even if cursor exits canvas area
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    const isEraser = tool === 'eraser';
    const activeColor = isEraser ? '#ffffff' : color;
    const activeWidth = isEraser ? strokeSize * 2.5 : strokeSize;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = activeWidth;
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;

    // Draw single dot on tap
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, activeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'bucket' || !isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const isEraser = tool === 'eraser';
    const activeColor = isEraser ? '#ffffff' : color;
    const activeWidth = isEraser ? strokeSize * 2.5 : strokeSize;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = activeWidth;
    ctx.strokeStyle = activeColor;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
  };

  // Pointer Up / Cancel
  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    pushHistory();
  };

  // Save Doodle & Attach
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-[#eff3f4] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#eff3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center text-[#1d9bf0]">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0f1419] leading-tight flex items-center gap-1.5">
                <span>Strawpage Doodler</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#1d9bf0]">
                  Doodle
                </span>
              </h2>
              <p className="text-xs text-[#536471]">
                Draw a sketch or doodle directly on top of an image
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hidden image input for importing backgrounds */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-[#1d9bf0]/30"
              title="Import an image to doodle on top"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{hasBackgroundPhoto ? 'Replace Photo' : 'Import Photo'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#536471] hover:text-[#0f1419] hover:bg-[#eff3f4] rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-3 sm:p-4 bg-[#f7f9f9] flex flex-col items-center">
          <div 
            className="w-full relative shadow-xs rounded-xl overflow-hidden bg-white border border-[#cfd9de]"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`w-full aspect-[4/3] max-w-full block bg-white select-none touch-none ${
                tool === 'bucket' ? 'cursor-crosshair' : tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
              }`}
              style={{ touchAction: 'none' }}
            />

            {/* Drag & Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-[#1d9bf0]/20 backdrop-blur-2xs border-2 border-dashed border-[#1d9bf0] rounded-xl flex items-center justify-center text-[#1d9bf0] font-bold text-sm z-10 pointer-events-none">
                Drop image here to doodle on top!
              </div>
            )}

            {/* Subtle Empty State Helper */}
            {!hasDrawn && !hasBackgroundPhoto && (
              <div className="absolute bottom-2 right-2 text-[11px] text-[#536471]/80 pointer-events-none select-none bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-xs border border-gray-100 shadow-2xs">
                Tip: Click &apos;Import Photo&apos; or drop an image to doodle on top
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#eff3f4] flex flex-col gap-3">
          {/* Top Control Row: Tools, Sizes, Undo/Redo/Clear */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Tool Mode: Pen / Bucket / Eraser */}
            <div className="flex items-center gap-1 bg-[#eff3f4] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tool === 'pen'
                    ? 'bg-white text-[#0f1419] shadow-xs'
                    : 'text-[#536471] hover:text-[#0f1419]'
                }`}
                title="Draw"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Draw</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('bucket')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tool === 'bucket'
                    ? 'bg-white text-[#0f1419] shadow-xs'
                    : 'text-[#536471] hover:text-[#0f1419]'
                }`}
                title="Fill Bucket"
              >
                <PaintBucket className="w-3.5 h-3.5" />
                <span>Bucket</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-white text-[#0f1419] shadow-xs'
                    : 'text-[#536471] hover:text-[#0f1419]'
                }`}
                title="Eraser"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>
            </div>

            {/* Stroke Sizes */}
            <div className={`flex items-center gap-1.5 bg-[#eff3f4] p-1 rounded-xl transition-opacity ${
              tool === 'bucket' ? 'opacity-40 pointer-events-none' : ''
            }`}>
              {STROKE_SIZES.map((item) => (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => setStrokeSize(item.size)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    strokeSize === item.size
                      ? 'bg-white shadow-xs'
                      : 'hover:bg-black/5'
                  }`}
                  title={`${item.label} (${item.size}px)`}
                >
                  <span
                    className="rounded-full bg-[#0f1419]"
                    style={{
                      width: `${item.dotSize}px`,
                      height: `${item.dotSize}px`,
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Undo, Redo, Clear */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                disabled={!canUndo}
                onClick={handleUndo}
                className="p-2 text-[#536471] hover:text-[#0f1419] hover:bg-[#eff3f4] disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={handleRedo}
                className="p-2 text-[#536471] hover:text-[#0f1419] hover:bg-[#eff3f4] disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer ml-1"
                title="Clear Canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Palette Swatches */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {PRESET_COLORS.map((c) => {
              const isSelected = tool !== 'eraser' && color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 transition-transform cursor-pointer relative flex items-center justify-center ${
                    isSelected ? 'scale-110 ring-2 ring-offset-2 ring-[#1d9bf0]' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c,
                    border: c.toLowerCase() === '#ffffff' ? '1px solid #cfd9de' : 'none',
                  }}
                  title={c}
                >
                  {isSelected && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#facc15'
                          ? 'bg-black'
                          : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            {/* Custom Color Pipette */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  colorInputRef.current?.click();
                  if (tool === 'eraser') setTool('pen');
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-[#536471] hover:border-[#1d9bf0] flex items-center justify-center text-[#536471] hover:text-[#1d9bf0] transition-colors cursor-pointer`}
                title="Custom color"
              >
                <Pipette className="w-3.5 h-3.5" />
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  if (tool === 'eraser') setTool('pen');
                }}
                className="sr-only"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#eff3f4] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#536471] hover:text-[#0f1419] px-4 py-2 rounded-full hover:bg-[#eff3f4] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!hasDrawn}
            onClick={handleSave}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 text-white font-bold text-sm px-6 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Attach Doodle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
