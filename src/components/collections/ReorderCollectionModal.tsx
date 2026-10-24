'use client';

import React, { useState } from 'react';
import { X, GripVertical, FileText, ChevronUp, ChevronDown as ChevronDownIcon, Layers } from 'lucide-react';
import { Collection, Post } from '@/lib/mockData';

const MAX_POSTS_PER_COLLECTION = 100;

interface ReorderCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
  allPosts: Post[];
  onReorderCollectionItems: (collectionId: string, orderedItemIds: string[]) => void;
  onRemoveCollectionItem?: (collectionId: string, itemId: string) => void;
}

function getPostThumbnail(post: Post): string | null {
  if (post.images && post.images.length > 0) return post.images[0];
  if (post.carouselData?.slides && post.carouselData.slides.length > 0) {
    return post.carouselData.slides[0].url || null;
  }
  if (post.boardData?.images && post.boardData.images.length > 0) {
    return post.boardData.images[0].url || null;
  }
  if (post.linkData?.image) return post.linkData.image;
  return null;
}

function getPostSnippet(post: Post): string {
  if (post.text && post.text.trim()) return post.text.trim();
  if (post.carouselData?.header) return post.carouselData.header;
  if (post.linkData?.title) return post.linkData.title;
  if (post.type === 'board') return 'Visual Board';
  if (post.type === 'carousel') return 'Photo Carousel';
  return 'Post';
}

function getPostTypeLabel(type: string): string {
  switch (type) {
    case 'carousel': return '🎞️ Carousel';
    case 'board': return '📌 Board';
    case 'link_card': return '🔗 Link';
    case 'grid': return '⊞ Grid';
    case 'badge': return '🏷️ Badge';
    default: return '📝 Post';
  }
}

export default function ReorderCollectionModal({
  isOpen,
  onClose,
  collection,
  allPosts,
  onReorderCollectionItems,
  onRemoveCollectionItem
}: ReorderCollectionModalProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen || !collection) return null;

  // Resolve posts in the exact sequence of collection.itemIds
  const postMap = new Map((allPosts || []).map((p) => [p.id, p]));
  let currentCollectionPosts: Post[] = [];

  if (collection.itemIds) {
    for (const id of collection.itemIds) {
      const found = postMap.get(id);
      if (found) {
        currentCollectionPosts.push(found);
      }
    }
    // Prototype fallback if mock collection IDs
    if (currentCollectionPosts.length === 0 && collection.id.startsWith('col_') && (allPosts || []).length > 0) {
      const countToTake = Math.min(allPosts.length, collection.itemIds.length || 3);
      currentCollectionPosts = allPosts.slice(0, countToTake);
    }
  }

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= currentCollectionPosts.length) return;

    const currentIds = currentCollectionPosts.map((p) => p.id);
    const [movedId] = currentIds.splice(fromIdx, 1);
    currentIds.splice(toIdx, 0, movedId);

    onReorderCollectionItems(collection.id, currentIds);
  };

  const handleDrop = (toIdx: number) => {
    if (draggedIndex === null) return;
    handleMoveItem(draggedIndex, toIdx);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemovePost = (postId: string) => {
    if (confirm(`Remove this post from "${collection.title}"? The post will stay on your main profile.`)) {
      if (onRemoveCollectionItem) {
        onRemoveCollectionItem(collection.id, postId);
      } else {
        const remaining = collection.itemIds.filter((id) => id !== postId);
        onReorderCollectionItems(collection.id, remaining);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl md:max-w-4xl lg:max-w-5xl w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eff3f4] bg-white px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base shrink-0">{collection.icon || '📁'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#0f1419] text-base leading-tight truncate">
                  Reorder: {collection.title}
                </h3>
                <span className="text-xs font-bold text-[#536471] bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {currentCollectionPosts.length} / {MAX_POSTS_PER_COLLECTION} posts
                </span>
              </div>
              <p className="text-[11px] text-[#536471] truncate hidden sm:block">
                Drag posts or use arrows to customize their display sequence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draggable Post Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
          {currentCollectionPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {currentCollectionPosts.map((post, idx) => {
                const thumb = getPostThumbnail(post);
                const snippet = getPostSnippet(post);
                const typeLabel = getPostTypeLabel(post.type);
                const isDraggingThis = draggedIndex === idx;
                const isTargeted = dragOverIndex === idx;

                return (
                  <div
                    key={post.id}
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
                    className={`rounded-xl border p-2 flex items-center justify-between gap-2 transition-all select-none group shadow-2xs cursor-grab active:cursor-grabbing ${
                      isDraggingThis
                        ? 'opacity-40 border-[#1d9bf0] scale-98 bg-blue-50/20'
                        : isTargeted
                          ? 'border-[#1d9bf0] ring-2 ring-[#1d9bf0]/30 bg-blue-50/30'
                          : 'border-[#eff3f4] bg-white hover:border-[#1d9bf0] hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Grip, Position Number, Thumbnail */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <GripVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1d9bf0] shrink-0" />
                      <span className="w-5 h-5 rounded-full bg-[#0f1419] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-black/5"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#536471] shrink-0 border border-black/5">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}

                      {/* Post Snippet & Type Label */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#0f1419] truncate leading-snug">
                          {snippet}
                        </p>
                        <span className="text-[10px] text-[#536471] font-medium block truncate mt-0.5">
                          {typeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Right: Quick Move Arrows & Remove Button */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, idx - 1)}
                          title="Move up"
                          className="p-1 text-gray-400 hover:text-[#0f1419] hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < currentCollectionPosts.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, idx + 1)}
                          title="Move down"
                          className="p-1 text-gray-400 hover:text-[#0f1419] hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePost(post.id)}
                        title="Remove from collection"
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-[#536471] text-xs px-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-[#536471]">
                <Layers className="w-5 h-5" />
              </div>
              <p className="font-bold text-[#0f1419] text-sm">
                No posts in "{collection.title}" yet
              </p>
              <p className="text-xs text-[#536471] max-w-sm mx-auto mt-1 mb-4">
                Click the folder icon on any post on your timeline to add posts to this collection (up to {MAX_POSTS_PER_COLLECTION} posts max).
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0f1419] hover:bg-black text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#f7f9f9] border-t border-[#eff3f4] flex items-center justify-between text-[11px] text-[#536471]">
          <span>
            {currentCollectionPosts.length} posts · Maximum {MAX_POSTS_PER_COLLECTION} posts per preset
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
