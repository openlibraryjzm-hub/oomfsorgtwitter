'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  Repeat2, 
  Heart, 
  BarChart2, 
  Share, 
  ExternalLink,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  LayoutGrid,
  FolderPlus
} from 'lucide-react';
import { Post, BoardItem } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';
import TwitterMediaGrid from './TwitterMediaGrid';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onManageCollections?: (post: Post) => void;
  isThreadView?: boolean;
}

export default function PostCard({ post, onDelete, onManageCollections, isThreadView = false }: PostCardProps) {
  const router = useRouter();

  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [reposted, setReposted] = useState(post.isReposted || false);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reposted) {
      setReposted(false);
      setRepostsCount((prev) => Math.max(0, prev - 1));
    } else {
      setReposted(true);
      setRepostsCount((prev) => prev + 1);
    }
  };

  const handleCardClick = () => {
    if (isThreadView) return;
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    router.push(`/${post.author.username}/status/${post.id}`);
  };

  // Render Board Media (3-item split preview in timeline, 2-column Pinterest masonry in full thread view)
  const renderBoard = () => {
    if (post.type !== 'board' || !post.boardData || post.boardData.images.length === 0) {
      return null;
    }

    const items: BoardItem[] = post.boardData.images;

    // Helper for rendering a user card in Pinterest masonry mode
    const renderMasonryItem = (item: BoardItem, key: string) => {
      if (item.type === 'user') {
        return (
          <div
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${item.username || item.url.replace(/^\//, '')}`);
            }}
            className="rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] hover:bg-blue-50/30 transition-colors cursor-pointer flex flex-col group/masonry-user select-none"
          >
            <div className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4]">
              <img
                src={formatTwitterAvatar(item.avatar || item.url)}
                alt={item.name || item.username || 'User'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-black/10 group-hover/masonry-user:ring-[#1d9bf0] group-hover/masonry-user:scale-105 transition-all shadow-xs"
              />
              <div className="mt-3 min-w-0 max-w-full px-2">
                <span className="font-bold text-sm sm:text-base text-[#0f1419] group-hover/masonry-user:text-[#1d9bf0] transition-colors truncate block">
                  {item.name || item.username}
                </span>
                {item.username && (
                  <span className="text-xs text-[#536471] truncate block">
                    @{item.username}
                  </span>
                )}
              </div>
            </div>
            {item.caption && (
              <div className="px-3 py-2 bg-white text-xs text-[#0f1419] font-medium border-t border-[#eff3f4]">
                {item.caption}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={key}
          className="rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] flex flex-col"
        >
          <img
            src={item.url}
            alt={item.caption || 'Board media'}
            className="w-full h-auto object-cover block"
          />
          {item.caption && (
            <div className="px-3 py-2 bg-white text-xs text-[#0f1419] font-medium border-t border-[#eff3f4]">
              {item.caption}
            </div>
          )}
        </div>
      );
    };

    // FULL THREAD VIEW: 2-Column Pinterest Style Masonry Grid showing all items (>3)
    if (isThreadView) {
      const leftColumn = items.filter((_, idx) => idx % 2 === 0);
      const rightColumn = items.filter((_, idx) => idx % 2 === 1);

      return (
        <div className="my-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f1419]">
              <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
              <span>Full Board View</span>
            </div>
            <span className="text-[11px] font-semibold text-[#536471]">
              {items.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 items-start">
            {/* Column 1 */}
            <div className="flex flex-col gap-2.5">
              {leftColumn.map((item, i) => renderMasonryItem(item, item.id || `left_${i}`))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2.5">
              {rightColumn.map((item, i) => renderMasonryItem(item, item.id || `right_${i}`))}
            </div>
          </div>
        </div>
      );
    }

    // TIMELINE PREVIEW: 3-Item Split (Left half = 1st item, Right half = 2nd & 3rd stacked taking a quarter each)
    const firstItem = items[0];
    const secondItem = items[1] || items[0];
    const thirdItem = items[2] || items[1] || items[0];
    const extraCount = Math.max(0, items.length - 3);

    return (
      <div className="mt-2.5 flex flex-col gap-2">
        <div className="rounded-2xl overflow-hidden border border-[#eff3f4] h-72 sm:h-80 w-full grid grid-cols-2 gap-0.5 bg-[#eff3f4] relative group/board">
          {/* Left Half: 1st Item (50% width, 100% height) */}
          <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
            {firstItem.type === 'user' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/${firstItem.username || firstItem.url.replace(/^\//, '')}`);
                }}
                className="relative w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] hover:bg-blue-50/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer group/user-cell transition-colors select-none"
              >
                <img
                  src={formatTwitterAvatar(firstItem.avatar || firstItem.url)}
                  alt={firstItem.name || firstItem.username || 'User'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-black/10 group-hover/user-cell:ring-[#1d9bf0] group-hover/user-cell:scale-105 transition-all shadow-xs"
                />
                <div className="mt-2.5 min-w-0 max-w-full px-2">
                  <span className="font-bold text-sm sm:text-base text-[#0f1419] group-hover/user-cell:text-[#1d9bf0] transition-colors truncate block">
                    {firstItem.name || firstItem.username}
                  </span>
                  {firstItem.username && (
                    <span className="text-xs text-[#536471] truncate block">
                      @{firstItem.username}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <img
                src={firstItem.url}
                alt={firstItem.caption || 'Board preview 1'}
                className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
              />
            )}
          </div>

          {/* Right Half: 2nd and 3rd Items (25% total area each) */}
          <div className="grid grid-rows-2 gap-0.5 w-full h-full overflow-hidden">
            {/* Top-Right Quarter: 2nd Item */}
            <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
              {secondItem.type === 'user' ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${secondItem.username || secondItem.url.replace(/^\//, '')}`);
                  }}
                  className="relative w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] hover:bg-blue-50/40 p-2 flex flex-col items-center justify-center text-center cursor-pointer group/user-cell transition-colors select-none overflow-hidden"
                >
                  <img
                    src={formatTwitterAvatar(secondItem.avatar || secondItem.url)}
                    alt={secondItem.name || secondItem.username || 'User'}
                    className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover ring-2 ring-black/10 group-hover/user-cell:ring-[#1d9bf0] group-hover/user-cell:scale-105 transition-all shadow-xs"
                  />
                  <div className="mt-1 min-w-0 max-w-full px-1">
                    <span className="font-bold text-xs sm:text-sm text-[#0f1419] group-hover/user-cell:text-[#1d9bf0] transition-colors truncate block">
                      {secondItem.name || secondItem.username}
                    </span>
                    {secondItem.username && (
                      <span className="text-[11px] text-[#536471] truncate block">
                        @{secondItem.username}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <img
                  src={secondItem.url}
                  alt={secondItem.caption || 'Board preview 2'}
                  className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
                />
              )}
            </div>

            {/* Bottom-Right Quarter: 3rd Item */}
            <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
              {thirdItem.type === 'user' ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${thirdItem.username || thirdItem.url.replace(/^\//, '')}`);
                  }}
                  className="relative w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] hover:bg-blue-50/40 p-2 flex flex-col items-center justify-center text-center cursor-pointer group/user-cell transition-colors select-none overflow-hidden"
                >
                  <img
                    src={formatTwitterAvatar(thirdItem.avatar || thirdItem.url)}
                    alt={thirdItem.name || thirdItem.username || 'User'}
                    className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover ring-2 ring-black/10 group-hover/user-cell:ring-[#1d9bf0] group-hover/user-cell:scale-105 transition-all shadow-xs"
                  />
                  <div className="mt-1 min-w-0 max-w-full px-1">
                    <span className="font-bold text-xs sm:text-sm text-[#0f1419] group-hover/user-cell:text-[#1d9bf0] transition-colors truncate block">
                      {thirdItem.name || thirdItem.username}
                    </span>
                    {thirdItem.username && (
                      <span className="text-[11px] text-[#536471] truncate block">
                        @{thirdItem.username}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <img
                  src={thirdItem.url}
                  alt={thirdItem.caption || 'Board preview 3'}
                  className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
                />
              )}

              {/* Overlay Badge indicating Board & remaining count */}
              <div className="absolute inset-0 bg-black/20 group-hover/board:bg-black/30 pointer-events-none transition-colors flex items-end justify-end p-2.5">
                <span className="bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs pointer-events-auto">
                  <LayoutGrid className="w-3 h-3 text-[#1d9bf0]" />
                  <span>{extraCount > 0 ? `+${extraCount} more` : 'View Board'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Board Mini Banner below images and above metrics */}
        <div
          onClick={handleCardClick}
          className="flex items-center justify-between px-3.5 py-2 bg-[#f7f9f9] hover:bg-[#1d9bf0]/10 border border-[#eff3f4] hover:border-[#1d9bf0]/40 rounded-xl transition-all cursor-pointer group/board-banner select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-[#1d9bf0]/15 text-[#1d9bf0] flex items-center justify-center shrink-0">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[#0f1419] group-hover/board-banner:text-[#1d9bf0] transition-colors truncate">
              {extraCount > 0
                ? `Click to view ${extraCount} more ${extraCount === 1 ? 'item' : 'items'} on this board`
                : `Click to view full board (${items.length} items)`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#1d9bf0] shrink-0">
            <span>Explore board</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/board-banner:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    );
  };


  // THREAD / FOCAL TWEET EXPANDED VIEW
  if (isThreadView) {
    return (
      <article className="bg-white p-4 border-b border-[#eff3f4]">
        {/* Author Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/${post.author.username}`}>
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
              />
            </Link>
            <div className="flex flex-col">
              <Link 
                href={`/${post.author.username}`} 
                className="font-bold text-[#0f1419] hover:underline flex items-center gap-1 text-base leading-tight"
              >
                {post.author.name}
                {post.author.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0 inline" />
                )}
              </Link>
              <Link href={`/${post.author.username}`} className="text-[#536471] text-sm">
                @{post.author.username}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onManageCollections && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageCollections(post);
                }}
                title="Add to collection"
                className="text-xs text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-2 rounded-full transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                }}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
            <button 
              type="button"
              className="text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-2 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Tweet Body / Board Title */}
        {(post.title || post.text) && (
          <div className="text-[#0f1419] text-xl font-bold leading-relaxed whitespace-pre-line py-2">
            {post.title || post.text}
          </div>
        )}

        {/* Custom Post Media Types */}
        {renderBoard()}
        {((post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0)) && (
          <TwitterMediaGrid attachments={post.attachments} images={post.images} />
        )}

        {/* Timestamp & Views */}
        <div className="py-3 text-sm text-[#536471] border-b border-[#eff3f4] flex items-center gap-2 mt-1">
          <span>{post.createdAt}</span>
          <span>·</span>
          <span><b>{post.viewsCount}</b> Views</span>
        </div>

        {/* Metrics Bar */}
        <div className="py-3 text-sm text-[#536471] border-b border-[#eff3f4] flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{repostsCount}</span>
            <span>Reposts</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{post.repliesCount}</span>
            <span>Replies</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{likesCount}</span>
            <span>Likes</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="py-2 border-b border-[#eff3f4] flex items-center justify-around text-[#536471]">
          <button 
            type="button" 
            className="p-2 hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] rounded-full transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={toggleRepost}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              reposted ? 'text-green-600 bg-green-50' : 'hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <Repeat2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={toggleLike}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              liked ? 'text-pink-600 bg-pink-50' : 'hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-pink-600 text-pink-600' : ''}`} />
          </button>
          <button 
            type="button" 
            className="p-2 hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] rounded-full transition-colors cursor-pointer"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="p-2 hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] rounded-full transition-colors cursor-pointer"
          >
            <Share className="w-5 h-5" />
          </button>
        </div>
      </article>
    );
  }

  // STANDARD TIMELINE POST VIEW
  return (
    <article 
      onClick={handleCardClick}
      className="border-b border-[#eff3f4] bg-white p-4 hover:bg-[#f7f9f9]/50 transition-colors flex gap-3 group cursor-pointer"
    >
      {/* Author Avatar */}
      <Link 
        href={`/${post.author.username}`} 
        onClick={(e) => e.stopPropagation()} 
        className="shrink-0"
      >
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm truncate">
            <Link 
              href={`/${post.author.username}`}
              onClick={(e) => e.stopPropagation()} 
              className="font-bold text-[#0f1419] hover:underline flex items-center gap-1 truncate"
            >
              {post.author.name}
              {post.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0 inline" />
              )}
            </Link>
            <Link 
              href={`/${post.author.username}`} 
              onClick={(e) => e.stopPropagation()}
              className="text-[#536471] truncate"
            >
              @{post.author.username}
            </Link>
            <span className="text-[#536471]">·</span>
            <span className="text-[#536471] hover:underline">{post.createdAt}</span>
          </div>

          <div className="flex items-center gap-1">
            {onManageCollections && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageCollections(post);
                }}
                title="Add to collection"
                className="text-xs text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                }}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                Delete
              </button>
            )}
            <button 
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Body / Board Title */}
        {(post.title || post.text) && (
          <p className="text-[#0f1419] text-[15px] font-bold leading-relaxed whitespace-pre-line">
            {post.title || post.text}
          </p>
        )}

        {/* Custom Post Media Types */}
        {renderBoard()}
        {((post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0)) && (
          <TwitterMediaGrid attachments={post.attachments} images={post.images} />
        )}

        {/* X Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-1 text-[#536471] text-xs max-w-md">
          {/* Reply */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${post.author.username}/status/${post.id}`);
            }}
            className="flex items-center gap-1.5 hover:text-[#1d9bf0] group/action transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span>{post.repliesCount}</span>
          </button>

          {/* Retweet */}
          <button 
            type="button"
            onClick={toggleRepost}
            className={`flex items-center gap-1.5 group/action transition-colors cursor-pointer ${
              reposted ? 'text-green-600' : 'hover:text-green-600'
            }`}
          >
            <div className="p-2 rounded-full group-hover/action:bg-green-50 transition-colors">
              <Repeat2 className="w-4 h-4" />
            </div>
            <span>{repostsCount}</span>
          </button>

          {/* Like */}
          <button 
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 group/action transition-colors cursor-pointer ${
              liked ? 'text-pink-600' : 'hover:text-pink-600'
            }`}
          >
            <div className="p-2 rounded-full group-hover/action:bg-pink-50 transition-colors">
              <Heart className={`w-4 h-4 ${liked ? 'fill-pink-600 text-pink-600' : ''}`} />
            </div>
            <span>{likesCount}</span>
          </button>

          {/* Views */}
          <div className="flex items-center gap-1.5 hover:text-[#1d9bf0] group/action transition-colors">
            <div className="p-2 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition-colors">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>{post.viewsCount}</span>
          </div>

          {/* Bookmark / Share */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(window.location.origin + `/${post.author.username}/status/${post.id}`);
            }}
            title="Copy link to post"
            className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors cursor-pointer"
          >
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
