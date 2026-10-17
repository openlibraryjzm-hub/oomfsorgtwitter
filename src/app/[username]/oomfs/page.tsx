import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import UserNetworkView from '@/components/network/UserNetworkView';
import { resolveUserProfile } from '@/lib/resolveUser';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function OomfsContent({ params }: PageProps) {
  const resolved = await params;
  const user = await resolveUserProfile(resolved.username);

  return <UserNetworkView targetUser={user} initialTab="oomfs" />;
}

export default function UserOomfsPage({ params }: PageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading mutual OOMFs...</div>}>
        <OomfsContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
