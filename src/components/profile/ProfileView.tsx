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
  Filter,
  Search,
  Paintbrush,
  DollarSign,
  MoreHorizontal,
  FolderPlus,
  ArrowUpDown,
  Check,
  GripVertical,
  Camera,
  Layers,
  Image as ImageIcon,
  Link2
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
import CanvasPreview from './CanvasPreview';
import FullscreenMediaModal from './FullscreenMediaModal';
import TipCircle from './TipCircle';
import SupporterModal from './SupporterModal';
import { getSupportersForUser, Supporter } from '@/lib/mockData';
import PostComposer from '@/components/feed/PostComposer';
import LinksPortal from '@/components/links/LinksPortal';
import ReorderCollectionModal from '@/components/collections/ReorderCollectionModal';
import CreateCollectionModal from '@/components/collections/CreateCollectionModal';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import BannerCropModal from '@/components/profile/BannerCropModal';
import { uploadBannerImage } from '@/lib/bannerStorage';
import { saveSessionPost, getAllSessionPosts } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar, compressImageFile } from '@/lib/utils';
import { getProfileFollowStats, toggleFollow, isValidUuid } from '@/lib/follows';
import { 
  getProfileCollections, 
  updateCollection, 
  deleteCollection, 
  reorderCollections, 
  reorderCollectionItems,
  removeItemFromCollection,
  getLocalCollections,
  isLinkCollection,
  isPostCollection
} from '@/lib/collections';

interface ProfileViewProps {
  user: User;
  initialTab?: 'posts' | 'presets' | 'links' | 'comments' | 'likes';
}

function XLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function CatShushIcon({ className = "w-4 h-4" }: { className?: string }) {
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
  initialTab = 'posts'
}: ProfileViewProps) {
  const { user: authUser, profile: authProfile, signInWithTwitter, refreshProfile } = useAuth();
  const supabase = createClient();

  // 5 tabs requested left-to-right: 1. Posts (default), 2. Presets, 3. Links, 4. Comments, 5. Likes
  const [activeTab, setActiveTab] = useState<'posts' | 'presets' | 'links' | 'comments' | 'likes'>(initialTab);
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
  const [reorderTargetCollection, setReorderTargetCollection] = useState<Collection | null>(null);

  // Item assignment & collection creation modals
  const [manageItem, setManageItem] = useState<{
    id: string;
    title?: string;
  } | null>(null);
  const [createCollectionTab, setCreateCollectionTab] = useState<'posts' | null>(null);

  const handleSelectPostCollection = (id: string | null) => {
    setActiveCollectionId(id);
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

  const handleTogglePinCollection = async (id: string) => {
    const col = collections.find((c) => c.id === id);
    if (!col) return;
    const nextPinned = !col.isPinned;

    const currentPinned = collections
      .filter((c) => c.isPinned && c.id !== id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (nextPinned && currentPinned.length >= 5) {
      alert('You can only pin up to 5 collections to the quick bar.');
      return;
    }

    let updatedCollections: Collection[];
    if (nextPinned) {
      const nextSortOrder = currentPinned.length;
      updatedCollections = collections.map((c) =>
        c.id === id ? { ...c, isPinned: true, sortOrder: nextSortOrder } : c
      );
    } else {
      let pinIdx = 0;
      updatedCollections = collections.map((c) => {
        if (c.id === id) {
          return { ...c, isPinned: false };
        }
        if (c.isPinned) {
          const updated = { ...c, sortOrder: pinIdx };
          pinIdx++;
          return updated;
        }
        return c;
      });
    }

    setCollections(updatedCollections);
    await updateCollection(id, { isPinned: nextPinned }, activeCreatorUserId);
    await reorderCollections(
      updatedCollections
        .slice()
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })
        .map((c) => c.id),
      activeCreatorUserId
    );
  };

  const handleDeleteCollection = async (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (activeCollectionId === id) setActiveCollectionId(null);
    await deleteCollection(id, activeCreatorUserId);
  };

  const handleReorderCollections = async (reordered: Collection[]) => {
    setCollections(reordered);
    await reorderCollections(reordered.map((c) => c.id), activeCreatorUserId);
  };

  const handleReorderCollectionItems = async (collectionId: string, orderedItemIds: string[]) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, itemIds: orderedItemIds } : c))
    );
    await reorderCollectionItems(collectionId, orderedItemIds, activeCreatorUserId);
  };

  const handleRemoveCollectionItem = async (collectionId: string, itemId: string) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId ? { ...c, itemIds: c.itemIds.filter((id) => id !== itemId) } : c
      )
    );
    await removeItemFromCollection(collectionId, itemId, activeCreatorUserId);
  };

  const handleCreatedCollection = (newCol: Collection) => {
    setCollections((prev) => [newCol, ...prev]);
    setActiveCollectionId(newCol.id);
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
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCommentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 4 - commentImages.length;
    if (availableSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsUploadingCommentImage(true);

    try {
      const compressedUrls = await Promise.all(
        filesToProcess.map((f) => compressImageFile(f, 1200, 0.85))
      );
      setCommentImages((prev) => [...prev, ...compressedUrls].slice(0, 4));
    } catch (err) {
      console.error('Error compressing comment image:', err);
    } finally {
      setIsUploadingCommentImage(false);
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCommentImage = (index: number) => {
    setCommentImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Likes state (only liked posts)
  const [likedPosts] = useState<Post[]>(() => {
    return MOCK_LIKED_POSTS[initialUser.username] || [];
  });

  // Composer Drawer State (for Posts & Links)
  const [composerOpen, setComposerOpen] = useState(false);
  const [blockType, setBlockType] = useState<'standard' | 'carousel' | 'board' | 'link_card' | 'grid'>('standard');

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

  // Header Banner & Canvas Viewport Mode & Fullscreen Lightbox State
  const [headerMode, setHeaderMode] = useState<'banner' | 'canvas'>('banner');
  const [fullscreenMedia, setFullscreenMedia] = useState<'banner' | 'canvas' | null>(null);
  const [supporterModalOpen, setSupporterModalOpen] = useState(false);
  const [profileSupporters, setProfileSupporters] = useState<Supporter[]>(() =>
    getSupportersForUser(userProfile.username)
  );

  // Sync profile supporters if userProfile changes
  useEffect(() => {
    setProfileSupporters(getSupportersForUser(userProfile.username));
  }, [userProfile.username]);

  // Gesture detection for swiping/dragging between Banner and Canvas
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDraggedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    // Trigger swap if swipe exceeds 40px horizontally and was fast
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && duration < 800) {
      setHeaderMode((prev) => (prev === 'banner' ? 'canvas' : 'banner'));
    }

    touchStartRef.current = null;
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    mouseDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;
    const deltaX = e.clientX - mouseStartRef.current.x;
    if (Math.abs(deltaX) > 10) {
      mouseDraggedRef.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;
    const deltaX = e.clientX - mouseStartRef.current.x;
    if (Math.abs(deltaX) > 50) {
      setHeaderMode((prev) => (prev === 'banner' ? 'canvas' : 'banner'));
    }
    mouseStartRef.current = null;
    setTimeout(() => {
      mouseDraggedRef.current = false;
    }, 100);
  };

  const handleMainBannerClick = () => {
    if (isSwipingRef.current || mouseDraggedRef.current) return;
    setFullscreenMedia(headerMode);
  };

  const handleToggleHeaderMode = () => {
    setHeaderMode((prev) => (prev === 'banner' ? 'canvas' : 'banner'));
  };

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

      if (targetColId) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === targetColId ? { ...c, itemIds: [newPost.id, ...c.itemIds] } : c
          )
        );
      }

      setActiveTab('posts');
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
    if (localPosts.length === 0 && initialUser.username.toLowerCase() === 'amberlyn') {
      localPosts = getLocalCollections('amberlyn').filter(isPostCollection);
    }
    if (localPosts.length > 0) setCollections(localPosts);
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

        // Fetch live curated post collections (Supabase live DB with localStorage cache & fallback)
        try {
          const dbPostCols = await getProfileCollections(targetUserId, 'posts');
          if (dbPostCols && dbPostCols.length > 0) {
            setCollections(dbPostCols);
          }
        } catch (colErr) {
          console.error('Error loading collections:', colErr);
        }

        if (isValidUuid(targetUserId)) {
          // 1. Fetch authored posts for the Posts tab (excluding comments)
          const { data: dbBlocks, error: postsError } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', targetUserId)
            .neq('type', 'comment')
            .order('created_at', { ascending: false });

          if (!postsError && dbBlocks && dbBlocks.length > 0) {
            const mappedPosts: Post[] = [];
            for (const b of dbBlocks) {
              if (
                b.type === 'standard' ||
                b.type === 'carousel' ||
                b.type === 'board' ||
                b.type === 'link_card' ||
                b.type === 'grid' ||
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
                  images: b.content?.images || [],
                  carouselData: b.content?.carouselData,
                  boardData: b.content?.boardData,
                  linkData: b.content?.linkData,
                  gridData: b.content?.gridData,
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
                setPosts(mappedPosts);
              } else {
                setPosts(prev => {
                  const existingIds = new Set(mappedPosts.map(p => p.id));
                  return [...mappedPosts, ...prev.filter(p => !existingIds.has(p.id))];
                });
              }
            }
          }

          // 2. Fetch comments targeted to this profile for the Comments tab
          try {
            const { data: dbComments, error: commentsErr } = await supabase
              .from('blocks')
              .select('*, profiles:user_id(*)')
              .eq('type', 'comment')
              .or(`target_user_id.eq.${targetUserId},and(user_id.eq.${targetUserId},target_user_id.is.null),content->>targetUsername.eq.${initialUser.username}`)
              .order('created_at', { ascending: false });

            let finalComments = dbComments;

            // Graceful fallback if target_user_id column is not yet present
            if (commentsErr) {
              const { data: fallbackBlocks } = await supabase
                .from('blocks')
                .select('*, profiles:user_id(*)')
                .eq('type', 'comment')
                .order('created_at', { ascending: false });

              if (fallbackBlocks) {
                finalComments = fallbackBlocks.filter(b => 
                  b.content?.targetUsername?.toLowerCase() === initialUser.username.toLowerCase() ||
                  (!b.content?.targetUsername && b.user_id === targetUserId)
                );
              }
            }

            if (finalComments && finalComments.length > 0) {
              const mappedComments: Comment[] = [];
              for (const b of finalComments) {
                const commentAuthorProfile = b.profiles;
                const authorData = commentAuthorProfile ? {
                  id: b.user_id,
                  username: commentAuthorProfile.username,
                  name: commentAuthorProfile.name || commentAuthorProfile.username,
                  avatar: formatTwitterAvatar(commentAuthorProfile.avatar_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentAuthorProfile.username}`,
                  banner: commentAuthorProfile.banner_url || '',
                  bio: commentAuthorProfile.bio || '',
                  joined: '2026',
                  followingCount: 0,
                  followersCount: 0,
                  oomfsCount: 0,
                  links: []
                } : (b.content?.author || {
                  id: b.user_id || 'guest',
                  username: b.content?.author?.username || 'guest',
                  name: b.content?.author?.name || 'Guest User',
                  avatar: formatTwitterAvatar(b.content?.author?.avatar) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
                  joined: '2026',
                  followingCount: 0,
                  followersCount: 0,
                  oomfsCount: 0,
                  links: []
                });

                const commentItem: Comment = {
                  id: b.id,
                  author: authorData,
                  createdAt: new Date(b.created_at).toLocaleDateString(),
                  text: b.content?.text || '',
                  images: b.content?.images || [],
                  targetUsername: b.content?.targetUsername || initialUser.username,
                  targetUserId: b.target_user_id || targetUserId,
                  likesCount: b.content?.likesCount || 0,
                  repliesCount: b.content?.repliesCount || 0,
                  repostsCount: b.content?.repostsCount || 0,
                  isLiked: false
                };

                // Save to session post store so clicking immediately opens thread view
                saveSessionPost({
                  id: b.id,
                  author: authorData,
                  createdAt: commentItem.createdAt,
                  type: 'comment',
                  text: commentItem.text,
                  images: commentItem.images,
                  targetUsername: commentItem.targetUsername,
                  targetUserId: commentItem.targetUserId,
                  likesCount: commentItem.likesCount,
                  repostsCount: commentItem.repostsCount || 0,
                  repliesCount: commentItem.repliesCount || 0,
                  viewsCount: '1'
                });

                mappedComments.push(commentItem);
              }

              if (mappedComments.length > 0) {
                setComments(mappedComments);
              }
            }
          } catch (commFetchErr) {
            console.error('Error loading comments:', commFetchErr);
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
    if (!commentText.trim() && commentImages.length === 0) return;
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

    // Target profile owner ID (must be a valid database UUID if persisting to Supabase)
    const targetOwnerId = (userProfile.id && isValidUuid(userProfile.id))
      ? userProfile.id
      : (initialUser.id && isValidUuid(initialUser.id))
        ? initialUser.id
        : null;

    if (authUser?.id) {
      try {
        const payload: any = {
          user_id: authUser.id,
          type: 'comment',
          content: {
            text: commentText.trim(),
            images: commentImages,
            targetUsername: userProfile.username,
            author: authorData,
            likesCount: 0,
            repliesCount: 0,
            repostsCount: 0
          }
        };

        if (targetOwnerId) {
          payload.target_user_id = targetOwnerId;
        }

        let { data, error } = await supabase
          .from('blocks')
          .insert(payload)
          .select('id')
          .single();

        // If target_user_id column doesn't exist yet, retry without it
        if (error && error.message?.includes('target_user_id')) {
          delete payload.target_user_id;
          const retry = await supabase
            .from('blocks')
            .insert(payload)
            .select('id')
            .single();
          data = retry.data;
        }

        if (data?.id) {
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
      images: commentImages,
      targetUsername: userProfile.username,
      targetUserId: targetOwnerId || undefined,
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      isLiked: false
    };

    // Cache in session store as a post so clicking on it immediately opens status thread
    saveSessionPost({
      id: newCommentId,
      author: authorData,
      createdAt: 'Just now',
      type: 'comment',
      text: commentText.trim(),
      images: commentImages,
      targetUsername: userProfile.username,
      targetUserId: targetOwnerId || undefined,
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1'
    });

    setComments([newComment, ...comments]);
    setCommentText('');
    setCommentImages([]);
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

  // Raw timeline posts (Standard, Carousel, Board, Link Card, Web Badge - all post types included)
  const rawTimelinePosts = useMemo(
    () => posts,
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
            {activeCollectionId ? (
              <div className="flex items-center gap-1.5 text-xs truncate">
                <span className="font-bold text-[#1d9bf0] truncate max-w-[140px] sm:max-w-[200px]">
                  {collections.find(c => c.id === activeCollectionId)?.title || 'Preset'}
                </span>
                <span className="text-[#536471]">• {timelinePosts.length} posts</span>
              </div>
            ) : (
              <span className="text-xs text-[#536471] truncate">
                {allTimelinePosts.length} Posts
              </span>
            )}
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
                  onClick={handleToggleHeaderMode}
                  aria-label={headerMode === 'banner' ? 'Show OOMF Doodles' : 'Show Clean Banner'}
                  title={headerMode === 'banner' ? 'Show OOMF Doodles' : 'Show Clean Banner'}
                  className="p-2 hover:bg-[#0f1419]/10 rounded-full text-[#0f1419] transition-colors cursor-pointer"
                >
                  {headerMode === 'banner' ? (
                    <Paintbrush className="w-5 h-5 text-[#1d9bf0]" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#1d9bf0]" />
                  )}
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

      {/* Banner & Doodle Viewport: 1:1 X Standard 3:1 Aspect Ratio (1500x500) */}
      <div 
        onClick={handleMainBannerClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        title={headerMode === 'banner' ? 'Tap to view banner (Swipe/drag to view OOMF Doodles)' : 'Tap to sign banner (Swipe/drag to view Clean Banner)'}
        className="w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden select-none cursor-pointer transition-opacity duration-300"
      >
        {headerMode === 'banner' ? (
          userProfile.banner ? (
            <img
              src={userProfile.banner}
              alt={`${userProfile.name}'s banner`}
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
          )
        ) : (
          <CanvasPreview 
            username={userProfile.username} 
            bannerUrl={userProfile.banner}
            mode="main" 
            className="w-full h-full pointer-events-none" 
          />
        )}
      </div>

      {/* Avatar & Action Button Row */}
      <div className="px-4 relative flex flex-wrap sm:flex-nowrap justify-between items-end pb-3 gap-y-3">
        {/* Avatar & Tip Circle (Twin Hero Circles overlapping banner) */}
        <div className="flex items-end gap-2.5 sm:gap-3 shrink-0">
          {/* Avatar (top half overlaps banner, bottom half in white area) */}
          <div className="relative -mt-16 sm:-mt-20 shrink-0">
            <img
              src={formatTwitterAvatar(userProfile.avatar)}
              alt={userProfile.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover bg-white shadow-md"
            />
          </div>

          {/* Tip Circle (Twin Supporter Orbit, exact same diameter and banner overlap) */}
          <TipCircle
            username={userProfile.username}
            name={userProfile.name}
            supporters={profileSupporters}
            onClick={() => setSupporterModalOpen(true)}
          />
        </div>

        {/* Action buttons */}
        <div ref={followButtonRef} className="flex items-center gap-1.5 sm:gap-2 mb-2 shrink-0">
          {/* Ask! button (only visible when viewing another user's profile) */}
          {!isSelf && (
            <button
              type="button"
              className="border border-[#cfd9de] hover:bg-[#0f1419]/5 text-[#0f1419] font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title={`Ask @${userProfile.username}`}
            >
              <CatShushIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0f1419]" />
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
              className={`font-bold text-sm min-w-[95px] sm:min-w-[105px] py-2 px-4 sm:px-5 rounded-full transition-all cursor-pointer ${
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

        {/* 1:1 X Standard Stats Row: oomfs, Following, Followers */}
        <div className="flex items-center gap-4 sm:gap-5 pt-1 flex-wrap text-sm">
          {/* OOMFs (Highlighted in Twitter Blue) */}
          <Link 
            href={`/${userProfile.username}/oomfs`}
            className="flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span className="font-bold text-[#1d9bf0]">{userProfile.oomfsCount ?? 0}</span>
            <span className="text-[#1d9bf0] font-medium">oomfs</span>
          </Link>

          {/* Following */}
          <Link 
            href={`/${userProfile.username}/following`}
            className="flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span className="font-bold text-[#0f1419]">{userProfile.followingCount ?? 0}</span>
            <span className="text-[#536471]">Following</span>
          </Link>

          {/* Followers */}
          <Link 
            href={`/${userProfile.username}/followers`}
            className="flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span className="font-bold text-[#0f1419]">{userProfile.followersCount ?? 0}</span>
            <span className="text-[#536471]">Followers</span>
          </Link>
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
            onClose={() => setComposerOpen(false)}
          />
        </div>
      )}

      {/* 5 TABS BAR: Posts (1st), Presets (2nd), Links (3rd), Comments (4th), Likes (5th) */}
      <div className="flex border-b border-[#eff3f4] mt-4 font-medium text-sm text-[#536471]">
        {/* 1. Posts */}
        <button
          onClick={() => {
            setActiveTab('posts');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/${userProfile.username}`);
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'posts' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Posts</span>
            {activeCollectionId && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d9bf0] shrink-0" title="Preset active" />
            )}
          </div>
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 2. Presets */}
        <button
          onClick={() => {
            setActiveTab('presets');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/${userProfile.username}/presets`);
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'presets' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Presets</span>
          </div>
          {activeTab === 'presets' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 3. Links */}
        <button
          onClick={() => {
            setActiveTab('links');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `/${userProfile.username}/links`);
            }
          }}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'links' ? 'text-[#0f1419]' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>Links</span>
          </div>
          {activeTab === 'links' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 4. Comments */}
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'comments' ? 'text-[#0f1419]' : ''
          }`}
        >
          Comments
          {activeTab === 'comments' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 5. Likes */}
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'likes' ? 'text-[#0f1419]' : ''
          }`}
        >
          Likes
          {activeTab === 'likes' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1">
        {/* 1. POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            {/* Minimalist Breadcrumb / Clear Indicator when a preset is active */}
            {activeCollectionId && (() => {
              const activeCol = collections.find((c) => c.id === activeCollectionId);
              if (!activeCol) return null;
              return (
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#eff3f4] text-xs bg-[#f7f9f9]/70">
                  <button
                    type="button"
                    onClick={() => handleSelectPostCollection(null)}
                    className="flex items-center gap-1.5 text-[#1d9bf0] font-bold hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All posts</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-[#536471] font-medium truncate max-w-[140px] sm:max-w-xs">
                      {activeCol.icon || '📁'} {activeCol.title}
                    </span>
                    {isSelf && (
                      <button
                        type="button"
                        onClick={() => setReorderTargetCollection(activeCol)}
                        className="text-[#1d9bf0] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        title="Reorder posts in this collection"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {timelinePosts.length > 0 ? (
              timelinePosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onDelete={handleDeletePost}
                  onManageCollections={isSelf ? (p) => setManageItem({ id: p.id, title: p.text?.slice(0, 40) || 'Post' }) : undefined}
                />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                No posts in this preset yet.{' '}
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

        {/* 2. PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="flex flex-col">
            {/* Presets Header */}
            <div className="px-4 py-3.5 bg-[#f7f9f9]/80 border-b border-[#eff3f4] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 text-[#1d9bf0] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#0f1419] text-sm sm:text-base leading-tight truncate">
                    Presets & Collections
                  </h3>
                  <p className="text-xs text-[#536471] truncate">
                    Curated channels and post collections by @{userProfile.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setCreateCollectionTab('posts')}
                    className="text-xs font-bold text-white bg-[#1d9bf0] hover:bg-[#1a8cd8] px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Collection</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Master Feed Launcher Card */}
              <button
                type="button"
                onClick={() => {
                  handleSelectPostCollection(null);
                  setActiveTab('posts');
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/${userProfile.username}`);
                  }
                }}
                className="w-full text-left bg-gradient-to-r from-blue-50/70 via-white to-blue-50/30 border border-blue-100 hover:border-[#1d9bf0] hover:shadow-xs rounded-2xl p-4 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#1d9bf0] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[#0f1419] text-sm sm:text-base group-hover:text-[#1d9bf0] transition-colors truncate">
                        All Posts (Master Timeline)
                      </h4>
                      <span className="text-[11px] font-bold text-[#1d9bf0] bg-blue-100/60 px-2 py-0.5 rounded-full shrink-0">
                        {allTimelinePosts.length} posts
                      </span>
                    </div>
                    <p className="text-xs text-[#536471] mt-0.5 line-clamp-1">
                      View the complete chronological timeline featuring all posts, photo carousels, boards, and link cards.
                    </p>
                  </div>
                </div>
                <div className="text-[#1d9bf0] font-bold text-xs flex items-center gap-1 shrink-0 ml-3 group-hover:translate-x-1 transition-transform">
                  <span className="hidden sm:inline">Open Feed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Collections Presets Grid */}
              {collections.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <span className="text-xs font-extrabold text-[#536471] uppercase tracking-wider">
                      Curated Presets ({collections.length})
                    </span>
                    <span className="text-[11px] text-[#536471]">
                      Click any preset to view posts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {collections.map((col) => (
                      <div
                        key={col.id}
                        className="bg-white border border-[#eff3f4] hover:border-[#1d9bf0]/60 hover:shadow-xs rounded-2xl p-4 transition-all flex flex-col justify-between group"
                      >
                        <div 
                          onClick={() => {
                            handleSelectPostCollection(col.id);
                            setActiveTab('posts');
                            if (typeof window !== 'undefined') {
                              window.history.replaceState(null, '', `/${userProfile.username}`);
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                {col.icon || '📁'}
                              </span>
                              <h4 className="font-extrabold text-[#0f1419] text-sm sm:text-base group-hover:text-[#1d9bf0] transition-colors truncate">
                                {col.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-semibold text-[#536471] bg-[#f7f9f9] px-2 py-0.5 rounded-full">
                                {col.itemIds?.length || 0}
                              </span>
                            </div>
                          </div>

                          {col.description && (
                            <p className="text-xs text-[#536471] line-clamp-2 leading-relaxed">
                              {col.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#f7f9f9] text-xs">
                          {isSelf ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReorderTargetCollection(col);
                                }}
                                className="text-[11px] font-semibold text-[#1d9bf0] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                <span>Reorder</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete collection "${col.title}"?`)) {
                                    handleDeleteCollection(col.id);
                                  }
                                }}
                                className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer ml-1"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#536471] font-medium">
                              Preset Lens
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectPostCollection(col.id);
                              setActiveTab('posts');
                              if (typeof window !== 'undefined') {
                                window.history.replaceState(null, '', `/${userProfile.username}`);
                              }
                            }}
                            className="text-[#1d9bf0] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                          >
                            <span>View posts</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-[#536471] flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-[#0f1419] text-sm mb-1">
                    No Presets Yet
                  </h4>
                  <p className="text-xs text-[#536471] max-w-sm mx-auto mb-4">
                    Presets allow you to group your posts, carousels, boards, and links into curated playlists.
                  </p>
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => setCreateCollectionTab('posts')}
                      className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      Create Your First Preset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. LINKS TAB: LINKTREE-STYLE PORTAL */}
        {activeTab === 'links' && (
          <LinksPortal user={userProfile} isSelf={isSelf} />
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
              <form onSubmit={handleAddComment} className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Replying context indicator */}
                <div className="text-xs text-[#536471] flex items-center gap-1">
                  <span>Replying to</span>
                  <span className="text-[#1d9bf0] font-medium">@{userProfile.username}</span>
                </div>

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Leave a comment for @${userProfile.username}...`}
                  rows={commentImages.length > 0 ? 2 : 3}
                  className="w-full text-[15px] text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
                />

                {/* Previews of attached images */}
                {commentImages.length > 0 && (
                  <div className={`grid gap-2 mb-1 ${
                    commentImages.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2 sm:grid-cols-4'
                  }`}>
                    {commentImages.map((img, idx) => (
                      <div key={idx} className="relative group/preview rounded-xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] aspect-square">
                        <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveCommentImage(idx)}
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
                  ref={commentFileInputRef}
                  onChange={handleCommentImageSelect}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                {/* Composer Actions Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={commentImages.length >= 4 || isUploadingCommentImage}
                      onClick={() => commentFileInputRef.current?.click()}
                      title={commentImages.length >= 4 ? "Maximum 4 images allowed" : "Add photos (up to 4)"}
                      className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {commentImages.length > 0 && (
                        <span className="text-[11px] font-bold text-[#1d9bf0]">
                          {commentImages.length}/4
                        </span>
                      )}
                    </button>
                    {isUploadingCommentImage && (
                      <span className="text-xs text-[#536471] animate-pulse">
                        Compressing photo...
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={(!commentText.trim() && commentImages.length === 0) || isSubmittingComment || isUploadingCommentImage}
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


      {/* Owner Post Reordering Modal (up to 100 posts per collection) */}
      {reorderTargetCollection && (
        <ReorderCollectionModal
          isOpen={Boolean(reorderTargetCollection)}
          onClose={() => setReorderTargetCollection(null)}
          collection={reorderTargetCollection}
          allPosts={allTimelinePosts}
          onReorderCollectionItems={handleReorderCollectionItems}
          onRemoveCollectionItem={handleRemoveCollectionItem}
        />
      )}

      {/* Add To Collection Modal (for organizing existing posts & links) */}
      {manageItem && (
        <AddToCollectionModal
          isOpen={Boolean(manageItem)}
          onClose={() => setManageItem(null)}
          itemId={manageItem.id}
          itemTitle={manageItem.title}
          itemTypeLabel="post"
          collections={collections}
          userId={activeCreatorUserId}
          tabType="posts"
          onUpdateCollections={(updated) => setCollections(updated)}
        />
      )}

      {/* Create Collection Modal */}
      {createCollectionTab && (
        <CreateCollectionModal
          isOpen={Boolean(createCollectionTab)}
          onClose={() => setCreateCollectionTab(null)}
          userId={activeCreatorUserId}
          tabType="posts"
          onCreated={handleCreatedCollection}
          username={userProfile.username}
        />
      )}

      {/* Fullscreen Banner / Canvas Lightbox Modal */}
      <FullscreenMediaModal
        isOpen={Boolean(fullscreenMedia)}
        type={fullscreenMedia}
        bannerUrl={userProfile.banner}
        name={userProfile.name}
        username={userProfile.username}
        onClose={() => setFullscreenMedia(null)}
      />

      {/* Supporter Orbit Modal */}
      <SupporterModal
        isOpen={supporterModalOpen}
        name={userProfile.name}
        username={userProfile.username}
        supporters={profileSupporters}
        onClose={() => setSupporterModalOpen(false)}
        onScenarioChange={(newSupporters) => {
          setProfileSupporters(newSupporters);
        }}
        onAddTip={(newSupporter) => {
          setProfileSupporters((prev) => [newSupporter, ...prev]);
        }}
      />
    </div>
  );
}
