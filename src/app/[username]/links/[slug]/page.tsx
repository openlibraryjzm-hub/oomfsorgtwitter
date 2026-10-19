import { redirect } from 'next/navigation';

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

export default async function UserLinkSlugPage({ params }: UserLinkSlugPageProps) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username;
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';

  redirect(`/${username}/links`);
}
