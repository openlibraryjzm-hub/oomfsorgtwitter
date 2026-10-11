export interface BioLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  clicks?: number;
  icon?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  banner: string;
  bio: string;
  location?: string;
  website?: string;
  joined: string;
  followingCount: number;
  followersCount: number;
  oomfsCount: number;
  isVerified?: boolean;
  isOomf?: boolean; // Is mutual follower
  isFollowing?: boolean;
  links: BioLink[];
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'link_card' | 'oomf_spotlight' | 'prompt_card' | 'media_card' | 'vouch_card';
  text: string;
  linkData?: {
    title: string;
    url: string;
    description?: string;
    image?: string;
    buttonText?: string;
  };
  spotlightUser?: User;
  promptData?: {
    question: string;
    answer: string;
  };
  mediaData?: {
    platform: 'spotify' | 'youtube' | 'github' | 'custom';
    title: string;
    subtitle?: string;
    url: string;
    previewUrl?: string;
  };
  vouchData?: {
    vouchedBy: User;
    endorsement: string;
    relationship: string;
  };
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount: string;
  isLiked?: boolean;
  isReposted?: boolean;
}

export const MOCK_USERS: Record<string, User> = {
  amberlyn: {
    id: 'usr_1',
    username: 'amberlyn',
    name: 'amber lyn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    bio: 'digital designer & builder ✨ putting oomfs.org in my bio. talk to me about UI, coffee & ambient music.',
    location: 'Auckland, NZ',
    website: 'oomfs.org/amberlyn',
    joined: 'October 2022',
    followingCount: 342,
    followersCount: 2840,
    oomfsCount: 128,
    isVerified: true,
    isOomf: true,
    isFollowing: true,
    links: [
      {
        id: 'l1',
        title: '🎨 My Design Portfolio (2026)',
        url: 'https://amberlyn.design',
        category: 'Work',
        clicks: 1420
      },
      {
        id: 'l2',
        title: '📝 Substack: Design Systems & OOMFs',
        url: 'https://amberlyn.substack.com',
        category: 'Writing',
        clicks: 890
      },
      {
        id: 'l3',
        title: '🎧 Spotify Playlist: Late Night Coding',
        url: 'https://spotify.com',
        category: 'Music',
        clicks: 2310
      }
    ]
  },
  dev_kyle: {
    id: 'usr_2',
    username: 'dev_kyle',
    name: 'Kyle Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    bio: 'Full-stack typescript dev. Building cool web apps. 1/2 of the oomfs crew.',
    location: 'San Francisco, CA',
    website: 'oomfs.org/dev_kyle',
    joined: 'January 2023',
    followingCount: 512,
    followersCount: 1490,
    oomfsCount: 128,
    isVerified: true,
    isOomf: true,
    isFollowing: true,
    links: [
      {
        id: 'l4',
        title: '💻 GitHub Repositories',
        url: 'https://github.com',
        clicks: 940
      },
      {
        id: 'l4b',
        title: '☕ Buy me a Coffee',
        url: 'https://buymeacoffee.com',
        clicks: 310
      }
    ]
  },
  sora_arts: {
    id: 'usr_3',
    username: 'sora_arts',
    name: 'Sora 🎨',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    bio: '3D Artist & Motion Designer. Commissions OPEN. Link in bio below ⬇️',
    location: 'Tokyo, Japan',
    website: 'oomfs.org/sora_arts',
    joined: 'March 2021',
    followingCount: 189,
    followersCount: 9420,
    oomfsCount: 94,
    isVerified: false,
    isOomf: true,
    isFollowing: true,
    links: [
      {
        id: 'l5',
        title: '🖼️ ArtStation 3D Gallery',
        url: 'https://artstation.com',
        clicks: 3100
      }
    ]
  },
  celeste: {
    id: 'usr_5',
    username: 'celeste',
    name: 'Celeste 🌙',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    bio: 'indie founder & podcaster. proud oomf.',
    location: 'London, UK',
    website: 'oomfs.org/celeste',
    joined: 'June 2023',
    followingCount: 230,
    followersCount: 1120,
    oomfsCount: 88,
    isVerified: true,
    isOomf: true,
    isFollowing: true,
    links: [
      {
        id: 'l6',
        title: '🎙️ The Indie Hustle Podcast',
        url: 'https://podcast.apple.com',
        clicks: 1200
      }
    ]
  },
  jack: {
    id: 'usr_4',
    username: 'jack',
    name: 'jack',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bio: 'just setting up my oomfs.org',
    joined: 'March 2006',
    followingCount: 420,
    followersCount: 6500000,
    oomfsCount: 12,
    isVerified: true,
    isOomf: false,
    isFollowing: false,
    links: []
  }
};

export const CURRENT_USER: User = MOCK_USERS.amberlyn;

export const MOCK_OOMFS: User[] = [
  MOCK_USERS.dev_kyle,
  MOCK_USERS.sora_arts,
  MOCK_USERS.celeste,
  {
    id: 'usr_6',
    username: 'marcus_v',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    bio: 'Product engineer. Rebuilding link-in-bio for the X ecosystem.',
    joined: 'February 2024',
    followingCount: 310,
    followersCount: 950,
    oomfsCount: 75,
    isVerified: false,
    isOomf: true,
    isFollowing: true,
    links: []
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '12m',
    type: 'link_card',
    text: 'Just updated my bio link portfolio! Added all recent client case studies and my new interactive UI library.',
    linkData: {
      title: 'Amber Lyn - 2026 Design Portfolio & Case Studies',
      url: 'https://amberlyn.design',
      description: 'Explore web apps, design systems, and product UI explorations created by Amber.',
      buttonText: 'Visit Portfolio ↗'
    },
    likesCount: 84,
    repostsCount: 12,
    repliesCount: 9,
    viewsCount: '1.4K',
    isLiked: true
  },
  {
    id: 'post_vouch_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '45m',
    type: 'vouch_card',
    text: 'So honored to get this shoutout from one of my favorite builders:',
    vouchData: {
      vouchedBy: MOCK_USERS.dev_kyle,
      endorsement: 'Amber is hands-down the sharpest product designer on this app. Whenever we collaborate, UI quality jumps 10x.',
      relationship: 'Mutual OOMF since 2023'
    },
    likesCount: 96,
    repostsCount: 18,
    repliesCount: 7,
    viewsCount: '2.1K',
    isLiked: false
  },
  {
    id: 'post_media_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '2h',
    type: 'media_card',
    text: 'What I listen to on repeat while shipping new features:',
    mediaData: {
      platform: 'spotify',
      title: 'Late Night Flow & Ambient Synths',
      subtitle: 'Curated by Amber · 42 songs · 2h 45m',
      url: 'https://open.spotify.com'
    },
    likesCount: 67,
    repostsCount: 8,
    repliesCount: 11,
    viewsCount: '1.8K',
    isLiked: true
  },
  {
    id: 'post_3',
    author: MOCK_USERS.amberlyn,
    createdAt: '3h',
    type: 'prompt_card',
    text: 'Weekly OOMF Q&A prompt! Drop your thoughts below 👇',
    promptData: {
      question: 'What is your favorite feature on oomfs.org so far?',
      answer: 'The mutual follower badge & having a Twitter 1:1 profile that doubles as a link-in-bio page!'
    },
    likesCount: 56,
    repostsCount: 6,
    repliesCount: 23,
    viewsCount: '980',
    isLiked: false
  },
  {
    id: 'post_kyle_1',
    author: MOCK_USERS.dev_kyle,
    createdAt: '1h',
    type: 'oomf_spotlight',
    text: 'Shoutout to my top oomf @sora_arts for helping with the 3D renders on our latest web project! If you aren’t following Sora yet, fix that ASAP.',
    spotlightUser: MOCK_USERS.sora_arts,
    likesCount: 142,
    repostsCount: 28,
    repliesCount: 14,
    viewsCount: '3.8K',
    isLiked: false
  },
  {
    id: 'post_sora_1',
    author: MOCK_USERS.sora_arts,
    createdAt: '5h',
    type: 'standard',
    text: 'Putting oomfs.org/sora_arts in my X bio is the best thing I did this week. The 1:1 Twitter UI for profile links is so clean 😭🙌',
    likesCount: 310,
    repostsCount: 45,
    repliesCount: 18,
    viewsCount: '8.2K',
    isLiked: true,
    isReposted: true
  }
];
