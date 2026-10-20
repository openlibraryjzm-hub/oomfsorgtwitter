'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Heart, Repeat2, Share, CheckCircle2 } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import { Post, ThreadReply, MOCK_THREAD_REPLIES, CURRENT_USER } from '@/lib/mockData';
import { getSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';

interface ThreadClientViewProps {
  initialPost: Post;
  username: string;
}

export default function ThreadClientView({ initialPost, username }: ThreadClientViewProps) {
  const { user: authUser, profile: authProfile } = useAuth();
  const supabase = createClient();
  const [post, setPost] = useState<Post>(() => {
    const cached = getSessionPost(initialPost.id);
    return cached || initialPost;
  });

  const [replies, setReplies] = useState<ThreadReply[]>(() => {
    return MOCK_THREAD_REPLIES[initialPost.id] || [];
  });
  const [replyText, setReplyText] = useState('');

  // Ensure client-side resolution from session store or Supabase if server returned fallback
  useEffect(() => {
    const cached = getSessionPost(initialPost.id);
    if (cached) {
      setPost(cached);
      return;
    }

    const isFallback = initialPost.text === `Post #${initialPost.id} on oomfs.org` &&
      !initialPost.carouselData &&
      !initialPost.boardData &&
      !initialPost.linkData;

    if (isFallback) {
      const fetchFromSupabase = async () => {
        try {
          const { data: dbBlock } = await supabase
            .from('blocks')
            .select('*, profiles(*)')
            .eq('id', initialPost.id)
            .single();

          if (dbBlock) {
            const authorProfile = dbBlock.profiles;
            setPost({
              id: dbBlock.id,
              author: {
                id: dbBlock.user_id,
                username: authorProfile?.username || username,
                name: authorProfile?.name || username,
                avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                banner: authorProfile?.banner_url || '',
                bio: authorProfile?.bio || '',
                joined: 'October 2026',
                followingCount: 0,
                followersCount: 0,
                oomfsCount: 0,
                links: []
              },
              createdAt: new Date(dbBlock.created_at).toLocaleDateString(),
              type: dbBlock.type,
              text: dbBlock.content?.text || '',
              images: dbBlock.content?.images || [],
              targetUsername: dbBlock.content?.targetUsername || null,
              targetUserId: dbBlock.target_user_id || null,
              carouselData: dbBlock.content?.carouselData,
              boardData: dbBlock.content?.boardData,
              linkData: dbBlock.content?.linkData,
              badgeData: dbBlock.content?.badgeData,
              likesCount: dbBlock.content?.likesCount || 0,
              repostsCount: dbBlock.content?.repostsCount || 0,
              repliesCount: dbBlock.content?.repliesCount || 0,
              viewsCount: '1'
            });
          }
        } catch (err) {
          console.error('Error loading thread post on client:', err);
        }
      };

      fetchFromSupabase();
    }
  }, [initialPost, username, supabase]);

  const currentUserAvatar = formatTwitterAvatar(authProfile?.avatar_url || CURRENT_USER.avatar);
  const currentUserName = authProfile?.name || CURRENT_USER.name;
  const currentUserHandle = authProfile?.username || CURRENT_USER.username;

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply: ThreadReply = {
      id: `reply_${Date.now()}`,
      author: {
        id: authUser?.id || `usr_${currentUserHandle}`,
        username: currentUserHandle,
        name: currentUserName,
        avatar: currentUserAvatar,
        banner: '',
        bio: '',
        joined: 'October 2026',
        followingCount: 0,
        followersCount: 0,
        oomfsCount: 0,
        links: []
      },
      createdAt: 'Just now',
      text: replyText.trim(),
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      isLiked: false
    };

    setReplies([...replies, newReply]);
    setReplyText('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 flex items-center gap-6 px-4 py-3 border-b border-[#eff3f4]">
        <button 
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else if (post.targetUsername) {
              window.location.href = `/${post.targetUsername}`;
            } else {
              window.location.href = `/${username}`;
            }
          }}
          className="p-2 hover:bg-[#f7f9f9] rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
        </button>
        <h1 className="font-extrabold text-xl text-[#0f1419]">
          Post
        </h1>
      </header>

      {/* Main Tweet View */}
      <PostCard post={post} isThreadView={true} />

      {/* Reply Composer */}
      <div className="p-4 border-b border-[#eff3f4] bg-white">
        <div className="text-xs text-[#536471] mb-2 pl-12">
          Replying to <span className="text-[#1d9bf0]">@{post.author.username}</span>
        </div>

        <form onSubmit={handleAddReply} className="flex gap-3">
          <img
            src={currentUserAvatar}
            alt={currentUserName}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
          />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Post your reply"
              rows={2}
              className="w-full text-base text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
            />
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold text-sm px-4 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Reply
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Thread Replies List */}
      <div className="flex-1">
        {replies.length > 0 ? (
          replies.map((reply) => (
            <article key={reply.id} className="p-4 border-b border-[#eff3f4] hover:bg-[#f7f9f9]/40 transition-colors flex gap-3">
              <Link href={`/${reply.author.username}`} className="shrink-0">
                <img
                  src={formatTwitterAvatar(reply.author.avatar)}
                  alt={reply.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Link href={`/${reply.author.username}`} className="font-bold text-[#0f1419] hover:underline flex items-center gap-1">
                    {reply.author.name}
                    {reply.author.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white inline" />
                    )}
                  </Link>
                  <span className="text-[#536471]">@{reply.author.username}</span>
                  <span className="text-[#536471]">·</span>
                  <span className="text-[#536471]">{reply.createdAt}</span>
                </div>
                <p className="text-[#0f1419] text-[15px] leading-relaxed whitespace-pre-line">
                  {reply.text}
                </p>
                <div className="flex items-center gap-6 text-xs text-[#536471] pt-1">
                  <button type="button" className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors cursor-pointer">
                    <MessageCircle className="w-4 h-4" />
                    <span>{reply.repliesCount || ''}</span>
                  </button>
                  <button type="button" className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer">
                    <Repeat2 className="w-4 h-4" />
                    <span>{reply.repostsCount || ''}</span>
                  </button>
                  <button type="button" className="flex items-center gap-1.5 hover:text-pink-600 transition-colors cursor-pointer">
                    <Heart className="w-4 h-4" />
                    <span>{reply.likesCount || ''}</span>
                  </button>
                  <button type="button" className="hover:text-[#1d9bf0] transition-colors cursor-pointer">
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 text-center text-[#536471] text-sm">
            No replies yet. Be the first to join the conversation!
          </div>
        )}
      </div>
    </div>
  );
}
