'use client';

import React from 'react';
import { Collection } from '@/lib/mockData';
import { Plus, ArrowUpDown } from 'lucide-react';

interface BoardPresetsBarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectAllBoards: () => void;
  onSelectCollection: (id: string | null) => void;
  isSelf: boolean;
  totalBoardsCount: number;
  onCreatePreset: () => void;
  onReorderPresets: () => void;
}

export default function BoardPresetsBar({
  collections,
  activeCollectionId,
  onSelectAllBoards,
  onSelectCollection,
  isSelf,
  totalBoardsCount,
  onCreatePreset,
  onReorderPresets
}: BoardPresetsBarProps) {
  // Strip any emoji characters for strict clean typography
  const stripEmojis = (str: string) => {
    return str.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    ).trim();
  };

  const isAllBoardsActive = activeCollectionId === null;

  // Maximum number of preset tabs in the horizontal scroll bar
  const PRESETS_CAP = 12;
  const displayPresets = collections.slice(0, PRESETS_CAP);

  return (
    <div className="sticky top-[53px] z-10 bg-white/95 backdrop-blur-md border-b border-[#eff3f4] px-4 py-2.5 select-none">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* Master Tab: "All Boards" */}
        <button
          type="button"
          onClick={onSelectAllBoards}
          className={`min-w-[96px] sm:min-w-[108px] h-[58px] rounded-xl px-3 py-2 flex flex-col justify-center cursor-pointer transition-all border shrink-0 text-left ${
            isAllBoardsActive
              ? 'border-[#0f1419] bg-[#0f1419] text-white shadow-xs'
              : 'border-[#eff3f4] bg-[#f7f9f9] hover:bg-[#eff3f4] text-[#0f1419]'
          }`}
        >
          <span className="font-bold text-xs truncate">All Boards</span>
          <span
            className={`text-[11px] truncate mt-0.5 ${
              isAllBoardsActive ? 'text-gray-300' : 'text-[#536471]'
            }`}
          >
            {totalBoardsCount} {totalBoardsCount === 1 ? 'board' : 'boards'}
          </span>
        </button>

        {/* Divider if presets exist */}
        {displayPresets.length > 0 && (
          <div className="h-7 w-[1px] bg-[#eff3f4] mx-0.5 shrink-0" />
        )}

        {/* Preset Tabs: Direct 1-tap filtering to boards */}
        {displayPresets.map((col) => {
          const isActive = activeCollectionId === col.id;
          const cleanTitle = stripEmojis(col.title) || 'Preset';
          const count = col.itemIds?.length || 0;

          return (
            <button
              key={col.id}
              type="button"
              onClick={() => onSelectCollection(isActive ? null : col.id)}
              className={`min-w-[100px] sm:min-w-[115px] h-[58px] rounded-xl px-3 py-2 flex flex-col justify-center cursor-pointer transition-all border shrink-0 text-left ${
                isActive
                  ? 'border-[#0f1419] bg-[#0f1419] text-white shadow-xs'
                  : 'border-[#eff3f4] bg-[#f7f9f9] hover:bg-[#eff3f4] text-[#0f1419]'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-bold text-xs truncate">{cleanTitle}</span>
              </div>
              <span
                className={`text-[11px] truncate mt-0.5 ${
                  isActive ? 'text-gray-300' : 'text-[#536471]'
                }`}
              >
                {count} {count === 1 ? 'board' : 'boards'}
              </span>
            </button>
          );
        })}

        {/* Owner Actions: + New Preset & Rearrange */}
        {isSelf && (
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            {/* Create New Preset Button */}
            <button
              type="button"
              onClick={onCreatePreset}
              title="Create new preset"
              className="min-w-[76px] h-[58px] rounded-xl border border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 flex flex-col items-center justify-center gap-0.5 text-[#536471] hover:text-[#1d9bf0] transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[11px] font-bold">New</span>
            </button>

            {/* Manage / Rearrange Presets Button */}
            {collections.length > 0 && (
              <button
                type="button"
                onClick={onReorderPresets}
                title="Manage presets"
                className="h-[58px] px-2.5 rounded-xl border border-[#eff3f4] bg-[#f7f9f9] hover:bg-[#eff3f4] text-[#536471] hover:text-[#0f1419] flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold hidden sm:inline">Manage</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
