'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  CheckCircle2, 
  Check, 
  Users, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Plus, 
  X,
  LogIn,
  Layers,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { 
  User, 
  MOCK_POSTS, 
  MOCK_COMMENTS, 
  MOCK_LIKED_POSTS, 
  CURRENT_USER, 
  Post, 
  Comment
} from '@/lib/mockData';
import PostCard from '@/components/feed/PostCard';
import CommentCard from '@/components/feed/CommentCard';
import PostComposer from '@/components/feed/PostComposer';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user: initialUser }: ProfileViewProps) {
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();
  const supabase = createClient();

  // 4 tabs requested left-to-right: 1. Posts (default), 2. Comments, 3. Links, 4. Likes
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'links' | 'likes'>('posts');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userProfile, setUserProfile] = useState<User>(initialUser);

  // Check if viewing own profile
  const isSelf = Boolean(
    (authProfile && authProfile.username.toLowerCase() === initialUser.username.toLowerCase()) || 
    (authUser && authProfile?.username === initialUser.username)
  );

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
          setUserProfile(prev => ({
            ...prev,
            id: dbUser.id,
            name: dbUser.name ?? prev.name,
            avatar: dbUser.avatar_url ?? prev.avatar,
            banner: dbUser.banner_url ?? prev.banner,
            bio: dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : prev.bio,
            location: dbUser.location ?? prev.location,
            website: dbUser.website ?? prev.website,
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://oomfs.org/${userProfile.username}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  // Timeline posts (Standard, Carousel, Board) - excludes link cards and badges
  const timelinePosts = posts.filter(p => p.type !== 'link_card' && p.type !== 'badge');

  // Unified Badge Wall posts
  const badgePosts = posts.filter(p => p.type === 'badge' && p.badgeData);

  // Combined links (user profile links + link_card posts)
  const linkCards = [
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
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-between px-4 py-2 border-b border-[#eff3f4]">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="p-2 hover:bg-[#f7f9f9] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg text-[#0f1419] leading-tight flex items-center gap-1">
              {userProfile.name}
              {userProfile.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white" />
              )}
            </h1>
            <span className="text-xs text-[#536471]">
              {timelinePosts.length} Posts
            </span>
          </div>
        </div>

        {/* Action Trigger - Always accessible to draft & test posts */}
        <button
          onClick={() => setComposerOpen(!composerOpen)}
          className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          {composerOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{composerOpen ? 'Close Composer' : 'Create Post'}</span>
        </button>
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
        <div className="flex items-center gap-2 mb-2">
          {/* Share / Copy Bio Link */}
          <button
            onClick={handleCopyLink}
            className="border border-[#eff3f4] hover:bg-[#f7f9f9] text-[#0f1419] font-bold text-sm px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy oomfs.org link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#536471]" />
                <span className="text-xs">oomfs.org/{userProfile.username}</span>
              </>
            )}
          </button>

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
              onClick={() => setIsFollowing(!isFollowing)}
              className={`font-bold text-sm px-5 py-2 rounded-full transition-colors cursor-pointer ${
                isFollowing
                  ? 'border border-[#eff3f4] text-[#0f1419] hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                  : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
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
          <span className="text-sm text-[#536471]">
            @{userProfile.username}
          </span>
        </div>

        {/* Bio Text */}
        {userProfile.bio && (
          <p className="text-sm text-[#0f1419] leading-normal whitespace-pre-line">
            {userProfile.bio}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#536471] pt-1">
          {userProfile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{userProfile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <LinkIcon className="w-4 h-4 text-[#1d9bf0]" />
            <a 
              href={`https://${userProfile.website || `oomfs.org/${userProfile.username}`}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-[#1d9bf0] hover:underline font-medium"
            >
              {userProfile.website || `oomfs.org/${userProfile.username}`}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {userProfile.joined}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{userProfile.followingCount}</span>
            <span className="text-[#536471]">Following</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{userProfile.followersCount.toLocaleString()}</span>
            <span className="text-[#536471]">Followers</span>
          </div>

          {/* OOMFS MUTUAL STAT HIGHLIGHT */}
          <Link 
            href="/oomfs"
            className="bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 px-2.5 py-1 rounded-full text-[#1d9bf0] font-bold flex items-center gap-1.5 transition-colors border border-[#1d9bf0]/20 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{userProfile.oomfsCount} OOMFs (Mutuals)</span>
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
            onClose={() => setComposerOpen(false)}
          />
        </div>
      )}

      {/* 4 TABS BAR: Posts (1st), Comments (2nd), Links (3rd), Likes (4th) */}
      <div className="flex border-b border-[#eff3f4] mt-4 font-medium text-sm text-[#536471]">
        {/* 1. Posts */}
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'posts' ? 'text-[#0f1419]' : ''
          }`}
        >
          Posts ({timelinePosts.length})
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
          Comments ({comments.length})
          {activeTab === 'comments' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* 3. Links */}
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'links' ? 'text-[#0f1419]' : ''
          }`}
        >
          Links ({linkCards.length + badgePosts.length})
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
          Likes ({likedPosts.length})
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
            {/* Quick-Compose Bar right at the top of Posts tab */}
            {!composerOpen && (
              <div className="px-4 py-3 border-b border-[#eff3f4] bg-[#f7f9f9]/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBlockType('standard');
                    setComposerOpen(true);
                  }}
                  className="flex items-center gap-2.5 flex-1 text-left cursor-pointer group"
                >
                  <img
                    src={formatTwitterAvatar(userProfile.avatar)}
                    alt={userProfile.name}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                  <span className="text-sm text-[#536471] group-hover:text-[#0f1419] transition-colors">
                    Draft a new post, carousel, or board...
                  </span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBlockType('standard');
                      setComposerOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-white border border-[#eff3f4] hover:border-[#1d9bf0] text-[#0f1419] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1d9bf0]" />
                    <span className="hidden sm:inline">Standard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBlockType('carousel');
                      setComposerOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-white border border-[#eff3f4] hover:border-[#1d9bf0] text-[#0f1419] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#1d9bf0]" />
                    <span>Carousel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBlockType('board');
                      setComposerOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-white border border-[#eff3f4] hover:border-[#1d9bf0] text-[#0f1419] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
                    <span>Board</span>
                  </button>
                </div>
              </div>
            )}

            {timelinePosts.length > 0 ? (
              timelinePosts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                No posts yet. Click <b>&quot;Create Post&quot;</b> above to share your first post!
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
          <div className="p-4 flex flex-col gap-4">
            {/* 1. THE BADGE WALL (Above larger cards, early web 88x31 buttons packed super tightly in center column) */}
            <div className="border border-[#eff3f4] rounded-2xl bg-white overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2.5 bg-[#f7f9f9] border-b border-[#eff3f4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#1d9bf0]/10 flex items-center justify-center text-[#1d9bf0]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wider">
                      Badge Wall
                    </span>
                    <span className="text-[11px] font-semibold text-[#536471]">
                      ({badgePosts.length})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBlockType('badge');
                    setComposerOpen(true);
                  }}
                  className="bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Badge</span>
                </button>
              </div>

              {/* Tightly packed unified wall within center column */}
              <div className="p-3 sm:p-3.5 bg-white">
                {badgePosts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center justify-start">
                    {badgePosts.map((post) => {
                      const b = post.badgeData!;
                      return (
                        <div
                          key={post.id}
                          className="relative group/badge-item shrink-0"
                        >
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${b.title} • ${b.url.replace(/^https?:\/\//, '')}`}
                            className="block w-[88px] h-[31px] shrink-0 rounded-xs overflow-hidden border border-black/25 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
                          >
                            {b.badgeType === 'image' && b.imageUrl ? (
                              <img
                                src={b.imageUrl}
                                alt={b.title}
                                className="w-[88px] h-[31px] object-cover block"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <div
                                className="w-[88px] h-[31px] flex items-center overflow-hidden font-mono text-[9px] font-extrabold"
                                style={{ backgroundColor: b.bgColor || '#0f1419', color: b.textColor || '#ffffff' }}
                              >
                                {b.sublabel && (
                                  <span className="bg-black/35 h-full px-1.5 flex items-center justify-center border-r border-white/20 uppercase tracking-tight shrink-0">
                                    {b.sublabel}
                                  </span>
                                )}
                                <span className="flex-1 px-1 text-center truncate tracking-tight uppercase flex items-center justify-center gap-0.5">
                                  {b.icon && <span className="text-[10px]">{b.icon}</span>}
                                  <span className="truncate">{b.label || b.title}</span>
                                </span>
                              </div>
                            )}
                          </a>

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
                ) : (
                  <div className="text-center py-5 px-3 border border-dashed border-[#eff3f4] rounded-xl bg-[#f7f9f9]/50">
                    <p className="text-xs text-[#536471] mb-2">
                      No badges on this wall yet. Tiny 88×31 buttons pack tightly together here.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBlockType('badge');
                        setComposerOpen(true);
                      }}
                      className="text-xs font-bold text-[#1d9bf0] hover:underline cursor-pointer"
                    >
                      + Create the first badge
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. LARGER BIO LINK CARDS */}
            <div className="p-3 bg-[#f7f9f9] rounded-xl border border-[#eff3f4] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1d9bf0] uppercase tracking-wider block mb-0.5">
                  Linktree Style Showcase
                </span>
                <p className="text-xs text-[#536471]">
                  Curated links displayed for visitors discovering <b>oomfs.org/{userProfile.username}</b>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBlockType('link_card');
                  setComposerOpen(true);
                }}
                className="bg-[#1d9bf0] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#1a8cd8] transition-colors shrink-0 cursor-pointer"
              >
                + Add Link
              </button>
            </div>

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
              <div className="text-center py-6 text-[#536471] text-sm">
                No bio links listed yet.
              </div>
            )}
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
    </div>
  );
}
