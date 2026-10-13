'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Share, 
  CheckCircle2, 
  MoreHorizontal,
  Lock
} from 'lucide-react';
import { Comment } from '@/lib/mockData';

interface CommentCardProps {
  comment: Comment;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function CommentCard({ comment, onDelete, canDelete }: CommentCardProps) {
  const [liked, setLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  return (
    <article className="border-b border-[#eff3f4] bg-white p-4 hover:bg-[#f7f9f9]/40 transition-colors flex gap-3 select-text">
      {/* Author Avatar */}
      <Link href={`/${comment.author.username}`} className="shrink-0">
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm truncate">
            <Link 
              href={`/${comment.author.username}`} 
              className="font-bold text-[#0f1419] hover:underline flex items-center gap-1 truncate"
            >
              {comment.author.name}
              {comment.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0 inline" />
              )}
            </Link>
            <Link href={`/${comment.author.username}`} className="text-[#536471] truncate">
              @{comment.author.username}
            </Link>
            <span className="text-[#536471]">·</span>
            <span className="text-[#536471]">{comment.createdAt}</span>
          </div>

          <div className="flex items-center gap-1">
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Delete
              </button>
            )}
            <button 
              type="button" 
              className="text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comment Text */}
        <p className="text-[#0f1419] text-[15px] leading-relaxed whitespace-pre-line">
          {comment.text}
        </p>

        {/* Action Bar (Constrained: NO thread open, NO replies, NO quotes) */}
        <div className="flex items-center justify-between mt-1 pt-1 text-[#536471] text-xs max-w-xs">
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
            <span>{likesCount > 0 ? likesCount : ''}</span>
          </button>

          {/* Comment restriction indicator */}
          <div 
            title="Comments cannot be threaded or quoted" 
            className="flex items-center gap-1 text-[11px] text-[#536471]/70 px-2 py-1 rounded"
          >
            <Lock className="w-3 h-3 text-[#536471]/60" />
            <span>Direct comment</span>
          </div>

          {/* Share */}
          <button 
            type="button" 
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
            title="Copy link"
            className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors cursor-pointer"
          >
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
