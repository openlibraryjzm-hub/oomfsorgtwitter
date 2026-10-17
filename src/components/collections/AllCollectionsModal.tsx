'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Star, Layers } from 'lucide-react';
import { Collection } from '@/lib/mockData';

interface AllCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  totalPostsCount?: number;
  totalCount?: number;
  itemTypeLabel?: string;
}

export default function AllCollectionsModal({
  isOpen,
  onClose,
  collections,
  activeCollectionId,
  onSelectCollection,
  totalPostsCount,
  totalCount,
  itemTypeLabel = 'posts'
}: AllCollectionsModalProps) {
  const count = totalCount ?? totalPostsCount ?? 0;
  const unit = itemTypeLabel;
  const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCollections = collections.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#eff3f4] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1d9bf0]" />
            <div>
              <h3 className="font-extrabold text-[#0f1419] text-base leading-tight">
                Curated Collections
              </h3>
              <p className="text-xs text-[#536471]">
                {collections.length} available presets · choose a lens
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#eff3f4] bg-[#f7f9f9]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#536471] absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${collections.length} collections...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#cfd9de] focus:border-[#1d9bf0] rounded-full pl-9 pr-8 py-2 text-xs text-[#0f1419] outline-none shadow-2xs"
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
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#eff3f4]">
          {/* Default Option: Show All Posts */}
          {!searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSelectCollection(null);
                onClose();
              }}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                activeCollectionId === null
                  ? 'bg-[#1d9bf0]/10 text-[#0f1419]'
                  : 'hover:bg-[#f7f9f9]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-[#536471] shrink-0 border border-black/5">
                  ∞
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-[#0f1419] flex items-center gap-2">
                    <span>All {capitalizedUnit}</span>
                    <span className="text-[11px] font-medium text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {count} {unit}
                    </span>
                  </div>
                  <p className="text-xs text-[#536471] truncate">
                    {unit === 'links' ? 'Default curated order' : 'Standard reverse-chronological feed'}
                  </p>
                </div>
              </div>
              {activeCollectionId === null && (
                <div className="w-6 h-6 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          )}

          {/* Collection Rows */}
          {filteredCollections.length > 0 ? (
            filteredCollections.map((col) => {
              const isActive = activeCollectionId === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    onSelectCollection(col.id);
                    onClose();
                  }}
                  className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-[#1d9bf0]/10 text-[#0f1419]'
                      : 'hover:bg-[#f7f9f9]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#f7f9f9] group-hover:bg-white flex items-center justify-center text-lg shrink-0 border border-black/5 shadow-2xs transition-colors">
                      {col.icon || '📁'}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs sm:text-sm text-[#0f1419] flex items-center gap-1.5 truncate">
                        <span className="truncate">{col.title}</span>
                        <span className="text-[11px] font-medium text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                          {col.itemIds.length} {unit}
                        </span>
                        {col.isPinned && (
                          <span 
                            title="Pinned to top row" 
                            className="text-amber-500 shrink-0 flex items-center"
                          >
                            <Star className="w-3 h-3 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      {col.description && (
                        <p className="text-xs text-[#536471] truncate mt-0.5">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-[#536471] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      View →
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-[#536471] text-xs">
              No collections match &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#f7f9f9] border-t border-[#eff3f4] flex items-center justify-between text-[11px] text-[#536471]">
          <span>Showing {filteredCollections.length} of {collections.length} presets</span>
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
