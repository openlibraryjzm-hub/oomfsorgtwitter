'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Hash, 
  Check, 
  Copy, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Users,
  MessageSquare,
  Image as ImageIcon,
  Pencil,
  X,
  LogIn
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatTwitterAvatar, compressImageFile } from '@/lib/utils';
import { 
  getViewerRelationships, 
  toggleFollow, 
  isValidUuid 
} from '@/lib/follows';
import { MOCK_USERS, Comment, CURRENT_USER } from '@/lib/mockData';
import CommentCard from '@/components/feed/CommentCard';
import DoodleModal from '@/components/feed/DoodleModal';
import { saveSessionPost, deleteSessionPost, markPostAsDeleted } from '@/lib/postStore';

interface HashtagClientViewProps {
  tag: string;
}

interface CreatorWithTag {
  id: string;
  username: string;
  name: string;
  avatar: string;
  banner?: string;
  bio?: string;
  hashtags: string[];
  isVerified?: boolean;
}

const SAMPLE_TAG_POSTS: Record<string, Comment[]> = {
  vibecoder: [
    {
      id: 'tag_post_vibecoder_1',
      author: {
        id: 'usr_dev_kyle',
        username: 'dev_kyle',
        name: 'Kyle Phillips',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80',
        banner: '',
        bio: 'Rust & systems programmer.',
        joined: '2026',
        followingCount: 0,
        followersCount: 0,
        oomfsCount: 0,
        isVerified: true,
        links: []
      },
      createdAt: '2h',
      text: 'Late night vibecoding session with lofi beats and TypeScript. Building out the new tag hubs! #vibecoder',
      likesCount: 8,
      repliesCount: 2,
      repostsCount: 1,
    },
    {
      id: 'tag_post_vibecoder_2',
      author: {
        id: 'usr_amberlyn',
        username: 'amberlyn',
        name: 'Amberlyn',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
        banner: '',
        bio: 'Design engineer building oomfs.org.',
        joined: '2026',
        followingCount: 0,
        followersCount: 0,
        oomfsCount: 0,
        isVerified: true,
        links: []
      },
      createdAt: '4h',
      text: 'Just finished a fresh set of UI tokens for the hashtag timeline. Love how minimal this is feeling. #vibecoder',
      likesCount: 15,
      repliesCount: 4,
      repostsCount: 3,
    }
  ],
  painter: [
    {
      id: 'tag_post_painter_1',
      author: {
        id: 'usr_sora_arts',
        username: 'sora_arts',
        name: 'Sora 🎨',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
        banner: '',
        bio: 'Digital illustrator & painter.',
        joined: '2026',
        followingCount: 0,
        followersCount: 0,
        oomfsCount: 0,
        isVerified: true,
        links: []
      },
      createdAt: '3h',
      text: 'Working on a new digital canvas piece today! Exploring watercolors and gouache textures. #painter',
      images: [
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      ],
      likesCount: 24,
      repliesCount: 5,
      repostsCount: 6,
    }
  ],
  gamer: [
    {
      id: 'tag_post_gamer_1',
      author: {
        id: 'usr_amberlyn',
        username: 'amberlyn',
        name: 'Amberlyn',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
        banner: '',
        bio: 'Design engineer building oomfs.org.',
        joined: '2026',
        followingCount: 0,
        followersCount: 0,
        oomfsCount: 0,
        isVerified: true,
        links: []
      },
      createdAt: '1d',
      text: 'Cozy gaming Sunday. Anyone playing anything good lately? #gamer',
      likesCount: 12,
      repliesCount: 6,
      repostsCount: 2,
    }
  ]
};

export default function HashtagClientView({ tag }: HashtagClientViewProps) {
  const router = useRouter();
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();
  const supabase = createClient();

  const cleanTag = useMemo(() => {
    return tag.replace(/^#+/, '').trim().toLowerCase();
  }, [tag]);

  const displayTag = `#${cleanTag}`;

  const [activeTab, setActiveTab] = useState<'creators' | 'posts'>('creators');
  const [creators, setCreators] = useState<CreatorWithTag[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  // Posts state
  const [posts, setPosts] = useState<Comment[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Composer state
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Doodler state
  const [isDoodleModalOpen, setIsDoodleModalOpen] = useState(false);
  const [doodleEditingIndex, setDoodleEditingIndex] = useState<number | null>(null);
  const [doodleInitialImage, setDoodleInitialImage] = useState<string | null>(null);

  // Copy states for tag & share URL
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Viewer relationship sets for Follows you / Following status
  const [viewerFollowing, setViewerFollowing] = useState<Set<string>>(new Set());
  const [viewerFollowers, setViewerFollowers] = useState<Set<string>>(new Set());
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 1. Fetch viewer relationships
  useEffect(() => {
    async function loadRelationships() {
      if (authUser?.id && isValidUuid(authUser.id)) {
        const rels = await getViewerRelationships(authUser.id);
        setViewerFollowing(rels.followingIds);
        setViewerFollowers(rels.followerIds);
      } else {
        setViewerFollowing(new Set());
        setViewerFollowers(new Set());
      }
    }
    loadRelationships();
  }, [authUser?.id]);

  // 2. Query profiles tagged with this hashtag (Supabase + localStorage cache + mock fallback)
  useEffect(() => {
    let isCancelled = false;

    async function loadCreatorsWithTag() {
      setCreatorsLoading(true);
      try {
        const creatorMap = new Map<string, CreatorWithTag>();

        // Query Supabase for real profiles
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, banner_url, bio, hashtags, created_at')
          .order('created_at', { ascending: false });

        if (!error && dbProfiles) {
          for (const p of dbProfiles) {
            let userTags: string[] = Array.isArray(p.hashtags) ? p.hashtags : [];

            // Check localStorage cache for recent client updates
            if (typeof window !== 'undefined') {
              try {
                const cached =
                  localStorage.getItem(`oomfs_profile_hashtags_${p.id}`) ||
                  localStorage.getItem(`oomfs_profile_hashtags_${p.username}`);
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    userTags = parsed;
                  }
                }
              } catch {
                // ignore
              }
            }

            const hasTag = userTags.some(
              (t) => t.replace(/^#+/, '').trim().toLowerCase() === cleanTag
            );

            if (hasTag) {
              creatorMap.set(p.username.toLowerCase(), {
                id: p.id,
                username: p.username,
                name: p.name || p.username,
                avatar: formatTwitterAvatar(p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`),
                banner: p.banner_url,
                bio: p.bio,
                hashtags: userTags,
                isVerified: false,
              });
            }
          }
        }

        // Check mock users (showcase accounts) if not already included
        Object.values(MOCK_USERS).forEach((mockUser) => {
          let mockTags: string[] = mockUser.hashtags || [];

          if (typeof window !== 'undefined') {
            try {
              const cached =
                localStorage.getItem(`oomfs_profile_hashtags_${mockUser.id}`) ||
                localStorage.getItem(`oomfs_profile_hashtags_${mockUser.username}`);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  mockTags = parsed;
                }
              }
            } catch {
              // ignore
            }
          }

          const hasTag = mockTags.some(
            (t) => t.replace(/^#+/, '').trim().toLowerCase() === cleanTag
          );

          if (hasTag && !creatorMap.has(mockUser.username.toLowerCase())) {
            creatorMap.set(mockUser.username.toLowerCase(), {
              id: mockUser.id,
              username: mockUser.username,
              name: mockUser.name,
              avatar: formatTwitterAvatar(mockUser.avatar),
              banner: mockUser.banner,
              bio: mockUser.bio,
              hashtags: mockTags,
              isVerified: mockUser.isVerified,
            });
          }
        });

        if (!isCancelled) {
          setCreators(Array.from(creatorMap.values()));
        }
      } catch (err) {
        console.error('Error fetching creators for hashtag:', err);
      } finally {
        if (!isCancelled) {
          setCreatorsLoading(false);
        }
      }
    }

    loadCreatorsWithTag();

    return () => {
      isCancelled = true;
    };
  }, [cleanTag, supabase]);

  // 3. Query posts related to this hashtag (Supabase + localStorage cache + sample posts)
  useEffect(() => {
    let isCancelled = false;

    async function loadPostsForTag() {
      setPostsLoading(true);
      try {
        const postsList: Comment[] = [];
        const seenIds = new Set<string>();

        // Check localStorage cache first for instant hydration
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(`oomfs_tag_posts_${cleanTag}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                for (const p of parsed) {
                  if (p?.id && !seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    postsList.push(p);
                  }
                }
              }
            }
          } catch {
            // ignore
          }
        }

        // Query Supabase blocks
        const { data: dbBlocks, error } = await supabase
          .from('blocks')
          .select('*, profiles:user_id(*)')
          .order('created_at', { ascending: false });

        if (!error && dbBlocks) {
          for (const b of dbBlocks) {
            const content = b.content;
            if (!content) continue;

            const matchesTagField =
              content.hashtag && content.hashtag.toLowerCase() === cleanTag;
            const matchesTextHashtag =
              typeof content.text === 'string' &&
              content.text.toLowerCase().includes(`#${cleanTag}`);

            if (matchesTagField || matchesTextHashtag) {
              if (!seenIds.has(b.id)) {
                seenIds.add(b.id);
                const authorProfile = b.profiles;
                postsList.push({
                  id: b.id,
                  author: {
                    id: b.user_id,
                    username: authorProfile?.username || content.author?.username || 'user',
                    name: authorProfile?.name || content.author?.name || 'User',
                    avatar: formatTwitterAvatar(
                      authorProfile?.avatar_url || content.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`
                    ),
                    banner: authorProfile?.banner_url || '',
                    bio: authorProfile?.bio || '',
                    joined: '2026',
                    followingCount: 0,
                    followersCount: 0,
                    oomfsCount: 0,
                    isVerified: false,
                    links: []
                  },
                  createdAt: new Date(b.created_at).toLocaleDateString(),
                  text: content.text || '',
                  images: content.images || [],
                  likesCount: content.likesCount || 0,
                  repliesCount: content.repliesCount || 0,
                  repostsCount: content.repostsCount || 0,
                  isLiked: false,
                });
              }
            }
          }
        }

        // Include sample demo posts for showcase tags if empty
        const samplePosts = SAMPLE_TAG_POSTS[cleanTag] || [];
        for (const sp of samplePosts) {
          if (!seenIds.has(sp.id)) {
            seenIds.add(sp.id);
            postsList.push(sp);
          }
        }

        if (!isCancelled) {
          setPosts(postsList);
        }
      } catch (err) {
        console.error('Error fetching posts for hashtag:', err);
      } finally {
        if (!isCancelled) {
          setPostsLoading(false);
        }
      }
    }

    loadPostsForTag();

    return () => {
      isCancelled = true;
    };
  }, [cleanTag, supabase]);

  // Handle post image attachment selection
  const handlePostImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 4 - postImages.length;
    if (availableSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsUploadingImage(true);

    try {
      const compressedUrls = await Promise.all(
        filesToProcess.map((file) => compressImageFile(file, 1200, 0.85))
      );
      setPostImages((prev) => {
        const combined = [...prev, ...compressedUrls];
        return combined.slice(0, 4);
      });
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePostImage = (indexToRemove: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Doodle attachments
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
      setPostImages((prev) => {
        const copy = [...prev];
        copy[doodleEditingIndex] = doodleDataUrl;
        return copy;
      });
    } else {
      setPostImages((prev) => {
        if (prev.length >= 4) return prev;
        return [...prev, doodleDataUrl];
      });
    }
    setDoodleEditingIndex(null);
    setDoodleInitialImage(null);
  };

  // Submit new post to hashtag feed
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && postImages.length === 0) return;
    setIsSubmittingPost(true);

    const authorData = authProfile ? {
      id: authUser?.id || `usr_${authProfile.username}`,
      username: authProfile.username,
      name: authProfile.name || authProfile.username,
      avatar: authProfile.avatar_url || CURRENT_USER.avatar,
      isVerified: false,
      banner: '',
      bio: '',
      joined: '2026',
      followingCount: 0,
      followersCount: 0,
      oomfsCount: 0,
      links: []
    } : CURRENT_USER;

    let newPostId = `tag_post_${cleanTag}_${Date.now()}`;

    if (authUser?.id && isValidUuid(authUser.id)) {
      try {
        const payload: any = {
          user_id: authUser.id,
          type: 'comment',
          content: {
            text: postText.trim(),
            images: postImages,
            hashtag: cleanTag,
            author: authorData,
            likesCount: 0,
            repliesCount: 0,
            repostsCount: 0
          }
        };

        const { data, error } = await supabase
          .from('blocks')
          .insert(payload)
          .select('id')
          .single();

        if (data?.id) {
          newPostId = data.id;
        }
      } catch (err) {
        console.error('Error inserting post to Supabase:', err);
      }
    }

    const newComment: Comment = {
      id: newPostId,
      author: authorData,
      createdAt: 'Just now',
      text: postText.trim(),
      images: postImages,
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      isLiked: false
    };

    // Cache in session store so thread view resolves instantly
    saveSessionPost({
      id: newPostId,
      author: authorData,
      createdAt: 'Just now',
      type: 'comment',
      text: postText.trim(),
      images: postImages,
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1'
    });

    const updatedPosts = [newComment, ...posts];
    setPosts(updatedPosts);

    // Cache in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`oomfs_tag_posts_${cleanTag}`, JSON.stringify(updatedPosts));
      } catch {
        // ignore
      }
    }

    setPostText('');
    setPostImages([]);
    setIsSubmittingPost(false);
  };

  // Delete post
  const handleDeletePost = async (id: string) => {
    deleteSessionPost(id);
    markPostAsDeleted(id);
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`oomfs_tag_posts_${cleanTag}`, JSON.stringify(updatedPosts));
      } catch {
        // ignore
      }
    }

    if (authUser?.id) {
      try {
        await supabase.from('blocks').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting post from Supabase:', err);
      }
    }
  };

  // Copy tag text to clipboard
  const handleCopyTag = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(displayTag);
        setCopiedTag(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedTag(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy tag:', err);
    }
  };

  // Copy link to tag page
  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        if (linkTimeoutRef.current) clearTimeout(linkTimeoutRef.current);
        linkTimeoutRef.current = setTimeout(() => {
          setCopiedLink(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Follow / Unfollow toggle
  const handleToggleUserFollow = async (profileId: string) => {
    if (!authUser) {
      signInWithTwitter();
      return;
    }

    if (actionLoadingId) return;
    const isCurrentlyFollowing = viewerFollowing.has(profileId);

    // Optimistic toggle
    setViewerFollowing((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) next.delete(profileId);
      else next.add(profileId);
      return next;
    });

    setActionLoadingId(profileId);
    try {
      if (isValidUuid(profileId)) {
        const res = await toggleFollow(profileId, authUser.id, isCurrentlyFollowing);
        if (!res.success) {
          // Revert optimistic toggle
          setViewerFollowing((prev) => {
            const next = new Set(prev);
            if (isCurrentlyFollowing) next.add(profileId);
            else next.delete(profileId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow on hashtag page:', err);
      // Revert optimistic toggle
      setViewerFollowing((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) next.add(profileId);
        else next.delete(profileId);
        return next;
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Check if viewer has this tag on their notepad
  const viewerHasTag = useMemo(() => {
    if (!authProfile) return false;
    const authTags: string[] = Array.isArray(authProfile.hashtags) ? authProfile.hashtags : [];
    return authTags.some((t: string) => t.replace(/^#+/, '').trim().toLowerCase() === cleanTag);
  }, [authProfile, cleanTag]);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. STICKY TOP HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-[#0f1419]/10 rounded-full transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-extrabold text-base sm:text-lg text-[#0f1419] leading-tight truncate">
              {displayTag}
            </h1>
            <span className="text-xs text-[#536471] truncate">
              {activeTab === 'creators'
                ? creatorsLoading
                  ? 'Loading...'
                  : `${creators.length} ${creators.length === 1 ? 'creator' : 'creators'}`
                : postsLoading
                  ? 'Loading...'
                  : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Share / Copy Link"
            className="p-2 hover:bg-[#0f1419]/10 rounded-full transition-colors cursor-pointer text-[#536471] hover:text-[#0f1419] relative"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-[#00ba7c]" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {copiedLink && (
              <span className="absolute -bottom-8 right-0 bg-[#0f1419] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none z-30 whitespace-nowrap animate-in fade-in duration-100">
                Link copied!
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. DEDICATED HASHTAG HERO CARD */}
      <div className="p-4 sm:p-6 border-b border-[#eff3f4] bg-gradient-to-b from-[#f7f9f9]/70 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 flex items-center justify-center text-[#1d9bf0] shrink-0 shadow-xs">
              <Hash className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0f1419] tracking-tight">
                  <span className="text-[#1d9bf0]">#</span>
                  <span>{cleanTag}</span>
                </h2>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-[#1d9bf0]/10 text-[#1d9bf0] px-2 py-0.5 rounded-full">
                  Hashtag
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#536471] mt-1">
                Creators and discussions on oomfs.org for <span className="font-semibold text-[#0f1419]">{displayTag}</span>
              </p>
            </div>
          </div>

          {/* Quick Copy Tag Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyTag}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copiedTag
                  ? 'bg-[#00ba7c] text-white'
                  : 'bg-[#eff3f4] hover:bg-[#e2e8f0] text-[#0f1419]'
              }`}
            >
              {copiedTag ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied tag</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#536471]" />
                  <span>Copy tag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. DUAL TAB NAVIGATION BAR: Creators & Posts */}
      <div className="flex border-b border-[#eff3f4] bg-white sticky top-[53px] z-10">
        <button
          type="button"
          onClick={() => setActiveTab('creators')}
          className={`flex-1 py-3 text-center text-sm font-bold relative transition-colors cursor-pointer hover:bg-[#f7f9f9] ${
            activeTab === 'creators' ? 'text-[#0f1419]' : 'text-[#536471]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Creators</span>
            <span className="text-xs font-normal text-[#536471]">
              ({creators.length})
            </span>
          </div>
          {activeTab === 'creators' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1d9bf0] rounded-full mx-auto w-16" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-center text-sm font-bold relative transition-colors cursor-pointer hover:bg-[#f7f9f9] ${
            activeTab === 'posts' ? 'text-[#0f1419]' : 'text-[#536471]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>Posts</span>
            <span className="text-xs font-normal text-[#536471]">
              ({posts.length})
            </span>
          </div>
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1d9bf0] rounded-full mx-auto w-16" />
          )}
        </button>
      </div>

      {/* 4. TAB CONTENT */}
      {activeTab === 'creators' ? (
        /* ================= CREATORS TAB ================= */
        <div className="divide-y divide-[#eff3f4]">
          {creatorsLoading ? (
            <div className="py-16 text-center text-sm text-[#536471] animate-pulse">
              Finding creators tagging {displayTag}...
            </div>
          ) : creators.length > 0 ? (
            creators.map((c) => {
              const isSelf = authUser?.id === c.id || authProfile?.username === c.username;
              const isViewerFollowing = viewerFollowing.has(c.id);
              const userFollowsViewer = viewerFollowers.has(c.id);
              const isHovered = hoveredButtonId === c.id;
              const isActionLoading = actionLoadingId === c.id;

              return (
                <div
                  key={c.id || c.username}
                  className="p-4 sm:p-5 hover:bg-[#f7f9f9]/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Creator Avatar */}
                    <Link href={`/${c.username}`} className="shrink-0 group/avatar">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-[#eff3f4] group-hover/avatar:opacity-90 transition-opacity"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`;
                        }}
                      />
                    </Link>

                    {/* Creator Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/${c.username}`}
                            className="group/name inline-flex items-center gap-1 leading-tight"
                          >
                            <h3 className="font-extrabold text-base text-[#0f1419] group-hover/name:underline truncate">
                              {c.name}
                            </h3>
                            {c.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
                            )}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/${c.username}`}
                              className="text-xs text-[#536471] hover:underline"
                            >
                              @{c.username}
                            </Link>
                            {userFollowsViewer && !isViewerFollowing && (
                              <span className="bg-[#eff3f4] text-[#536471] text-[10px] font-medium px-1.5 py-0.2 rounded shrink-0">
                                Follows you
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Follow Button */}
                        <div>
                          {isSelf ? (
                            <span className="text-[11px] text-[#536471] font-medium px-2 py-0.5 bg-[#eff3f4] rounded-full shrink-0">
                              You
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserFollow(c.id)}
                              onMouseEnter={() => setHoveredButtonId(c.id)}
                              onMouseLeave={() => setHoveredButtonId(null)}
                              disabled={isActionLoading}
                              className={`font-bold text-xs min-w-[76px] py-1 px-3 rounded-full transition-all cursor-pointer ${
                                isViewerFollowing
                                  ? isHovered
                                    ? 'border border-red-200 bg-red-50 text-red-600'
                                    : 'border border-[#cfd9de] text-[#0f1419] bg-white'
                                  : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
                              } ${isActionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isViewerFollowing ? (isHovered ? 'Unfollow' : 'Following') : 'Follow'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bio snippet if available */}
                      {c.bio && (
                        <p className="text-xs sm:text-[13px] text-[#0f1419] mt-1.5 line-clamp-2 leading-relaxed">
                          {c.bio}
                        </p>
                      )}

                      {/* Creator's hashtags (clickable to their own tag pages) */}
                      {c.hashtags.length > 0 && (
                        <div className="mt-2 text-xs leading-relaxed text-[#0f1419] break-words">
                          {c.hashtags.map((hTag, idx) => {
                            const isLast = idx === c.hashtags.length - 1;
                            const hClean = hTag.replace(/^#+/, '').trim();
                            const isCurrentTag = hClean.toLowerCase() === cleanTag;

                            return (
                              <React.Fragment key={`${c.username}-${hTag}-${idx}`}>
                                <Link
                                  href={`/hashtag/${encodeURIComponent(hClean.toLowerCase())}`}
                                  className={`inline-flex items-center group/subtag ${
                                    isCurrentTag
                                      ? 'font-bold text-[#1d9bf0]'
                                      : 'text-[#0f1419] hover:text-[#1d9bf0]'
                                  } transition-colors`}
                                >
                                  <span className="text-[#1d9bf0] font-bold mr-0.5">#</span>
                                  <span className="group-hover/subtag:underline underline-offset-2">
                                    {hClean}
                                  </span>
                                </Link>
                                {!isLast && <span className="text-[#536471] mr-1.5">,</span>}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State: No creators with this tag yet */
            <div className="py-16 px-6 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-[#1d9bf0]/10 text-[#1d9bf0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hash className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0f1419] mb-1.5">
                No creators using {displayTag} yet
              </h3>
              <p className="text-xs sm:text-sm text-[#536471] leading-relaxed mb-6">
                Be the first creator to add <span className="font-bold text-[#0f1419]">{displayTag}</span> to your profile notepad on oomfs.org!
              </p>

              {authUser && authProfile ? (
                viewerHasTag ? (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00ba7c]/10 text-[#00ba7c] font-bold text-xs rounded-full">
                    <Check className="w-4 h-4" />
                    <span>You have this hashtag on your profile</span>
                  </div>
                ) : (
                  <Link
                    href={`/${authProfile.username}/hashtags`}
                    className="inline-flex items-center gap-2 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#1d9bf0]" />
                    <span>Add {displayTag} to your profile</span>
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => signInWithTwitter()}
                  className="inline-flex items-center gap-2 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors shadow-xs cursor-pointer"
                >
                  <span>Connect X to claim {displayTag}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ================= POSTS TAB (Tag Comment Section) ================= */
        <div className="flex flex-col">
          {/* Tag Post / Comment Composer */}
          <div className="p-4 border-b border-[#eff3f4] bg-white flex gap-3">
            <img
              src={formatTwitterAvatar(authProfile?.avatar_url || CURRENT_USER.avatar)}
              alt="Your avatar"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
            />
            <form onSubmit={handleAddPost} className="flex-1 flex flex-col gap-2 min-w-0">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder={`Post something to ${displayTag}...`}
                rows={postImages.length > 0 ? 2 : 3}
                className="w-full text-[15px] text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
              />

              {/* Previews of attached images */}
              {postImages.length > 0 && (
                <div
                  className={`grid gap-2 mb-1 ${
                    postImages.length === 1
                      ? 'grid-cols-1 max-w-sm'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {postImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group/preview rounded-xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] aspect-square"
                    >
                      <img
                        src={img}
                        alt={`Attached ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

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
                        onClick={() => handleRemovePostImage(idx)}
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
                ref={fileInputRef}
                onChange={handlePostImageSelect}
                multiple
                accept="image/*"
                className="hidden"
              />

              {/* Composer Actions Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={postImages.length >= 4 || isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    title={
                      postImages.length >= 4
                        ? 'Maximum 4 images allowed'
                        : 'Add photos (up to 4)'
                    }
                    className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {postImages.length > 0 && (
                      <span className="text-[11px] font-bold text-[#1d9bf0]">
                        {postImages.length}/4
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={postImages.length >= 4 || isUploadingImage}
                    onClick={handleOpenBlankDoodler}
                    title={
                      postImages.length >= 4
                        ? 'Maximum 4 attachments allowed'
                        : 'Draw a doodle'
                    }
                    className="px-2.5 py-1 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Doodle</span>
                  </button>

                  {isUploadingImage && (
                    <span className="text-xs text-[#536471] animate-pulse">
                      Compressing photo...
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    (!postText.trim() && postImages.length === 0) ||
                    isSubmittingPost ||
                    isUploadingImage
                  }
                  className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  {isSubmittingPost ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts List / Comments Feed */}
          <div>
            {postsLoading ? (
              <div className="py-16 text-center text-sm text-[#536471] animate-pulse">
                Loading posts for {displayTag}...
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <CommentCard
                  key={post.id}
                  comment={post}
                  onDelete={handleDeletePost}
                  canDelete={Boolean(
                    (authProfile && authProfile.username === post.author.username) ||
                    (authUser && authUser.id === post.author.id)
                  )}
                />
              ))
            ) : (
              <div className="text-center py-16 px-6 text-[#536471] max-w-sm mx-auto">
                <div className="w-12 h-12 bg-[#1d9bf0]/10 text-[#1d9bf0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-[#0f1419] mb-1">
                  No posts on {displayTag} yet
                </h4>
                <p className="text-xs sm:text-sm text-[#536471] leading-relaxed">
                  Be the first to share your thoughts, photos, or doodles about {displayTag} above!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. DOODLE MODAL */}
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
