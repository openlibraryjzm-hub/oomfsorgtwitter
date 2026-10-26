'use client';

import React, { useState, useEffect } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Collection } from '@/lib/mockData';

interface ReorderPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onReorder: (reordered: Collection[]) => void;
}

export default function ReorderPresetsModal({
  isOpen,
  onClose,
  collections,
  onReorder,
}: ReorderPresetsModalProps) {
  const [items, setItems] = useState<Collection[]>(collections);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync items when collections prop updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setItems(collections);
      setHasChanges(false);
    }
  }, [isOpen, collections]);

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

  // Close on Escape key
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

  if (!isOpen) return null;

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
    setHasChanges(true);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    handleMove(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    if (hasChanges) {
      onReorder(items);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={handleSave}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eff3f4] bg-white px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#0f1419] text-base leading-tight truncate">
                Rearrange Presets
              </h3>
              <p className="text-[11px] text-[#536471] truncate">
                Drag cards or use arrows to customize their order on your profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="text-xs font-bold text-white bg-[#0f1419] hover:bg-[#272c30] px-4 py-1.5 rounded-full transition-colors cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>

        {/* Reorderable Preset List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
          {items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {items.map((col, idx) => {
                const isDraggingThis = draggedIndex === idx;
                const isTargeted = dragOverIndex === idx;

                return (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      setDraggedIndex(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverIndex !== idx) setDragOverIndex(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === idx) setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(idx);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 transition-all select-none group shadow-2xs cursor-grab active:cursor-grabbing ${
                      isDraggingThis
                        ? 'opacity-40 border-[#1d9bf0] scale-98 bg-blue-50/20'
                        : isTargeted
                          ? 'border-[#1d9bf0] ring-2 ring-[#1d9bf0]/30 bg-blue-50/30'
                          : 'border-[#eff3f4] bg-white hover:border-[#1d9bf0] hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Grip, Position Number, Icon, Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-[#1d9bf0] shrink-0" />
                      <span className="w-5 h-5 rounded-full bg-[#0f1419] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                        {col.icon || '📁'}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-[#0f1419] truncate leading-snug">
                            {col.title}
                          </p>
                          <span className="text-[10px] font-semibold text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                            {col.itemIds?.length || 0} posts
                          </span>
                        </div>
                        {col.description && (
                          <p className="text-xs text-[#536471] truncate mt-0.5">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Move Arrows */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, idx - 1);
                        }}
                        disabled={idx === 0}
                        aria-label="Move preset up"
                        title="Move up"
                        className="p-1 rounded-md text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, idx + 1);
                        }}
                        disabled={idx === items.length - 1}
                        aria-label="Move preset down"
                        title="Move down"
                        className="p-1 rounded-md text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 text-[#536471]">
              <p className="text-sm font-semibold">No presets found to rearrange</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
