'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  CheckCircle2, 
  Check, 
  Users, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Award, 
  Music, 
  Plus, 
  X,
  LogIn
} from 'lucide-react';
import { User, MOCK_OOMFS, MOCK_POSTS, CURRENT_USER, Post } from '@/lib/mockData';
import PostCard from '@/components/feed/PostCard';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user: initialUser }: ProfileViewProps) {
  const { user: authUser, profile: authProfile, signInWithTwitter } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'posts' | 'oomfs' | 'links' | 'vouches'>('posts');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userProfile, setUserProfile] = useState<User>(initialUser);

  // Posts / Blocks state
  const [posts, setPosts] = useState<Post[]>(() => {
    const defaultPosts = MOCK_POSTS.filter(p => p.author.username === initialUser.username);
    return defaultPosts.length > 0 ? defaultPosts : [
      {
        id: `post_sample_${initialUser.username}`,
        author: initialUser,
        createdAt: '10m',
        type: 'link_card',
        text: `Welcome to my oomfs.org profile! Connect with me below:`,
        linkData: {
          title: `${initialUser.name} - Official Link`,
          url: `https://x.com/${initialUser.username}`,
          buttonText: 'Connect on X ↗'
        },
        likesCount: 12,
        repostsCount: 2,
        repliesCount: 1,
        viewsCount: '450'
      }
    ];
  });

  // Composer Drawer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [blockType, setBlockType] = useState<'link_card' | 'vouch_card' | 'media_card' | 'oomf_spotlight' | 'prompt_card' | 'standard'>('link_card');

  // Input states
  const [postText, setPostText] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [vouchText, setVouchText] = useState('');
  const [selectedOomfUsername, setSelectedOomfUsername] = useState(MOCK_OOMFS[0]?.username || 'dev_kyle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(initialUser.name);
  const [editBio, setEditBio] = useState(initialUser.bio);
  const [editLocation, setEditLocation] = useState(initialUser.location || '');
  const [editWebsite, setEditWebsite] = useState(initialUser.website || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Check if viewing own profile
  const isSelf = (authProfile && authProfile.username.toLowerCase() === initialUser.username.toLowerCase()) || 
                 (authUser && authProfile?.username === initialUser.username);

  // Fetch real Supabase data if this profile exists in DB
  useEffect(() => {
    const loadSupabaseProfileAndBlocks = async () => {
      try {
        const { data: dbUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', initialUser.username.toLowerCase())
          .single();

        if (dbUser) {
          setUserProfile(prev => ({
            ...prev,
            id: dbUser.id,
            name: dbUser.name ?? prev.name,
            avatar: dbUser.avatar_url ?? prev.avatar,
            banner: dbUser.banner_url ?? prev.banner,
            bio: dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : prev.bio,
            location: dbUser.location ?? prev.location,
            website: dbUser.website ?? prev.website,
          }));
          setEditName(dbUser.name ?? initialUser.name);
          setEditBio(dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : initialUser.bio);
          setEditLocation(dbUser.location ?? initialUser.location ?? '');
          setEditWebsite(dbUser.website ?? initialUser.website ?? '');

          // Fetch DB blocks
          const { data: dbBlocks, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', dbUser.id)
            .order('created_at', { ascending: false });

          if (!error && dbBlocks && dbBlocks.length > 0) {
            const mappedPosts: Post[] = dbBlocks.map((b: any) => ({
              id: b.id,
              author: {
                ...initialUser,
                name: dbUser.name || initialUser.name,
                avatar: dbUser.avatar_url || initialUser.avatar,
              },
              createdAt: new Date(b.created_at).toLocaleDateString(),
              type: b.type,
              text: b.content?.text || '',
              linkData: b.content?.linkData,
              spotlightUser: b.content?.spotlightUser,
              promptData: b.content?.promptData,
              mediaData: b.content?.mediaData,
              vouchData: b.content?.vouchData,
              likesCount: b.content?.likesCount || 0,
              repostsCount: b.content?.repostsCount || 0,
              repliesCount: 0,
              viewsCount: '1',
            }));
            setPosts(mappedPosts);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      }
    };

    loadSupabaseProfileAndBlocks();
  }, [initialUser.username]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://oomfs.org/${userProfile.username}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    setUserProfile(prev => ({
      ...prev,
      name: editName,
      bio: editBio,
      location: editLocation,
      website: editWebsite,
    }));

    if (authUser?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: editName,
            bio: editBio,
            location: editLocation,
            website: editWebsite,
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('Error saving profile to Supabase:', error);
          alert('Could not update profile in Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Error saving profile to Supabase:', err);
      }
    }

    setIsSavingProfile(false);
    setEditModalOpen(false);
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedOomf = MOCK_OOMFS.find(o => o.username === selectedOomfUsername) || MOCK_OOMFS[0];

    const blockContent: any = {
      text: postText.trim() || (blockType === 'vouch_card' ? 'Mutual vouch:' : ''),
      ...(blockType === 'link_card' ? {
        linkData: {
          title: linkTitle || 'Featured Project Link',
          url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl || 'oomfs.org'}`,
          buttonText: 'Open Link ↗'
        }
      } : {}),
      ...(blockType === 'vouch_card' ? {
        vouchData: {
          vouchedBy: selectedOomf,
          endorsement: vouchText || 'Incredible builder and mutual friend.',
          relationship: `Mutual OOMF`
        }
      } : {}),
      ...(blockType === 'media_card' ? {
        mediaData: {
          platform: 'spotify',
          title: mediaTitle || 'Favorite Playlist / Track',
          subtitle: 'Featured Audio',
          url: 'https://open.spotify.com'
        }
      } : {}),
      ...(blockType === 'oomf_spotlight' ? {
        spotlightUser: selectedOomf
      } : {}),
      ...(blockType === 'prompt_card' ? {
        promptData: {
          question: 'What is your current hyperfocus?',
          answer: postText || 'Building cool apps with my oomfs!'
        }
      } : {})
    };

    let newPostId = `post_${Date.now()}`;

    // If authenticated in Supabase, persist to `blocks` table!
    if (authUser?.id) {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .insert({
            user_id: authUser.id,
            type: blockType,
            content: blockContent
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          newPostId = data.id;
        }
      } catch (err) {
        console.error('Error inserting into Supabase:', err);
      }
    }

    const newPost: Post = {
      id: newPostId,
      author: userProfile,
      createdAt: 'Just now',
      type: blockType,
      text: blockContent.text,
      linkData: blockContent.linkData,
      vouchData: blockContent.vouchData,
      mediaData: blockContent.mediaData,
      spotlightUser: blockContent.spotlightUser,
      promptData: blockContent.promptData,
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1'
    };

    setPosts([newPost, ...posts]);
    setPostText('');
    setLinkTitle('');
    setLinkUrl('');
    setMediaTitle('');
    setVouchText('');
    setComposerOpen(false);
    setIsSubmitting(false);
  };

  const handleDeletePost = async (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
    if (authUser?.id) {
      try {
        await supabase.from('blocks').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting block from Supabase:', err);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-between px-4 py-2 border-b border-[#eff3f4]">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="p-2 hover:bg-[#f7f9f9] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0f1419]" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg text-[#0f1419] leading-tight flex items-center gap-1">
              {userProfile.name}
              {userProfile.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white" />
              )}
            </h1>
            <span className="text-xs text-[#536471]">
              {posts.length} Content Blocks
            </span>
          </div>
        </div>

        {/* Action Trigger */}
        {isSelf || !authUser ? (
          <button
            onClick={() => setComposerOpen(!composerOpen)}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        ) : null}
      </header>

      {/* Banner */}
      <div className="h-44 sm:h-52 bg-[#eff3f4] relative overflow-hidden">
        {userProfile.banner ? (
          <img
            src={userProfile.banner}
            alt={`${userProfile.name}'s banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100" />
        )}
      </div>

      {/* Avatar & Action Button Row */}
      <div className="px-4 relative flex justify-between items-end pb-3">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20">
          <img
            src={formatTwitterAvatar(userProfile.avatar)}
            alt={userProfile.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white object-cover bg-white shadow-md"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-2">
          {/* Share / Copy Bio Link */}
          <button
            onClick={handleCopyLink}
            className="border border-[#eff3f4] hover:bg-[#f7f9f9] text-[#0f1419] font-bold text-sm px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy oomfs.org link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#536471]" />
                <span className="text-xs">oomfs.org/{userProfile.username}</span>
              </>
            )}
          </button>

          {isSelf ? (
            <button 
              onClick={() => setEditModalOpen(true)}
              className="border border-[#eff3f4] hover:bg-[#f7f9f9] text-[#0f1419] font-bold text-sm px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              Edit profile
            </button>
          ) : !authUser ? (
            <button
              onClick={() => signInWithTwitter()}
              className="bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-sm px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect X</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`font-bold text-sm px-5 py-2 rounded-full transition-colors cursor-pointer ${
                isFollowing
                  ? 'border border-[#eff3f4] text-[#0f1419] hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                  : 'bg-[#0f1419] hover:bg-[#272c30] text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* User Bio Details Section */}
      <div className="px-4 flex flex-col gap-3">
        <div>
          <h2 className="font-extrabold text-xl text-[#0f1419] leading-tight flex items-center gap-1.5">
            {userProfile.name}
            {userProfile.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-[#1d9bf0] fill-[#1d9bf0] text-white" />
            )}
          </h2>
          <span className="text-sm text-[#536471]">
            @{userProfile.username}
          </span>
        </div>

        {/* Bio Text */}
        {userProfile.bio && (
          <p className="text-sm text-[#0f1419] leading-normal whitespace-pre-line">
            {userProfile.bio}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#536471] pt-1">
          {userProfile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{userProfile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <LinkIcon className="w-4 h-4 text-[#1d9bf0]" />
            <a 
              href={`https://${userProfile.website || `oomfs.org/${userProfile.username}`}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-[#1d9bf0] hover:underline font-medium"
            >
              {userProfile.website || `oomfs.org/${userProfile.username}`}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {userProfile.joined}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{userProfile.followingCount}</span>
            <span className="text-[#536471]">Following</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#0f1419]">{userProfile.followersCount.toLocaleString()}</span>
            <span className="text-[#536471]">Followers</span>
          </div>

          {/* OOMFS SPECIAL STAT HIGHLIGHT */}
          <button 
            onClick={() => setActiveTab('oomfs')}
            className="bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 px-2.5 py-1 rounded-full text-[#1d9bf0] font-bold flex items-center gap-1.5 transition-colors border border-[#1d9bf0]/20 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{userProfile.oomfsCount} OOMFs (Mutuals)</span>
          </button>
        </div>
      </div>

      {/* BLOCK COMPOSER (PERSISTS TO SUPABASE WHEN LOGGED IN) */}
      {composerOpen && (
        <div className="mx-4 mt-4 p-4 border border-[#1d9bf0]/30 bg-blue-50/20 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d9bf0] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{authUser ? 'Add Block to Supabase Profile' : 'Add Block Sandbox'}</span>
            </div>
            <button
              onClick={() => setComposerOpen(false)}
              className="p-1 text-[#536471] hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Block Type Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'link_card', label: '🔗 Bio Link Card' },
              { id: 'vouch_card', label: '🏆 OOMF Vouch' },
              { id: 'media_card', label: '🎵 Spotify / Media' },
              { id: 'oomf_spotlight', label: '⭐ OOMF Spotlight' },
              { id: 'prompt_card', label: '❓ Q&A Prompt' },
              { id: 'standard', label: '📝 Standard Post' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBlockType(tab.id as any)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                  blockType === tab.id 
                    ? 'bg-[#0f1419] text-white' 
                    : 'bg-white border border-[#eff3f4] text-[#536471] hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleAddBlock} className="flex flex-col gap-2 pt-2">
            {blockType === 'link_card' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Link Title (e.g. My Newsletter / GitHub / Portfolio)"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="URL (e.g. https://portfolio.site)"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
                  required
                />
              </div>
            )}

            {blockType === 'vouch_card' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#536471] font-medium">Select Mutual OOMF Endorsing You:</label>
                <select
                  value={selectedOomfUsername}
                  onChange={e => setSelectedOomfUsername(e.target.value)}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
                >
                  {MOCK_OOMFS.map(o => (
                    <option key={o.username} value={o.username}>
                      {o.name} (@{o.username})
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="What is their testimonial/vouch for you?"
                  value={vouchText}
                  onChange={e => setVouchText(e.target.value)}
                  rows={2}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none resize-none"
                />
              </div>
            )}

            {blockType === 'media_card' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Media / Audio Title (e.g. Late Night Synthwave Playlist)"
                  value={mediaTitle}
                  onChange={e => setMediaTitle(e.target.value)}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
                  required
                />
              </div>
            )}

            {blockType === 'oomf_spotlight' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#536471] font-medium">Choose OOMF to spotlight:</label>
                <select
                  value={selectedOomfUsername}
                  onChange={e => setSelectedOomfUsername(e.target.value)}
                  className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
                >
                  {MOCK_OOMFS.map(o => (
                    <option key={o.username} value={o.username}>
                      {o.name} (@{o.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              placeholder="Caption or post note (optional)..."
              value={postText}
              onChange={e => setPostText(e.target.value)}
              rows={2}
              className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="px-3 py-1.5 text-xs text-[#536471] hover:bg-gray-100 rounded-full font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Add to Profile Feed'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-[#eff3f4] mt-4 font-medium text-sm text-[#536471]">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'posts' ? 'text-[#0f1419]' : ''
          }`}
        >
          Blocks & Posts ({posts.length})
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('oomfs')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer ${
            activeTab === 'oomfs' ? 'text-[#1d9bf0]' : ''
          }`}
        >
          <Users className="w-4 h-4 text-[#1d9bf0]" />
          OOMFS ({MOCK_OOMFS.length})
          {activeTab === 'oomfs' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'links' ? 'text-[#0f1419]' : ''
          }`}
        >
          Bio Links ({userProfile.links.length})
          {activeTab === 'links' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('vouches')}
          className={`flex-1 py-3.5 text-center relative hover:bg-[#f7f9f9] transition-colors font-bold cursor-pointer ${
            activeTab === 'vouches' ? 'text-[#0f1419]' : ''
          }`}
        >
          Vouches & Media
          {activeTab === 'vouches' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1">
        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                No blocks yet. Click <b>"Add Block"</b> above to add your first bio card!
              </div>
            )}
          </div>
        )}

        {/* OOMFS TAB */}
        {activeTab === 'oomfs' && (
          <div className="flex flex-col">
            <div className="p-4 bg-[#f7f9f9] border-b border-[#eff3f4]">
              <h3 className="font-bold text-[#0f1419] text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1d9bf0]" />
                Mutual Followers (OOMFs)
              </h3>
              <p className="text-xs text-[#536471] mt-0.5">
                Click any profile to experience profile hopping across mutuals:
              </p>
            </div>

            {MOCK_OOMFS.map((oomf) => (
              <Link
                key={oomf.id}
                href={`/${oomf.username}`}
                className="flex items-center justify-between p-4 border-b border-[#eff3f4] hover:bg-[#f7f9f9]/70 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={oomf.avatar}
                    alt={oomf.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#0f1419] group-hover:underline flex items-center gap-1">
                      {oomf.name}
                      {oomf.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white" />
                      )}
                    </span>
                    <span className="text-xs text-[#536471]">
                      @{oomf.username}
                    </span>
                    <p className="text-xs text-[#536471] line-clamp-1 mt-1">
                      {oomf.bio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1d9bf0]/20">
                    View OOMF Profile →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="p-3 bg-[#f7f9f9] rounded-xl border border-[#eff3f4]">
              <span className="text-xs font-bold text-[#1d9bf0] uppercase tracking-wider block mb-1">
                Linktree Alternative Mode
              </span>
              <p className="text-xs text-[#536471]">
                Visitors from X clicking <b>oomfs.org/{userProfile.username}</b> can tap these curated links directly.
              </p>
            </div>

            {userProfile.links.length > 0 ? (
              userProfile.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border border-[#eff3f4] rounded-2xl bg-white hover:border-[#1d9bf0] hover:shadow-xs transition-all flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[#0f1419] text-base group-hover:text-[#1d9bf0] transition-colors">
                      {link.title}
                    </span>
                    <span className="text-xs text-[#536471] font-mono">
                      {link.url}
                    </span>
                  </div>
                  <div className="bg-[#1d9bf0] text-white text-xs font-bold px-4 py-2 rounded-full group-hover:bg-[#1a8cd8] transition-colors flex items-center gap-1 shrink-0">
                    <span>Visit</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))
            ) : (
              <div className="text-center py-8 text-[#536471] text-sm">
                No bio links listed yet.
              </div>
            )}
          </div>
        )}

        {/* VOUCHES TAB */}
        {activeTab === 'vouches' && (
          <div>
            {posts.filter(p => p.type === 'vouch_card' || p.type === 'media_card').length > 0 ? (
              posts.filter(p => p.type === 'vouch_card' || p.type === 'media_card').map(post => (
                <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
              ))
            ) : (
              <div className="text-center py-12 text-[#536471] text-sm">
                No vouches or media added yet. Use the <b>"Add Block"</b> button above to add an OOMF Vouch or Spotify embed!
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4]">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-[#0f1419] hover:bg-[#f7f9f9] rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-extrabold text-lg text-[#0f1419]">Edit profile</h3>
              </div>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={isSavingProfile}
                className="bg-[#0f1419] hover:bg-[#272c30] disabled:opacity-50 text-white font-bold text-sm px-4 py-1.5 rounded-full cursor-pointer transition-colors"
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Modal Form */}
            <form id="edit-profile-form" onSubmit={handleSaveProfile} className="p-4 flex flex-col gap-4">
              {/* Name */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                  required
                />
              </div>

              {/* Bio */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell your OOMFs about yourself..."
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent resize-none"
                />
              </div>

              {/* Location */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                />
              </div>

              {/* Website */}
              <div className="border border-[#eff3f4] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-3 py-2">
                <label className="text-xs text-[#536471] block font-medium">Website</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  placeholder="e.g. oomfs.org/yourname or your personal link"
                  className="w-full text-sm text-[#0f1419] outline-none pt-0.5 bg-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
