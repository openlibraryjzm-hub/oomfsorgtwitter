import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UserNetworkView from '@/components/network/UserNetworkView';
import { resolveUserProfile } from '@/lib/resolveUser';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function FollowingContent({ params }: PageProps) {
  const resolved = await params;
  const user = await resolveUserProfile(resolved.username);

  return <UserNetworkView targetUser={user} initialTab="following" />;
}

export default function UserFollowingPage({ params }: PageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading following...</div>}>
        <FollowingContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
