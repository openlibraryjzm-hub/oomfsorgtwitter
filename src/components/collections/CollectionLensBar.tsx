'use client';

import React from 'react';
import { ChevronDown, LayoutGrid, X, Plus } from 'lucide-react';
import { Collection } from '@/lib/mockData';

interface CollectionLensBarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onOpenAllModal: () => void;
  totalPostsCount?: number;
  totalCount?: number;
  isSelf?: boolean;
  onCreateCollection?: () => void;
  mode?: 'posts' | 'links';
}

export default function CollectionLensBar({
  collections,
  activeCollectionId,
  onSelectCollection,
  onOpenAllModal,
  totalPostsCount,
  totalCount,
  isSelf,
  onCreateCollection,
  mode = 'posts'
}: CollectionLensBarProps) {
  const count = totalCount ?? totalPostsCount ?? 0;
  const isLinksMode = mode === 'links';

  // For links mode, identify the main/default link page
  const mainCollection = isLinksMode
    ? collections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main')
    : null;
  const isMainActive = isLinksMode
    ? (activeCollectionId === null || activeCollectionId === 'main' || activeCollectionId === mainCollection?.id)
    : (activeCollectionId === null);

  const pinnedCollections = collections
    .filter((c) => {
      if (!c.isPinned) return false;
      if (isLinksMode && (c.isDefault || c.id === mainCollection?.id || c.slug === 'main')) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 5);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);
  const isUnpinnedActive = activeCollection && !activeCollection.isPinned && (
    !isLinksMode || (activeCollection.id !== mainCollection?.id && activeCollection.slug !== 'main')
  );

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 px-4 border-b border-[#eff3f4] bg-white select-none shrink-0">
      {/* 1. Primary Leftmost Pill (All Feed for Posts, Main Page for Links) */}
      <button
        type="button"
        onClick={() => onSelectCollection(isLinksMode ? (mainCollection ? mainCollection.id : null) : null)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
          isMainActive
            ? 'bg-[#0f1419] text-white shadow-xs'
            : 'bg-white border border-[#eff3f4] text-[#536471] hover:bg-[#f7f9f9] hover:text-[#0f1419]'
        }`}
      >
        {isLinksMode && <span className="text-xs">{mainCollection?.icon || '🌐'}</span>}
        <span>{isLinksMode ? (mainCollection?.title || 'Main') : 'All'}</span>
        <span
          className={`text-[10px] ml-0.5 ${
            isMainActive ? 'text-white/80' : 'text-[#536471]'
          }`}
        >
          ({isLinksMode ? (mainCollection?.itemIds?.length ?? count) : count})
        </span>
      </button>

      {/* 2. Pinned Lenses (Top 4) */}
      {pinnedCollections.map((col) => {
        const isActive = activeCollectionId === col.id;
        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onSelectCollection(col.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#0f1419] text-white shadow-xs'
                : 'bg-white border border-[#eff3f4] text-[#536471] hover:bg-[#f7f9f9] hover:text-[#0f1419]'
            }`}
          >
            {col.icon && <span className="text-xs">{col.icon}</span>}
            <span>{col.title}</span>
            <span
              className={`text-[10px] ml-0.5 ${
                isActive ? 'text-white/80' : 'text-[#536471]'
              }`}
            >
              ({col.itemIds.length})
            </span>
          </button>
        );
      })}

      {/* 3. Surface active unpinned collection if selected from modal */}
      {isUnpinnedActive && (
        <div className="flex items-center gap-1 bg-[#0f1419] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs whitespace-nowrap shrink-0">
          {activeCollection.icon && <span className="text-xs">{activeCollection.icon}</span>}
          <span>{activeCollection.title}</span>
          <span className="text-[10px] text-white/80 ml-0.5">
            ({activeCollection.itemIds.length})
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCollection(null);
            }}
            className="ml-1 p-0.5 hover:bg-white/20 rounded-full cursor-pointer transition-colors"
            title="Reset to All"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* 4. "Browse All (N) ▾" Scalability Pill */}
      {collections.length > 0 && (
        <button
          type="button"
          onClick={onOpenAllModal}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-[#f7f9f9] border border-[#cfd9de] text-[#0f1419] hover:bg-[#eff3f4] hover:border-gray-400"
          title={isLinksMode ? `Browse all ${collections.length} link pages` : `Browse all ${collections.length} curated collections`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#536471]" />
          <span>{isLinksMode ? `All Pages (${collections.length})` : `All (${collections.length})`}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#536471]" />
        </button>
      )}

      {/* 5. "+ New" Collection Button (for profile owner) */}
      {isSelf && onCreateCollection && (
        <button
          type="button"
          onClick={onCreateCollection}
          className="px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 bg-white border border-dashed border-[#1d9bf0] text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
          title={isLinksMode ? 'Create a new link page' : 'Create a new collection lens'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isLinksMode ? 'New Page' : (collections.length === 0 ? 'Create collection' : 'New')}</span>
        </button>
      )}
    </div>
  );
}
