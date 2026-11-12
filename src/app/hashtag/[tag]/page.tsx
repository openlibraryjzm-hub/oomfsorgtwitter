import { redirect } from 'next/navigation';

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

export default async function HashtagPage({ params }: HashtagPageProps) {
  redirect('/');
}
