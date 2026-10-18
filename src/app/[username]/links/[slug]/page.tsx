import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProfileView from '@/components/profile/ProfileView';
import { resolveUserProfile } from '@/lib/resolveUser';

interface UserLinkSlugPageProps {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateStaticParams() {
  return [
    { username: 'amberlyn', slug: 'work' },
    { username: 'amberlyn', slug: 'writing' },
    { username: 'amberlyn', slug: 'sound' },
    { username: 'amberlyn', slug: 'code' },
  ];
}

async function LinkSlugPageContent({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username;
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';
  const slug = resolvedParams?.slug ? resolvedParams.slug.toLowerCase() : undefined;

  const user = await resolveUserProfile(username);

  return <ProfileView user={user} initialTab="links" initialLinkPageSlug={slug} />;
}

export default function UserLinkSlugPage({ params }: UserLinkSlugPageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading link page...</div>}>
        <LinkSlugPageContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
