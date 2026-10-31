export interface BioLink {
  id: string;
  title: string;
  url: string;
  subtitle?: string;
  category?: string;
  clicks?: number;
  icon?: string;
  image?: string;
  customIcon?: string;
  actionLabel?: string;
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
  hashtags?: string[];
}

export interface BoardImage {
  id: string;
  type?: 'image' | 'user';
  url: string;
  caption?: string;
  username?: string;
  name?: string;
  avatar?: string;
}

export type BoardItem = BoardImage;

export interface ImageAttachment {
  type: 'image';
  url: string;
}

export interface UserAttachment {
  type: 'user';
  username: string;
  name: string;
  avatar: string;
  id?: string;
}

export type PostAttachment = ImageAttachment | UserAttachment;

export interface BadgeData {
  title: string;
  url: string;
  badgeType: 'image' | 'custom' | 'avatar';
  imageUrl?: string;
  label?: string;
  sublabel?: string;
  bgColor?: string;
  textColor?: string;
  icon?: string;
  overlayStyle?: 'scrim' | 'plaque' | 'auto';
  showText?: boolean;
  targetUsername?: string;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'board' | 'comment';
  title?: string;
  images?: string[];
  attachments?: PostAttachment[];
  targetUsername?: string;
  targetUserId?: string;
  text: string;
  boardData?: {
    images: BoardImage[];
  };
  badgeData?: BadgeData;
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount: string;
  isLiked?: boolean;
  isReposted?: boolean;
}

export interface Comment {
  id: string;
  author: User;
  createdAt: string;
  text: string;
  images?: string[];
  targetUsername?: string;
  targetUserId?: string;
  likesCount: number;
  repliesCount?: number;
  repostsCount?: number;
  isLiked?: boolean;
  isReposted?: boolean;
}

export interface ThreadReply {
  id: string;
  author: User;
  createdAt: string;
  text: string;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  isLiked?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  itemIds: string[];
  isPinned?: boolean;
  isExclusive?: boolean; // When true: visible ONLY inside this collection, hidden from main "All" feed
  slug?: string;
  isDefault?: boolean;
  tabType?: 'posts' | 'links';
  userId?: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface Supporter {
  id: string;
  username: string;
  name: string;
  avatar: string;
  amount: number;
  tier: 'hero' | 'patron' | 'supporter' | 'micro';
  message?: string;
  createdAt: string;
  isMutual?: boolean;
  customRadius?: number;
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
        title: 'Design Portfolio',
        url: 'https://amberlyn.design',
        category: 'globe',
      },
      {
        id: 'l2',
        title: 'Discord Community',
        url: 'https://discord.gg/oomfs',
        category: 'discord',
      },
      {
        id: 'l3',
        title: '𝕏 Profile',
        url: 'https://x.com/amberlyn',
        category: 'x',
      },
      {
        id: 'l4_youtube',
        title: 'Design Vlogs',
        url: 'https://youtube.com/@amberlyn',
        category: 'youtube',
      },
      {
        id: 'l5_twitch',
        title: 'Live Streams',
        url: 'https://twitch.tv/amberlyn',
        category: 'twitch',
      },
      {
        id: 'l6_steam',
        title: 'Steam Library',
        url: 'https://steamcommunity.com/id/amberlyn',
        category: 'steam',
      },
      {
        id: 'l7_spotify',
        title: 'Coding Chill Lo-Fi',
        url: 'https://spotify.com',
        category: 'spotify',
      },
      {
        id: 'l8_reddit',
        title: 'Design Discussion',
        url: 'https://reddit.com/r/webdesign',
        category: 'reddit',
      },
      {
        id: 'l9_github',
        title: 'Open Source Repos',
        url: 'https://github.com/amberlyn',
        category: 'github',
      },
      {
        id: 'l10_instagram',
        title: 'Design Shots & BTS',
        url: 'https://instagram.com/amberlyn',
        category: 'instagram',
      },
      {
        id: 'l11_tiktok',
        title: 'Design Tips & Speedpaints',
        url: 'https://tiktok.com/@amberlyn',
        category: 'tiktok',
      },
      {
        id: 'l12_patreon',
        title: 'Exclusive Mentorship Tier',
        url: 'https://patreon.com/amberlyn',
        category: 'patreon',
      },
      {
        id: 'l13_onlyfans',
        title: 'VIP Creator Feed',
        url: 'https://onlyfans.com/amberlyn',
        category: 'onlyfans',
      },
      {
        id: 'l14_substack',
        title: 'Weekly UI/UX Newsletter',
        url: 'https://amberlyn.substack.com',
        category: 'substack',
      },
      {
        id: 'l15_fansly',
        title: 'Behind The Scenes Club',
        url: 'https://fansly.com/amberlyn',
        category: 'fansly',
      },
      {
        id: 'l16_pixiv',
        title: 'Fanbox & Illustrations',
        url: 'https://amberlyn.fanbox.cc',
        category: 'pixiv',
      }
    ],
    hashtags: ['#vibecoder', '#gamer', '#painter', '#pixelart', '#nightowl']
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
        title: 'GitHub Repos',
        url: 'https://github.com',
        category: 'github',
        clicks: 940
      },
      {
        id: 'l4b',
        title: 'Buy Me a Coffee',
        url: 'https://buymeacoffee.com',
        category: 'buymeacoffee',
        clicks: 310
      }
    ],
    hashtags: ['#rustlang', '#systems', '#vibecoder', '#linux', '#mechanicalkeyboards']
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
        title: 'ArtStation',
        url: 'https://artstation.com',
        clicks: 3100
      }
    ],
    hashtags: ['#painter', '#conceptart', '#anime', '#digitalillustration', '#watercolor']
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
        title: 'Indie Podcast',
        url: 'https://podcast.apple.com',
        clicks: 1200
      }
    ],
    hashtags: ['#founder', '#podcaster', '#ambient', '#solopreneur']
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
    links: [],
    hashtags: ['#founder', '#bitcoin', '#openprotocol', '#nostr']
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
    id: 'post_board_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '1h',
    type: 'board',
    title: 'Brutalist Architecture',
    text: 'Minimalist industrial and brutalist architecture moodboard for our upcoming winter release.',
    boardData: {
      images: [
        {
          id: 'b1',
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&h=900&q=80',
          caption: 'Concrete and warm oak courtyard'
        },
        {
          id: 'b2',
          type: 'user',
          url: '/sora_arts',
          username: 'sora_arts',
          name: 'Sora',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          caption: '3D collaborator and sculptor'
        },
        {
          id: 'b3',
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&h=520&q=80',
          caption: 'Glass and steel facade geometry'
        },
        {
          id: 'b4',
          url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=700&h=950&q=80',
          caption: 'Monochrome interior textures'
        },
        {
          id: 'b5',
          url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=700&h=560&q=80',
          caption: 'Soft brutalist living space'
        },
        {
          id: 'b6',
          url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=700&h=860&q=80',
          caption: 'Modular apartment elevation'
        }
      ]
    },
    likesCount: 96,
    repostsCount: 18,
    repliesCount: 7,
    viewsCount: '2.1K',
    isLiked: false
  },
  {
    id: 'post_amber_ui',
    author: MOCK_USERS.amberlyn,
    createdAt: '2h',
    type: 'board',
    title: 'Design Systems Library',
    text: 'Token-based design systems for mobile-first web applications with Figma components and layout tokens.',
    boardData: {
      images: [
        {
          id: 'b_ui1',
          url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=700&h=900&q=80',
          caption: 'Layout math and responsive tokens'
        },
        {
          id: 'b_ui2',
          type: 'user',
          url: '/dev_kyle',
          username: 'dev_kyle',
          name: 'Kyle Vance',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          caption: 'Design engineering partner'
        },
        {
          id: 'b_ui3',
          url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=700&h=520&q=80',
          caption: 'Figma component anatomy'
        },
        {
          id: 'b_ui4',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&h=800&q=80',
          caption: 'Light theme elevation tokens'
        }
      ]
    },
    likesCount: 142,
    repostsCount: 35,
    repliesCount: 18,
    viewsCount: '4.2K',
    isLiked: false
  },
  {
    id: 'post_amber_film',
    author: MOCK_USERS.amberlyn,
    createdAt: '4h',
    type: 'board',
    title: '35mm Tokyo Night Walk',
    text: 'Film scans from Shibuya and Shinjuku crossing with late night rainy reflections and grain.',
    boardData: {
      images: [
        {
          id: 'bf1',
          url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
          caption: 'Shibuya crossing in the rain'
        },
        {
          id: 'bf2',
          url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
          caption: 'Neon alley reflections'
        },
        {
          id: 'bf3',
          url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
          caption: 'Tokyo tower perspective'
        },
        {
          id: 'bf4',
          url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
          caption: 'Subway station monochrome'
        }
      ]
    },
    likesCount: 89,
    repostsCount: 12,
    repliesCount: 6,
    viewsCount: '1.8K',
    isLiked: false
  },
  {
    id: 'post_grid_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '3h',
    type: 'board',
    title: 'Studio Collaborators',
    text: 'Top mutuals and creative partners shipping with our design studio this sprint.',
    boardData: {
      images: [
        {
          id: 'bu1',
          type: 'user',
          url: '/dev_kyle',
          username: 'dev_kyle',
          name: 'Kyle Vance',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          caption: 'Full-stack lead'
        },
        {
          id: 'bu2',
          type: 'user',
          url: '/sora_arts',
          username: 'sora_arts',
          name: 'Sora',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          caption: '3D artist & sculptor'
        },
        {
          id: 'bu3',
          type: 'user',
          url: '/celeste',
          username: 'celeste',
          name: 'Celeste Ray',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
          caption: 'Audio director'
        },
        {
          id: 'bu4',
          type: 'user',
          url: '/marcus_v',
          username: 'marcus_v',
          name: 'Marcus Vance',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          caption: 'Product engineer'
        }
      ]
    },
    likesCount: 54,
    repostsCount: 12,
    repliesCount: 4,
    viewsCount: '1.2K',
    isLiked: true
  },
  {
    id: 'post_kyle_1',
    author: MOCK_USERS.dev_kyle,
    createdAt: '2h',
    type: 'board',
    title: 'Mechanical Keyboards',
    text: 'Mechanical keyboard and desk hardware builds gallery.',
    boardData: {
      images: [
        {
          id: 'ks1',
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&h=550&q=80',
          caption: 'Custom 65% anodized aluminum case'
        },
        {
          id: 'ks2',
          url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&h=720&q=80',
          caption: 'Coiled aviator cable and deskmat'
        },
        {
          id: 'ks3',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=750&h=550&q=80',
          caption: 'Retro synth and monitor rig'
        },
        {
          id: 'ks4',
          url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=520&h=720&q=80',
          caption: 'Testing latency benchmarks'
        },
        {
          id: 'ks5',
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&h=550&q=80',
          caption: 'Custom PCB soldering complete'
        }
      ]
    },
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
    type: 'board',
    title: '3D Procedural Shaders',
    text: 'New 3D procedural shaders and abstract glass renders board.',
    boardData: {
      images: [
        {
          id: 'sb1',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&h=900&q=80',
          caption: 'Chromatic dispersion study 01'
        },
        {
          id: 'sb2',
          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=700&h=550&q=80',
          caption: 'Iridescent torus knot'
        },
        {
          id: 'sb3',
          url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=700&h=550&q=80',
          caption: 'Liquid metal topology'
        },
        {
          id: 'sb4',
          url: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?auto=format&fit=crop&w=700&h=880&q=80',
          caption: 'Subsurface crystal refraction'
        },
        {
          id: 'sb5',
          url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=700&h=640&q=80',
          caption: 'Soft body cloth simulation'
        }
      ]
    },
    likesCount: 310,
    repostsCount: 45,
    repliesCount: 18,
    viewsCount: '8.2K',
    isLiked: true,
    isReposted: true
  }
];

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  amberlyn: [
    {
      id: 'comment_1',
      author: MOCK_USERS.dev_kyle,
      createdAt: '25m',
      text: 'The portfolio updates look incredible amber! Especially the interactive sound design section.',
      likesCount: 8,
      isLiked: true
    },
    {
      id: 'comment_2',
      author: MOCK_USERS.sora_arts,
      createdAt: '1h',
      text: 'Love the vibe on your profile! Leaving my mark here 🎨✨',
      likesCount: 5,
      isLiked: false
    },
    {
      id: 'comment_3',
      author: MOCK_USERS.celeste,
      createdAt: '3h',
      text: 'One of the cleanest profiles on the entire app. So glad we connected!',
      likesCount: 14,
      isLiked: false
    }
  ],
  dev_kyle: [
    {
      id: 'comment_k1',
      author: MOCK_USERS.amberlyn,
      createdAt: '1h',
      text: 'Thanks for the shoutout Kyle! Keep shipping 🔥',
      likesCount: 4,
      isLiked: true
    }
  ]
};

export const MOCK_THREAD_REPLIES: Record<string, ThreadReply[]> = {
  post_board_1: [
    {
      id: 'reply_b1',
      author: MOCK_USERS.sora_arts,
      createdAt: '40m',
      text: 'Opening this board into the 2-column grid view is so satisfying. Concrete + warm oak is timeless.',
      likesCount: 9,
      repliesCount: 0,
      repostsCount: 1,
      isLiked: true
    }
  ],
  post_sora_1: [
    {
      id: 'reply_s1',
      author: MOCK_USERS.amberlyn,
      createdAt: '3h',
      text: 'Welcome to the platform Sora!! Love having your 3D work showcased here.',
      likesCount: 19,
      repliesCount: 1,
      repostsCount: 1,
      isLiked: true
    }
  ]
};

export const MOCK_LIKED_POSTS: Record<string, Post[]> = {
  amberlyn: [
    { ...MOCK_POSTS[5], isLiked: true }, // Sora's board post
    { ...MOCK_POSTS[4], isLiked: true }  // Kyle's board post
  ],
  dev_kyle: [
    { ...MOCK_POSTS[0], isLiked: true }  // Amber's board post
  ]
};

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col_highlights',
    title: 'Highlights',
    tabType: 'posts',
    description: 'Flagship launches, top design boards, and studio archives',
    itemIds: ['post_board_1', 'post_amber_ui', 'post_amber_film'],
    isPinned: true
  },
  {
    id: 'col_design_systems',
    title: 'Design Systems',
    tabType: 'posts',
    description: 'Tokens, component architecture, and responsive layout math',
    itemIds: ['post_amber_ui', 'post_board_1'],
    isPinned: true
  },
  {
    id: 'col_tokyo_roll',
    title: '35mm Tokyo',
    tabType: 'posts',
    description: 'Street photography, camera scans, and night walks',
    itemIds: ['post_amber_film'],
    isPinned: true
  },
  {
    id: 'col_architecture',
    title: 'Brutalism',
    tabType: 'posts',
    description: 'Concrete pavilions, geometric facade studies, and minimalism',
    itemIds: ['post_board_1', 'post_amber_ui'],
    isPinned: true
  },
  {
    id: 'col_collaborators',
    title: 'Collaborators',
    tabType: 'posts',
    description: 'Mutuals, creative partners, and core network',
    itemIds: ['post_grid_1'],
    isPinned: true
  },
  {
    id: 'col_shaders',
    title: 'WebGL Shaders',
    tabType: 'posts',
    description: 'Interactive canvas shaders and kinetic typography experiments',
    itemIds: ['post_amber_ui'],
    isPinned: false
  },
  {
    id: 'col_essays',
    title: 'Essays and Notes',
    tabType: 'posts',
    description: 'Thoughts on digital curation and web culture',
    itemIds: ['post_amber_ui', 'post_amber_film', 'post_board_1', 'post_grid_1'],
    isPinned: false
  },
  {
    id: 'col_setups',
    title: 'Studio Setups',
    tabType: 'posts',
    description: 'Minimal workspaces, hardware builds, and daily tools',
    itemIds: ['post_board_1'],
    isPinned: false
  },
  {
    id: 'col_launches',
    title: 'Product Drops',
    tabType: 'posts',
    description: 'Sprint retrospectives, release notes, and roadmap',
    itemIds: ['post_amber_ui', 'post_board_1'],
    isPinned: false
  }
];

export const MOCK_LINK_COLLECTIONS: Collection[] = [
  {
    id: 'col_link_main',
    title: 'Main',
    icon: '🌐',
    slug: 'main',
    tabType: 'links',
    isDefault: true,
    isPinned: true,
    description: 'Primary bio links, core socials, and featured badges',
    itemIds: ['post_badge_1', 'post_badge_oomf_1', 'post_badge_2', 'post_badge_3', 'post_badge_4', 'l1', 'l2', 'l3']
  },
  {
    id: 'col_link_work',
    title: 'Work & Projects',
    icon: '💼',
    slug: 'work',
    tabType: 'links',
    description: 'Client case studies, Figma design systems, and advisory',
    itemIds: ['post_badge_6', 'l1', 'l4_figma', 'l6_cal'],
    isPinned: true
  },
  {
    id: 'col_link_writing',
    title: 'Writing & Essays',
    icon: '📝',
    slug: 'writing',
    tabType: 'links',
    description: 'Substack publications, deep dives, and design notes',
    itemIds: ['post_badge_5', 'l2'],
    isPinned: true
  },
  {
    id: 'col_link_music',
    title: 'Sound & Playlists',
    icon: '🎧',
    slug: 'sound',
    tabType: 'links',
    description: 'Spotify focus playlists, ambient sets, and synth mixes',
    itemIds: ['l3'],
    isPinned: true
  },
  {
    id: 'col_link_dev',
    title: 'Code & Open Source',
    icon: '🛠️',
    slug: 'code',
    tabType: 'links',
    description: 'GitHub repos, UI components, and TypeScript templates',
    itemIds: ['post_badge_7', 'post_badge_8', 'l5_github'],
    isPinned: false
  },
  {
    id: 'col_link_socials',
    title: 'Socials & Networks',
    icon: '🌐',
    slug: 'socials',
    tabType: 'links',
    description: 'Connect across X, Bluesky, Mastodon, and GitHub',
    itemIds: ['l5_github', 'l2', 'l1'],
    isPinned: false
  },
  {
    id: 'col_link_side_quests',
    title: 'Side Quests & Drops',
    icon: '🚀',
    slug: 'drops',
    tabType: 'links',
    description: 'Experimental microsites, weekend hackathons, and fun tools',
    itemIds: ['l4_figma', 'l3', 'l1'],
    isPinned: false
  },
  {
    id: 'col_link_advisory',
    title: 'Office Hours & Chat',
    icon: '☕',
    slug: 'office-hours',
    tabType: 'links',
    description: '1-on-1 chats, portfolio critiques, and founder mentoring',
    itemIds: ['l6_cal', 'l1'],
    isPinned: false
  },
  {
    id: 'col_link_reading_list',
    title: 'Reading List 2026',
    icon: '📚',
    slug: 'reading',
    tabType: 'links',
    description: 'Curated articles, book recommendations, and philosophy notes',
    itemIds: ['l2'],
    isPinned: false
  },
  {
    id: 'col_link_archive',
    title: 'Archive & Legacy',
    icon: '📦',
    slug: 'archive',
    tabType: 'links',
    description: 'Legacy 2023-2025 experiments, archived archives, and drafts',
    itemIds: ['l3', 'l5_github', 'l6_cal'],
    isPinned: false
  }
];

const DEFAULT_COIN_RADIUS = Math.sqrt(0.5 * 0.83) * 49.2; // 31.69488...

export const DEFAULT_SUPPORTERS: Supporter[] = [
  {
    id: 'coin_amb',
    username: 'ambcoin',
    name: 'Amb Coin',
    avatar: '/ambcoin.png',
    amount: 50,
    tier: 'supporter',
    message: 'Official Amb Coin in orbit',
    createdAt: 'Just now',
    isMutual: true,
    customRadius: DEFAULT_COIN_RADIUS,
  },
  {
    id: 'coin_my',
    username: 'mycoin',
    name: 'My Coin',
    avatar: '/My_Coin (1).png',
    amount: 50,
    tier: 'supporter',
    message: 'Official Community Coin in orbit',
    createdAt: 'Just now',
    isMutual: true,
    customRadius: DEFAULT_COIN_RADIUS,
  },
];

export const MOCK_SUPPORTERS: Record<string, Supporter[]> = {
  amberlyn: DEFAULT_SUPPORTERS,
  dev_kyle: DEFAULT_SUPPORTERS,
  jack: DEFAULT_SUPPORTERS,
};

export function getSupportersForUser(username: string): Supporter[] {
  const normalized = (username || '').toLowerCase().replace('@', '');
  return MOCK_SUPPORTERS[normalized] || DEFAULT_SUPPORTERS;
}


