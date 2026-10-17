import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UserNetworkView from '@/components/network/UserNetworkView';
import { resolveUserProfile } from '@/lib/resolveUser';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function FollowersContent({ params }: PageProps) {
  const resolved = await params;
  const user = await resolveUserProfile(resolved.username);

  return <UserNetworkView targetUser={user} initialTab="followers" />;
}

export default function UserFollowersPage({ params }: PageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading followers...</div>}>
        <FollowersContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
