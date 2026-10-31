'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Sparkles, Hash } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { 
  getViewerRelationships, 
  toggleFollow, 
  isValidUuid 
} from '@/lib/follows';
import { getDeletedPostIds } from '@/lib/postStore';

interface HomeProfile {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  hashtags?: string[];
  created_at?: string;
  is_verified?: boolean;
}

interface BoardSummary {
  id: string;
  title: string;
  images: string[];
}

const MAX_TAGS_ON_CARD = 7;

/**
 * Solo Image Board Thumbnail:
 * Displays the primary lead image of the board (edge-to-edge).
 * Balances partially on the banner alongside the avatar.
 */
function BoardCollageThumbnail({
  board,
  username,
}: {
  board: BoardSummary;
  username: string;
}) {
  const leadImage = board.images?.[0];

  return (
    <Link
      href={`/${username}/status/${board.id}`}
      title={board.title ? `Board: ${board.title}` : 'View board'}
      className="group/board relative block h-16 sm:h-18 w-24 sm:w-28 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md hover:scale-[1.04] transition-all bg-[#eff3f4] shrink-0 cursor-pointer"
    >
      {leadImage ? (
        <img
          src={leadImage}
          alt={board.title || 'Board'}
          className="w-full h-full object-cover group-hover/board:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        /* Fallback placeholder */
        <div className="w-full h-full bg-gradient-to-br from-[#cfd9de] to-[#eff3f4] flex items-center justify-center text-[10px] text-[#536471] font-semibold">
          Board
        </div>
      )}

      {/* Subtle overlay badge for title on hover */}
      {board.title && (
        <div className="absolute inset-x-0 bottom-0 bg-black/65 backdrop-blur-2xs text-white text-[9px] font-semibold px-1 py-0.5 truncate opacity-0 group-hover/board:opacity-100 transition-opacity">
          {board.title}
        </div>
      )}
    </Link>
  );
}

export default function HomePage() {
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<HomeProfile[]>([]);
  const [boardsByUser, setBoardsByUser] = useState<Record<string, BoardSummary[]>>({});
  const [loading, setLoading] = useState(true);

  // Viewer relationship sets for OOMFS / Follows you badges
  const [viewerFollowing, setViewerFollowing] = useState<Set<string>>(new Set());
  const [viewerFollowers, setViewerFollowers] = useState<Set<string>>(new Set());
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Transient clipboard copy feedback
  const [copiedTagKey, setCopiedTagKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 2. Fetch real profiles and batch-fetch up to 3 boards per user
  useEffect(() => {
    let isCancelled = false;

    async function loadRealProfilesAndBoards() {
      setLoading(true);
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, banner_url, bio, hashtags, created_at')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Error fetching home profiles:', profilesError);
          if (!isCancelled) setProfiles([]);
          return;
        }

        if (!isCancelled && profilesData) {
          // Strictly filter out any invalid non-UUID records (pure real OAuth accounts)
          const validProfiles = profilesData.filter(
            (p) => isValidUuid(p.id) && Boolean(p.username)
          );
          setProfiles(validProfiles as HomeProfile[]);

          const userIds = validProfiles.map((p) => p.id);
          if (userIds.length > 0) {
            // Batch-query boards for all visible creators in one single query
            const { data: boardsData, error: boardsError } = await supabase
              .from('blocks')
              .select('id, user_id, type, content, created_at')
              .eq('type', 'board')
              .in('user_id', userIds)
              .order('created_at', { ascending: false });

            if (!boardsError && boardsData) {
              const grouped: Record<string, BoardSummary[]> = {};
              const deletedIds = getDeletedPostIds();

              boardsData.forEach((b: any) => {
                if (deletedIds.has(b.id)) return;

                const rawImgs = b.content?.boardData?.images || b.content?.images || [];
                const images: string[] = rawImgs
                  .map((img: any) =>
                    typeof img === 'string' ? img : img?.url || img?.avatar
                  )
                  .filter(Boolean);

                const title = b.content?.text || b.content?.title || '';

                if (!grouped[b.user_id]) {
                  grouped[b.user_id] = [];
                }
                if (grouped[b.user_id].length < 3) {
                  grouped[b.user_id].push({
                    id: b.id,
                    title,
                    images,
                  });
                }
              });

              if (!isCancelled) {
                setBoardsByUser(grouped);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load home profiles:', err);
        if (!isCancelled) setProfiles([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadRealProfilesAndBoards();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 3. Follow / Unfollow inline action
  const handleToggleUserFollow = async (profileId: string) => {
    if (!authUser) {
      signInWithTwitter();
      return;
    }
    if (authUser.id === profileId || actionLoadingId) return;

    const isFollowing = viewerFollowing.has(profileId);
    setActionLoadingId(profileId);

    // Optimistic UI toggle
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
          // Rollback on failure
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

  // 4. Click-to-copy hashtag handler
  const handleCopyTag = async (tag: string, key: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(tag);
        setCopiedTagKey(key);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedTagKey(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  /**
   * Resolves hashtags for a profile:
   * Prioritizes DB array -> localStorage cache -> Amberlyn fallback if applicable -> empty
   */
  const resolveProfileHashtags = (p: HomeProfile): string[] => {
    let tags = Array.isArray(p.hashtags) && p.hashtags.length > 0 ? p.hashtags : [];

    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem(`oomfs_profile_hashtags_${p.id}`) ||
          localStorage.getItem(`oomfs_profile_hashtags_${p.username}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            tags = parsed;
          }
        }
      } catch {}
    }

    // Default showcase tags for amberlyn / amberlyndev if empty
    if (
      tags.length === 0 &&
      (p.username.toLowerCase() === 'amberlyndev' ||
        p.username.toLowerCase() === 'amberlyn')
    ) {
      return ['#vibecoder', '#gamer', '#painter', '#pixelart', '#nightowl'];
    }

    return tags;
  };

  return (
    <MainLayout>
      {/* 1:1 Sticky Top Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-extrabold text-xl text-[#0f1419] tracking-tight">Home</h1>
        </div>
        {!loading && profiles.length > 0 && (
          <span className="text-xs font-semibold text-[#536471] bg-[#eff3f4] px-2.5 py-1 rounded-full">
            {profiles.length} {profiles.length === 1 ? 'creator' : 'creators'}
          </span>
        )}
      </header>

      {/* Main Center Feed */}
      <div className="min-h-screen bg-white">
        {loading ? (
          /* Clean Loading Skeleton */
          <div className="divide-y divide-[#eff3f4]">
            {[1, 2, 3].map((n) => (
              <div key={n} className="pb-4 animate-pulse">
                <div className="w-full aspect-[3/1] bg-[#eff3f4]" />
                <div className="px-4 flex justify-between items-end -mt-10 sm:-mt-12 mb-2">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-white bg-[#cfd9de]" />
                  <div className="w-24 h-8 rounded-full bg-[#eff3f4] mb-1" />
                </div>
                <div className="px-4 flex flex-col gap-2 mt-2">
                  <div className="w-36 h-4 bg-[#eff3f4] rounded" />
                  <div className="w-20 h-3 bg-[#eff3f4] rounded" />
                  <div className="w-full h-8 bg-[#eff3f4] rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mb-3 text-[#1d9bf0]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#0f1419] mb-1">
              No real accounts found yet
            </h3>
            <p className="text-xs text-[#536471] max-w-sm mt-1">
              When users sign in via Twitter / X OAuth on oomfs.org, their profile cards will appear here.
            </p>
          </div>
        ) : (
          /* Cards Presentation Feed */
          <div className="divide-y divide-[#eff3f4]">
            {profiles.map((p) => {
              const isSelf =
                authUser?.id === p.id ||
                authProfile?.username?.toLowerCase() === p.username.toLowerCase();
              const viewerIsFollowing = viewerFollowing.has(p.id);
              const userFollowsViewer = viewerFollowers.has(p.id);
              const isViewerMutual = viewerIsFollowing && userFollowsViewer;
              const isHovered = hoveredButtonId === p.id;
              const isActionLoading = actionLoadingId === p.id;
              const tags = resolveProfileHashtags(p);
              const userBoards = boardsByUser[p.id] || [];
              const isVerified =
                p.username.toLowerCase() === 'amberlyndev' ||
                p.username.toLowerCase() === 'amberlyn' ||
                Boolean(p.is_verified);

              return (
                <article
                  key={p.id}
                  className="hover:bg-[#fcfdfd] transition-colors pb-4"
                >
                  {/* Banner Section: 1:1 Parity with Profile 3:1 Aspect Ratio (1500x500) */}
                  <Link
                    href={`/${p.username}`}
                    className="block w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden group/banner cursor-pointer"
                  >
                    {p.banner_url ? (
                      <img
                        src={p.banner_url}
                        alt={`${p.name || p.username}'s banner`}
                        className="w-full h-full object-cover group-hover/banner:scale-[1.02] transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
                    )}
                  </Link>

                  {/* Overlapping Avatar, Board Thumbnails & Action Button Row */}
                  <div className="px-4 flex items-end justify-between relative -mt-10 sm:-mt-12 mb-2 gap-2">
                    {/* Left: Avatar + Horizontally Aligned Board Thumbnails balancing on the banner */}
                    <div className="flex items-end gap-2.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
                      {/* Overlapping Avatar */}
                      <Link
                        href={`/${p.username}`}
                        className="relative group/avatar cursor-pointer shrink-0"
                      >
                        <img
                          src={formatTwitterAvatar(
                            p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`
                          )}
                          alt={p.name || p.username}
                          className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-white object-cover bg-white shadow-sm shrink-0 group-hover/avatar:opacity-95 transition-opacity"
                        />
                      </Link>

                      {/* Up to 3 Board Collage Thumbnails balancing on banner */}
                      {userBoards.length > 0 && (
                        <div className="flex items-end gap-2 shrink-0 pb-1">
                          {userBoards.map((b) => (
                            <BoardCollageThumbnail
                              key={b.id}
                              board={b}
                              username={p.username}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Action Button */}
                    <div className="mb-1 shrink-0">
                      {!isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleToggleUserFollow(p.id)}
                          onMouseEnter={() => setHoveredButtonId(p.id)}
                          onMouseLeave={() => setHoveredButtonId(null)}
                          disabled={isActionLoading}
                          className={`font-bold text-xs min-w-[95px] py-1.5 px-4 rounded-full transition-all cursor-pointer ${
                            viewerIsFollowing
                              ? isHovered
                                ? 'border border-red-200 bg-red-50 text-red-600'
                                : 'border border-[#cfd9de] text-[#0f1419] bg-white'
                              : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
                          } ${isActionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {viewerIsFollowing ? (isHovered ? 'Unfollow' : 'Following') : 'Follow'}
                        </button>
                      ) : (
                        <div className="text-xs text-[#536471] font-medium px-3 py-1 bg-[#eff3f4] rounded-full">
                          You
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Identity Details (Name, Verified, Handle, Relationship Badge, Hashtags) */}
                  <div className="px-4 flex flex-col gap-1">
                    <div>
                      <Link
                        href={`/${p.username}`}
                        className="group/name inline-flex items-center gap-1.5"
                      >
                        <h2 className="font-extrabold text-base text-[#0f1419] group-hover/name:underline leading-tight">
                          {p.name || p.username}
                        </h2>
                        {isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white shrink-0" />
                        )}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${p.username}`}
                        className="text-xs text-[#536471] hover:underline"
                      >
                        @{p.username}
                      </Link>
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

                    {/* Hashtags display replacing Bio */}
                    <div className="mt-2 text-[13px] leading-relaxed text-[#0f1419] font-normal break-words">
                      {tags.length > 0 ? (
                        <p className="inline">
                          {tags.slice(0, MAX_TAGS_ON_CARD).map((tag, idx) => {
                            const isLast =
                              idx === Math.min(tags.length, MAX_TAGS_ON_CARD) - 1 &&
                              tags.length <= MAX_TAGS_ON_CARD;
                            const cleanTag = tag.replace(/^#+/, '');
                            const tagKey = `${p.id}-${tag}-${idx}`;
                            const isCopied = copiedTagKey === tagKey;

                            return (
                              <React.Fragment key={tagKey}>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyTag(tag, tagKey);
                                  }}
                                  title="Click to copy hashtag"
                                  className="inline-flex items-center cursor-pointer group/tag relative hover:text-[#1d9bf0] transition-colors"
                                >
                                  <span className="text-[#1d9bf0] font-bold select-none mr-0.5">#</span>
                                  <span className="group-hover/tag:underline underline-offset-2 font-medium">
                                    {cleanTag}
                                  </span>
                                  {isCopied && (
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0f1419] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none z-20 animate-in fade-in duration-100">
                                      Copied!
                                    </span>
                                  )}
                                </span>
                                {!isLast && <span className="text-[#536471] mr-1.5 select-none">,</span>}
                              </React.Fragment>
                            );
                          })}
                          {tags.length > MAX_TAGS_ON_CARD && (
                            <Link
                              href={`/${p.username}/hashtags`}
                              className="text-[12px] text-[#1d9bf0] hover:underline font-semibold ml-1 inline-block"
                            >
                              +{tags.length - MAX_TAGS_ON_CARD} more
                            </Link>
                          )}
                        </p>
                      ) : (
                        <div className="text-xs text-[#536471]/70 italic flex items-center justify-between">
                          <span>No hashtags written yet</span>
                          {isSelf && (
                            <Link
                              href={`/${p.username}/hashtags`}
                              className="text-[#1d9bf0] hover:underline font-semibold not-italic inline-flex items-center gap-1"
                            >
                              <Hash className="w-3 h-3" />
                              <span>Add hashtags</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
