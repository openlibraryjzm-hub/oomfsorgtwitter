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
}

export interface CarouselSlide {
  id: string;
  url: string;
  caption?: string;
}

export interface BoardImage {
  id: string;
  url: string;
  caption?: string;
}

export type GridItemKind = 'avatar' | 'link';

export interface GridItem {
  id: string;
  kind: GridItemKind; // 'avatar' (circle) | 'link' (square)
  title: string;
  url: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: string;
  bgColor?: string;
  showLabel?: boolean;
}

export interface GridPostData {
  columns: 4 | 5;
  items: GridItem[];
}

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
  type: 'standard' | 'carousel' | 'board' | 'link_card' | 'grid' | 'comment';
  images?: string[];
  targetUsername?: string;
  targetUserId?: string;
  text: string;
  carouselData?: {
    header?: string;
    slides: CarouselSlide[];
  };
  boardData?: {
    images: BoardImage[];
  };
  linkData?: {
    title: string;
    url: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    image?: string;
    buttonText?: string;
    pageId?: string;
  };
  gridData?: GridPostData;
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
        icon: '🎨',
        title: 'Design Portfolio (2026)',
        subtitle: 'Product design, design systems & web explorations',
        url: 'https://amberlyn.design',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
        category: 'Work',
        clicks: 1420
      },
      {
        id: 'l2',
        icon: '📝',
        title: 'Substack: Design Systems',
        subtitle: 'Weekly deep dives into UI engineering and Twitter culture',
        url: 'https://amberlyn.substack.com',
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
        category: 'Writing',
        clicks: 890
      },
      {
        id: 'l3',
        icon: '🎧',
        title: 'Spotify: Late Night Coding',
        subtitle: 'Lo-fi beats and ambient synthwave for deep focus',
        url: 'https://spotify.com',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        category: 'Music',
        clicks: 2310
      },
      {
        id: 'l4_figma',
        icon: '📐',
        title: 'Figma: OOMFS UI Kit',
        subtitle: 'Complete 1:1 Twitter Light theme tokens and components',
        url: 'https://figma.com/@amberlyn',
        image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
        category: 'Work',
        clicks: 3410
      },
      {
        id: 'l5_github',
        icon: '🐙',
        title: 'GitHub: Open Source UI',
        subtitle: 'Explore repos, design system scripts & experimental web apps',
        url: 'https://github.com/amberlyn',
        image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=600&q=80',
        category: 'Dev',
        clicks: 1120
      },
      {
        id: 'l6_cal',
        icon: '📅',
        title: 'Book 15m Design Advisory',
        subtitle: 'Quick office hours for design critique and UI feedback',
        url: 'https://cal.com/amberlyn',
        image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80',
        category: 'Work',
        clicks: 530
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
    id: 'post_carousel_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '15m',
    type: 'carousel',
    text: 'October camera roll & studio moments. Swipe through the latest workspace setups and UI explorations ➡️',
    carouselData: {
      header: 'october studio & camera roll 📸',
      slides: [
        {
          id: 's1',
          url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&h=720&q=80',
          caption: 'Morning light hitting the studio desk'
        },
        {
          id: 's2',
          url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&h=560&q=80',
          caption: 'Prototyping new oomfs.org layout tokens'
        },
        {
          id: 's3',
          url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=480&h=720&q=80',
          caption: 'Flat white #2 before shipping'
        },
        {
          id: 's4',
          url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=640&h=640&q=80',
          caption: 'Typography & grid studies'
        },
        {
          id: 's5',
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=820&h=540&q=80',
          caption: 'Late night shader tests'
        },
        {
          id: 's6',
          url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=520&h=740&q=80',
          caption: 'Wrapping up the sprint ✨'
        }
      ]
    },
    likesCount: 124,
    repostsCount: 19,
    repliesCount: 14,
    viewsCount: '2.8K',
    isLiked: true
  },
  {
    id: 'post_board_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '1h',
    type: 'board',
    text: 'Minimalist industrial & brutalist architecture moodboard for our upcoming winter release. Click to expand full board (6 items) 👇',
    boardData: {
      images: [
        {
          id: 'b1',
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&h=900&q=80',
          caption: 'Concrete & warm oak courtyard'
        },
        {
          id: 'b2',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&h=520&q=80',
          caption: 'Nordic daylight studio'
        },
        {
          id: 'b3',
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&h=520&q=80',
          caption: 'Glass & steel facade geometry'
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
    type: 'standard',
    text: 'Deep dive into token-based design systems for mobile-first web applications. Published our complete Figma library breakdown & layout tokens 🎨👇',
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
    type: 'standard',
    text: '35mm film scans from Shibuya & Shinjuku crossing. Late night rainy reflections and grain 🎞️☕',
    likesCount: 89,
    repostsCount: 12,
    repliesCount: 6,
    viewsCount: '1.8K',
    isLiked: false
  },
  {
    id: 'post_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '3h',
    type: 'link_card',
    text: 'Just updated my bio link portfolio! Added all recent client case studies and my new interactive UI library.',
    linkData: {
      title: 'Design Portfolio (2026)',
      subtitle: 'Client case studies, interactive UI experiments & design systems',
      description: 'Explore web apps, design systems, and product UI explorations created by Amber.',
      icon: '🎨',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
      url: 'https://amberlyn.design',
      buttonText: 'Visit Portfolio ↗'
    },
    likesCount: 84,
    repostsCount: 12,
    repliesCount: 9,
    viewsCount: '1.4K',
    isLiked: true
  },
  {
    id: 'post_grid_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '3h',
    type: 'grid',
    text: 'favorite mutuals, open-source repos & creative tools this month ✦\n(circles link to mutual profiles, squares open sites directly)',
    gridData: {
      columns: 5,
      items: [
        {
          id: 'gi_1',
          kind: 'avatar',
          title: 'Kyle Vance',
          url: '/dev_kyle',
          subtitle: '@dev_kyle',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          showLabel: true
        },
        {
          id: 'gi_2',
          kind: 'link',
          title: 'GitHub',
          url: 'https://github.com',
          subtitle: 'github.com',
          bgColor: '#0f1419',
          icon: '💻',
          showLabel: true
        },
        {
          id: 'gi_3',
          kind: 'avatar',
          title: 'Sora',
          url: '/sora_arts',
          subtitle: '@sora_arts',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          showLabel: true
        },
        {
          id: 'gi_4',
          kind: 'link',
          title: 'Figma',
          url: 'https://figma.com',
          subtitle: 'figma.com',
          bgColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          icon: '🎨',
          showLabel: true
        },
        {
          id: 'gi_5',
          kind: 'avatar',
          title: 'Jack',
          url: '/jack',
          subtitle: '@jack',
          imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
          showLabel: true
        },
        {
          id: 'gi_6',
          kind: 'link',
          title: 'Next.js',
          url: 'https://nextjs.org',
          subtitle: 'nextjs.org',
          bgColor: '#000000',
          icon: '▲',
          showLabel: false
        },
        {
          id: 'gi_7',
          kind: 'link',
          title: 'Spotify',
          url: 'https://spotify.com',
          subtitle: 'spotify.com',
          bgColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
          icon: '🎧',
          showLabel: false
        },
        {
          id: 'gi_8',
          kind: 'link',
          title: 'Neocities',
          url: 'https://neocities.org',
          subtitle: 'neocities.org',
          bgColor: '#e06800',
          icon: '👾',
          showLabel: false
        },
        {
          id: 'gi_9',
          kind: 'link',
          title: 'Substack',
          url: 'https://substack.com',
          subtitle: 'substack.com',
          bgColor: '#f97316',
          icon: '📡',
          showLabel: false
        },
        {
          id: 'gi_10',
          kind: 'link',
          title: 'Tailwind',
          url: 'https://tailwindcss.com',
          subtitle: 'tailwindcss.com',
          bgColor: 'linear-gradient(135deg, #06b6d4, #1d9bf0)',
          icon: '🌊',
          showLabel: false
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
    type: 'carousel',
    text: ' Shipping our new mechanical keyboard & desk hardware builds this weekend:',
    carouselData: {
      header: 'weekend hardware builds 🛠️',
      slides: [
        {
          id: 'ks1',
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&h=550&q=80',
          caption: 'Custom 65% anodized aluminum case'
        },
        {
          id: 'ks2',
          url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&h=720&q=80',
          caption: 'Coiled aviator cable & deskmat'
        },
        {
          id: 'ks3',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=750&h=550&q=80',
          caption: 'Retro synth & monitor rig'
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
    text: 'New 3D procedural shaders & abstract glass renders board. Tap to view all 5 full-resolution pieces 🎨✨',
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
  post_carousel_1: [
    {
      id: 'reply_c1',
      author: MOCK_USERS.dev_kyle,
      createdAt: '10m',
      text: 'Slide 2 & 5 go crazy! Love how the portrait and landscape shots flow together in the carousel.',
      likesCount: 14,
      repliesCount: 1,
      repostsCount: 0,
      isLiked: true
    }
  ],
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
  post_1: [
    {
      id: 'reply_1',
      author: MOCK_USERS.dev_kyle,
      createdAt: '8m',
      text: 'Just checked out the design system case study, the motion curves are butter smooth!',
      likesCount: 12,
      repliesCount: 1,
      repostsCount: 0,
      isLiked: true
    },
    {
      id: 'reply_2',
      author: MOCK_USERS.celeste,
      createdAt: '5m',
      text: 'Subscribed to the Substack right away! Cant wait for the deep dive on OOMF culture.',
      likesCount: 6,
      repliesCount: 0,
      repostsCount: 0,
      isLiked: false
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
    { ...MOCK_POSTS[4], isLiked: true }, // Sora's board post
    { ...MOCK_POSTS[3], isLiked: true }  // Kyle's carousel post
  ],
  dev_kyle: [
    { ...MOCK_POSTS[0], isLiked: true }  // Amber's carousel post
  ]
};

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col_highlights',
    title: 'Highlights',
    icon: '⭐',
    tabType: 'posts',
    description: 'Flagship launches, top design threads, and studio archives',
    itemIds: ['post_carousel_1', 'post_amber_ui', 'post_board_1'],
    isPinned: true
  },
  {
    id: 'col_design_systems',
    title: 'Design Systems',
    icon: '🎨',
    tabType: 'posts',
    description: 'Tokens, component architecture, and responsive layout math',
    itemIds: ['post_amber_ui', 'post_board_1'],
    isPinned: true
  },
  {
    id: 'col_tokyo_roll',
    title: '35mm Tokyo',
    icon: '📸',
    tabType: 'posts',
    description: 'Street photography, camera scans, and neon night walks',
    itemIds: ['post_amber_film', 'post_carousel_1'],
    isPinned: true
  },
  {
    id: 'col_architecture',
    title: 'Brutalism',
    icon: '🌿',
    tabType: 'posts',
    description: 'Concrete pavilions, geometric facade studies, and minimalism',
    itemIds: ['post_board_1', 'post_carousel_1'],
    isPinned: true
  },
  {
    id: 'col_shaders',
    title: 'WebGL & Shaders',
    icon: '⚡',
    tabType: 'posts',
    description: 'Interactive canvas shaders and kinetic typography experiments',
    itemIds: ['post_carousel_1', 'post_amber_ui'],
    isPinned: false
  },
  {
    id: 'col_essays',
    title: 'Essays & Notes',
    icon: '📝',
    tabType: 'posts',
    description: 'Longform thoughts on digital gardening and web culture',
    itemIds: ['post_amber_ui', 'post_amber_film'],
    isPinned: false
  },
  {
    id: 'col_setups',
    title: 'Studio Setups',
    icon: '☕',
    tabType: 'posts',
    description: 'Minimal workspaces, cable management, and daily tools',
    itemIds: ['post_carousel_1', 'post_board_1'],
    isPinned: false
  },
  {
    id: 'col_launches',
    title: 'Product Drops',
    icon: '🚀',
    tabType: 'posts',
    description: 'Sprint retrospectives, v1 release notes, and product roadmap',
    itemIds: ['post_amber_ui', 'post_carousel_1', 'post_board_1'],
    isPinned: false
  },
  {
    id: 'col_playlists',
    title: 'Late Night Focus',
    icon: '🎧',
    tabType: 'posts',
    description: 'Ambient electronic, lo-fi beats, and coding mixes',
    itemIds: ['post_amber_film', 'post_carousel_1'],
    isPinned: false
  },
  {
    id: 'col_tools',
    title: 'Dev Stack',
    icon: '🛠️',
    tabType: 'posts',
    description: 'Next.js 16, Tailwind v4, Supabase, and frontend tooling',
    itemIds: ['post_amber_ui', 'post_board_1'],
    isPinned: false
  },
  {
    id: 'col_best_2025',
    title: 'Best of 2025',
    icon: '🎯',
    tabType: 'posts',
    description: 'Annual retrospective of favorite creations and milestones',
    itemIds: ['post_board_1', 'post_amber_ui', 'post_carousel_1'],
    isPinned: false
  },
  {
    id: 'col_retro_web',
    title: 'Retro Web',
    icon: '👾',
    tabType: 'posts',
    description: '88x31 pixel buttons, webrings, and early internet lore',
    itemIds: ['post_amber_film', 'post_amber_ui'],
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
    itemIds: ['post_badge_1', 'post_badge_oomf_1', 'post_badge_2', 'post_badge_3', 'post_badge_4', 'l1', 'l2', 'l3', 'post_1']
  },
  {
    id: 'col_link_work',
    title: 'Work & Projects',
    icon: '💼',
    slug: 'work',
    tabType: 'links',
    description: 'Client case studies, Figma design systems, and advisory',
    itemIds: ['post_badge_6', 'l1', 'post_1', 'l4_figma', 'l6_cal'],
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
    itemIds: ['l2', 'post_1'],
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

export const MOCK_SUPPORTERS: Record<string, Supporter[]> = {
  amberlyn: [
    {
      id: 'sup_1',
      username: 'dev_kyle',
      name: 'Kyle Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      amount: 50,
      tier: 'hero',
      message: 'Keep cooking! oomfs.org UI is looking pristine 🚀',
      createdAt: '2 days ago',
      isMutual: true,
    },
    {
      id: 'sup_2',
      username: 'sora_arts',
      name: 'Sora 🎨',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      amount: 25,
      tier: 'patron',
      message: 'Love the 3D moodboard collections, such an inspiration ✨',
      createdAt: '5 days ago',
      isMutual: true,
    },
    {
      id: 'sup_3',
      username: 'celeste',
      name: 'Celeste 🌙',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      amount: 15,
      tier: 'supporter',
      message: 'Proud mutual supporter! Next podcast episode shoutout.',
      createdAt: '1 week ago',
      isMutual: true,
    },
    {
      id: 'sup_4',
      username: 'marcus_v',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      amount: 10,
      tier: 'supporter',
      message: 'Twitter Light theme fidelity is insane.',
      createdAt: '2 weeks ago',
      isMutual: true,
    },
    {
      id: 'sup_5',
      username: 'elena_r',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      amount: 5,
      tier: 'micro',
      message: 'Coffee fund on me ☕',
      createdAt: '3 weeks ago',
      isMutual: false,
    },
    {
      id: 'sup_6',
      username: 'liam_c',
      name: 'Liam Chen',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      amount: 5,
      tier: 'micro',
      message: 'Big fan of the carousel format!',
      createdAt: '1 month ago',
      isMutual: false,
    },
  ],
  dev_kyle: [
    {
      id: 'sup_k1',
      username: 'amberlyn',
      name: 'amber lyn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      amount: 50,
      tier: 'hero',
      message: 'TypeScript wizardry at its finest! 🤝',
      createdAt: '3 days ago',
      isMutual: true,
    },
    {
      id: 'sup_k2',
      username: 'sora_arts',
      name: 'Sora 🎨',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      amount: 10,
      tier: 'supporter',
      message: 'Thanks for open sourcing the components!',
      createdAt: '1 week ago',
      isMutual: true,
    },
  ],
  jack: [], // 0 supporters - tests cold start
};

export function getSupportersForUser(username: string): Supporter[] {
  const normalized = (username || '').toLowerCase().replace('@', '');
  return MOCK_SUPPORTERS[normalized] || [];
}


