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
  MoreHorizontal,
  FolderPlus,
  ArrowUpDown,
  Check,
  GripVertical,
  Camera
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
import CreateCollectionModal from '@/components/collections/CreateCollectionModal';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import BannerCropModal from '@/components/profile/BannerCropModal';
import { uploadBannerImage } from '@/lib/bannerStorage';
import { saveSessionPost, getAllSessionPosts } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { getProfileFollowStats, toggleFollow, isValidUuid } from '@/lib/follows';
import { 
  getProfileCollections, 
  updateCollection, 
  deleteCollection, 
  reorderCollections, 
  reorderCollectionItems,
  getLocalCollections,
  isLinkCollection,
  isPostCollection
} from '@/lib/collections';

interface ProfileViewProps {
  user: User;
  initialTab?: 'posts' | 'comments' | 'links' | 'likes';
  initialLinkPageSlug?: string;
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

export default function ProfileView({ 
  user: initialUser,
  initialTab = 'posts',
  initialLinkPageSlug
}: ProfileViewProps) {
  const { user: authUser, profile: authProfile, signInWithTwitter, refreshProfile } = useAuth();
  const supabase = createClient();

  // 4 tabs requested left-to-right: 1. Posts (default), 2. Comments, 3. Links, 4. Likes
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'links' | 'likes'>(initialTab);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);
  const [userProfile, setUserProfile] = useState<User>(initialUser);

  // Curated collections / presets state (only showcase demo amberlyn gets mock placeholders; others start clean or sync from Supabase)
  const isDemoProfile = initialUser.username.toLowerCase() === 'amberlyn';
  const [collections, setCollections] = useState<Collection[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = getLocalCollections(initialUser.id);
      let postCols = cached.filter(isPostCollection);
      if (postCols.length === 0 && isDemoProfile) {
        const altCached = getLocalCollections('amberlyn');
        postCols = altCached.filter(isPostCollection);
      }
      if (postCols.length > 0) return postCols;
    }
    return isDemoProfile ? MOCK_COLLECTIONS : [];
  });
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [allCollectionsModalOpen, setAllCollectionsModalOpen] = useState(false);
  const [showPostCollections, setShowPostCollections] = useState(false);

  // Curated link collections / presets state
  const [linkCollections, setLinkCollections] = useState<Collection[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = getLocalCollections(initialUser.id);
      let linkCols = cached.filter(isLinkCollection);
      if (linkCols.length === 0 && isDemoProfile) {
        const altCached = getLocalCollections('amberlyn');
        linkCols = altCached.filter(isLinkCollection);
      }
      if (linkCols.length > 0) return linkCols;
    }
    return isDemoProfile ? MOCK_LINK_COLLECTIONS : [];
  });
  const [activeLinkCollectionId, setActiveLinkCollectionId] = useState<string | null>(() => {
    if (initialLinkPageSlug) {
      const isDemo = initialUser.username.toLowerCase() === 'amberlyn';
      const initialCols = isDemo ? MOCK_LINK_COLLECTIONS : [];
      const matched = initialCols.find(c => c.slug === initialLinkPageSlug || c.id === initialLinkPageSlug);
      return matched ? matched.id : initialLinkPageSlug;
    }
    return null;
  });
  const [allLinkCollectionsModalOpen, setAllLinkCollectionsModalOpen] = useState(false);
  const [showLinkCollections, setShowLinkCollections] = useState(Boolean(initialLinkPageSlug || initialTab === 'links'));

  // Reorder mode states for Link Pages (Model B unified drag & drop)
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Item assignment & collection creation modals
  const [manageItem, setManageItem] = useState<{
    id: string;
    title?: string;
    tabType: 'posts' | 'links';
  } | null>(null);
  const [createCollectionTab, setCreateCollectionTab] = useState<'posts' | 'links' | null>(null);

  const handleSelectPostCollection = (id: string | null) => {
    setActiveCollectionId(id);
    if (id !== null) {
      setShowPostCollections(true);
    }
  };

  const handleSelectLinkCollection = (id: string | null) => {
    setIsReordering(false);
    setDraggedItemId(null);
    setDragOverItemId(null);
    setActiveLinkCollectionId(id);
    if (id !== null) {
      setShowLinkCollections(true);
    }
    if (typeof window !== 'undefined') {
      const col = linkCollections.find((c) => c.id === id);
      if (!col || col.isDefault || col.slug === 'main' || id === null) {
        window.history.replaceState(null, '', `/${userProfile.username}/links`);
      } else if (col.slug) {
        window.history.replaceState(null, '', `/${userProfile.username}/links/${col.slug}`);
      }
    }
  };

  // Check if viewing own profile
  const isSelf = Boolean(
    (authProfile && authProfile.username.toLowerCase() === initialUser.username.toLowerCase()) || 
    (authUser && authProfile?.username === initialUser.username) ||
    (authUser && userProfile.id && authUser.id === userProfile.id)
  );

  // Active creator user ID for mutating collections (prioritize authenticated Supabase Auth UUID)
  const activeCreatorUserId = (authUser?.id && isValidUuid(authUser.id))
    ? authUser.id
    : (userProfile.id && isValidUuid(userProfile.id))
      ? userProfile.id
      : userProfile.id || initialUser.id || 'usr_amberlyn';

  const handleTogglePinCollection = async (id: string, tab: 'posts' | 'links') => {
    const targetCols = tab === 'posts' ? collections : linkCollections;
    const col = targetCols.find((c) => c.id === id);
    if (!col) return;
    const nextPinned = !col.isPinned;

    if (tab === 'posts') {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: nextPinned } : c))
      );
    } else {
      setLinkCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: nextPinned } : c))
      );
    }
    await updateCollection(id, { isPinned: nextPinned }, activeCreatorUserId);
  };

  const handleDeleteCollection = async (id: string, tab: 'posts' | 'links') => {
    if (tab === 'posts') {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (activeCollectionId === id) setActiveCollectionId(null);
    } else {
      setLinkCollections((prev) => prev.filter((c) => c.id !== id));
      if (activeLinkCollectionId === id) setActiveLinkCollectionId(null);
    }
    await deleteCollection(id, activeCreatorUserId);
  };

  const handleReorderCollections = async (reordered: Collection[], tab: 'posts' | 'links') => {
    if (tab === 'posts') {
      setCollections(reordered);
    } else {
      setLinkCollections(reordered);
    }
    await reorderCollections(reordered.map((c) => c.id), activeCreatorUserId);
  };

  const handleCreatedCollection = (newCol: Collection) => {
    if (newCol.tabType === 'links') {
      setLinkCollections((prev) => [newCol, ...prev]);
      setActiveLinkCollectionId(newCol.id);
      setShowLinkCollections(true);
    } else {
      setCollections((prev) => [newCol, ...prev]);
      setActiveCollectionId(newCol.id);
      setShowPostCollections(true);
    }
  };

  // Sticky header scroll detection & action state
  const followButtonRef = useRef<HTMLDivElement>(null);
  const [isScrolledPastFollow, setIsScrolledPastFollow] = useState(false);
  const [isHoveringStickyFollow, setIsHoveringStickyFollow] = useState(false);
  const shouldShowStickyFollow = !isSelf && Boolean(authUser) && isScrolledPastFollow;

  // Posts state
  const [posts, setPosts] = useState<Post[]>(() => {
    const defaultPosts = MOCK_POSTS.filter(p => p.author.username.toLowerCase() === initialUser.username.toLowerCase());
    const sessionPosts = (typeof window !== 'undefined' ? getAllSessionPosts() : []).filter(
      p => p.author?.username?.toLowerCase() === initialUser.username.toLowerCase()
    );
    const combined = [...sessionPosts, ...defaultPosts];
    const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return unique.length > 0 ? unique : [
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
  const [editBanner, setEditBanner] = useState(initialUser.banner || '');
  const [editBannerBlob, setEditBannerBlob] = useState<Blob | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempCropSrc, setTempCropSrc] = useState<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Banner file selection and crop handlers
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setTempCropSrc(dataUrl);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropApply = (croppedDataUrl: string, croppedBlob: Blob) => {
    setEditBanner(croppedDataUrl);
    setEditBannerBlob(croppedBlob);
    setCropModalOpen(false);
    setTempCropSrc(null);
  };

  const handleRemoveBanner = () => {
    setEditBanner('');
    setEditBannerBlob(null);
  };

  // Listen for posts created via the LeftSidebar modal or inline PostComposer
  useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent<Post | { post: Post; collectionId?: string | null }>;
      const detail = customEvent.detail;
      if (!detail) return;

      const newPost = 'post' in detail ? detail.post : detail;
      const targetColId = 'collectionId' in detail ? detail.collectionId : null;

      saveSessionPost(newPost);
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });

      const isMainTarget = !targetColId || targetColId === 'main' || targetColId === 'col_link_main';

      if (targetColId && !isMainTarget) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === targetColId ? { ...c, itemIds: [newPost.id, ...c.itemIds] } : c
          )
        );
        setLinkCollections((prev) =>
          prev.map((c) =>
            c.id === targetColId ? { ...c, itemIds: [newPost.id, ...c.itemIds] } : c
          )
        );
      } else if (newPost.type === 'link_card' || newPost.type === 'badge') {
        setLinkCollections((prev) =>
          prev.map((c) =>
            (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main')
              ? { ...c, itemIds: [newPost.id, ...c.itemIds] }
              : c
          )
        );
      }

      if (newPost.type === 'link_card' || newPost.type === 'badge') {
        setActiveTab('links');
      } else {
        setActiveTab('posts');
      }
    };

    window.addEventListener('oomfs:post-created', handlePostCreated);
    return () => window.removeEventListener('oomfs:post-created', handlePostCreated);
  }, []);

  // Immediate hydration from local storage & session posts on mount to eliminate empty-state flash on refresh
  useEffect(() => {
    const sessionPosts = getAllSessionPosts().filter(
      p => p.author?.username?.toLowerCase() === initialUser.username.toLowerCase()
    );
    if (sessionPosts.length > 0) {
      setPosts((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const newToAdd = sessionPosts.filter(p => !existingIds.has(p.id));
        return newToAdd.length > 0 ? [...newToAdd, ...prev] : prev;
      });
    }

    const cachedTargetId = (isValidUuid(authUser?.id) && isSelf) 
      ? authUser!.id 
      : (isValidUuid(userProfile.id) ? userProfile.id : (initialUser.id || `usr_${initialUser.username.toLowerCase()}`));
    let localPosts = getLocalCollections(cachedTargetId).filter(isPostCollection);
    let localLinks = getLocalCollections(cachedTargetId).filter(isLinkCollection);
    if (localLinks.length === 0 && initialUser.username.toLowerCase() === 'amberlyn') {
      localLinks = getLocalCollections('amberlyn').filter(isLinkCollection);
    }
    if (localPosts.length === 0 && initialUser.username.toLowerCase() === 'amberlyn') {
      localPosts = getLocalCollections('amberlyn').filter(isPostCollection);
    }
    if (localPosts.length > 0) setCollections(localPosts);
    if (localLinks.length > 0) setLinkCollections(localLinks);
  }, [authUser?.id, isSelf, userProfile.id, initialUser.id, initialUser.username]);

  // Fetch real Supabase data if this profile exists in DB (or if signed-in user created blocks)
  useEffect(() => {
    const loadSupabaseProfileAndBlocks = async () => {
      try {
        const { data: dbUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', initialUser.username.toLowerCase())
          .single();

        // Effective user ID whose content/collections belong on this profile
        const targetUserId = dbUser?.id || (isSelf && authUser?.id) || userProfile.id || initialUser.id || `usr_${initialUser.username.toLowerCase()}`;

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
        }

        // Fetch live curated collections (Supabase live DB with localStorage cache & fallback)
        try {
          const [dbPostCols, dbLinkCols] = await Promise.all([
            getProfileCollections(targetUserId, 'posts'),
            getProfileCollections(targetUserId, 'links')
          ]);
          if (dbPostCols && dbPostCols.length > 0) {
            setCollections(dbPostCols);
          }
          if (dbLinkCols && dbLinkCols.length > 0) {
            setLinkCollections(dbLinkCols);
          }
          if (initialLinkPageSlug) {
            const match = dbLinkCols.find((c) => c.slug === initialLinkPageSlug || c.id === initialLinkPageSlug);
            if (match) {
              setActiveLinkCollectionId(match.id);
              setShowLinkCollections(true);
            }
          }
        } catch (colErr) {
          console.error('Error loading collections:', colErr);
        }

        if (isValidUuid(targetUserId)) {
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

    let finalBannerUrl = editBanner;

    // If a new banner was cropped (either Blob or dataUrl), upload to storage
    if (editBanner && (editBannerBlob || editBanner.startsWith('data:'))) {
      const uploadRes = await uploadBannerImage(
        authUser?.id || userProfile.id,
        editBannerBlob || editBanner
      );
      finalBannerUrl = uploadRes.bannerUrl;
    }

    setUserProfile(prev => ({
      ...prev,
      name: editName,
      bio: editBio,
      location: editLocation,
      website: editWebsite,
      banner: finalBannerUrl,
    }));

    if (authUser?.id) {
      try {
        const updatePayload: Record<string, any> = {
          name: editName,
          bio: editBio,
          location: editLocation,
          website: editWebsite,
          banner_url: finalBannerUrl || null,
        };

        let lastError: any = null;
        let updateSucceeded = false;

        // Try updating; if a column is missing from Supabase schema cache (e.g. location), retry gracefully without that column
        for (let attempt = 0; attempt < 4; attempt++) {
          const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', authUser.id);

          if (!error) {
            updateSucceeded = true;
            break;
          }

          lastError = error;
          const match = error.message?.match(/Could not find the '(\w+)' column of 'profiles'/i);
          if (match && match[1] && match[1] in updatePayload) {
            console.warn(`Column '${match[1]}' not found in profiles schema cache. Retrying update without it.`);
            delete updatePayload[match[1]];
            continue;
          }
          break;
        }

        if (updateSucceeded) {
          refreshProfile();
        } else if (lastError) {
          console.error('Error saving profile to Supabase:', lastError);
          alert('Could not update profile in Supabase: ' + lastError.message);
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

  // Deleted link cards state (for optimistic and mock removal)
  const [deletedLinkCardIds, setDeletedLinkCardIds] = useState<Set<string>>(new Set());

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

  const handleDeleteLinkCard = async (id: string) => {
    setDeletedLinkCardIds((prev) => new Set([...prev, id]));
    handleDeletePost(id);
    if (activeLinkCollection && activeLinkCollection.itemIds?.includes(id)) {
      const updatedIds = activeLinkCollection.itemIds.filter((itemId) => itemId !== id);
      setLinkCollections((prev) =>
        prev.map((c) => (c.id === activeLinkCollection.id ? { ...c, itemIds: updatedIds } : c))
      );
      if (activeCreatorUserId) {
        await reorderCollectionItems(activeLinkCollection.id, updatedIds, activeCreatorUserId);
      }
    }
  };

  // Raw timeline posts (Standard, Carousel, Board) - excludes link cards and badges
  const rawTimelinePosts = useMemo(
    () => posts.filter((p) => p.type !== 'link_card' && p.type !== 'badge'),
    [posts]
  );

  // All timeline posts
  const allTimelinePosts = rawTimelinePosts;

  // Filter & custom-order timeline posts when a collection lens is selected
  const timelinePosts = useMemo(() => {
    if (!activeCollectionId) {
      return allTimelinePosts;
    }
    const col = collections.find((c) => c.id === activeCollectionId);
    if (!col || !col.itemIds || col.itemIds.length === 0) {
      return [];
    }
    const postMap = new Map(rawTimelinePosts.map((p) => [p.id, p]));
    const matchedPosts: Post[] = [];
    for (const id of col.itemIds) {
      const found = postMap.get(id);
      if (found) {
        matchedPosts.push(found);
      }
    }
    if (matchedPosts.length > 0) {
      return matchedPosts;
    }
    // Prototype fallback for mock collections if browsing an account without matched mock IDs
    if (col.id.startsWith('col_') && rawTimelinePosts.length > 0) {
      return rawTimelinePosts.slice(0, Math.min(rawTimelinePosts.length, col.itemIds.length));
    }
    return [];
  }, [rawTimelinePosts, allTimelinePosts, activeCollectionId, collections]);

  // Identify the main/default link collection
  const mainLinkCollection = useMemo(() => {
    return linkCollections.find((c) => c.isDefault || c.slug === 'main' || c.id === 'col_link_main') || {
      id: 'main',
      title: 'Main',
      icon: '🌐',
      slug: 'main',
      isDefault: true,
      description: 'Primary bio links, core socials, and featured badges',
      itemIds: ['post_badge_1', 'post_badge_oomf_1', 'post_badge_2', 'post_badge_3', 'post_badge_4', 'l1', 'l2', 'l3', 'post_1']
    };
  }, [linkCollections]);

  // Current active link collection object
  const activeLinkCollection = useMemo(() => {
    if (!activeLinkCollectionId || activeLinkCollectionId === 'main' || activeLinkCollectionId === mainLinkCollection.id) {
      return mainLinkCollection;
    }
    return linkCollections.find((c) => c.id === activeLinkCollectionId) || mainLinkCollection;
  }, [activeLinkCollectionId, linkCollections, mainLinkCollection]);

  const isMainPageActive = !activeLinkCollection || activeLinkCollection.isDefault || activeLinkCollection.slug === 'main' || activeLinkCollection.id === mainLinkCollection.id;

  // Unified Badge Wall posts
  const allBadgePosts = useMemo(
    () => posts.filter(p => p.type === 'badge' && p.badgeData),
    [posts]
  );

  // Per-page badge posts (distinct badge wall per page)
  const pageBadgePosts = useMemo(() => {
    return allBadgePosts.filter((p) => {
      if (activeLinkCollection?.itemIds && activeLinkCollection.itemIds.includes(p.id)) {
        return true;
      }
      const pPage = (p.badgeData as any)?.pageId;
      if (isMainPageActive) {
        return !pPage || pPage === 'main' || pPage === mainLinkCollection.id;
      }
      return pPage === activeLinkCollection?.id || (activeLinkCollection?.slug && pPage === activeLinkCollection.slug);
    });
  }, [allBadgePosts, activeLinkCollection, isMainPageActive, mainLinkCollection.id]);

  // Raw combined links (user profile links + link_card posts)
  const rawLinkCards = useMemo(() => [
    ...posts.filter(p => p.type === 'link_card' && p.linkData).map(p => ({
      id: p.id,
      title: p.linkData!.title,
      subtitle: p.linkData!.subtitle || p.linkData!.description || p.text,
      description: p.linkData!.description || p.text,
      icon: p.linkData!.icon,
      image: p.linkData!.image,
      url: p.linkData!.url,
      clicks: 120,
      pageId: (p.linkData as any)?.pageId
    })),
    ...userProfile.links.map(l => ({
      id: l.id,
      title: l.title,
      subtitle: l.subtitle || (l.category ? `Category: ${l.category}` : undefined),
      description: l.category ? `Category: ${l.category}` : undefined,
      icon: l.icon,
      image: l.image,
      url: l.url,
      clicks: l.clicks,
      pageId: 'main'
    }))
  ].filter(l => !deletedLinkCardIds.has(l.id)), [posts, userProfile.links, deletedLinkCardIds]);

  // Eligible link cards for this page
  const pageLinkCards = useMemo(() => {
    return rawLinkCards.filter((l) => {
      if (activeLinkCollection?.itemIds && activeLinkCollection.itemIds.includes(l.id)) {
        return true;
      }
      if (isMainPageActive) {
        return !l.pageId || l.pageId === 'main' || l.pageId === mainLinkCollection.id;
      }
      return l.pageId === activeLinkCollection?.id || (activeLinkCollection?.slug && l.pageId === activeLinkCollection.slug);
    });
  }, [rawLinkCards, activeLinkCollection, isMainPageActive, mainLinkCollection.id]);

  // Model B: Unified ordered items for the active link page
  const unifiedPageItems = useMemo(() => {
    const badgeMap = new Map(pageBadgePosts.map((p) => [p.id, p]));
    const linkMap = new Map(pageLinkCards.map((l) => [l.id, l]));

    const items: Array<
      | { id: string; kind: 'badge'; post: Post }
      | { id: string; kind: 'link_card'; link: (typeof rawLinkCards)[number] }
    > = [];

    if (activeLinkCollection?.itemIds && activeLinkCollection.itemIds.length > 0) {
      for (const id of activeLinkCollection.itemIds) {
        if (badgeMap.has(id)) {
          items.push({ id, kind: 'badge', post: badgeMap.get(id)! });
          badgeMap.delete(id);
        } else if (linkMap.has(id)) {
          items.push({ id, kind: 'link_card', link: linkMap.get(id)! });
          linkMap.delete(id);
        }
      }
    }

    // Append any unassigned badges on this page
    for (const [id, post] of badgeMap.entries()) {
      items.push({ id, kind: 'badge', post });
    }

    // Append any unassigned link cards on this page
    for (const [id, link] of linkMap.entries()) {
      items.push({ id, kind: 'link_card', link });
    }

    return items;
  }, [pageBadgePosts, pageLinkCards, activeLinkCollection]);

  // Model B: Render groups where consecutive badges group into a cluster, while link cards take full rows
  const renderGroups = useMemo(() => {
    type RenderGroup = 
      | {
          type: 'badge_cluster';
          key: string;
          items: Array<{ id: string; post: Post }>;
        }
      | {
          type: 'link_card';
          key: string;
          link: (typeof rawLinkCards)[number];
        };

    const groups: RenderGroup[] = [];
    let currentBadgeCluster: Array<{ id: string; post: Post }> = [];

    for (const item of unifiedPageItems) {
      if (item.kind === 'badge') {
        currentBadgeCluster.push({ id: item.id, post: item.post });
      } else {
        if (currentBadgeCluster.length > 0) {
          groups.push({
            type: 'badge_cluster',
            key: `cluster-${currentBadgeCluster.map((b) => b.id).join('-')}`,
            items: currentBadgeCluster
          });
          currentBadgeCluster = [];
        }
        groups.push({
          type: 'link_card',
          key: `link-${item.id}`,
          link: item.link
        });
      }
    }

    if (currentBadgeCluster.length > 0) {
      groups.push({
        type: 'badge_cluster',
        key: `cluster-${currentBadgeCluster.map((b) => b.id).join('-')}`,
        items: currentBadgeCluster
      });
    }

    return groups;
  }, [unifiedPageItems, rawLinkCards]);

  // Drag-and-drop handlers for unified Link Page items
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    if (!isReordering) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedItemId(id);
  };

  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    if (!isReordering || !draggedItemId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleItemDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!isReordering || !draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const currentIds = unifiedPageItems.map((item) => item.id);
    const sourceIndex = currentIds.indexOf(draggedItemId);
    const targetIndex = currentIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const updatedIds = [...currentIds];
    const [moved] = updatedIds.splice(sourceIndex, 1);
    updatedIds.splice(targetIndex, 0, moved);

    const targetColId = activeLinkCollection?.id || mainLinkCollection.id || 'col_link_main';

    const isMain = targetColId === 'col_link_main' || targetColId === 'main' || Boolean(activeLinkCollection?.isDefault || activeLinkCollection?.slug === 'main');

    // Optimistically update React state
    setLinkCollections((prev) => {
      const exists = prev.some((c) => c.id === targetColId || (isMain && (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main')));
      if (exists) {
        return prev.map((c) => {
          const isMatch = c.id === targetColId || (isMain && (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main'));
          return isMatch ? { ...c, itemIds: updatedIds, tabType: 'links' as const } : c;
        });
      }
      return [...prev, { ...mainLinkCollection, id: targetColId, itemIds: updatedIds, tabType: 'links' as const }];
    });

    setDraggedItemId(null);
    setDragOverItemId(null);

    // Persist to Supabase and LocalStorage
    const effectiveUserId = (isSelf && authUser?.id) || userProfile.id || initialUser.id || `usr_${initialUser.username.toLowerCase()}`;
    await reorderCollectionItems(targetColId, updatedIds, effectiveUserId);
  };

  const handleItemDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

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
              {activeCollectionId ? `${timelinePosts.length} of ${allTimelinePosts.length}` : allTimelinePosts.length} Posts
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

      {/* Banner: 1:1 X Standard 3:1 Aspect Ratio (1500x500) */}
      <div className="w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden">
        {userProfile.banner ? (
          <img
            src={userProfile.banner}
            alt={`${userProfile.name}'s banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
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
              onClick={() => {
                setEditName(userProfile.name);
                setEditBio(userProfile.bio);
                setEditLocation(userProfile.location || '');
                setEditWebsite(userProfile.website || '');
                setEditBanner(userProfile.banner || '');
                setEditBannerBlob(null);
                setEditModalOpen(true);
              }}
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
            collections={collections}
            linkCollections={linkCollections}
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
              if (collections.length > 0 || isSelf) {
                setShowPostCollections(prev => !prev);
              }
            } else {
              setActiveTab('posts');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `/${userProfile.username}`);
              }
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'posts' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Posts</span>
            {activeTab === 'posts' && (collections.length > 0 || isSelf) && (
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
              if (linkCollections.length > 0 || isSelf) {
                setShowLinkCollections(prev => !prev);
              }
            } else {
              setActiveTab('links');
              if (typeof window !== 'undefined') {
                const col = linkCollections.find((c) => c.id === activeLinkCollectionId);
                if (col && !col.isDefault && col.slug && col.slug !== 'main') {
                  window.history.replaceState(null, '', `/${userProfile.username}/links/${col.slug}`);
                } else {
                  window.history.replaceState(null, '', `/${userProfile.username}/links`);
                }
              }
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'links' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Links</span>
            {activeTab === 'links' && (linkCollections.length > 0 || isSelf) && (
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
                totalCount={allTimelinePosts.length}
                isSelf={isSelf}
                onCreateCollection={() => setCreateCollectionTab('posts')}
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
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onDelete={handleDeletePost}
                  onManageCollections={isSelf ? (p) => setManageItem({ id: p.id, title: p.text?.slice(0, 40) || 'Post', tabType: 'posts' }) : undefined}
                />
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
            {/* Secondary Row: Curated Link Pages Bar (Shown by default or toggled) */}
            {showLinkCollections && (
              <CollectionLensBar
                mode="links"
                collections={linkCollections}
                activeCollectionId={activeLinkCollectionId}
                onSelectCollection={handleSelectLinkCollection}
                onOpenAllModal={() => setAllLinkCollectionsModalOpen(true)}
                totalCount={unifiedPageItems.length}
                isSelf={isSelf}
                onCreateCollection={() => setCreateCollectionTab('links')}
              />
            )}

            {/* Active Link Page Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f7f9f9]/80 border-b border-[#eff3f4]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">{activeLinkCollection?.icon || '🌐'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#0f1419] text-sm leading-tight truncate">
                      {activeLinkCollection?.title || 'Main Page'}
                    </h3>
                    {activeLinkCollection?.slug && activeLinkCollection.slug !== 'main' && (
                      <span className="text-[10px] font-mono text-[#1d9bf0] bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0">
                        /{activeLinkCollection.slug}
                      </span>
                    )}
                  </div>
                  {activeLinkCollection?.description && (
                    <p className="text-xs text-[#536471] truncate mt-0.5">
                      {activeLinkCollection.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isSelf && unifiedPageItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReordering(!isReordering);
                      setDraggedItemId(null);
                      setDragOverItemId(null);
                    }}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      isReordering
                        ? 'bg-[#0f1419] text-white hover:bg-black shadow-xs'
                        : 'text-[#536471] hover:text-[#0f1419] hover:bg-[#0f1419]/5'
                    }`}
                  >
                    {isReordering ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </>
                    )}
                  </button>
                )}
                {isSelf && !isReordering && (
                  <button
                    type="button"
                    onClick={() => {
                      setBlockType('link_card');
                      setComposerOpen(true);
                    }}
                    className="text-xs font-bold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    + Add Link
                  </button>
                )}
              </div>
            </div>

            {/* Reorder Mode Notification Banner */}
            {isReordering && (
              <div className="bg-[#1d9bf0]/10 border-b border-[#1d9bf0]/20 px-4 py-2 flex items-center justify-between text-xs text-[#0f1419]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#1d9bf0] animate-pulse shrink-0" />
                  <span className="truncate">
                    <strong>Reorder Mode</strong>: Drag badges and link cards to rearrange. Links are paused while reordering.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReordering(false);
                    setDraggedItemId(null);
                    setDragOverItemId(null);
                  }}
                  className="font-bold text-[#1d9bf0] hover:underline cursor-pointer ml-3 shrink-0"
                >
                  Done
                </button>
              </div>
            )}

            <div className="p-4 flex flex-col gap-4">
              {/* MODEL B UNIFIED ITEMS FLOW */}
              {renderGroups.map((group) => {
                if (group.type === 'badge_cluster') {
                  return (
                    <div
                      key={group.key}
                      className={`border rounded-2xl bg-white p-3 sm:p-3.5 shadow-2xs transition-colors ${
                        isReordering ? 'border-[#1d9bf0]/30 bg-[#f7f9f9]/50' : 'border-[#eff3f4]'
                      }`}
                    >
                      <div className="flex flex-wrap gap-3 items-start justify-start">
                        {group.items.map(({ id, post }) => {
                          const b = post.badgeData!;
                          const isItemDragged = draggedItemId === id;
                          const isDropTarget = dragOverItemId === id && draggedItemId !== null && draggedItemId !== id;

                          return (
                            <div
                              key={id}
                              draggable={isReordering}
                              onDragStart={(e) => handleItemDragStart(e, id)}
                              onDragOver={(e) => handleItemDragOver(e, id)}
                              onDrop={(e) => handleItemDrop(e, id)}
                              onDragEnd={handleItemDragEnd}
                              className={`relative group/badge-item flex flex-col items-center w-[88px] gap-1 shrink-0 transition-all select-none ${
                                isReordering ? 'cursor-grab active:cursor-grabbing' : ''
                              } ${
                                isItemDragged ? 'opacity-30 scale-95' : ''
                              } ${
                                isDropTarget ? (b.badgeType === 'avatar' ? 'ring-2 ring-[#1d9bf0] ring-offset-2 scale-105 rounded-full' : 'ring-2 ring-[#1d9bf0] ring-offset-2 scale-105 rounded-xs') : ''
                              }`}
                            >
                              {b.badgeType === 'avatar' ? (
                                <a
                                  href={b.url}
                                  target={b.url.startsWith('http') ? '_blank' : undefined}
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (isReordering) {
                                      e.preventDefault();
                                    }
                                  }}
                                  title={`${b.title} • ${b.url}`}
                                  className="block w-[52px] h-[52px] rounded-full overflow-hidden border border-black/15 shadow-2xs hover:shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer my-0.5"
                                >
                                  <img
                                    src={b.imageUrl}
                                    alt={b.title}
                                    className="w-[52px] h-[52px] rounded-full object-cover block pointer-events-none"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={b.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (isReordering) {
                                      e.preventDefault();
                                    }
                                  }}
                                  title={`${b.title} • ${b.url.replace(/^https?:\/\//, '')}`}
                                  className="block w-[88px] h-[31px] shrink-0 rounded-xs overflow-hidden border border-black/25 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
                                  style={b.badgeType !== 'image' ? { background: b.bgColor || '#0f1419' } : undefined}
                                >
                                  {b.badgeType === 'image' && b.imageUrl ? (
                                    <img
                                      src={b.imageUrl}
                                      alt={b.title}
                                      className="w-[88px] h-[31px] object-cover block pointer-events-none"
                                    />
                                  ) : null}
                                </a>
                              )}

                              {b.showText !== false && (b.label || b.title) && (
                                <span className="text-[10px] font-semibold text-[#536471] group-hover/badge-item:text-[#0f1419] text-center truncate w-full leading-tight transition-colors">
                                  {b.label || b.title}
                                </span>
                              )}

                              {/* Delete button for profile owner (hidden while reordering) */}
                              {isSelf && !isReordering && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(post.id);
                                  }}
                                  title="Delete badge from this page"
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
                  );
                }

                // Link Card (Wide short rectangle: left half icon/title/subtitle, right half flush image)
                const link = group.link;
                const isItemDragged = draggedItemId === link.id;
                const isDropTarget = dragOverItemId === link.id && draggedItemId !== null && draggedItemId !== link.id;

                return (
                  <div
                    key={group.key}
                    draggable={isReordering}
                    onDragStart={(e) => handleItemDragStart(e, link.id)}
                    onDragOver={(e) => handleItemDragOver(e, link.id)}
                    onDrop={(e) => handleItemDrop(e, link.id)}
                    onDragEnd={handleItemDragEnd}
                    className={`relative group/link-card transition-all select-none ${
                      isReordering ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${
                      isItemDragged ? 'opacity-30 scale-[0.99]' : ''
                    } ${
                      isDropTarget ? 'ring-2 ring-[#1d9bf0] ring-offset-2 rounded-2xl' : ''
                    }`}
                  >
                    {/* Top Corner Hover Delete Button for profile owner */}
                    {isSelf && !isReordering && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteLinkCard(link.id);
                        }}
                        title="Delete link card from profile"
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover/link-card:opacity-100 transition-opacity shadow-md hover:scale-110 active:scale-95 cursor-pointer z-20"
                      >
                        ×
                      </button>
                    )}

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (isReordering) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full h-28 sm:h-32 border rounded-2xl bg-white transition-all flex flex-row overflow-hidden relative ${
                        isReordering
                          ? 'border-[#1d9bf0]/30 hover:border-[#1d9bf0]'
                          : 'border-[#eff3f4] hover:border-[#1d9bf0] hover:shadow-xs'
                      }`}
                    >
                      {/* Left Half: Icon, Title, Subtitle, and URL / Actions */}
                      <div className="w-1/2 p-3 sm:p-4 flex flex-col justify-between min-w-0 pr-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Grip handle in reorder mode */}
                            {isReordering && (
                              <div className="text-[#536471] shrink-0">
                                <GripVertical className="w-4 h-4 text-[#536471]/60" />
                              </div>
                            )}
                            {link.icon && (
                              <span className="text-lg sm:text-xl shrink-0 select-none leading-none">
                                {link.icon}
                              </span>
                            )}
                            <h4 className="font-bold text-[#0f1419] text-sm sm:text-base group-hover/link-card:text-[#1d9bf0] transition-colors truncate">
                              {link.title}
                            </h4>
                          </div>
                          {link.subtitle && (
                            <p className="text-xs text-[#536471] line-clamp-2 leading-relaxed mt-1">
                              {link.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1.5 min-w-0 pt-1">
                          <span className="text-[11px] text-[#1d9bf0] font-mono truncate flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {link.url.replace(/^https?:\/\//, '')}
                          </span>
                          {isSelf && !isReordering && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setManageItem({ id: link.id, title: link.title, tabType: 'links' });
                              }}
                              title="Organize into link pages"
                              className="p-1.5 text-[#536471] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors cursor-pointer shrink-0"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Half: Dedicated to flush image with no margins above, below, to right */}
                      <div className="w-1/2 h-full overflow-hidden shrink-0 border-l border-[#eff3f4] bg-gray-50 relative">
                        {link.image ? (
                          <img
                            src={link.image}
                            alt={link.title}
                            className="w-full h-full object-cover group-hover/link-card:scale-105 transition-transform duration-300 pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] text-[#cfd9de]">
                            {link.icon ? (
                              <span className="text-3xl opacity-40 select-none">{link.icon}</span>
                            ) : (
                              <ExternalLink className="w-7 h-7 opacity-30" />
                            )}
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                );
              })}

              {/* 3. Empty State for this page */}
              {unifiedPageItems.length === 0 && (
                <div className="text-center py-12 px-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-1">
                    {activeLinkCollection?.icon || '🌐'}
                  </div>
                  <h4 className="font-bold text-[#0f1419] text-sm">
                    No links or badges on this page yet
                  </h4>
                  <p className="text-xs text-[#536471] max-w-sm">
                    {isSelf
                      ? `Publish links or 88×31 web badges directly to "${activeLinkCollection?.title || 'this page'}".`
                      : `@${userProfile.username} has not added any items to this page yet.`}
                  </p>
                  {isSelf && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBlockType('link_card');
                          setComposerOpen(true);
                        }}
                        className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
                      >
                        + Add Bio Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBlockType('badge');
                          setComposerOpen(true);
                        }}
                        className="bg-white border border-[#cfd9de] hover:bg-gray-50 text-[#0f1419] font-bold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
                      >
                        + Add Badge
                      </button>
                    </div>
                  )}
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

      {/* EDIT PROFILE MODAL: 1:1 X / Twitter Layout */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4] shrink-0 bg-white z-10">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-[#0f1419] hover:bg-[#f7f9f9] rounded-full cursor-pointer transition-colors"
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

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto flex-1">
              {/* 1:1 X Header Banner Upload Area */}
              <div className="w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden flex items-center justify-center group select-none">
                {editBanner ? (
                  <img
                    src={editBanner}
                    alt="Header preview"
                    className="w-full h-full object-cover brightness-90"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
                )}

                {/* Centered Camera & Remove Action Buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/25">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    title="Add header photo"
                    aria-label="Add header photo"
                    className="p-2.5 bg-black/60 hover:bg-black/75 text-white rounded-full transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  {editBanner && (
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      title="Remove header photo"
                      aria-label="Remove header photo"
                      className="p-2.5 bg-black/60 hover:bg-black/75 text-white rounded-full transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Hidden file input for banner selection */}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleBannerFileSelect}
                  className="hidden"
                />
              </div>

              {/* 1:1 X Overlapping Avatar Area */}
              <div className="px-4 -mt-10 sm:-mt-12 mb-3 relative flex justify-between items-end">
                <div className="relative group/edit-avatar">
                  <img
                    src={formatTwitterAvatar(userProfile.avatar)}
                    alt={userProfile.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover bg-white shadow-sm brightness-95"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25 pointer-events-none">
                    <div className="p-2 bg-black/60 text-white rounded-full">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <form id="edit-profile-form" onSubmit={handleSaveProfile} className="p-4 pt-1 flex flex-col gap-4">
                {/* Name */}
                <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2 transition-all">
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
                <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2 transition-all">
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
                <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2 transition-all">
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
                <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2 transition-all">
                  <label className="text-xs text-[#536471] block font-medium">Website</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={e => setEditWebsite(e.target.value)}
                    placeholder="e.g. oomfs.org/yourname or personal site"
                    className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 1500x500 Twitter Banner Crop Modal */}
      {cropModalOpen && tempCropSrc && (
        <BannerCropModal
          isOpen={cropModalOpen}
          imageSrc={tempCropSrc}
          onClose={() => {
            setCropModalOpen(false);
            setTempCropSrc(null);
          }}
          onApply={handleCropApply}
        />
      )}

      {/* All Collections Searchable Modal (Posts) */}
      <AllCollectionsModal
        isOpen={allCollectionsModalOpen}
        onClose={() => setAllCollectionsModalOpen(false)}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={handleSelectPostCollection}
        totalCount={allTimelinePosts.length}
        itemTypeLabel="posts"
        isSelf={isSelf}
        onCreateCollection={() => setCreateCollectionTab('posts')}
        onTogglePin={(id) => handleTogglePinCollection(id, 'posts')}
        onDeleteCollection={(id) => handleDeleteCollection(id, 'posts')}
        onReorderCollections={(reordered) => handleReorderCollections(reordered, 'posts')}
      />

      {/* All Collections Searchable Modal (Links) */}
      <AllCollectionsModal
        isOpen={allLinkCollectionsModalOpen}
        onClose={() => setAllLinkCollectionsModalOpen(false)}
        collections={linkCollections}
        activeCollectionId={activeLinkCollectionId}
        onSelectCollection={handleSelectLinkCollection}
        totalCount={rawLinkCards.length + allBadgePosts.length}
        itemTypeLabel="links"
        isSelf={isSelf}
        onCreateCollection={() => setCreateCollectionTab('links')}
        onTogglePin={(id) => handleTogglePinCollection(id, 'links')}
        onDeleteCollection={(id) => handleDeleteCollection(id, 'links')}
        onReorderCollections={(reordered) => handleReorderCollections(reordered, 'links')}
      />

      {/* Add To Collection Modal (for organizing existing posts & links) */}
      {manageItem && (
        <AddToCollectionModal
          isOpen={Boolean(manageItem)}
          onClose={() => setManageItem(null)}
          itemId={manageItem.id}
          itemTitle={manageItem.title}
          itemTypeLabel={manageItem.tabType === 'posts' ? 'post' : 'link'}
          collections={manageItem.tabType === 'posts' ? collections : linkCollections}
          userId={activeCreatorUserId}
          tabType={manageItem.tabType}
          onUpdateCollections={(updated) => {
            if (manageItem.tabType === 'posts') {
              setCollections(updated);
            } else {
              setLinkCollections(updated);
            }
          }}
        />
      )}

      {/* Create Collection Modal */}
      {createCollectionTab && (
        <CreateCollectionModal
          isOpen={Boolean(createCollectionTab)}
          onClose={() => setCreateCollectionTab(null)}
          userId={activeCreatorUserId}
          tabType={createCollectionTab}
          onCreated={handleCreatedCollection}
          username={userProfile.username}
        />
      )}
    </div>
  );
}
