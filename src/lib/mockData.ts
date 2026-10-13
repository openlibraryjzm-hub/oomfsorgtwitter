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

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'carousel' | 'board' | 'link_card';
  text: string;
  carouselData?: {
    header: string;
    slides: CarouselSlide[];
  };
  boardData?: {
    images: BoardImage[];
  };
  linkData?: {
    title: string;
    url: string;
    description?: string;
    image?: string;
    buttonText?: string;
  };
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
  likesCount: number;
  isLiked?: boolean;
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
    id: 'post_1',
    author: MOCK_USERS.amberlyn,
    createdAt: '3h',
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
