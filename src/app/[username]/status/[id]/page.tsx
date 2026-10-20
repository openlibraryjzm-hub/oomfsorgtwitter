import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ThreadClientView from './ThreadClientView';
import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS, Post } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

interface ThreadPageProps {
  params: Promise<{ username: string; id: string }>;
}

export async function generateStaticParams() {
  return [
    { username: 'amberlyn', id: 'post_carousel_1' },
    { username: 'amberlyn', id: 'post_board_1' },
    { username: 'amberlyn', id: 'post_1' },
    { username: 'dev_kyle', id: 'post_kyle_1' },
    { username: 'sora_arts', id: 'post_sora_1' },
  ];
}

async function ThreadContent({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolved = await params;
  const username = resolved.username.toLowerCase();
  const postId = resolved.id;

  const supabase = createClient();

  // Try finding in Supabase first
  let post: Post | null = null;

  try {
    const { data: dbBlock } = await supabase
      .from('blocks')
      .select('*, profiles(*)')
      .eq('id', postId)
      .single();

    if (dbBlock) {
      const authorProfile = dbBlock.profiles;
      post = {
        id: dbBlock.id,
        author: {
          id: dbBlock.user_id,
          username: authorProfile?.username || username,
          name: authorProfile?.name || username,
          avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          banner: authorProfile?.banner_url || '',
          bio: authorProfile?.bio || '',
          joined: 'October 2026',
          followingCount: 0,
          followersCount: 0,
          oomfsCount: 0,
          links: []
        },
        createdAt: new Date(dbBlock.created_at).toLocaleDateString(),
        type: dbBlock.type,
        text: dbBlock.content?.text || '',
        images: dbBlock.content?.images || [],
        targetUsername: dbBlock.content?.targetUsername || null,
        targetUserId: dbBlock.target_user_id || null,
        carouselData: dbBlock.content?.carouselData,
        boardData: dbBlock.content?.boardData,
        linkData: dbBlock.content?.linkData,
        badgeData: dbBlock.content?.badgeData,
        likesCount: dbBlock.content?.likesCount || 0,
        repostsCount: dbBlock.content?.repostsCount || 0,
        repliesCount: dbBlock.content?.repliesCount || 0,
        viewsCount: '1'
      };
    }
  } catch (e) {
    // Supabase query error, fallback to mock
  }

  // Fallback to mock posts or mock comments
  if (!post) {
    const mockFound = MOCK_POSTS.find((p) => p.id === postId);
    if (mockFound) {
      post = mockFound;
    } else {
      // Check mock comments across accounts
      for (const [targetUser, commentsList] of Object.entries(MOCK_COMMENTS)) {
        const foundComment = commentsList.find((c) => c.id === postId);
        if (foundComment) {
          post = {
            id: foundComment.id,
            author: foundComment.author,
            createdAt: foundComment.createdAt,
            type: 'comment',
            text: foundComment.text,
            images: foundComment.images || [],
            targetUsername: foundComment.targetUsername || targetUser,
            targetUserId: foundComment.targetUserId,
            likesCount: foundComment.likesCount,
            repostsCount: foundComment.repostsCount || 0,
            repliesCount: foundComment.repliesCount || 0,
            viewsCount: '1'
          };
          break;
        }
      }

      if (!post) {
        // Create a fallback post matching the author
        const author = MOCK_USERS[username] || {
          id: `usr_${username}`,
          username,
          name: username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          banner: '',
          bio: '',
          joined: 'October 2026',
          followingCount: 0,
          followersCount: 0,
          oomfsCount: 0,
          links: []
        };

        post = {
          id: postId,
          author,
          createdAt: '1h',
          type: 'standard',
          text: `Post #${postId} on oomfs.org`,
          likesCount: 5,
          repostsCount: 1,
          repliesCount: 0,
          viewsCount: '120'
        };
      }
    }
  }

  return <ThreadClientView initialPost={post} username={username} />;
}

export default function ThreadPage({ params }: ThreadPageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#536471]">Loading thread...</div>}>
        <ThreadContent params={params} />
      </Suspense>
    </MainLayout>
  );
}
