'use client';

import React, { useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { Post } from '@/lib/mockData';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isThreadView?: boolean;
}

export default function PostCard({ post, onDelete, isThreadView = false }: PostCardProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const scrollCarousel = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    if (!scrollRef.current) return;
    const scrollAmount = 260;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Render Carousel Media Strip (Universal Header + Peeking Natural Aspect Ratio Slides + Bottom Caption Overlays)
  const renderCarousel = () => {
    if (post.type !== 'carousel' || !post.carouselData || post.carouselData.slides.length === 0) {
      return null;
    }

    const { header, slides } = post.carouselData;

    return (
      <div className="mt-2.5 flex flex-col gap-2">
        {/* Universal Small Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-[#1d9bf0] shrink-0" />
            <span className="text-xs font-bold text-[#0f1419] truncate">
              {header || 'Photo Carousel'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#536471] shrink-0 ml-2">
            {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
          </span>
        </div>

        {/* Horizontal Peeking Scroll Strip */}
        <div className="relative group/carousel">
          {/* Desktop Scroll Left Button */}
          <button
            type="button"
            onClick={(e) => scrollCarousel(e, 'left')}
            aria-label="Scroll left"
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Track: fixed height so portrait images are thin & tall and landscape images are wide */}
          <div
            ref={scrollRef}
            onClick={(e) => e.stopPropagation()}
            className="flex items-stretch gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 pr-8"
            style={{ scrollbarWidth: 'none' }}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                onClick={handleCardClick}
                className={`relative shrink-0 snap-start rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] select-none cursor-pointer ${
                  isThreadView ? 'h-80 sm:h-96' : 'h-64 sm:h-72'
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.caption || `Slide ${idx + 1}`}
                  className="h-full w-auto max-w-[80vw] sm:max-w-[420px] object-cover block"
                  loading="lazy"
                />

                {/* Slide Index Pill (Top Right) */}
                <div className="absolute top-2.5 right-2.5 bg-black/55 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                  {idx + 1}/{slides.length}
                </div>

                {/* Individual Bottom Caption Overlay */}
                {slide.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pt-8 pb-2.5 pointer-events-none">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-2 drop-shadow-xs">
                      {slide.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Scroll Right Button */}
          <button
            type="button"
            onClick={(e) => scrollCarousel(e, 'right')}
            aria-label="Scroll right"
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render Board Media (3-image split preview in timeline, 2-column Pinterest masonry in full thread view)
  const renderBoard = () => {
    if (post.type !== 'board' || !post.boardData || post.boardData.images.length === 0) {
      return null;
    }

    const images = post.boardData.images;

    // FULL THREAD VIEW: 2-Column Pinterest Style Masonry Grid showing all >3 images
    if (isThreadView) {
      const leftColumn = images.filter((_, idx) => idx % 2 === 0);
      const rightColumn = images.filter((_, idx) => idx % 2 === 1);

      return (
        <div className="my-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f1419]">
              <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
              <span>Full Board View</span>
            </div>
            <span className="text-[11px] font-semibold text-[#536471]">
              {images.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 items-start">
            {/* Column 1 */}
            <div className="flex flex-col gap-2.5">
              {leftColumn.map((img, i) => (
                <div
                  key={img.id || `left_${i}`}
                  className="rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] flex flex-col"
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'Board media'}
                    className="w-full h-auto object-cover block"
                  />
                  {img.caption && (
                    <div className="px-3 py-2 bg-white text-xs text-[#0f1419] font-medium border-t border-[#eff3f4]">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2.5">
              {rightColumn.map((img, i) => (
                <div
                  key={img.id || `right_${i}`}
                  className="rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] flex flex-col"
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'Board media'}
                    className="w-full h-auto object-cover block"
                  />
                  {img.caption && (
                    <div className="px-3 py-2 bg-white text-xs text-[#0f1419] font-medium border-t border-[#eff3f4]">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // TIMELINE PREVIEW: 3-Image Split (Left half = 1st image, Right half = 2nd & 3rd stacked taking a quarter each)
    const firstImg = images[0];
    const secondImg = images[1] || images[0];
    const thirdImg = images[2] || images[1] || images[0];
    const extraCount = Math.max(0, images.length - 3);

    return (
      <div className="mt-2.5 rounded-2xl overflow-hidden border border-[#eff3f4] h-72 sm:h-80 w-full grid grid-cols-2 gap-0.5 bg-[#eff3f4] relative group/board">
        {/* Left Half: 1st Image (50% width, 100% height) */}
        <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
          <img
            src={firstImg.url}
            alt={firstImg.caption || 'Board preview 1'}
            className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
          />
        </div>

        {/* Right Half: 2nd and 3rd Images (25% total area each) */}
        <div className="grid grid-rows-2 gap-0.5 w-full h-full overflow-hidden">
          {/* Top-Right Quarter: 2nd Image */}
          <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
            <img
              src={secondImg.url}
              alt={secondImg.caption || 'Board preview 2'}
              className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
            />
          </div>

          {/* Bottom-Right Quarter: 3rd Image */}
          <div className="relative w-full h-full overflow-hidden bg-[#f7f9f9]">
            <img
              src={thirdImg.url}
              alt={thirdImg.caption || 'Board preview 3'}
              className="w-full h-full object-cover group-hover/board:scale-[1.02] transition-transform duration-200"
            />

            {/* Overlay Badge indicating Board & remaining count */}
            <div className="absolute inset-0 bg-black/20 group-hover/board:bg-black/30 transition-colors flex items-end justify-end p-2.5">
              <span className="bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <LayoutGrid className="w-3 h-3 text-[#1d9bf0]" />
                <span>{extraCount > 0 ? `+${extraCount} more` : 'View Board'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Link Card
  const renderLinkCard = () => {
    if (post.type !== 'link_card' || !post.linkData) return null;

    return (
      <a
        href={post.linkData.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-2.5 block border border-[#eff3f4] rounded-2xl overflow-hidden hover:border-[#1d9bf0]/60 hover:shadow-xs transition-all bg-[#f7f9f9]/70"
      >
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1d9bf0] uppercase tracking-wider">
              <ExternalLink className="w-3.5 h-3.5" />
              Featured Bio Link
            </span>
            <span className="text-xs text-[#536471] font-mono">
              {post.linkData.url.replace(/^https?:\/\//, '')}
            </span>
          </div>
          <h4 className="font-extrabold text-[#0f1419] text-base group-hover:text-[#1d9bf0] transition-colors">
            {post.linkData.title}
          </h4>
          {post.linkData.description && (
            <p className="text-xs text-[#536471] line-clamp-2">
              {post.linkData.description}
            </p>
          )}
          <div className="mt-1 flex items-center justify-between pt-2 border-t border-[#eff3f4]">
            <span className="text-xs font-semibold text-[#1d9bf0] flex items-center gap-1">
              {post.linkData.buttonText || 'Visit Link ↗'}
            </span>
            <span className="bg-[#1d9bf0] text-white text-xs font-bold px-3 py-1 rounded-full">
              Open
            </span>
          </div>
        </div>
      </a>
    );
  };

  // Render Badge
  const renderBadge = () => {
    if (post.type !== 'badge' || !post.badgeData) return null;
    const b = post.badgeData;

    return (
      <div className="mt-2.5 inline-flex flex-col items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
        <a
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${b.title} (${b.url})`}
          className="group/badge inline-block shrink-0 transition-transform hover:scale-105"
        >
          {b.badgeType === 'image' && b.imageUrl ? (
            <div className="w-[88px] h-[31px] rounded-xs overflow-hidden border border-black/20 shadow-xs block">
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-[88px] h-[31px] object-cover block"
              />
            </div>
          ) : (
            <div
              className="w-[88px] h-[31px] rounded-xs overflow-hidden border border-black/30 shadow-xs"
              style={{
                background: b.bgColor || '#0f1419'
              }}
            />
          )}
        </a>
        {b.showText !== false && (b.label || b.title) && (
          <div className="flex items-center gap-1.5 text-xs text-[#536471]">
            <span className="font-semibold text-[#0f1419]">{b.label || b.title}</span>
            <span>·</span>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1d9bf0] hover:underline flex items-center gap-0.5 font-mono text-[11px]"
            >
              <span>{b.url.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
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

        {/* Big Tweet Body */}
        {post.text && (
          <div className="text-[#0f1419] text-xl leading-relaxed whitespace-pre-line py-2">
            {post.text}
          </div>
        )}

        {/* Custom Post Media Types */}
        {renderCarousel()}
        {renderBoard()}
        {renderLinkCard()}
        {renderBadge()}

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

        {/* Text Body */}
        {post.text && (
          <p className="text-[#0f1419] text-[15px] leading-relaxed whitespace-pre-line">
            {post.text}
          </p>
        )}

        {/* Custom Post Media Types */}
        {renderCarousel()}
        {renderBoard()}
        {renderLinkCard()}
        {renderBadge()}

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
