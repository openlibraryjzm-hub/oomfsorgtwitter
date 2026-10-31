'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post, BoardItem } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';
import { MoreHorizontal, Trash2, FolderPlus } from 'lucide-react';

interface BoardGridCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onManageCollections?: (post: Post) => void;
}

export default function BoardGridCard({
  post,
  onDelete,
  onManageCollections
}: BoardGridCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    router.push(`/${post.author.username}/status/${post.id}`);
  };

  const rawItems: BoardItem[] = post.boardData?.images || [];
  
  // Fallback items if boardData is missing or empty
  const items: BoardItem[] = rawItems.length > 0 
    ? rawItems 
    : [
        { id: 'fb1', url: post.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb2', url: post.images?.[1] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb3', url: post.images?.[2] || 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=700&q=80', caption: '' }
      ];

  const firstItem = items[0];
  const secondaryItems = items.slice(1);

  // Title: use explicit post.title or extract clean first line from text, without emojis
  const cleanTitle = (post.title || post.text?.split('\n')[0] || 'Untitled Board').replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ''
  ).trim();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (window.confirm(`Delete board "${cleanTitle}"?`)) {
      onDelete(post.id);
    }
  };

  const getItemImageUrl = (item: BoardItem): string | null => {
    if (item.type === 'user') {
      return formatTwitterAvatar(item.avatar || item.url);
    }
    return item.url || null;
  };

  return (
    <article
      onClick={handleCardClick}
      className="group/board flex flex-col cursor-pointer select-none relative"
    >
      {/* Board Thumbnail: Widened Full-Bleed Hero Image (Aspect 2:1) + Cascading Circles for Other Board Items */}
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-[#eff3f4] border border-[#cfd9de] shadow-2xs group-hover/board:border-[#1d9bf0]/50 group-hover/board:shadow-md transition-all duration-200">
        {/* Main Hero Image / User Card */}
        {firstItem.type === 'user' ? (
          <div className="w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] flex flex-col items-center justify-center p-3 text-center select-none overflow-hidden">
            <img
              src={formatTwitterAvatar(firstItem.avatar || firstItem.url)}
              alt={firstItem.name || firstItem.username || 'User'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white shadow-sm group-hover/board:scale-105 transition-transform"
            />
            <div className="mt-1.5 px-1 max-w-full">
              <span className="font-bold text-xs sm:text-sm text-[#0f1419] truncate block leading-tight">
                {firstItem.name || firstItem.username || 'User'}
              </span>
              {firstItem.username && (
                <span className="text-[11px] text-[#536471] truncate block">
                  @{firstItem.username}
                </span>
              )}
            </div>
          </div>
        ) : (
          <img
            src={firstItem.url}
            alt={firstItem.caption || cleanTitle}
            className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        )}

        {/* Subtle Bottom Gradient Scrim for Contrast if overlay circles exist */}
        {secondaryItems.length > 0 && firstItem.type !== 'user' && (
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Overlaid on Bottom-Left: Cascading Overlapping Circles of Other Board Items */}
        {secondaryItems.length > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center z-10">
            {secondaryItems.slice(0, 3).map((item, idx) => {
              const imgUrl = getItemImageUrl(item);
              const zIndex = 30 - idx * 10;
              const itemTitle = item.caption || item.name || item.username || `Item ${idx + 2}`;

              return (
                <div
                  key={item.id || idx}
                  style={{ zIndex }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white bg-[#eff3f4] overflow-hidden shadow-sm shrink-0 transition-transform hover:scale-110 ${
                    idx > 0 ? '-ml-2' : ''
                  }`}
                  title={itemTitle}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt={itemTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-[8px] font-bold text-gray-700">
                      0{idx + 2}
                    </div>
                  )}
                </div>
              );
            })}

            {/* +N More Bubble if > 3 secondary items */}
            {secondaryItems.length > 3 && (
              <div
                style={{ zIndex: 0 }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white bg-[#0f1419] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm shrink-0 -ml-2 select-none"
                title={`${secondaryItems.length - 3} more items`}
              >
                +{secondaryItems.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Hover action menu for owner */}
        {(onDelete || onManageCollections) && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-1.5 right-1.5 opacity-0 group-hover/board:opacity-100 transition-opacity flex items-center gap-1 z-20"
          >
            {onManageCollections && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageCollections(post);
                }}
                title="Add to preset collection"
                className="p-1 rounded-full bg-white/90 hover:bg-white text-[#536471] hover:text-[#1d9bf0] shadow-xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                title="Delete board"
                className="p-1 rounded-full bg-white/90 hover:bg-white text-[#536471] hover:text-red-600 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title & Action Menu displayed under the rectangle for each board */}
      <div className="flex items-start justify-between gap-1.5 mt-1.5 px-0.5">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13px] sm:text-sm text-[#0f1419] truncate leading-snug group-hover/board:text-[#1d9bf0] transition-colors">
            {cleanTitle}
          </h3>
          <p className="text-[11px] sm:text-xs text-[#536471] mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {(onDelete || onManageCollections) && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title="More actions"
              className="p-1 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-[#eff3f4] rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                >
                  {onManageCollections && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onManageCollections(post);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#0f1419] hover:bg-[#f7f9f9] transition-colors font-medium text-left cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#1d9bf0]" />
                      <span>Add to preset</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        if (window.confirm(`Delete board "${cleanTitle}"?`)) {
                          onDelete(post.id);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete board</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
