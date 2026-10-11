'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  Repeat2, 
  Heart, 
  BarChart2, 
  Share, 
  ExternalLink,
  Users,
  CheckCircle2,
  Sparkles,
  MoreHorizontal,
  Music,
  Award,
  Play
} from 'lucide-react';
import { Post } from '@/lib/mockData';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [reposted, setReposted] = useState(post.isReposted || false);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount);

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const toggleRepost = () => {
    if (reposted) {
      setReposted(false);
      setRepostsCount((prev) => prev - 1);
    } else {
      setReposted(true);
      setRepostsCount((prev) => prev + 1);
    }
  };

  return (
    <article className="border-b border-[#eff3f4] bg-white p-4 hover:bg-[#f7f9f9]/50 transition-colors flex gap-3 group">
      {/* Author Avatar */}
      <Link href={`/${post.author.username}`} className="shrink-0">
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
              className="font-bold text-[#0f1419] hover:underline flex items-center gap-1 truncate"
            >
              {post.author.name}
              {post.author.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0 inline" />
              )}
            </Link>
            <Link href={`/${post.author.username}`} className="text-[#536471] truncate">
              @{post.author.username}
            </Link>
            <span className="text-[#536471]">·</span>
            <span className="text-[#536471] hover:underline">{post.createdAt}</span>
          </div>

          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
            <button className="text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-1.5 rounded-full transition-colors">
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

        {/* CONTENT TYPE: Bio Link Card (Linktree Alternative) */}
        {post.type === 'link_card' && post.linkData && (
          <a
            href={post.linkData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block border border-[#eff3f4] rounded-2xl overflow-hidden hover:border-[#1d9bf0]/60 hover:shadow-sm transition-all bg-[#f7f9f9]/70"
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
        )}

        {/* CONTENT TYPE: OOMF Vouch / Endorsement Card */}
        {post.type === 'vouch_card' && post.vouchData && (
          <div className="mt-2 border border-emerald-100 rounded-2xl p-4 bg-emerald-50/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-600" />
                Verified OOMF Vouch
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                {post.vouchData.relationship}
              </span>
            </div>

            <p className="text-sm font-medium text-[#0f1419] italic leading-relaxed border-l-2 border-emerald-400 pl-3 py-0.5">
              "{post.vouchData.endorsement}"
            </p>

            <Link 
              href={`/${post.vouchData.vouchedBy.username}`}
              className="flex items-center gap-2 pt-1 hover:underline w-fit"
            >
              <img
                src={post.vouchData.vouchedBy.avatar}
                alt={post.vouchData.vouchedBy.name}
                className="w-6 h-6 rounded-full object-cover border border-emerald-200"
              />
              <span className="text-xs font-bold text-[#0f1419]">
                {post.vouchData.vouchedBy.name}
              </span>
              <span className="text-xs text-[#536471]">
                @{post.vouchData.vouchedBy.username}
              </span>
            </Link>
          </div>
        )}

        {/* CONTENT TYPE: Media / Audio Embed Card */}
        {post.type === 'media_card' && post.mediaData && (
          <a
            href={post.mediaData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block border border-[#eff3f4] rounded-2xl p-4 bg-[#f7f9f9] hover:border-[#1d9bf0]/50 transition-all group/media"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover/media:scale-105 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-[#0f1419] truncate group-hover/media:text-[#1d9bf0] transition-colors">
                    {post.mediaData.title}
                  </span>
                  <span className="text-xs text-[#536471] truncate">
                    {post.mediaData.subtitle || 'Audio on Spotify'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#0f1419] text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
                <Play className="w-3 h-3 fill-white" />
                <span>Listen</span>
              </div>
            </div>
          </a>
        )}

        {/* CONTENT TYPE: OOMF Spotlight Card */}
        {post.type === 'oomf_spotlight' && post.spotlightUser && (
          <div className="mt-2 border border-[#eff3f4] rounded-2xl p-4 bg-gradient-to-br from-[#1d9bf0]/5 to-transparent flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={post.spotlightUser.avatar}
                alt={post.spotlightUser.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-[#0f1419] truncate">
                    {post.spotlightUser.name}
                  </span>
                  <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                    OOMF
                  </span>
                </div>
                <span className="text-xs text-[#536471] truncate">
                  @{post.spotlightUser.username}
                </span>
              </div>
            </div>

            <Link
              href={`/${post.spotlightUser.username}`}
              className="bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shrink-0"
            >
              View OOMF Profile
            </Link>
          </div>
        )}

        {/* CONTENT TYPE: Q&A Prompt Card */}
        {post.type === 'prompt_card' && post.promptData && (
          <div className="mt-2 border border-purple-100 rounded-2xl p-4 bg-purple-50/50 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OOMFS Prompt Response</span>
            </div>
            <div className="font-bold text-sm text-[#0f1419]">
              "{post.promptData.question}"
            </div>
            <div className="text-sm text-[#536471] bg-white p-3 rounded-xl border border-purple-100 italic">
              "{post.promptData.answer}"
            </div>
          </div>
        )}

        {/* X Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-1 text-[#536471] text-xs max-w-md">
          {/* Reply */}
          <button className="flex items-center gap-1.5 hover:text-[#1d9bf0] group/action transition-colors">
            <div className="p-2 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span>{post.repliesCount}</span>
          </button>

          {/* Retweet */}
          <button 
            onClick={toggleRepost}
            className={`flex items-center gap-1.5 group/action transition-colors ${
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
            onClick={toggleLike}
            className={`flex items-center gap-1.5 group/action transition-colors ${
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
          <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors">
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
