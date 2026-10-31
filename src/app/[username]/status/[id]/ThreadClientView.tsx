'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Heart, Repeat2, Share, CheckCircle2, Image as ImageIcon, Pencil, X } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import TwitterMediaGrid from '@/components/feed/TwitterMediaGrid';
import DoodleModal from '@/components/feed/DoodleModal';
import { Post, ThreadReply, MOCK_THREAD_REPLIES, CURRENT_USER } from '@/lib/mockData';
import { getSessionPost, deleteSessionPost, markPostAsDeleted } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar, compressImageFile } from '@/lib/utils';

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
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [isUploadingReplyImage, setIsUploadingReplyImage] = useState(false);
  const [isDoodleModalOpen, setIsDoodleModalOpen] = useState(false);
  const [doodleEditingIndex, setDoodleEditingIndex] = useState<number | null>(null);
  const [doodleInitialImage, setDoodleInitialImage] = useState<string | null>(null);
  const replyFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleOpenDoodlerForImage = (imgSrc: string, index: number) => {
    setDoodleInitialImage(imgSrc);
    setDoodleEditingIndex(index);
    setIsDoodleModalOpen(true);
  };

  const handleOpenBlankDoodler = () => {
    setDoodleInitialImage(null);
    setDoodleEditingIndex(null);
    setIsDoodleModalOpen(true);
  };

  const handleAttachDoodle = (doodleDataUrl: string) => {
    if (doodleEditingIndex !== null) {
      setReplyImages((prev) => {
        const copy = [...prev];
        copy[doodleEditingIndex] = doodleDataUrl;
        return copy;
      });
    } else {
      setReplyImages((prev) => {
        if (prev.length >= 4) return prev;
        return [...prev, doodleDataUrl];
      });
    }
    setDoodleEditingIndex(null);
    setDoodleInitialImage(null);
  };

  const handleReplyImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 4 - replyImages.length;
    if (availableSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsUploadingReplyImage(true);

    try {
      const compressedUrls = await Promise.all(
        filesToProcess.map((f) => compressImageFile(f, 1200, 0.85))
      );
      setReplyImages((prev) => [...prev, ...compressedUrls].slice(0, 4));
    } catch (err) {
      console.error('Error compressing reply image:', err);
    } finally {
      setIsUploadingReplyImage(false);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveReplyImage = (index: number) => {
    setReplyImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Ensure client-side resolution from session store or Supabase if server returned fallback
  useEffect(() => {
    const cached = getSessionPost(initialPost.id);
    if (cached) {
      setPost(cached);
      return;
    }

    const isFallback = initialPost.text === `Post #${initialPost.id} on oomfsorg` &&
      !initialPost.boardData &&
      !(initialPost.attachments && initialPost.attachments.length > 0) &&
      !(initialPost.images && initialPost.images.length > 0);

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
              title: dbBlock.content?.title || dbBlock.content?.text || undefined,
              text: dbBlock.content?.title || dbBlock.content?.text || '',
              images: dbBlock.content?.images || [],
              attachments: dbBlock.content?.attachments || [],
              targetUsername: dbBlock.content?.targetUsername || null,
              targetUserId: dbBlock.target_user_id || null,
              boardData: dbBlock.content?.boardData,
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
    if (!replyText.trim() && replyImages.length === 0) return;

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
      images: replyImages.length > 0 ? replyImages : undefined,
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      isLiked: false
    };

    setReplies([...replies, newReply]);
    setReplyText('');
    setReplyImages([]);
  };

  const router = useRouter();
  const isOwner = Boolean(
    (authProfile && authProfile.username.toLowerCase() === username.toLowerCase()) ||
    (authUser && authUser.id === post.author.id) ||
    (username.toLowerCase() === 'amberlyn' && !authUser)
  );

  const handleDeleteThreadPost = async (id: string) => {
    if (confirm('Delete this board?')) {
      deleteSessionPost(id);
      markPostAsDeleted(id);
      if (authUser?.id) {
        try {
          await supabase.from('blocks').delete().eq('id', id);
        } catch (err) {
          console.error('Error deleting block from Supabase:', err);
        }
      }
      router.push(`/${username}`);
    }
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
          Board
        </h1>
      </header>

      {/* Main Tweet View */}
      <PostCard post={post} isThreadView={true} onDelete={isOwner ? handleDeleteThreadPost : undefined} />

      {/* Reply Composer */}
      <div className="p-4 border-b border-[#eff3f4] bg-white">
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
              rows={replyImages.length > 0 ? 2 : 2}
              className="w-full text-base text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
            />

            {/* Previews of attached images/doodles */}
            {replyImages.length > 0 && (
              <div className={`grid gap-2 mb-1 ${
                replyImages.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2 sm:grid-cols-4'
              }`}>
                {replyImages.map((img, idx) => (
                  <div key={idx} className="relative group/preview rounded-xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] aspect-square">
                    <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Doodle on this image button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDoodlerForImage(img, idx)}
                      className="absolute bottom-1.5 right-1.5 px-2 py-1 bg-black/75 hover:bg-[#1d9bf0] text-white rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Doodle on this photo"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Doodle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveReplyImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={replyFileInputRef}
              onChange={handleReplyImageSelect}
              multiple
              accept="image/*"
              className="hidden"
            />

            {/* Reply Actions Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  disabled={replyImages.length >= 4 || isUploadingReplyImage}
                  onClick={() => replyFileInputRef.current?.click()}
                  title={replyImages.length >= 4 ? "Maximum 4 images allowed" : "Add photos (up to 4)"}
                  className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  {replyImages.length > 0 && (
                    <span className="text-[11px] font-bold text-[#1d9bf0]">
                      {replyImages.length}/4
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={replyImages.length >= 4 || isUploadingReplyImage}
                  onClick={handleOpenBlankDoodler}
                  title={replyImages.length >= 4 ? "Maximum 4 attachments allowed" : "Draw a doodle"}
                  className="px-2.5 py-1 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Doodle</span>
                </button>

                {isUploadingReplyImage && (
                  <span className="text-xs text-[#536471] animate-pulse">
                    Compressing photo...
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={(!replyText.trim() && replyImages.length === 0) || isUploadingReplyImage}
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
                {reply.text && (
                  <p className="text-[#0f1419] text-[15px] leading-relaxed whitespace-pre-line">
                    {reply.text}
                  </p>
                )}
                {reply.images && reply.images.length > 0 && (
                  <div className="mt-1">
                    <TwitterMediaGrid images={reply.images} />
                  </div>
                )}
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

      {/* Strawpage Doodler Modal */}
      <DoodleModal
        isOpen={isDoodleModalOpen}
        onClose={() => {
          setIsDoodleModalOpen(false);
          setDoodleEditingIndex(null);
          setDoodleInitialImage(null);
        }}
        onSave={handleAttachDoodle}
        initialImage={doodleInitialImage}
      />
    </div>
  );
}
