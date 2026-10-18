'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Star, Layers, Plus, Trash2, GripVertical } from 'lucide-react';
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
  onDeleteCollection,
  onReorderCollections
}: AllCollectionsModalProps) {
  const count = totalCount ?? totalPostsCount ?? 0;
  const unit = itemTypeLabel;
  const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const isDraggable = Boolean(isSelf && onReorderCollections && !searchQuery.trim());

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isDraggable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isDraggable || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isDraggable || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...collections];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onReorderCollections?.(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  const isLinksMode = unit === 'links';
  const mainCol = isLinksMode
    ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main')
    : null;

  const displayCollections = isLinksMode
    ? collections.filter((c) => c.id !== mainCol?.id && c.slug !== 'main')
    : collections;

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
                {unit === 'links' ? 'Link Pages' : 'Curated Collections'}
              </h3>
              <p className="text-xs text-[#536471]">
                {unit === 'links'
                  ? `${collections.length} distinct pages · select a destination`
                  : `${collections.length} available presets · choose a lens`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isSelf && onCreateCollection && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateCollection();
                }}
                className="px-2.5 py-1 text-xs font-bold text-[#1d9bf0] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{unit === 'links' ? 'New Page' : 'New'}</span>
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

        {/* Search Bar */}
        <div className="p-3 border-b border-[#eff3f4] bg-[#f7f9f9]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#536471] absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={unit === 'links' ? `Search ${collections.length} link pages...` : `Search ${collections.length} collections...`}
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
          {/* Default Option: Show All Posts or Main Page for Links */}
          {!searchQuery && (
            <button
              type="button"
              onClick={() => {
                const mainCol = unit === 'links' ? collections.find(c => c.isDefault || c.slug === 'main' || c.id === 'col_link_main') : null;
                onSelectCollection(mainCol ? mainCol.id : null);
                onClose();
              }}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                activeCollectionId === null || (unit === 'links' && (activeCollectionId === 'main' || collections.find(c => c.id === activeCollectionId)?.slug === 'main'))
                  ? 'bg-[#1d9bf0]/10 text-[#0f1419]'
                  : 'hover:bg-[#f7f9f9]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-[#536471] shrink-0 border border-black/5">
                  {unit === 'links' ? '🌐' : '∞'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-[#0f1419] flex items-center gap-2">
                    <span>{unit === 'links' ? 'Main Page' : `All ${capitalizedUnit}`}</span>
                    <span className="text-[11px] font-medium text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {unit === 'links' 
                        ? `${collections.find(c => c.isDefault || c.slug === 'main' || c.id === 'col_link_main')?.itemIds?.length ?? count} items` 
                        : `${count} ${unit}`}
                    </span>
                    {unit === 'links' && (
                      <span className="text-[10px] font-mono text-[#1d9bf0] bg-blue-50 px-1.5 py-0.5 rounded-md">
                        /links
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#536471] truncate">
                    {unit === 'links' ? 'Primary bio links, socials, and featured badges' : 'Standard reverse-chronological feed'}
                  </p>
                </div>
              </div>
              {(activeCollectionId === null || (unit === 'links' && (activeCollectionId === 'main' || collections.find(c => c.id === activeCollectionId)?.slug === 'main'))) && (
                <div className="w-6 h-6 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          )}

          {/* Collection Rows */}
          {filteredCollections.length > 0 ? (
            filteredCollections.map((col, idx) => {
              const isActive = activeCollectionId === col.id;
              const isItemDragged = draggedIndex === idx;
              const isDropTarget = dragOverIndex === idx && draggedIndex !== null && draggedIndex !== idx;
              const isTargetAbove = draggedIndex !== null && idx < draggedIndex;

              return (
                <div
                  key={col.id}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    onSelectCollection(col.id);
                    onClose();
                  }}
                  className={`w-full p-3.5 flex items-center justify-between text-left transition-all group select-none relative ${
                    isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${
                    isActive
                      ? 'bg-[#1d9bf0]/10 text-[#0f1419]'
                      : 'hover:bg-[#f7f9f9]'
                  } ${
                    isItemDragged ? 'opacity-35 bg-[#1d9bf0]/5' : ''
                  } ${
                    isDropTarget
                      ? isTargetAbove
                        ? 'border-t-2 border-[#1d9bf0] bg-[#1d9bf0]/5'
                        : 'border-b-2 border-[#1d9bf0] bg-[#1d9bf0]/5'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {/* Dotted Drag Handle Indicator */}
                    {isDraggable && (
                      <div
                        className="text-gray-300 group-hover:text-gray-500 hover:text-[#0f1419] transition-colors p-1 -ml-1.5 shrink-0 flex items-center justify-center rounded cursor-grab active:cursor-grabbing"
                        title="Drag to reorder presets (top presets show leftmost)"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    <div className="w-9 h-9 rounded-xl bg-[#f7f9f9] group-hover:bg-white flex items-center justify-center text-lg shrink-0 border border-black/5 shadow-2xs transition-colors">
                      {col.icon || '📁'}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs sm:text-sm text-[#0f1419] flex items-center gap-1.5 truncate">
                        <span className="truncate">{col.title}</span>
                        <span className="text-[11px] font-medium text-[#536471] bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                          {col.itemIds.length} {unit}
                        </span>
                        {col.slug && (
                          <span className="text-[10px] font-mono text-[#1d9bf0] bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0">
                            /{col.slug}
                          </span>
                        )}
                        {col.isPinned && (
                          <span 
                            title="Pinned to quick-access bar" 
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

                  {/* Actions / Select Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Owner pin/delete actions */}
                    {isSelf && onTogglePin && (
                      <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(col.id);
                        }}
                        title={col.isPinned ? "Unpin from top row" : "Pin to top row"}
                        className={`p-1.5 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer ${
                          col.isPinned ? 'text-amber-500' : 'text-gray-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${col.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    )}

                    {isSelf && onDeleteCollection && (
                      <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete collection "${col.title}"? Your posts will remain intact.`)) {
                            onDeleteCollection(col.id);
                          }
                        }}
                        title="Delete collection"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-[#536471] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        View →
                      </div>
                    )}
                  </div>
                </div>
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
          {isDraggable ? (
            <span className="flex items-center gap-1.5 font-medium text-gray-500">
              <GripVertical className="w-3.5 h-3.5 text-gray-400" />
              <span>Drag presets to reorder · top presets pin leftmost</span>
            </span>
          ) : (
            <span>Showing {filteredCollections.length} of {collections.length} presets</span>
          )}
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
