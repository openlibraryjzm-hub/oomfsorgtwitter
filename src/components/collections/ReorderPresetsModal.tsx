'use client';

import React, { useState, useEffect } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, Trash2, Star } from 'lucide-react';
import { Collection } from '@/lib/mockData';

interface ReorderPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onReorder: (reordered: Collection[]) => void;
  onDelete?: (collectionId: string) => void;
  onTogglePin?: (collectionId: string) => void;
}

export default function ReorderPresetsModal({
  isOpen,
  onClose,
  collections,
  onReorder,
  onDelete,
  onTogglePin
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

  const handleDeleteItem = (col: Collection) => {
    const cleanTitle = col.title
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      .trim() || 'Preset';

    if (
      window.confirm(
        `Delete preset "${cleanTitle}"? Your boards will remain intact on your profile.`
      )
    ) {
      if (onDelete) {
        onDelete(col.id);
      }
      const updated = items.filter((c) => c.id !== col.id);
      setItems(updated);
      setHasChanges(true);
    }
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
                Manage Presets
              </h3>
              <p className="text-[11px] text-[#536471] truncate">
                Drag to rearrange, use step arrows, or delete presets
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

        {/* Reorderable & Deletable Preset List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
          {items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {items.map((col, idx) => {
                const isDraggingThis = draggedIndex === idx;
                const isTargeted = dragOverIndex === idx;
                const cleanTitle = col.title
                  .replace(
                    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
                    ''
                  )
                  .trim() || 'Preset';

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
                    {/* Left: Grip, Position Number, Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-[#1d9bf0] shrink-0" />
                      <span className="w-5 h-5 rounded-full bg-[#0f1419] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-[#0f1419] truncate leading-snug">
                            {cleanTitle}
                          </p>
                          <span className="text-[10px] font-semibold text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                            {col.itemIds?.length || 0} boards
                          </span>
                          {col.isPinned && (
                            <span className="text-[10px] font-semibold text-[#1d9bf0] bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-[#1d9bf0]" />
                              Top Bar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Pin Toggle, Quick Move Arrows & Delete Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onTogglePin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(col.id);
                            setItems((prev) =>
                              prev.map((c) =>
                                c.id === col.id ? { ...c, isPinned: !c.isPinned } : c
                              )
                            );
                          }}
                          aria-label={col.isPinned ? 'Unpin from top bar' : 'Pin to top bar'}
                          title={col.isPinned ? 'Pinned to top bar (click to unpin)' : 'Pin to top bar'}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer mr-0.5 ${
                            col.isPinned
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-[#536471] hover:text-[#0f1419] hover:bg-gray-100'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${col.isPinned ? 'fill-amber-500' : ''}`} />
                        </button>
                      )}

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

                      {/* Delete Preset Button */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(col);
                          }}
                          aria-label={`Delete preset ${cleanTitle}`}
                          title="Delete preset"
                          className="p-1.5 rounded-md text-[#536471] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 text-[#536471]">
              <p className="text-sm font-semibold">No presets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
