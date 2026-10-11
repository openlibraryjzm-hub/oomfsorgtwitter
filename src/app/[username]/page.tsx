import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProfileView from '@/components/profile/ProfileView';
import { MOCK_USERS, User } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateStaticParams() {
  return [
    { username: 'amberlyn' },
    { username: 'dev_kyle' },
    { username: 'sora_arts' },
    { username: 'jack' },
  ];
}

async function ProfileContent({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username;
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';

  const supabase = createClient();
  const { data: dbUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  let user: User;

  if (dbUser) {
    user = {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name || dbUser.username,
      avatar: dbUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      banner: dbUser.banner_url || '',
      bio: dbUser.bio ?? '', // Real bio from Supabase!
      location: dbUser.location || '',
      website: dbUser.website || `oomfs.org/${dbUser.username}`,
      joined: dbUser.created_at 
        ? new Date(dbUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'October 2026',
      followingCount: 0,
      followersCount: 0,
      oomfsCount: 0,
      isVerified: false,
      links: []
    };
  } else if (MOCK_USERS[username]) {
    user = MOCK_USERS[username];
  } else {
    user = {
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
      links: []
    };
  }

  return <ProfileView user={user} />;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading profile...</div>}>
        <ProfileContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
