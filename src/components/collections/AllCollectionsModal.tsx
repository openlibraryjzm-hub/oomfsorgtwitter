'use client';

import React from 'react';
import { X, Check, Pin, Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { Collection } from '@/lib/mockData';

const MAX_COLLECTIONS_LIMIT = 50;

interface AllCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  totalPostsCount?: number;
  totalCount?: number;
  itemTypeLabel?: string;
  userId?: string;
  isSelf?: boolean;
  onCreateCollection?: () => void;
  onTogglePin?: (collectionId: string) => void;
  onDeleteCollection?: (collectionId: string) => void;
  onOpenReorder?: (collection: Collection) => void;
}

export default function AllCollectionsModal({
  isOpen,
  onClose,
  collections,
  activeCollectionId,
  onSelectCollection,
  itemTypeLabel = 'posts',
  isSelf,
  onCreateCollection,
  onTogglePin,
  onDeleteCollection,
  onOpenReorder
}: AllCollectionsModalProps) {
  const isLinksMode = itemTypeLabel === 'links';

  if (!isOpen) return null;

  const mainCol = isLinksMode
    ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main')
    : null;

  const rawCollections = isLinksMode
    ? collections.filter((c) => c.id !== mainCol?.id && c.slug !== 'main')
    : collections;

  // Strict 50 collections limit on the modal
  const displayCollections = rawCollections.slice(0, MAX_COLLECTIONS_LIMIT);
  const isAtMaxLimit = displayCollections.length >= MAX_COLLECTIONS_LIMIT;

  // Filter 5 pinned slots in fixed slot order (Slot 1 to Slot 5)
  const pinnedList = displayCollections
    .filter((c) => c.isPinned)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 5);

  // Sort collections: Pinned items first (in slot order 1..5), then unpinned items
  const sortedCollections = [...displayCollections].sort((a, b) => {
    const aPinIdx = pinnedList.findIndex((p) => p.id === a.id);
    const bPinIdx = pinnedList.findIndex((p) => p.id === b.id);
    const aIsPinned = aPinIdx !== -1;
    const bIsPinned = bPinIdx !== -1;

    if (aIsPinned && bIsPinned) return aPinIdx - bPinIdx;
    if (aIsPinned) return -1;
    if (bIsPinned) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  // 50 Pokédex-style slots: existing collections fill from slot 01 onward, remaining slots are empty placeholders
  const slots = Array.from({ length: MAX_COLLECTIONS_LIMIT }, (_, index) => {
    const slotNumber = String(index + 1).padStart(2, '0');
    const collection = sortedCollections[index] ?? null;
    return { index, slotNumber, collection };
  });

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl sm:max-w-4xl w-full shadow-2xl border border-gray-100 p-4 sm:p-5 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Top Bar: Master "All" Capsule on Left + New & Close on Right */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          {/* Master "All" Feed Capsule */}
          <div
            onClick={() => {
              const m = isLinksMode ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main') : null;
              onSelectCollection(m ? m.id : null);
              onClose();
            }}
            className={`rounded-full border px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer group shadow-2xs ${
              activeCollectionId === null
                ? 'bg-[#0f1419] text-white border-[#0f1419] shadow-xs'
                : 'bg-white border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#f7f9f9]'
            }`}
            title={isLinksMode ? 'Show Main Links' : 'Show all posts (Unfiltered feed)'}
          >
            <span className="text-xs shrink-0 leading-none">{isLinksMode ? '🌐' : '∞'}</span>
            <span className={`font-bold text-xs ${activeCollectionId === null ? 'text-white' : 'text-[#0f1419]'}`}>
              {isLinksMode ? 'Main Links' : 'All Posts'}
            </span>
            {activeCollectionId === null && (
              <Check className="w-3.5 h-3.5 text-white shrink-0 ml-0.5" />
            )}
          </div>

          {/* Right Action Controls: New Collection & Close */}
          <div className="flex items-center gap-1.5">
            {isSelf && onCreateCollection && (
              <button
                type="button"
                onClick={() => {
                  if (isAtMaxLimit) {
                    alert(`Maximum limit of ${MAX_COLLECTIONS_LIMIT} collections reached.`);
                    return;
                  }
                  onClose();
                  onCreateCollection();
                }}
                disabled={isAtMaxLimit}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                  isAtMaxLimit
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-[#1d9bf0] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20'
                }`}
                title={isAtMaxLimit ? 'Limit reached (50 max)' : 'Create new collection'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isLinksMode ? 'New Page' : 'New'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 50-Grid Pokédex Layout (5 columns x 10 rows on desktop, 2 cols on mobile) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {slots.map(({ slotNumber, collection: col }) => {
              // EMPTY / PLACEHOLDER SLOT
              if (!col) {
                return (
                  <div
                    key={`slot-empty-${slotNumber}`}
                    onClick={() => {
                      if (isSelf && onCreateCollection) {
                        onClose();
                        onCreateCollection();
                      }
                    }}
                    className={`rounded-full border border-dashed px-2.5 py-1.5 flex items-center justify-between gap-1.5 transition-all min-w-0 select-none ${
                      isSelf && onCreateCollection
                        ? 'border-gray-200 hover:border-[#1d9bf0] hover:bg-blue-50/30 cursor-pointer group text-gray-400 hover:text-[#1d9bf0]'
                        : 'border-gray-100 bg-gray-50/30 text-gray-300 cursor-default'
                    }`}
                    title={
                      isSelf
                        ? `Slot #${slotNumber} empty — click to create collection`
                        : `Slot #${slotNumber} (Empty)`
                    }
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-semibold shrink-0">
                        #{slotNumber}
                      </span>
                      <span className="text-[11px] font-medium truncate opacity-40 group-hover:opacity-100">
                        {isSelf ? '+ new' : '—'}
                      </span>
                    </div>
                  </div>
                );
              }

              // FILLED SLOT
              const isActive = activeCollectionId === col.id;
              const pinnedSlotIndex = pinnedList.findIndex((p) => p.id === col.id);
              const isPinned = pinnedSlotIndex !== -1;
              const isSlotsFull = pinnedList.length >= 5 && !isPinned;

              return (
                <div
                  key={col.id}
                  onClick={() => {
                    onSelectCollection(col.id);
                    onClose();
                  }}
                  className={`rounded-full border px-2.5 py-1.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer group shadow-2xs min-w-0 ${
                    isActive
                      ? 'bg-[#0f1419] text-white border-[#0f1419] shadow-xs hover:bg-[#272c30]'
                      : isPinned
                        ? 'bg-white border-[#0f1419]/30 hover:border-[#1d9bf0] hover:bg-blue-50/20'
                        : 'bg-white border-[#eff3f4] hover:border-[#1d9bf0] hover:bg-[#f7f9f9]'
                  }`}
                  title={`Slot #${slotNumber}: ${col.title}`}
                >
                  {/* Slot Number + Icon + Preset Title */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-mono font-bold shrink-0 ${
                        isActive ? 'text-white/60' : 'text-[#8b98a5]'
                      }`}
                    >
                      #{slotNumber}
                    </span>
                    {col.icon && (
                      <span className="text-xs shrink-0 leading-none">
                        {col.icon}
                      </span>
                    )}
                    <span
                      className={`font-bold text-xs truncate ${
                        isActive ? 'text-white' : 'text-[#0f1419]'
                      }`}
                    >
                      {col.title}
                    </span>
                  </div>

                  {/* Actions & Pin Indicators */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                    )}

                    {isPinned && (
                      <Pin className={`w-2.5 h-2.5 shrink-0 ${isActive ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}`} />
                    )}

                    {isSelf && onOpenReorder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onOpenReorder(col);
                        }}
                        title={`Reorder posts in "${col.title}"`}
                        className={`p-0.5 rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100 ${
                          isActive
                            ? 'text-white/70 hover:text-white hover:bg-white/10'
                            : 'text-gray-400 hover:text-[#1d9bf0] hover:bg-blue-50'
                        }`}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    )}

                    {isSelf && onTogglePin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSlotsFull) {
                            alert('All 5 pinned slots are full. Unpin a collection to pin this one.');
                            return;
                          }
                          onTogglePin(col.id);
                        }}
                        title={
                          isPinned
                            ? `Pinned in Slot ${pinnedSlotIndex + 1}. Click to unpin.`
                            : isSlotsFull
                              ? 'All 5 slots filled'
                              : 'Pin to quick bar'
                        }
                        className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                          isActive
                            ? 'text-white/70 hover:text-white hover:bg-white/10'
                            : isPinned
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-[#1d9bf0] hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    )}

                    {isSelf && onDeleteCollection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete collection "${col.title}"? Your posts will remain intact.`)) {
                            onDeleteCollection(col.id);
                          }
                        }}
                        title="Delete collection"
                        className={`p-0.5 rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100 ${
                          isActive
                            ? 'text-white/70 hover:text-red-300 hover:bg-white/10'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
