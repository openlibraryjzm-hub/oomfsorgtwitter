'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  List, 
  LayoutGrid,
  Palette,
  Layers
} from 'lucide-react';
import { User, MOCK_USERS } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { formatTwitterAvatar } from '@/lib/utils';
import { 
  getMutualOomfs, 
  getUserFollowing, 
  getUserFollowers, 
  getViewerRelationships, 
  toggleFollow,
  isValidUuid 
} from '@/lib/follows';

export type NetworkTab = 'oomfs' | 'following' | 'followers';
export type ViewMode = 'compact' | 'cards' | 'canvas' | 'link_wall';

interface UserNetworkViewProps {
  targetUser: User;
  initialTab?: NetworkTab;
}

interface NetworkProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  banner?: string;
  bio?: string;
  isVerified?: boolean;
}

export default function UserNetworkView({ targetUser, initialTab = 'oomfs' }: UserNetworkViewProps) {
  const router = useRouter();
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();

  const [activeTab, setActiveTab] = useState<NetworkTab>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Viewer's relationship IDs to populate "Follows you", "OOMFS", and "Following" tags
  const [viewerFollowing, setViewerFollowing] = useState<Set<string>>(new Set());
  const [viewerFollowers, setViewerFollowers] = useState<Set<string>>(new Set());
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync activeTab when URL or prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load viewer relationship sets
  useEffect(() => {
    async function loadRelationships() {
      if (authUser?.id && isValidUuid(authUser.id)) {
        const rels = await getViewerRelationships(authUser.id);
        setViewerFollowing(rels.followingIds);
        setViewerFollowers(rels.followerIds);
      }
    }
    loadRelationships();
  }, [authUser?.id]);

  // Load profiles for current tab
  useEffect(() => {
    let isCancelled = false;

    async function loadTabProfiles() {
      setLoading(true);

      const targetId = targetUser.id;

      // Real Supabase accounts with valid UUID
      if (isValidUuid(targetId)) {
        try {
          let data: any[] = [];
          if (activeTab === 'oomfs') {
            data = await getMutualOomfs(targetId);
          } else if (activeTab === 'following') {
            data = await getUserFollowing(targetId);
          } else if (activeTab === 'followers') {
            data = await getUserFollowers(targetId);
          }

          if (!isCancelled) {
            const mapped: NetworkProfile[] = (data || []).map((p: any) => ({
              id: p.id,
              username: p.username,
              name: p.name || p.username,
              avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
              banner: p.banner_url || '',
              bio: p.bio || '',
              isVerified: false,
            }));
            setProfiles(mapped);
          }
        } catch (err) {
          console.error(`Error loading ${activeTab}:`, err);
          if (!isCancelled) setProfiles([]);
        } finally {
          if (!isCancelled) setLoading(false);
        }
      } else {
        // Fallback for mock users (e.g. amberlyn, dev_kyle, jack)
        const mockKeys = Object.keys(MOCK_USERS).filter(k => k !== targetUser.username.toLowerCase());
        const sampleMockProfiles: NetworkProfile[] = mockKeys.slice(0, 3).map(k => {
          const u = MOCK_USERS[k];
          return {
            id: u.id,
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            banner: u.banner || '',
            bio: u.bio,
            isVerified: u.isVerified,
          };
        });

        if (!isCancelled) {
          setProfiles(sampleMockProfiles);
          setLoading(false);
        }
      }
    }

    loadTabProfiles();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, targetUser.id, targetUser.username]);

  // Tab switch handler with URL sync
  const handleTabChange = (tab: NetworkTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/${targetUser.username}/${tab}`);
  };

  // Follow / Unfollow inline handler
  const handleToggleUserFollow = async (profileId: string) => {
    if (!authUser) {
      signInWithTwitter();
      return;
    }
    if (authUser.id === profileId || actionLoadingId) return;

    const isFollowing = viewerFollowing.has(profileId);
    setActionLoadingId(profileId);

    // Optimistic UI update
    setViewerFollowing((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });

    try {
      if (isValidUuid(profileId)) {
        const res = await toggleFollow(profileId, authUser.id, isFollowing);
        if (!res.success) {
          console.error('Error toggling follow:', res.error);
          setViewerFollowing((prev) => {
            const next = new Set(prev);
            if (isFollowing) next.add(profileId);
            else next.delete(profileId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      setViewerFollowing((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(profileId);
        else next.delete(profileId);
        return next;
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1:1 Sticky Top Header with Back nav, User info, and 4-Option Presentation Panel */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Back button + User Name & Handle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/${targetUser.username}`)}
            className="p-2 -ml-2 hover:bg-[#0f1419]/10 rounded-full transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="font-extrabold text-base sm:text-lg text-[#0f1419] leading-tight truncate">
                {targetUser.name}
              </h1>
              {targetUser.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
              )}
            </div>
            <span className="text-xs text-[#536471] truncate">
              @{targetUser.username}
            </span>
          </div>
        </div>

        {/* Right: 4-Option Horizontally Aligned Display Option Panel (Icon-Only) */}
        <div className="flex items-center bg-[#eff3f4] p-0.5 rounded-full shrink-0">
          <button
            onClick={() => setViewMode('compact')}
            title="Compact"
            aria-label="Compact view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'compact'
                ? 'bg-white text-[#0f1419] shadow-xs'
                : 'text-[#536471] hover:text-[#0f1419]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewMode('cards')}
            title="Cards"
            aria-label="Cards view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'cards'
                ? 'bg-white text-[#0f1419] shadow-xs'
                : 'text-[#536471] hover:text-[#0f1419]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewMode('canvas')}
            title="Canvas"
            aria-label="Canvas view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'canvas'
                ? 'bg-white text-[#0f1419] shadow-xs'
                : 'text-[#536471] hover:text-[#0f1419]'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewMode('link_wall')}
            title="Link Wall"
            aria-label="Link Wall view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'link_wall'
                ? 'bg-white text-[#0f1419] shadow-xs'
                : 'text-[#536471] hover:text-[#0f1419]'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 1:1 Interconnected Tabs Header */}
      <div className="flex border-b border-[#eff3f4]">
        {/* Tab 1: OOMFs */}
        <button
          onClick={() => handleTabChange('oomfs')}
          className="flex-1 hover:bg-[#f7f9f9] transition-colors relative py-3.5 text-center cursor-pointer"
        >
          <span
            className={`text-sm ${
              activeTab === 'oomfs'
                ? 'font-bold text-[#0f1419]'
                : 'font-medium text-[#536471]'
            }`}
          >
            OOMFs
          </span>
          {activeTab === 'oomfs' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* Tab 2: Following */}
        <button
          onClick={() => handleTabChange('following')}
          className="flex-1 hover:bg-[#f7f9f9] transition-colors relative py-3.5 text-center cursor-pointer"
        >
          <span
            className={`text-sm ${
              activeTab === 'following'
                ? 'font-bold text-[#0f1419]'
                : 'font-medium text-[#536471]'
            }`}
          >
            Following
          </span>
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        {/* Tab 3: Followers */}
        <button
          onClick={() => handleTabChange('followers')}
          className="flex-1 hover:bg-[#f7f9f9] transition-colors relative py-3.5 text-center cursor-pointer"
        >
          <span
            className={`text-sm ${
              activeTab === 'followers'
                ? 'font-bold text-[#0f1419]'
                : 'font-medium text-[#536471]'
            }`}
          >
            Followers
          </span>
          {activeTab === 'followers' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* List Feed */}
      {loading ? (
        <div className="p-8 text-center text-sm text-[#536471]">
          Loading {activeTab}...
        </div>
      ) : profiles.length === 0 ? (
        /* Clean Twitter Empty States */
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mb-3 text-[#1d9bf0]">
            {activeTab === 'oomfs' ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Users className="w-6 h-6" />
            )}
          </div>
          <h3 className="font-extrabold text-lg text-[#0f1419] mb-1">
            {activeTab === 'oomfs'
              ? 'No mutual OOMFs yet'
              : activeTab === 'following'
              ? `@${targetUser.username} isn't following anyone yet`
              : `@${targetUser.username} has no followers yet`}
          </h3>
          <p className="text-xs text-[#536471] max-w-sm mt-1">
            {activeTab === 'oomfs'
              ? 'When two users follow each other on oomfs.org, they become OOMFs and receive an OOMFS badge.'
              : activeTab === 'following'
              ? 'When they follow accounts on oomfs.org, they will show up here.'
              : 'When users connect and follow this profile on oomfs.org, they will appear here.'}
          </p>
        </div>
      ) : viewMode === 'compact' ? (
        /* 1. COMPACT LIST PRESENTATION */
        <div className="divide-y divide-[#eff3f4]">
          {profiles.map((p) => {
            const isSelf = authUser?.id === p.id || authProfile?.username.toLowerCase() === p.username.toLowerCase();
            const viewerIsFollowing = viewerFollowing.has(p.id);
            const userFollowsViewer = viewerFollowers.has(p.id);
            const isViewerMutual = viewerIsFollowing && userFollowsViewer;
            const isHovered = hoveredButtonId === p.id;
            const isLoading = actionLoadingId === p.id;

            return (
              <div
                key={p.id}
                className="p-4 hover:bg-[#f7f9f9] transition-colors flex items-start justify-between gap-3 group"
              >
                {/* Left Profile Info */}
                <Link
                  href={`/${p.username}`}
                  className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <img
                    src={formatTwitterAvatar(p.avatar)}
                    alt={p.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-[#0f1419] group-hover:underline truncate">
                        {p.name}
                      </span>
                      {p.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#536471]">
                      <span>@{p.username}</span>
                      {!isSelf && (
                        isViewerMutual ? (
                          <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            OOMFS
                          </span>
                        ) : userFollowsViewer ? (
                          <span className="bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0">
                            Follows you
                          </span>
                        ) : null
                      )}
                    </div>

                    {p.bio && (
                      <p className="text-xs text-[#0f1419] line-clamp-2 mt-1 leading-normal whitespace-pre-line break-words">
                        {p.bio}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Right Action Button */}
                {!isSelf && (
                  <div className="shrink-0 pt-0.5">
                    <button
                      onClick={() => handleToggleUserFollow(p.id)}
                      onMouseEnter={() => setHoveredButtonId(p.id)}
                      onMouseLeave={() => setHoveredButtonId(null)}
                      disabled={isLoading}
                      className={`font-bold text-xs min-w-[90px] py-1.5 px-3.5 rounded-full transition-all cursor-pointer ${
                        viewerIsFollowing
                          ? isHovered
                            ? 'border border-red-200 bg-red-50 text-red-600'
                            : 'border border-[#cfd9de] text-[#0f1419] bg-white'
                          : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
                      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {viewerIsFollowing ? (isHovered ? 'Unfollow' : 'Following') : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'cards' ? (
        /* 2. PROFILE CARDS PRESENTATION (Taller mini-profiles with banner + overlapping avatar + bio, no counts) */
        <div className="divide-y divide-[#eff3f4]">
          {profiles.map((p) => {
            const isSelf = authUser?.id === p.id || authProfile?.username.toLowerCase() === p.username.toLowerCase();
            const viewerIsFollowing = viewerFollowing.has(p.id);
            const userFollowsViewer = viewerFollowers.has(p.id);
            const isViewerMutual = viewerIsFollowing && userFollowsViewer;
            const isHovered = hoveredButtonId === p.id;
            const isLoading = actionLoadingId === p.id;

            return (
              <div
                key={p.id}
                className="hover:bg-[#fcfdfd] transition-colors pb-4"
              >
                {/* Banner Section */}
                <Link
                  href={`/${p.username}`}
                  className="block h-28 sm:h-32 bg-[#eff3f4] relative overflow-hidden group/banner cursor-pointer"
                >
                  {p.banner ? (
                    <img
                      src={p.banner}
                      alt={`${p.name}'s banner`}
                      className="w-full h-full object-cover group-hover/banner:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100" />
                  )}
                </Link>

                {/* Overlapping Avatar & Action Button Row */}
                <div className="px-4 flex justify-between items-end relative -mt-10 sm:-mt-12 mb-2">
                  <Link
                    href={`/${p.username}`}
                    className="relative group/avatar cursor-pointer"
                  >
                    <img
                      src={formatTwitterAvatar(p.avatar)}
                      alt={p.name}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-white object-cover bg-white shadow-sm shrink-0 group-hover/avatar:opacity-95 transition-opacity"
                    />
                  </Link>

                  {!isSelf ? (
                    <div className="mb-1">
                      <button
                        onClick={() => handleToggleUserFollow(p.id)}
                        onMouseEnter={() => setHoveredButtonId(p.id)}
                        onMouseLeave={() => setHoveredButtonId(null)}
                        disabled={isLoading}
                        className={`font-bold text-xs min-w-[95px] py-1.5 px-4 rounded-full transition-all cursor-pointer ${
                          viewerIsFollowing
                            ? isHovered
                              ? 'border border-red-200 bg-red-50 text-red-600'
                              : 'border border-[#cfd9de] text-[#0f1419] bg-white'
                            : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
                        } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {viewerIsFollowing ? (isHovered ? 'Unfollow' : 'Following') : 'Follow'}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-1 text-xs text-[#536471] font-medium px-3 py-1 bg-[#eff3f4] rounded-full">
                      You
                    </div>
                  )}
                </div>

                {/* Profile Identity Details (Name, Verified, Handle, Badge, Bio) */}
                <div className="px-4 flex flex-col gap-1">
                  <div>
                    <Link
                      href={`/${p.username}`}
                      className="group/name inline-flex items-center gap-1.5"
                    >
                      <h2 className="font-extrabold text-base text-[#0f1419] group-hover/name:underline leading-tight">
                        {p.name}
                      </h2>
                      {p.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
                      )}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#536471]">
                      @{p.username}
                    </span>
                    {!isSelf && (
                      isViewerMutual ? (
                        <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0">
                          OOMFS
                        </span>
                      ) : userFollowsViewer ? (
                        <span className="bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0">
                          Follows you
                        </span>
                      ) : null
                    )}
                  </div>

                  {p.bio && (
                    <p className="text-xs text-[#0f1419] leading-relaxed whitespace-pre-line mt-1 line-clamp-3 break-words">
                      {p.bio}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 3 & 4. CANVAS AND LINK WALL PRESENTATION (Wide rectangle banner + small top-left avatar, zero text) */
        <div className="divide-y divide-[#eff3f4]">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/${p.username}`}
              className="block relative overflow-hidden group cursor-pointer"
            >
              <div className="h-28 sm:h-36 w-full bg-[#eff3f4] relative overflow-hidden">
                {p.banner ? (
                  <img
                    src={p.banner}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 group-hover:opacity-90 transition-opacity" />
                )}

                {/* Small avatar overlaid on top-left, zero text */}
                <div className="absolute top-3 left-3 z-10">
                  <img
                    src={formatTwitterAvatar(p.avatar)}
                    alt=""
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover bg-white shadow-md group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
