import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProfileView from '@/components/profile/ProfileView';
import { resolveUserProfile } from '@/lib/resolveUser';

interface UserPresetsPageProps {
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

async function PresetsPageContent({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username;
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';

  const user = await resolveUserProfile(username);

  return <ProfileView user={user} initialTab="boards" />;
}

export default function UserPresetsPage({ params }: UserPresetsPageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading presets...</div>}>
        <PresetsPageContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
