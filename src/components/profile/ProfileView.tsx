'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  X,
  LogIn,
  ChevronDown,
  Filter,
  Search,
  Paintbrush,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { 
  User, 
  MOCK_POSTS, 
  MOCK_COMMENTS, 
  MOCK_LIKED_POSTS, 
  CURRENT_USER, 
  Post, 
  Comment,
  MOCK_COLLECTIONS,
  MOCK_LINK_COLLECTIONS,
  Collection
} from '@/lib/mockData';
import PostCard from '@/components/feed/PostCard';
import CommentCard from '@/components/feed/CommentCard';
import PostComposer from '@/components/feed/PostComposer';
import CollectionLensBar from '@/components/collections/CollectionLensBar';
import AllCollectionsModal from '@/components/collections/AllCollectionsModal';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { getProfileFollowStats, toggleFollow, isValidUuid } from '@/lib/follows';

interface ProfileViewProps {
  user: User;
}

function XLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function CatShushIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cat ears & head outline */}
      <path d="M4 10 L4 4 L9 6 C11 5.4 13 5.4 15 6 L20 4 L20 10 C21.2 15 18 20 12 20 C6 20 2.8 15 4 10 Z" />
      {/* Eyes: playful curved arcs */}
      <path d="M7 11.5 C7.8 10.3 9.2 10.3 10 11.5" />
      <path d="M14 11.5 C14.8 10.3 16.2 10.3 17 11.5" />
      {/* Whiskers */}
      <path d="M2 12.5 L4.5 13.5" />
      <path d="M2 15 L4.5 14.5" />
      <path d="M22 12.5 L19.5 13.5" />
      <path d="M22 15 L19.5 14.5" />
      {/* Tiny nose */}
      <path d="M11.5 12 L12.5 12 L12 12.7 Z" fill="currentColor" stroke="none" />
      {/* Shushing Paw over mouth */}
      <path
        d="M10.5 20 V14.5 C10.5 13.7 11.17 13 12 13 C12.83 13 13.5 13.7 13.5 14.5 V20"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Paw pad division line */}
      <path d="M12 13 V15" />
    </svg>
  );
}

export default function ProfileView({ user: initialUser }: ProfileViewProps) {
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();
  const supabase = createClient();

  // 4 tabs requested left-to-right: 1. Posts (default), 2. Comments, 3. Links, 4. Likes
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'links' | 'likes'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);
  const [userProfile, setUserProfile] = useState<User>(initialUser);

  // Curated collections / presets state (shared placeholders across profiles)
  const [collections] = useState<Collection[]>(MOCK_COLLECTIONS);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [allCollectionsModalOpen, setAllCollectionsModalOpen] = useState(false);
  const [showPostCollections, setShowPostCollections] = useState(false);

  // Curated link collections / presets state (shared placeholders across profiles)
  const [linkCollections] = useState<Collection[]>(MOCK_LINK_COLLECTIONS);
  const [activeLinkCollectionId, setActiveLinkCollectionId] = useState<string | null>(null);
  const [allLinkCollectionsModalOpen, setAllLinkCollectionsModalOpen] = useState(false);
  const [showLinkCollections, setShowLinkCollections] = useState(false);

  const handleSelectPostCollection = (id: string | null) => {
    setActiveCollectionId(id);
    if (id !== null) {
      setShowPostCollections(true);
    }
  };

  const handleSelectLinkCollection = (id: string | null) => {
    setActiveLinkCollectionId(id);
    if (id !== null) {
      setShowLinkCollections(true);
    }
  };

  // Check if viewing own profile
  const isSelf = Boolean(
    (authProfile && authProfile.username.toLowerCase() === initialUser.username.toLowerCase()) || 
    (authUser && authProfile?.username === initialUser.username) ||
    (authUser && userProfile.id && authUser.id === userProfile.id)
  );

  // Sticky header scroll detection & action state
  const followButtonRef = useRef<HTMLDivElement>(null);
  const [isScrolledPastFollow, setIsScrolledPastFollow] = useState(false);
  const [isHoveringStickyFollow, setIsHoveringStickyFollow] = useState(false);
  const shouldShowStickyFollow = !isSelf && Boolean(authUser) && isScrolledPastFollow;

  // Posts state
  const [posts, setPosts] = useState<Post[]>(() => {
    const defaultPosts = MOCK_POSTS.filter(p => p.author.username === initialUser.username);
    return defaultPosts.length > 0 ? defaultPosts : [
      {
        id: `post_sample_${initialUser.username}`,
        author: initialUser,
        createdAt: '10m',
        type: 'standard',
        text: `Welcome to my oomfs.org profile! Connect with me and leave a comment below.`,
        likesCount: 12,
        repostsCount: 2,
        repliesCount: 1,
        viewsCount: '450'
      }
    ];
  });

  // Comments state
  const [comments, setComments] = useState<Comment[]>(() => {
    return MOCK_COMMENTS[initialUser.username] || [];
  });
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Likes state (only liked posts)
  const [likedPosts] = useState<Post[]>(() => {
    return MOCK_LIKED_POSTS[initialUser.username] || [];
  });

  // Composer Drawer State (for Posts & Links)
  const [composerOpen, setComposerOpen] = useState(false);
  const [blockType, setBlockType] = useState<'standard' | 'carousel' | 'board' | 'link_card' | 'badge'>('standard');

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(initialUser.name);
  const [editBio, setEditBio] = useState(initialUser.bio);
  const [editLocation, setEditLocation] = useState(initialUser.location || '');
  const [editWebsite, setEditWebsite] = useState(initialUser.website || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Listen for posts created via the LeftSidebar modal or inline PostComposer
  useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent<Post>;
      const newPost = customEvent.detail;
      if (!newPost) return;

      saveSessionPost(newPost);
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });

      if (newPost.type === 'link_card' || newPost.type === 'badge') {
        setActiveTab('links');
      } else {
        setActiveTab('posts');
      }
    };

    window.addEventListener('oomfs:post-created', handlePostCreated);
    return () => window.removeEventListener('oomfs:post-created', handlePostCreated);
  }, []);

  // Fetch real Supabase data if this profile exists in DB (or if signed-in user created blocks)
  useEffect(() => {
    const loadSupabaseProfileAndBlocks = async () => {
      try {
        const { data: dbUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', initialUser.username.toLowerCase())
          .single();

        let targetUserId = dbUser?.id || null;

        if (dbUser) {
          const followStats = await getProfileFollowStats(dbUser.id, authUser?.id);
          setIsFollowing(followStats.isFollowing);
          setIsMutual(followStats.isMutual);
          setFollowsYou(followStats.followsYou);

          setUserProfile(prev => ({
            ...prev,
            id: dbUser.id,
            name: dbUser.name ?? prev.name,
            avatar: dbUser.avatar_url ?? prev.avatar,
            banner: dbUser.banner_url ?? prev.banner,
            bio: dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : prev.bio,
            location: dbUser.location ?? prev.location,
            website: dbUser.website ?? prev.website,
            followersCount: followStats.followersCount,
            followingCount: followStats.followingCount,
            oomfsCount: followStats.oomfsCount,
          }));
          setEditName(dbUser.name ?? initialUser.name);
          setEditBio(dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : initialUser.bio);
          setEditLocation(dbUser.location ?? initialUser.location ?? '');
          setEditWebsite(dbUser.website ?? initialUser.website ?? '');
        } else if (authUser?.id && initialUser.username.toLowerCase() === 'amberlyn') {
          // If viewing the default landing demo profile while signed in, also surface blocks created by this user
          targetUserId = authUser.id;
        }

        if (targetUserId) {
          const { data: dbBlocks, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (!error && dbBlocks && dbBlocks.length > 0) {
            const mappedPosts: Post[] = [];
            const mappedComments: Comment[] = [];

            for (const b of dbBlocks) {
              if (b.type === 'comment') {
                mappedComments.push({
                  id: b.id,
                  author: b.content?.author || {
                    id: 'guest',
                    username: 'guest',
                    name: 'Guest User',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
                    joined: '2026',
                    followingCount: 0,
                    followersCount: 0,
                    oomfsCount: 0,
                    links: []
                  },
                  createdAt: new Date(b.created_at).toLocaleDateString(),
                  text: b.content?.text || '',
                  likesCount: b.content?.likesCount || 0,
                  isLiked: false
                });
              } else if (
                b.type === 'standard' ||
                b.type === 'carousel' ||
                b.type === 'board' ||
                b.type === 'link_card' ||
                b.type === 'badge'
              ) {
                const postObj: Post = {
                  id: b.id,
                  author: dbUser ? {
                    ...initialUser,
                    id: dbUser.id,
                    name: dbUser.name || initialUser.name,
                    avatar: dbUser.avatar_url || initialUser.avatar,
                  } : initialUser,
                  createdAt: new Date(b.created_at).toLocaleDateString(),
                  type: b.type,
                  text: b.content?.text || '',
                  carouselData: b.content?.carouselData,
                  boardData: b.content?.boardData,
                  linkData: b.content?.linkData,
                  badgeData: b.content?.badgeData,
                  likesCount: b.content?.likesCount || 0,
                  repostsCount: b.content?.repostsCount || 0,
                  repliesCount: 0,
                  viewsCount: '1',
                };
                saveSessionPost(postObj);
                mappedPosts.push(postObj);
              }
            }

            if (mappedPosts.length > 0) {
              if (dbUser) {
                // Real DB profile: show their DB posts (or keep sample if only link_card/badge exists)
                const hasTimelinePosts = mappedPosts.some(p => p.type !== 'link_card' && p.type !== 'badge');
                if (hasTimelinePosts) {
                  setPosts(mappedPosts);
                } else {
                  setPosts(prev => {
                    const existingIds = new Set(mappedPosts.map(p => p.id));
                    return [...mappedPosts, ...prev.filter(p => !existingIds.has(p.id))];
                  });
                }
              } else {
                // Demo landing profile: prepend user's Supabase posts above the mock showcase posts
                setPosts(prev => {
                  const existingIds = new Set(mappedPosts.map(p => p.id));
                  return [...mappedPosts, ...prev.filter(p => !existingIds.has(p.id))];
                });
              }
            }
            if (mappedComments.length > 0) {
              setComments(mappedComments);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      }
    };

    loadSupabaseProfileAndBlocks();
  }, [initialUser.username, authUser?.id]);

  // Keep follow status and counts in sync with Supabase
  useEffect(() => {
    const profileId = userProfile.id;
    if (isValidUuid(profileId)) {
      getProfileFollowStats(profileId, authUser?.id).then((stats) => {
        setIsFollowing(stats.isFollowing);
        setIsMutual(stats.isMutual);
        setFollowsYou(stats.followsYou);
        setUserProfile((prev) => ({
          ...prev,
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
          oomfsCount: stats.oomfsCount,
        }));
      });
    }
  }, [userProfile.id, authUser?.id]);

  // Track scroll position past the main profile follow/action button to toggle sticky header action
  useEffect(() => {
    const checkPosition = () => {
      if (!followButtonRef.current) return;
      const rect = followButtonRef.current.getBoundingClientRect();
      setIsScrolledPastFollow(rect.bottom < 53);
    };

    window.addEventListener('scroll', checkPosition, { passive: true });
    checkPosition();

    return () => window.removeEventListener('scroll', checkPosition);
  }, []);

  // Toggle follow/unfollow with optimistic UI updates
  const handleToggleFollow = async () => {
    if (!authUser) {
      signInWithTwitter();
      return;
    }
    if (isSelf || isFollowLoading) return;

    const targetUserId = userProfile.id;
    const currentFollowing = isFollowing;
    const wasMutual = isMutual;

    setIsFollowLoading(true);

    // Optimistic UI updates
    setIsFollowing(!currentFollowing);
    if (currentFollowing) {
      // Unfollowing
      setIsMutual(false);
      setUserProfile((prev) => ({
        ...prev,
        followersCount: Math.max(0, prev.followersCount - 1),
        oomfsCount: wasMutual ? Math.max(0, prev.oomfsCount - 1) : prev.oomfsCount,
      }));
    } else {
      // Following
      setUserProfile((prev) => ({
        ...prev,
        followersCount: prev.followersCount + 1,
      }));
    }

    try {
      if (isValidUuid(targetUserId)) {
        const res = await toggleFollow(targetUserId, authUser.id, currentFollowing);
        if (!res.success) {
          console.error('Failed to toggle follow in Supabase:', res.error);
          // Rollback
          setIsFollowing(currentFollowing);
          setIsMutual(wasMutual);
          setUserProfile((prev) => ({
            ...prev,
            followersCount: currentFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
            oomfsCount: wasMutual ? prev.oomfsCount + 1 : prev.oomfsCount,
          }));
        } else {
          // Re-fetch exact counts and mutual status
          const freshStats = await getProfileFollowStats(targetUserId, authUser.id);
          setIsFollowing(freshStats.isFollowing);
          setIsMutual(freshStats.isMutual);
          setFollowsYou(freshStats.followsYou);
          setUserProfile((prev) => ({
            ...prev,
            followersCount: freshStats.followersCount,
            followingCount: freshStats.followingCount,
            oomfsCount: freshStats.oomfsCount,
          }));
        }
      }
    } catch (err) {
      console.error('Error in handleToggleFollow:', err);
      // Rollback
      setIsFollowing(currentFollowing);
      setIsMutual(wasMutual);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    setUserProfile(prev => ({
      ...prev,
      name: editName,
      bio: editBio,
      location: editLocation,
      website: editWebsite,
    }));

    if (authUser?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: editName,
            bio: editBio,
            location: editLocation,
            website: editWebsite,
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('Error saving profile to Supabase:', error);
          alert('Could not update profile in Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Error saving profile to Supabase:', err);
      }
    }

    setIsSavingProfile(false);
    setEditModalOpen(false);
  };

  // Add Comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);

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

    let newCommentId = `comment_${Date.now()}`;

    // Persist to Supabase if signed in
    const targetOwnerId = userProfile.id && !userProfile.id.startsWith('usr_')
      ? userProfile.id
      : authUser?.id;

    if (targetOwnerId && authUser?.id) {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .insert({
            user_id: authUser.id,
            type: 'comment',
            content: {
              text: commentText.trim(),
              targetUsername: userProfile.username,
              author: authorData,
              likesCount: 0
            }
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          newCommentId = data.id;
        }
      } catch (err) {
        console.error('Error inserting comment to Supabase:', err);
      }
    }

    const newComment: Comment = {
      id: newCommentId,
      author: authorData,
      createdAt: 'Just now',
      text: commentText.trim(),
      likesCount: 0,
      isLiked: false
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    if (authUser?.id) {
      try {
        await supabase.from('blocks').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting comment from Supabase:', err);
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
    if (authUser?.id) {
      try {
        await supabase.from('blocks').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting block from Supabase:', err);
      }
    }
  };

  // Raw timeline posts (Standard, Carousel, Board) - excludes link cards and badges
  const rawTimelinePosts = useMemo(
    () => posts.filter((p) => p.type !== 'link_card' && p.type !== 'badge'),
    [posts]
  );

  // Filter & custom-order timeline posts when a collection lens is selected
  const timelinePosts = useMemo(() => {
    if (!activeCollectionId) {
      return rawTimelinePosts;
    }
    const col = collections.find((c) => c.id === activeCollectionId);
    if (!col || !col.itemIds || col.itemIds.length === 0) {
      return rawTimelinePosts;
    }
    const postMap = new Map(rawTimelinePosts.map((p) => [p.id, p]));
    const matchedPosts: Post[] = [];
    for (const id of col.itemIds) {
      const found = postMap.get(id);
      if (found) {
        matchedPosts.push(found);
      }
    }
    // If the active collection specifies item IDs that aren't on this specific user profile
    // (e.g. visiting a non-amberlyn profile or a profile with custom user-generated posts),
    // provide a deterministic slice of this profile's timeline posts so the preset order demo is always functional
    if (matchedPosts.length === 0 && rawTimelinePosts.length > 0) {
      return rawTimelinePosts.slice(0, Math.min(rawTimelinePosts.length, col.itemIds.length));
    }
    return matchedPosts;
  }, [rawTimelinePosts, activeCollectionId, collections]);

  // Unified Badge Wall posts
  const badgePosts = posts.filter(p => p.type === 'badge' && p.badgeData);

  // Raw combined links (user profile links + link_card posts)
  const rawLinkCards = useMemo(() => [
    ...posts.filter(p => p.type === 'link_card' && p.linkData).map(p => ({
      id: p.id,
      title: p.linkData!.title,
      url: p.linkData!.url,
      description: p.linkData!.description || p.text,
      clicks: 120
    })),
    ...userProfile.links.map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      description: l.category ? `Category: ${l.category}` : undefined,
      clicks: l.clicks
    }))
  ], [posts, userProfile.links]);

  // Filter & custom-order link cards when a link collection lens is selected
  const linkCards = useMemo(() => {
    if (!activeLinkCollectionId) {
      return rawLinkCards;
    }
    const col = linkCollections.find((c) => c.id === activeLinkCollectionId);
    if (!col || !col.itemIds || col.itemIds.length === 0) {
      return rawLinkCards;
    }
    const linkMap = new Map(rawLinkCards.map((l) => [l.id, l]));
    const matchedLinks: typeof rawLinkCards = [];
    for (const id of col.itemIds) {
      const found = linkMap.get(id);
      if (found) {
        matchedLinks.push(found);
      }
    }
    // Fallback slice so presets always demonstrate custom curated subsets
    if (matchedLinks.length === 0 && rawLinkCards.length > 0) {
      return rawLinkCards.slice(0, Math.min(rawLinkCards.length, col.itemIds.length));
    }
    return matchedLinks;
  }, [rawLinkCards, activeLinkCollectionId, linkCollections]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-between px-4 py-2 border-b border-[#eff3f4]">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link 
            href="/" 
            className="p-2 hover:bg-[#f7f9f9] rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="font-extrabold text-lg text-[#0f1419] leading-tight flex items-center gap-1 truncate">
              <span className="truncate">{userProfile.name}</span>
              {userProfile.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
              )}
            </h1>
            <span className="text-xs text-[#536471] truncate">
              {activeCollectionId ? `${timelinePosts.length} of ${rawTimelinePosts.length}` : rawTimelinePosts.length} Posts
            </span>
          </div>
        </div>

        {/* Right Action Area: Persistent "View on X" + Dynamic [Filter/Search] or [Follow/Following] on scroll */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Back to X profile link */}
          <a
            href={`https://x.com/${userProfile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`View @${userProfile.username} on X`}
            aria-label={`View @${userProfile.username} on X`}
            className="border border-[#cfd9de] hover:bg-[#eff3f4] text-[#0f1419] font-bold text-xs py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">View @{userProfile.username} on</span>
            <XLogo className="w-3 h-3 text-[#0f1419] shrink-0" />
          </a>

          {/* Dynamic group: transitions between [Filter] [Search] and sticky [Follow/Following] */}
          <div className="flex items-center gap-1 transition-all duration-200">
            {shouldShowStickyFollow ? (
              <button
                onClick={handleToggleFollow}
                onMouseEnter={() => setIsHoveringStickyFollow(true)}
                onMouseLeave={() => setIsHoveringStickyFollow(false)}
                disabled={isFollowLoading}
                className={`font-bold text-xs sm:text-sm min-w-[90px] py-1.5 px-4 rounded-full transition-all cursor-pointer ${
                  isFollowing
                    ? isHoveringStickyFollow
                      ? 'border border-red-200 bg-red-50 text-red-600'
                      : 'border border-[#cfd9de] text-[#0f1419] bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                    : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
                } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isFollowing ? (isHoveringStickyFollow ? 'Unfollow' : 'Following') : 'Follow'}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="More"
                  title="More"
                  className="p-2 hover:bg-[#0f1419]/10 rounded-full text-[#0f1419] transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Filter"
                  title="Filter"
                  className="p-2 hover:bg-[#0f1419]/10 rounded-full text-[#0f1419] transition-colors cursor-pointer"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Search"
                  title="Search"
                  className="p-2 hover:bg-[#0f1419]/10 rounded-full text-[#0f1419] transition-colors cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="h-44 sm:h-52 bg-[#eff3f4] relative overflow-hidden">
        {userProfile.banner ? (
          <img
            src={userProfile.banner}
            alt={`${userProfile.name}'s banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100" />
        )}
      </div>

      {/* Avatar & Action Button Row */}
      <div className="px-4 relative flex justify-between items-end pb-3">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20">
          <img
            src={formatTwitterAvatar(userProfile.avatar)}
            alt={userProfile.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover bg-white shadow-md"
          />
        </div>

        {/* Action buttons */}
        <div ref={followButtonRef} className="flex items-center gap-2 mb-2">
          {/* Ask! button (only visible when viewing another user's profile) */}
          {!isSelf && (
            <button
              type="button"
              className="border border-[#cfd9de] hover:bg-[#0f1419]/5 text-[#0f1419] font-bold text-sm px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title={`Ask @${userProfile.username}`}
            >
              <CatShushIcon className="w-4 h-4 text-[#0f1419]" />
              <span>Ask!</span>
            </button>
          )}

          {isSelf ? (
            <button 
              onClick={() => setEditModalOpen(true)}
              className="border border-[#eff3f4] hover:bg-[#f7f9f9] text-[#0f1419] font-bold text-sm px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              Edit profile
            </button>
          ) : !authUser ? (
            <button
              onClick={() => signInWithTwitter()}
              className="bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-sm px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect X</span>
            </button>
          ) : (
            <button
              onClick={handleToggleFollow}
              onMouseEnter={() => setIsHoveringFollow(true)}
              onMouseLeave={() => setIsHoveringFollow(false)}
              disabled={isFollowLoading}
              className={`font-bold text-sm min-w-[105px] py-2 px-5 rounded-full transition-all cursor-pointer ${
                isFollowing
                  ? isHoveringFollow
                    ? 'border border-red-200 bg-red-50 text-red-600'
                    : 'border border-[#cfd9de] text-[#0f1419] bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                  : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
              } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isFollowing ? (isHoveringFollow ? 'Unfollow' : 'Following') : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* User Bio Details Section */}
      <div className="px-4 flex flex-col gap-3">
        <div>
          <h2 className="font-extrabold text-xl text-[#0f1419] leading-tight flex items-center gap-1.5">
            {userProfile.name}
            {userProfile.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-[#1d9bf0] fill-[#1d9bf0] text-white" />
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#536471]">
              @{userProfile.username}
            </span>
            {!isSelf && (
              isMutual ? (
                <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0">
                  OOMFS
                </span>
              ) : followsYou ? (
                <span className="bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0">
                  Follows you
                </span>
              ) : null
            )}
          </div>
        </div>

        {/* Bio Text */}
        {userProfile.bio && (
          <p className="text-sm text-[#0f1419] leading-normal whitespace-pre-line">
            {userProfile.bio}
          </p>
        )}

        {/* Stats & Actions Row: Focused on OOMFs with auxiliary Canvas and Tip action buttons */}
        <div className="flex items-center gap-2.5 pt-1 flex-wrap">
          <Link 
            href={`/${userProfile.username}/oomfs`}
            className="flex items-center gap-1.5 hover:underline cursor-pointer mr-1"
          >
            <span className="font-extrabold text-base text-[#1d9bf0]">{userProfile.oomfsCount}</span>
            <span className="font-semibold text-sm text-[#1d9bf0]">oomfs</span>
          </Link>

          {/* Canvas Button (placeholder) */}
          <button
            type="button"
            className="border border-[#cfd9de] hover:bg-[#0f1419]/5 text-[#0f1419] font-bold text-xs py-1 px-3 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Canvas"
          >
            <Paintbrush className="w-3.5 h-3.5 text-[#536471]" />
            <span>Canvas</span>
          </button>

          {/* Tip Button (placeholder) */}
          <button
            type="button"
            className="border border-[#cfd9de] hover:bg-[#0f1419]/5 text-[#0f1419] font-bold text-xs py-1 px-3 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tip"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#536471]" />
            <span>Tip</span>
          </button>
        </div>
      </div>

      {/* UNIFIED POST COMPOSER DRAWER */}
      {composerOpen && (
        <div className="mx-4 mt-4 border border-[#1d9bf0]/40 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f7f9f9] border-b border-[#eff3f4]">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1d9bf0] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{authUser ? 'Create Post (Saved to Supabase)' : 'Create Post'}</span>
            </div>
            <button
              onClick={() => setComposerOpen(false)}
              className="p-1 text-[#536471] hover:bg-gray-200/60 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <PostComposer
            targetUser={userProfile}
            defaultType={blockType}
            compact={true}
            onClose={() => setComposerOpen(false)}
          />
        </div>
      )}

      {/* 4 TABS BAR: Posts (1st), Comments (2nd), Links (3rd), Likes (4th) */}
      <div className="flex border-b border-[#eff3f4] mt-4 font-medium text-sm text-[#536471]">
        {/* 1. Posts */}
        <button
          onClick={() => {
            if (activeTab === 'posts') {
              setShowPostCollections(prev => !prev);
            } else {
              setActiveTab('posts');
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'posts' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Posts</span>
            {activeTab === 'posts' && (
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[#536471] transition-transform duration-200 ${
                  showPostCollections ? 'rotate-180 text-[#1d9bf0]' : ''
                }`}
              />
            )}
            {activeCollectionId && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d9bf0] shrink-0" title="Preset collection active" />
            )}
          </div>
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 2. Comments */}
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'comments' ? 'text-[#0f1419]' : ''
          }`}
        >
          Comments
          {activeTab === 'comments' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 3. Links */}
        <button
          onClick={() => {
            if (activeTab === 'links') {
              setShowLinkCollections(prev => !prev);
            } else {
              setActiveTab('links');
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'links' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Links</span>
            {activeTab === 'links' && (
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[#536471] transition-transform duration-200 ${
                  showLinkCollections ? 'rotate-180 text-[#1d9bf0]' : ''
                }`}
              />
            )}
            {activeLinkCollectionId && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d9bf0] shrink-0" title="Preset collection active" />
            )}
          </div>
          {activeTab === 'links' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 4. Likes */}
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'likes' ? 'text-[#0f1419]' : ''
          }`}
        >
          Likes
          {activeTab === 'likes' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1">
        {/* 1. POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            {/* Secondary Row: Curated Collection Lens Bar (Hidden by default, toggle by clicking Posts tab) */}
            {showPostCollections && (
              <CollectionLensBar
                collections={collections}
                activeCollectionId={activeCollectionId}
                onSelectCollection={handleSelectPostCollection}
                onOpenAllModal={() => setAllCollectionsModalOpen(true)}
                totalCount={rawTimelinePosts.length}
              />
            )}

            {/* Active Lens Indicator Banner if filtered */}
            {activeCollectionId && (() => {
              const activeCol = collections.find((c) => c.id === activeCollectionId);
              return activeCol ? (
                <div className="flex items-center justify-between px-4 py-2 bg-blue-50/60 border-b border-blue-100/80 text-xs text-[#0f1419]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm">{activeCol.icon || '📁'}</span>
                    <span className="font-semibold text-blue-950">Viewing collection:</span>
                    <span className="font-bold text-[#1d9bf0] truncate">{activeCol.title}</span>
                    <span className="text-gray-500 font-medium">({timelinePosts.length} posts in custom order)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!showPostCollections && (
                      <button
                        type="button"
                        onClick={() => setShowPostCollections(true)}
                        className="text-xs font-semibold text-[#1d9bf0] hover:underline cursor-pointer"
                      >
                        Change preset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectPostCollection(null)}
                      className="text-xs font-semibold text-[#536471] hover:text-[#0f1419] hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </div>
                </div>
              ) : null;
            })()}

            {timelinePosts.length > 0 ? (
              timelinePosts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                No posts in this collection yet.{' '}
                <button
                  type="button"
                  onClick={() => setActiveCollectionId(null)}
                  className="text-[#1d9bf0] hover:underline font-semibold cursor-pointer"
                >
                  View all posts
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div className="flex flex-col">
            {/* Leave a Comment Composer */}
            <div className="p-4 border-b border-[#eff3f4] bg-white flex gap-3">
              <img
                src={formatTwitterAvatar(authProfile?.avatar_url || CURRENT_USER.avatar)}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <form onSubmit={handleAddComment} className="flex-1 flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Leave a comment for @${userProfile.username}...`}
                  rows={2}
                  className="w-full text-sm text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#536471]">
                    Direct comments cannot be threaded or quoted.
                  </span>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentCard 
                    key={comment.id} 
                    comment={comment} 
                    onDelete={handleDeleteComment}
                    canDelete={Boolean(isSelf || (authProfile && authProfile.username === comment.author.username))}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-[#536471] text-sm">
                  No comments yet. Leave the first comment for @{userProfile.username} above!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. LINKS TAB */}
        {activeTab === 'links' && (
          <div>
            {/* Secondary Row: Curated Link Collections Lens Bar (Hidden by default, toggle by clicking Links tab) */}
            {showLinkCollections && (
              <CollectionLensBar
                collections={linkCollections}
                activeCollectionId={activeLinkCollectionId}
                onSelectCollection={handleSelectLinkCollection}
                onOpenAllModal={() => setAllLinkCollectionsModalOpen(true)}
                totalCount={rawLinkCards.length}
              />
            )}

            {/* Active Lens Indicator Banner if filtered */}
            {activeLinkCollectionId && (() => {
              const activeCol = linkCollections.find((c) => c.id === activeLinkCollectionId);
              return activeCol ? (
                <div className="flex items-center justify-between px-4 py-2 bg-blue-50/60 border-b border-blue-100/80 text-xs text-[#0f1419]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm">{activeCol.icon || '📁'}</span>
                    <span className="font-semibold text-blue-950">Viewing collection:</span>
                    <span className="font-bold text-[#1d9bf0] truncate">{activeCol.title}</span>
                    <span className="text-gray-500 font-medium">({linkCards.length} links in custom order)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!showLinkCollections && (
                      <button
                        type="button"
                        onClick={() => setShowLinkCollections(true)}
                        className="text-xs font-semibold text-[#1d9bf0] hover:underline cursor-pointer"
                      >
                        Change preset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectLinkCollection(null)}
                      className="text-xs font-semibold text-[#536471] hover:text-[#0f1419] hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </div>
                </div>
              ) : null;
            })()}

            <div className="p-4 flex flex-col gap-4">
              {/* 1. THE BADGE WALL (only shown on 'All' or when not filtered) */}
              {badgePosts.length > 0 && !activeLinkCollectionId && (
                <div className="border border-[#eff3f4] rounded-2xl bg-white p-3 sm:p-3.5 shadow-2xs">
                  <div className="flex flex-wrap gap-3 items-start justify-start">
                    {badgePosts.map((post) => {
                      const b = post.badgeData!;
                      return (
                        <div
                          key={post.id}
                          className="relative group/badge-item flex flex-col items-center w-[88px] gap-1 shrink-0"
                        >
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${b.title} • ${b.url.replace(/^https?:\/\//, '')}`}
                            className="block w-[88px] h-[31px] shrink-0 rounded-xs overflow-hidden border border-black/25 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
                            style={b.badgeType !== 'image' ? { background: b.bgColor || '#0f1419' } : undefined}
                          >
                            {b.badgeType === 'image' && b.imageUrl ? (
                              <img
                                src={b.imageUrl}
                                alt={b.title}
                                className="w-[88px] h-[31px] object-cover block"
                              />
                            ) : null}
                          </a>

                          {b.showText !== false && (b.label || b.title) && (
                            <span className="text-[10px] font-semibold text-[#536471] group-hover/badge-item:text-[#0f1419] text-center truncate w-full leading-tight transition-colors">
                              {b.label || b.title}
                            </span>
                          )}

                          {/* Delete button for profile owner */}
                          {isSelf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(post.id);
                              }}
                              title="Delete badge from wall"
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover/badge-item:opacity-100 transition-opacity shadow-xs hover:bg-red-700 cursor-pointer z-10"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {linkCards.length > 0 ? (
                linkCards.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 border border-[#eff3f4] rounded-2xl bg-white hover:border-[#1d9bf0] hover:shadow-xs transition-all flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                      <span className="font-bold text-[#0f1419] text-base group-hover:text-[#1d9bf0] transition-colors truncate">
                        {link.title}
                      </span>
                      {link.description && (
                        <p className="text-xs text-[#536471] line-clamp-1">
                          {link.description}
                        </p>
                      )}
                      <span className="text-xs text-[#1d9bf0] font-mono truncate">
                        {link.url.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                    <div className="bg-[#1d9bf0] text-white text-xs font-bold px-4 py-2 rounded-full group-hover:bg-[#1a8cd8] transition-colors flex items-center gap-1 shrink-0">
                      <span>Visit</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center py-10 text-[#536471] text-sm">
                  No links in this collection yet.{' '}
                  <button
                    type="button"
                    onClick={() => setActiveLinkCollectionId(null)}
                    className="text-[#1d9bf0] hover:underline font-semibold cursor-pointer"
                  >
                    View all links
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. LIKES TAB */}
        {activeTab === 'likes' && (
          <div>
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                @{userProfile.username} hasn&apos;t liked any posts yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4]">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-[#0f1419] hover:bg-[#f7f9f9] rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-extrabold text-lg text-[#0f1419]">Edit profile</h3>
              </div>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={isSavingProfile}
                className="bg-[#0f1419] hover:bg-[#272c30] disabled:opacity-50 text-white font-bold text-sm px-4 py-1.5 rounded-full cursor-pointer transition-colors"
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Modal Form */}
            <form id="edit-profile-form" onSubmit={handleSaveProfile} className="p-4 flex flex-col gap-4">
              {/* Name */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                  required
                />
              </div>

              {/* Bio */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell your OOMFs about yourself..."
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent resize-none"
                />
              </div>

              {/* Location */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                />
              </div>

              {/* Website */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Website</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  placeholder="e.g. oomfs.org/yourname or your personal link"
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Collections Searchable Modal (Posts) */}
      <AllCollectionsModal
        isOpen={allCollectionsModalOpen}
        onClose={() => setAllCollectionsModalOpen(false)}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={handleSelectPostCollection}
        totalCount={rawTimelinePosts.length}
        itemTypeLabel="posts"
      />

      {/* All Collections Searchable Modal (Links) */}
      <AllCollectionsModal
        isOpen={allLinkCollectionsModalOpen}
        onClose={() => setAllLinkCollectionsModalOpen(false)}
        collections={linkCollections}
        activeCollectionId={activeLinkCollectionId}
        onSelectCollection={handleSelectLinkCollection}
        totalCount={rawLinkCards.length}
        itemTypeLabel="links"
      />
    </div>
  );
}
