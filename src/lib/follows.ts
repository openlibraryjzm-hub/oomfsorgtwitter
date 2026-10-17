import { createClient } from '@/lib/supabase/client';

export interface ProfileFollowStats {
  followersCount: number;
  followingCount: number;
  oomfsCount: number;
  isFollowing: boolean;
  isMutual: boolean;
  followsYou: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Fetch followers count, following count, mutual OOMFs count,
 * and whether the viewer follows the target profile (and mutual status).
 *
 * Tries the high-performance PostgreSQL RPC function first, then gracefully
 * falls back to direct Supabase table queries if the RPC is not installed.
 */
export async function getProfileFollowStats(
  targetUserId: string,
  viewerUserId?: string | null
): Promise<ProfileFollowStats> {
  const defaultStats: ProfileFollowStats = {
    followersCount: 0,
    followingCount: 0,
    oomfsCount: 0,
    isFollowing: false,
    isMutual: false,
    followsYou: false,
  };

  if (!isValidUuid(targetUserId)) {
    return defaultStats;
  }

  const supabase = createClient();

  // 1. Attempt PostgreSQL RPC (Approach B)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_profile_follow_stats',
      {
        target_user_id: targetUserId,
        viewer_user_id: isValidUuid(viewerUserId) ? viewerUserId : null,
      }
    );

    if (!rpcError && rpcData) {
      const isFg = Boolean(rpcData.is_following);
      const isM = Boolean(rpcData.is_mutual);
      let followsYou = rpcData.follows_you !== undefined ? Boolean(rpcData.follows_you) : isM;

      // If not mutual, check if target follows viewer
      if (!isM && !followsYou && viewerUserId && isValidUuid(viewerUserId)) {
        const { data: rev } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', targetUserId)
          .eq('following_id', viewerUserId)
          .maybeSingle();
        followsYou = Boolean(rev);
      }

      return {
        followersCount: Number(rpcData.followers_count) || 0,
        followingCount: Number(rpcData.following_count) || 0,
        oomfsCount: Number(rpcData.oomfs_count) || 0,
        isFollowing: isFg,
        isMutual: isM,
        followsYou,
      };
    }
  } catch (err) {
    // Graceful fallback to client queries if RPC is unavailable
    console.debug('RPC get_profile_follow_stats unavailable, using direct query fallback', err);
  }

  // 2. Direct Query Fallback
  try {
    // Followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    // Following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    // Mutuals (OOMFS) count
    const { data: followingRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', targetUserId);

    let oomfsCount = 0;
    if (followingRows && followingRows.length > 0) {
      const followingIds = followingRows.map((r: { following_id: string }) => r.following_id);
      const { count: mutualCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)
        .in('follower_id', followingIds);

      oomfsCount = mutualCount || 0;
    }

    // Viewer status
    let isFollowing = false;
    let isMutual = false;
    let followsYou = false;

    if (viewerUserId && isValidUuid(viewerUserId) && viewerUserId !== targetUserId) {
      const [followRes, reverseRes] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', viewerUserId)
          .eq('following_id', targetUserId)
          .maybeSingle(),
        supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', targetUserId)
          .eq('following_id', viewerUserId)
          .maybeSingle(),
      ]);

      isFollowing = Boolean(followRes.data);
      followsYou = Boolean(reverseRes.data);
      isMutual = isFollowing && followsYou;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      oomfsCount,
      isFollowing,
      isMutual,
      followsYou,
    };
  } catch (err) {
    console.error('Error in getProfileFollowStats fallback:', err);
    return defaultStats;
  }
}

/**
 * Follow or unfollow a target profile
 */
export async function toggleFollow(
  targetUserId: string,
  currentUserId: string,
  isCurrentlyFollowing: boolean
): Promise<{ success: boolean; error?: any }> {
  if (!isValidUuid(targetUserId) || !isValidUuid(currentUserId)) {
    return { success: false, error: 'Invalid user UUID' };
  }

  if (targetUserId === currentUserId) {
    return { success: false, error: 'Cannot follow yourself' };
  }

  const supabase = createClient();

  if (isCurrentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error };
    }
    return { success: true };
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      });

    if (error) {
      console.error('Error following user:', error);
      return { success: false, error };
    }
    return { success: true };
  }
}

/**
 * Fetch mutual OOMFs for a given user (users where A follows B AND B follows A)
 */
export async function getMutualOomfs(userId: string) {
  if (!isValidUuid(userId)) return [];

  const supabase = createClient();

  // Try RPC first
  try {
    const { data: rpcProfiles, error } = await supabase.rpc('get_mutual_oomfs', {
      target_user_id: userId,
    });
    if (!error && rpcProfiles) {
      return rpcProfiles;
    }
  } catch (err) {
    console.debug('RPC get_mutual_oomfs not available, using fallback:', err);
  }

  // Fallback: Two-step query
  try {
    const { data: followingRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (!followingRows || followingRows.length === 0) return [];
    const followingIds = followingRows.map((r: { following_id: string }) => r.following_id);

    const { data: mutualRows } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId)
      .in('follower_id', followingIds);

    if (!mutualRows || mutualRows.length === 0) return [];
    const mutualIds = mutualRows.map((r: { follower_id: string }) => r.follower_id);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', mutualIds);

    if (error) {
      console.error('Error fetching mutual profiles:', error);
      return [];
    }

    return profiles || [];
  } catch (err) {
    console.error('Error in getMutualOomfs fallback:', err);
    return [];
  }
}

/**
 * Fetch profiles that target user is following
 */
export async function getUserFollowing(userId: string) {
  if (!isValidUuid(userId)) return [];

  const supabase = createClient();
  try {
    const { data: fgRows, error: fgError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (fgError || !fgRows || fgRows.length === 0) return [];

    const followingIds = fgRows.map((r: { following_id: string }) => r.following_id);

    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', followingIds);

    if (pError || !profiles) return [];
    return profiles;
  } catch (err) {
    console.error('Error in getUserFollowing:', err);
    return [];
  }
}

/**
 * Fetch profiles that follow target user
 */
export async function getUserFollowers(userId: string) {
  if (!isValidUuid(userId)) return [];

  const supabase = createClient();
  try {
    const { data: fRows, error: fError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (fError || !fRows || fRows.length === 0) return [];

    const followerIds = fRows.map((r: { follower_id: string }) => r.follower_id);

    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', followerIds);

    if (pError || !profiles) return [];
    return profiles;
  } catch (err) {
    console.error('Error in getUserFollowers:', err);
    return [];
  }
}

/**
 * Fetch viewer's follow and follower sets for relationship tags ("Follows you", "OOMF", "Following")
 */
export async function getViewerRelationships(viewerUserId: string | null | undefined): Promise<{
  followingIds: Set<string>;
  followerIds: Set<string>;
}> {
  const result = {
    followingIds: new Set<string>(),
    followerIds: new Set<string>(),
  };

  if (!isValidUuid(viewerUserId)) return result;

  const supabase = createClient();
  try {
    const [fgRes, fRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', viewerUserId),
      supabase.from('follows').select('follower_id').eq('following_id', viewerUserId),
    ]);

    if (fgRes.data) {
      fgRes.data.forEach((r: { following_id: string }) => result.followingIds.add(r.following_id));
    }
    if (fRes.data) {
      fRes.data.forEach((r: { follower_id: string }) => result.followerIds.add(r.follower_id));
    }
  } catch (err) {
    console.error('Error fetching viewer relationships:', err);
  }

  return result;
}

