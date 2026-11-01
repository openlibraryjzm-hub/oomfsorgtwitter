import { redirect } from 'next/navigation';

interface HashtagsRedirectProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return [
    { tag: 'vibecoder' },
    { tag: 'gamer' },
    { tag: 'painter' },
  ];
}

export default async function HashtagsRedirectPage({ params }: HashtagsRedirectProps) {
  const resolved = await params;
  const rawTag = resolved?.tag || '';
  const cleanTag = decodeURIComponent(rawTag).replace(/^#+/, '').trim().toLowerCase();
  redirect(`/hashtag/${encodeURIComponent(cleanTag)}`);
}
