import { Supporter } from './mockData';

// Reusable pool of high-quality avatar placeholders with verified Unsplash portraits
export const AVATAR_POOL = [
  { name: 'Satoshi 👑', username: 'satoshi_nak', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
  { name: 'Elena Rostova', username: 'elena_r', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kyle Vance', username: 'dev_kyle', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sora 🎨', username: 'sora_arts', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Celeste 🌙', username: 'celeste', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
  { name: 'Marcus Vance', username: 'marcus_v', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Liam Chen', username: 'liam_c', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { name: 'Maya Lin', username: 'maya_design', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Alex Rivera', username: 'arivera_eth', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80' },
  { name: 'Zoe Kim', username: 'zoe_k', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Oliver Twist', username: 'oliver_t', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sophia Wu', username: 'sophia_code', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lucas Scott', username: 'lucas_ui', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Hana Sato', username: 'hana_pixel', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Dante Rossi', username: 'dante_dev', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Chloe Bennett', username: 'chloe_b', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Noah Miller', username: 'noah_m', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80' },
  { name: 'Aria Stark', username: 'aria_builds', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Finnian Cole', username: 'finn_c', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80' },
  { name: 'Isabella Cruz', username: 'isa_cruz', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kai Tanaka', username: 'kai_t', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nora Lindqvist', username: 'nora_l', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80' },
  { name: 'Ethan Hunt', username: 'ethan_h', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80' },
  { name: 'Zara Ahmed', username: 'zara_a', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80' },
  { name: 'Julian Drake', username: 'julian_d', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=400&q=80' },
  { name: 'Emily Rose', username: 'emily_r', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
];

export interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: string;
  getSupporters: () => Supporter[];
}

export const SUPPORTER_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'empty',
    name: 'Cold Start',
    badge: '0 supporters',
    description: 'Empty orbit with the @oomfsorg cat mascot & "+ Be 1st" invite pill.',
    icon: '🌱',
    getSupporters: () => [],
  },
  {
    id: 'solo_whale',
    name: 'Solo Whale',
    badge: '1 hero ($100)',
    description: 'Single high-tier patron in the center wearing the 👑 gold crown.',
    icon: '🐳',
    getSupporters: () => [
      {
        id: 'sup_whale_1',
        username: AVATAR_POOL[0].username,
        name: AVATAR_POOL[0].name,
        avatar: AVATAR_POOL[0].avatar,
        amount: 100,
        tier: 'hero',
        message: 'Huge fan of what you are building on oomfs.org! Keep crushing it.',
        createdAt: 'Yesterday',
        isMutual: true,
      },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced Orbit',
    badge: '6 varied',
    description: 'Standard active profile with 1 hero, 2 patrons, and 3 supporters ($110 total).',
    icon: '⚖️',
    getSupporters: () => [
      {
        id: 'sup_b1',
        username: AVATAR_POOL[2].username,
        name: AVATAR_POOL[2].name,
        avatar: AVATAR_POOL[2].avatar,
        amount: 50,
        tier: 'hero',
        message: 'Keep cooking! oomfs.org UI is looking pristine 🚀',
        createdAt: '2 days ago',
        isMutual: true,
      },
      {
        id: 'sup_b2',
        username: AVATAR_POOL[3].username,
        name: AVATAR_POOL[3].name,
        avatar: AVATAR_POOL[3].avatar,
        amount: 25,
        tier: 'patron',
        message: 'Love the 3D moodboard collections, such an inspiration ✨',
        createdAt: '5 days ago',
        isMutual: true,
      },
      {
        id: 'sup_b3',
        username: AVATAR_POOL[4].username,
        name: AVATAR_POOL[4].name,
        avatar: AVATAR_POOL[4].avatar,
        amount: 15,
        tier: 'supporter',
        message: 'Proud mutual supporter! Next podcast episode shoutout.',
        createdAt: '1 week ago',
        isMutual: true,
      },
      {
        id: 'sup_b4',
        username: AVATAR_POOL[5].username,
        name: AVATAR_POOL[5].name,
        avatar: AVATAR_POOL[5].avatar,
        amount: 10,
        tier: 'supporter',
        message: 'Twitter Light theme fidelity is insane.',
        createdAt: '2 weeks ago',
        isMutual: true,
      },
      {
        id: 'sup_b5',
        username: AVATAR_POOL[1].username,
        name: AVATAR_POOL[1].name,
        avatar: AVATAR_POOL[1].avatar,
        amount: 5,
        tier: 'micro',
        message: 'Coffee fund on me ☕',
        createdAt: '3 weeks ago',
        isMutual: false,
      },
      {
        id: 'sup_b6',
        username: AVATAR_POOL[6].username,
        name: AVATAR_POOL[6].name,
        avatar: AVATAR_POOL[6].avatar,
        amount: 5,
        tier: 'micro',
        message: 'Big fan of the carousel format!',
        createdAt: '1 month ago',
        isMutual: false,
      },
    ],
  },
  {
    id: 'whales_and_swarm',
    name: 'Whales + Outer Swarm',
    badge: '2 big + 18 small',
    description: 'The classic GitHub Sponsors distribution: 2 huge center patrons surrounded by 18 micro-supporters.',
    icon: '👑',
    getSupporters: () => {
      const list: Supporter[] = [
        {
          id: 'ws_w1',
          username: AVATAR_POOL[0].username,
          name: AVATAR_POOL[0].name,
          avatar: AVATAR_POOL[0].avatar,
          amount: 100,
          tier: 'hero',
          message: 'Matching foundation grant for your open source work!',
          createdAt: '1 day ago',
          isMutual: true,
        },
        {
          id: 'ws_w2',
          username: AVATAR_POOL[8].username,
          name: AVATAR_POOL[8].name,
          avatar: AVATAR_POOL[8].avatar,
          amount: 75,
          tier: 'hero',
          message: 'Sponsoring the design tokens research ✨',
          createdAt: '3 days ago',
          isMutual: true,
        },
        {
          id: 'ws_p1',
          username: AVATAR_POOL[2].username,
          name: AVATAR_POOL[2].name,
          avatar: AVATAR_POOL[2].avatar,
          amount: 25,
          tier: 'patron',
          message: 'Love the work!',
          createdAt: '4 days ago',
          isMutual: true,
        },
        {
          id: 'ws_p2',
          username: AVATAR_POOL[3].username,
          name: AVATAR_POOL[3].name,
          avatar: AVATAR_POOL[3].avatar,
          amount: 20,
          tier: 'patron',
          message: 'Keep going!',
          createdAt: '5 days ago',
          isMutual: true,
        },
      ];

      // Add 16 small micro supporters ($3 - $5)
      for (let i = 4; i < 20; i++) {
        const p = AVATAR_POOL[i % AVATAR_POOL.length];
        list.push({
          id: `ws_s_${i}`,
          username: `${p.username}_${i}`,
          name: p.name,
          avatar: p.avatar,
          amount: i % 2 === 0 ? 5 : 3,
          tier: 'micro',
          message: `Great stuff! Supporter #${i + 1}`,
          createdAt: `${i + 1}d ago`,
          isMutual: i % 3 === 0,
        });
      }
      return list;
    },
  },
  {
    id: 'many_small',
    name: 'Swarm of Small',
    badge: '25 micro tips',
    description: 'Crowdfund / tip jar style: 25 micro supporters ($2-$5 each) forming a dense celestial cloud.',
    icon: '🐝',
    getSupporters: () => {
      const list: Supporter[] = [];
      for (let i = 0; i < 25; i++) {
        const p = AVATAR_POOL[i % AVATAR_POOL.length];
        list.push({
          id: `swarm_${i}`,
          username: `${p.username}_${i}`,
          name: p.name,
          avatar: p.avatar,
          amount: (i % 4) + 2, // $2 to $5
          tier: 'micro',
          message: `Coffee tip #${i + 1} ☕`,
          createdAt: `${(i % 12) + 1}h ago`,
          isMutual: i % 4 === 0,
        });
      }
      return list;
    },
  },
  {
    id: 'mutuals_only',
    name: 'OOMFS Mutuals Ring',
    badge: '10 mutuals',
    description: 'Pure reciprocal friendship: 10 mutual followers ($A <-> B) with verified mutual badges.',
    icon: '🤝',
    getSupporters: () => {
      return AVATAR_POOL.slice(0, 10).map((p, i) => ({
        id: `oomf_${i}`,
        username: p.username,
        name: p.name,
        avatar: p.avatar,
        amount: 10 + (i * 2),
        tier: i === 0 ? 'hero' : 'supporter',
        message: 'Mutual for life! Always here to support 🤝',
        createdAt: `${i + 1}d ago`,
        isMutual: true,
      }));
    },
  },
];
