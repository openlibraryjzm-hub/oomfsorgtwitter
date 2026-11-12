import { redirect } from 'next/navigation';

interface UserHashtagsPageProps {
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

export default async function UserHashtagsPage({ params }: UserHashtagsPageProps) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username;
  const username = rawUsername ? rawUsername.toLowerCase() : 'amberlyn';

  redirect(`/${username}`);
}
