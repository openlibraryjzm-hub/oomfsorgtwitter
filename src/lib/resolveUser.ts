import { createClient } from '@/lib/supabase/client';
import { getProfileFollowStats } from '@/lib/follows';
import { MOCK_USERS, User } from '@/lib/mockData';

export async function resolveUserProfile(rawUsername: string): Promise<User> {
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';
  const supabase = createClient();

  const { data: dbUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (dbUser) {
    const followStats = await getProfileFollowStats(dbUser.id);
    return {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name || dbUser.username,
      avatar: dbUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      banner: dbUser.banner_url || '',
      bio: dbUser.bio ?? '',
      location: dbUser.location || '',
      website: dbUser.website || `oomfs.org/${dbUser.username}`,
      joined: dbUser.created_at
        ? new Date(dbUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'October 2026',
      followingCount: followStats.followingCount,
      followersCount: followStats.followersCount,
      oomfsCount: followStats.oomfsCount,
      isVerified: false,
      links: [],
      hashtags: Array.isArray(dbUser.hashtags) ? dbUser.hashtags : (MOCK_USERS[username]?.hashtags || []),
    };
  }

  if (MOCK_USERS[username]) {
    return MOCK_USERS[username];
  }

  return {
    id: `usr_${username}`,
    username: username,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    banner: '',
    bio: '',
    joined: 'October 2026',
    followingCount: 0,
    followersCount: 0,
    oomfsCount: 0,
    isVerified: false,
    links: [],
    hashtags: [],
  };
}
