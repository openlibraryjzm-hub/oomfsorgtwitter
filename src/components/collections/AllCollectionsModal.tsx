'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Pin, Layers, Plus, Trash2 } from 'lucide-react';
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
  onReorderCollections?: (reordered: Collection[]) => void;
}

export default function AllCollectionsModal({
  isOpen,
  onClose,
  collections,
  activeCollectionId,
  onSelectCollection,
  totalPostsCount,
  totalCount,
  itemTypeLabel = 'posts',
  isSelf,
  onCreateCollection,
  onTogglePin,
  onDeleteCollection
}: AllCollectionsModalProps) {
  const count = totalCount ?? totalPostsCount ?? 0;
  const unit = itemTypeLabel;
  const isLinksMode = unit === 'links';

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mainCol = isLinksMode
    ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main')
    : null;

  const displayCollections = isLinksMode
    ? collections.filter((c) => c.id !== mainCol?.id && c.slug !== 'main')
    : collections;

  const isAtMaxLimit = displayCollections.length >= MAX_COLLECTIONS_LIMIT;

  // Filter 5 pinned slots in fixed slot order (Slot 1 to Slot 5)
  const pinnedList = displayCollections
    .filter((c) => c.isPinned)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 5);

  const filteredCollections = displayCollections.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.slug && c.slug.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#eff3f4] bg-white sticky top-0 z-20 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d9bf0] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#0f1419] text-base leading-tight">
                  {isLinksMode ? 'Featured Link Pages' : 'Featured Collections'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isAtMaxLimit
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-[#536471]'
                  }`}
                >
                  {displayCollections.length} / {MAX_COLLECTIONS_LIMIT} max
                </span>
              </div>
              <p className="text-xs text-[#536471]">
                {isLinksMode
                  ? `Select a link page to launch or adjust your top 5 quick bar pins`
                  : `Curate up to 50 playlists for your posts, carousels, and visual boards`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isSelf && onCreateCollection && (
              <button
                type="button"
                onClick={() => {
                  if (isAtMaxLimit) {
                    alert(`Maximum limit of ${MAX_COLLECTIONS_LIMIT} featured collections reached. Please delete an existing collection before adding a new one.`);
                    return;
                  }
                  onClose();
                  onCreateCollection();
                }}
                disabled={isAtMaxLimit}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                  isAtMaxLimit
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'text-[#1d9bf0] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20'
                }`}
                title={isAtMaxLimit ? 'Limit reached (50/50 max)' : 'Create new collection'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isLinksMode ? 'New Page' : 'New'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Pinned Dock (Fixed Slots 1 to 5) */}
        <div className="p-3 sm:p-3.5 bg-[#f7f9f9] border-b border-[#eff3f4]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center gap-2">
              <Pin className="w-3.5 h-3.5 text-[#1d9bf0]" />
              <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wide">
                Quick Bar Slots
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  pinnedList.length === 5
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {pinnedList.length} / 5 Pinned
              </span>
            </div>
            <span className="text-[11px] text-[#536471]">
              Fixed order: Slot 1 (leftmost) → Slot 5 (rightmost)
            </span>
          </div>

          {/* 5 Slots Grid */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((slotIndex) => {
              const item = pinnedList[slotIndex];
              return (
                <div
                  key={slotIndex}
                  className={`relative rounded-xl border p-2 flex flex-col justify-between transition-all min-h-[66px] ${
                    item
                      ? 'bg-white border-[#cfd9de] shadow-2xs hover:border-[#1d9bf0]'
                      : 'border-dashed border-gray-300 bg-white/60 text-gray-400'
                  }`}
                >
                  {/* Slot Header badge & Unpin button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        item
                          ? 'bg-[#0f1419] text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {slotIndex + 1}
                    </span>
                    {item && isSelf && onTogglePin && (
                      <button
                        type="button"
                        onClick={() => onTogglePin(item.id)}
                        title={`Remove from Slot ${slotIndex + 1}`}
                        className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Slot Content */}
                  {item ? (
                    <div className="mt-1 min-w-0">
                      <div className="text-xs font-bold text-[#0f1419] truncate flex items-center gap-1">
                        <span className="text-sm shrink-0">{item.icon || '📁'}</span>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-[10px] text-[#536471] truncate">
                        {item.itemIds.length} {unit}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col items-center justify-center text-[10px] text-gray-400 font-medium py-0.5">
                      <span>Empty</span>
                      <span className="text-[9px]">Slot {slotIndex + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Quick Reset */}
        <div className="p-3 border-b border-[#eff3f4] bg-white sticky top-[69px] z-10 flex items-center justify-between gap-2.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[#536471] absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${displayCollections.length} featured collections...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f7f9f9] border border-[#cfd9de] focus:border-[#1d9bf0] focus:bg-white rounded-full pl-9 pr-8 py-2 text-xs text-[#0f1419] outline-none shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-[#536471] hover:text-[#0f1419] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Master Full-Feed Reset Pill */}
          <button
            type="button"
            onClick={() => {
              const m = isLinksMode ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main') : null;
              onSelectCollection(m ? m.id : null);
              onClose();
            }}
            className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeCollectionId === null
                ? 'bg-[#0f1419] text-white border-transparent shadow-xs'
                : 'bg-white border-[#cfd9de] text-[#536471] hover:bg-[#f7f9f9]'
            }`}
            title={isLinksMode ? 'Return to Main Links' : 'Show full reverse-chronological feed'}
          >
            <span>{isLinksMode ? '🌐 Main' : '∞ All'}</span>
            <span className="text-[10px] opacity-80">({count})</span>
          </button>
        </div>

        {/* Scrollable 2-Column Collection Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5">
              {filteredCollections.map((col) => {
                const isActive = activeCollectionId === col.id;
                const pinnedSlotIndex = pinnedList.findIndex((p) => p.id === col.id);
                const isPinned = pinnedSlotIndex !== -1;
                const isSlotsFull = pinnedList.length >= 5 && !isPinned;

                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border p-3 flex flex-col justify-between transition-all bg-white shadow-2xs ${
                      isActive
                        ? 'border-[#1d9bf0] ring-2 ring-[#1d9bf0]/20 bg-blue-50/15'
                        : isPinned
                          ? 'border-[#0f1419]/30 hover:border-[#0f1419]/60'
                          : 'border-[#eff3f4] hover:border-[#cfd9de] hover:bg-[#f7f9f9]/50'
                    }`}
                  >
                    {/* Card Top: Icon, Title, Badges */}
                    <div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#f7f9f9] border border-black/5 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                          {col.icon || '📁'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs sm:text-sm text-[#0f1419] truncate">
                              {col.title}
                            </span>
                            {isPinned && (
                              <span className="shrink-0 text-[10px] font-extrabold bg-[#0f1419] text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Pin className="w-2.5 h-2.5" />
                                Slot {pinnedSlotIndex + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-medium text-[#536471] bg-gray-100 px-1.5 py-0.2 rounded-full">
                              {col.itemIds.length} {unit}
                            </span>
                            {col.slug && (
                              <span className="text-[10px] font-mono text-[#1d9bf0] bg-blue-50 px-1.5 py-0.2 rounded-md truncate">
                                /{col.slug}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Description */}
                      {col.description && (
                        <p className="text-xs text-[#536471] line-clamp-2 mt-2 leading-relaxed">
                          {col.description}
                        </p>
                      )}
                    </div>

                    {/* Card Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#eff3f4]">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCollection(col.id);
                          onClose();
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-[#1d9bf0] text-white shadow-2xs'
                            : 'bg-[#f7f9f9] hover:bg-[#eff3f4] text-[#0f1419]'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <span>View lens →</span>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        {isSelf && onTogglePin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSlotsFull) {
                                alert('All 5 pinned slots are full. Remove an item from the top dock to pin this collection.');
                                return;
                              }
                              onTogglePin(col.id);
                            }}
                            title={
                              isPinned
                                ? `Pinned in Slot ${pinnedSlotIndex + 1}. Click to unpin.`
                                : isSlotsFull
                                  ? 'All 5 slots filled'
                                  : 'Pin to next available quick bar slot'
                            }
                            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                              isPinned
                                ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-300'
                                : isSlotsFull
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                  : 'bg-white hover:bg-gray-100 text-[#536471] border border-[#cfd9de]'
                            }`}
                          >
                            <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-600 text-amber-600' : ''}`} />
                            <span>{isPinned ? `Slot ${pinnedSlotIndex + 1}` : '+ Pin'}</span>
                          </button>
                        )}

                        {isSelf && onDeleteCollection && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete collection "${col.title}"? Your posts will remain intact.`)) {
                                onDeleteCollection(col.id);
                              }
                            }}
                            title="Delete collection"
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-[#536471] text-xs px-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-xl">
                📁
              </div>
              <p className="font-bold text-[#0f1419] text-sm">
                {searchQuery ? `No collections match "${searchQuery}"` : `No featured collections yet`}
              </p>
              <p className="text-xs text-[#536471] max-w-xs mx-auto mt-1 mb-4">
                {searchQuery
                  ? 'Try another search term'
                  : `Curate up to ${MAX_COLLECTIONS_LIMIT} custom collections to feature on your profile.`}
              </p>
              {isSelf && onCreateCollection && !searchQuery && !isAtMaxLimit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateCollection();
                  }}
                  className="px-4 py-2 bg-[#0f1419] hover:bg-black text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  + Create First Collection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#f7f9f9] border-t border-[#eff3f4] flex items-center justify-between text-[11px] text-[#536471]">
          <span>
            {displayCollections.length} of {MAX_COLLECTIONS_LIMIT} featured collections · 5 quick bar slots max
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#1d9bf0] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
