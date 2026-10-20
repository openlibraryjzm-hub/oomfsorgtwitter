'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Share, 
  CheckCircle2, 
  MoreHorizontal,
  MessageCircle,
  Repeat2
} from 'lucide-react';
import { Comment } from '@/lib/mockData';
import TwitterMediaGrid from './TwitterMediaGrid';

interface CommentCardProps {
  comment: Comment;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function CommentCard({ comment, onDelete, canDelete }: CommentCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [reposted, setReposted] = useState(comment.isReposted || false);
  const [repostsCount, setRepostsCount] = useState(comment.repostsCount || 0);
  const [copied, setCopied] = useState(false);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reposted) {
      setReposted(false);
      setRepostsCount(prev => Math.max(0, prev - 1));
    } else {
      setReposted(true);
      setRepostsCount(prev => prev + 1);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${comment.author.username}/status/${comment.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleCardClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    router.push(`/${comment.author.username}/status/${comment.id}`);
  };

  return (
    <article 
      onClick={handleCardClick}
      className="border-b border-[#eff3f4] bg-white p-4 hover:bg-[#f7f9f9]/50 transition-colors flex gap-3 select-text cursor-pointer group"
    >
      {/* Author Avatar */}
      <Link 
        href={`/${comment.author.username}`} 
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm truncate">
            <Link 
              href={`/${comment.author.username}`} 
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[#0f1419] hover:underline flex items-center gap-1 truncate"
            >
              {comment.author.name}
              {comment.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0 inline" />
              )}
            </Link>
            <Link 
              href={`/${comment.author.username}`} 
              onClick={(e) => e.stopPropagation()}
              className="text-[#536471] truncate"
            >
              @{comment.author.username}
            </Link>
            <span className="text-[#536471]">·</span>
            <span className="text-[#536471] hover:underline">{comment.createdAt}</span>
          </div>

          <div className="flex items-center gap-1">
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(comment.id);
                }}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
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

        {/* Replying context if target user is known */}
        {comment.targetUsername && (
          <div className="text-xs text-[#536471] -mt-0.5 flex items-center gap-1">
            <span>Replying to</span>
            <Link
              href={`/${comment.targetUsername}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[#1d9bf0] hover:underline"
            >
              @{comment.targetUsername}
            </Link>
          </div>
        )}

        {/* Comment Text */}
        {comment.text && (
          <p className="text-[#0f1419] text-[15px] leading-relaxed whitespace-pre-line mt-0.5">
            {comment.text}
          </p>
        )}

        {/* Attached Images Grid */}
        {comment.images && comment.images.length > 0 && (
          <TwitterMediaGrid images={comment.images} />
        )}

        {/* 1:1 X Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-1 text-[#536471] text-xs max-w-md">
          {/* Reply */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${comment.author.username}/status/${comment.id}`);
            }}
            className="flex items-center gap-1.5 group/reply transition-colors cursor-pointer hover:text-[#1d9bf0]"
          >
            <div className="p-1.5 rounded-full group-hover/reply:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            {comment.repliesCount ? (
              <span className="text-[11px] font-medium">{comment.repliesCount}</span>
            ) : null}
          </button>

          {/* Repost */}
          <button 
            type="button"
            onClick={toggleRepost}
            className={`flex items-center gap-1.5 group/repost transition-colors cursor-pointer ${
              reposted ? 'text-green-600' : 'hover:text-green-600'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover/repost:bg-green-50 transition-colors">
              <Repeat2 className="w-4 h-4" />
            </div>
            {repostsCount > 0 && (
              <span className="text-[11px] font-medium">{repostsCount}</span>
            )}
          </button>

          {/* Like */}
          <button 
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 group/like transition-colors cursor-pointer ${
              liked ? 'text-pink-600' : 'hover:text-pink-600'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover/like:bg-pink-50 transition-colors">
              <Heart className={`w-4 h-4 ${liked ? 'fill-pink-600 text-pink-600' : ''}`} />
            </div>
            {likesCount > 0 && (
              <span className="text-[11px] font-medium">{likesCount}</span>
            )}
          </button>

          {/* Share */}
          <button 
            type="button"
            onClick={handleShare}
            title={copied ? "Link copied!" : "Share comment"}
            className="flex items-center gap-1.5 group/share transition-colors cursor-pointer hover:text-[#1d9bf0]"
          >
            <div className="p-1.5 rounded-full group-hover/share:bg-[#1d9bf0]/10 transition-colors">
              <Share className="w-4 h-4" />
            </div>
            {copied && (
              <span className="text-[10px] text-[#1d9bf0] font-semibold">Copied!</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
