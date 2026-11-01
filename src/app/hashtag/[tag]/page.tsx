import React, { Suspense } from 'react';
import { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import HashtagClientView from '@/components/hashtags/HashtagClientView';

interface HashtagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return [
    { tag: 'vibecoder' },
    { tag: 'gamer' },
    { tag: 'painter' },
    { tag: 'pixelart' },
    { tag: 'nightowl' },
    { tag: 'rustlang' },
    { tag: 'systems' },
    { tag: 'solopreneur' },
  ];
}

export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
  const resolved = await params;
  const rawTag = resolved?.tag || 'hashtag';
  const cleanTag = decodeURIComponent(rawTag).replace(/^#+/, '').trim().toLowerCase();

  return {
    title: `#${cleanTag} on oomfs.org`,
    description: `Discover creators and boards tagged with #${cleanTag} on oomfs.org.`,
    openGraph: {
      title: `#${cleanTag} — oomfs.org`,
      description: `Discover creators and boards tagged with #${cleanTag} on oomfs.org.`,
    },
    twitter: {
      card: 'summary',
      title: `#${cleanTag} — oomfs.org`,
      description: `Discover creators and boards tagged with #${cleanTag} on oomfs.org.`,
    },
  };
}

async function HashtagContent({ params }: { params: Promise<{ tag: string }> }) {
  const resolved = await params;
  const rawTag = resolved?.tag || '';
  const cleanTag = decodeURIComponent(rawTag).replace(/^#+/, '').trim().toLowerCase();

  return <HashtagClientView tag={cleanTag} />;
}

export default function HashtagPage({ params }: HashtagPageProps) {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-white">
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] px-4 py-3">
              <div className="h-5 w-24 bg-[#eff3f4] rounded animate-pulse" />
            </header>
            <div className="p-8 text-center text-sm text-[#536471] animate-pulse">
              Loading hashtag...
            </div>
          </div>
        }
      >
        <HashtagContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
