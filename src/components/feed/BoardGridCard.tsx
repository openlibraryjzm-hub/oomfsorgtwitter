'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post, BoardItem } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';
import { MoreHorizontal, Trash2, FolderPlus, Crop } from 'lucide-react';
import BoardCropModal from './BoardCropModal';

interface BoardGridCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onManageCollections?: (post: Post) => void;
  onUpdateCoverCrop?: (postId: string, newCroppedUrl: string) => void;
}

export default function BoardGridCard({
  post,
  onDelete,
  onManageCollections,
  onUpdateCoverCrop
}: BoardGridCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const handleCardClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    router.push(`/${post.author.username}/status/${post.id}`);
  };

  const rawItems: BoardItem[] = post.boardData?.images || [];
  
  // Ensure exactly 5 items for the 2x2 grid + center circle architecture
  const items: BoardItem[] = rawItems.length >= 5 
    ? rawItems.slice(0, 5) 
    : [
        ...rawItems,
        { id: 'fb1', url: post.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb2', url: post.images?.[1] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb3', url: post.images?.[2] || 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb4', url: post.images?.[3] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80', caption: '' },
        { id: 'fb5', url: post.images?.[4] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80', caption: '' }
      ].slice(0, 5);

  const firstItem = items[0];

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

  const getItemImageUrl = (item?: BoardItem): string | null => {
    if (!item) return null;
    if (item.type === 'user') {
      return formatTwitterAvatar(item.avatar || item.url);
    }
    return item.thumbnailUrl || item.url || null;
  };

  return (
    <article
      onClick={handleCardClick}
      className="group/board flex flex-col cursor-pointer select-none relative"
    >
      {/* 5-Image Board Thumbnail Layout: 2x2 Grid + Centered Circular Avatar (Aspect 2:1) */}
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-[#eff3f4] border border-[#cfd9de] shadow-2xs group-hover/board:border-[#1d9bf0]/50 group-hover/board:shadow-md transition-all duration-200">
        {/* 2x2 Grid (2 rows x 2 columns) occupying the full rectangle */}
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {items.slice(0, 4).map((item, idx) => {
            const imgUrl = getItemImageUrl(item);
            return (
              <div
                key={item.id || idx}
                className="relative w-full h-full overflow-hidden bg-[#eff3f4]"
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.caption || item.name || cleanTitle}
                    className="w-full h-full object-cover group-hover/board:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#cfd9de] to-[#eff3f4]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Centered circular image (Slot 4) positioned in the exact dead-center of the 2x2 grid */}
        {items[4] && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="rounded-full ring-2 ring-white shadow-md w-11 h-11 sm:w-14 sm:h-14 object-cover overflow-hidden z-10 bg-white">
              {getItemImageUrl(items[4]) ? (
                <img
                  src={getItemImageUrl(items[4])!}
                  alt={items[4].caption || items[4].name || cleanTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#cfd9de] to-[#eff3f4]" />
              )}
            </div>
          </div>
        )}

        {/* Hover action menu for owner */}
        {(onDelete || onManageCollections || onUpdateCoverCrop) && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-1.5 right-1.5 opacity-0 group-hover/board:opacity-100 transition-opacity flex items-center gap-1 z-20"
          >
            {onUpdateCoverCrop && firstItem.type !== 'user' && firstItem.url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCropModalOpen(true);
                }}
                title="Recrop thumbnail image"
                className="p-1 rounded-full bg-white/90 hover:bg-white text-[#536471] hover:text-[#1d9bf0] shadow-xs transition-colors cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5" />
              </button>
            )}
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
            5 items
          </p>
        </div>

        {(onDelete || onManageCollections || onUpdateCoverCrop) && (
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
                  {onUpdateCoverCrop && firstItem.type !== 'user' && firstItem.url && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setCropModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#0f1419] hover:bg-[#f7f9f9] transition-colors font-medium text-left cursor-pointer"
                    >
                      <Crop className="w-3.5 h-3.5 text-[#1d9bf0]" />
                      <span>Crop thumbnail</span>
                    </button>
                  )}
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

      {/* 2:1 Crop Viewfinder Modal */}
      {cropModalOpen && firstItem.url && (
        <div onClick={(e) => e.stopPropagation()}>
          <BoardCropModal
            isOpen={cropModalOpen}
            imageSrc={firstItem.url}
            aspectRatio={2.0}
            onClose={() => setCropModalOpen(false)}
            onApply={(newCroppedUrl) => {
              setCropModalOpen(false);
              if (onUpdateCoverCrop) {
                onUpdateCoverCrop(post.id, newCroppedUrl);
              }
            }}
          />
        </div>
      )}
    </article>
  );
}
