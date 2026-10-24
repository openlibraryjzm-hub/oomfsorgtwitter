'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Link2, 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  X, 
  Layers, 
  LayoutGrid, 
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Sparkles,
  Lock,
  FolderPlus,
  Globe,
  Users,
  ExternalLink,
  Grid2X2,
  Circle,
  Square,
  Check
} from 'lucide-react';
import { CURRENT_USER, Post, User, Collection, GridItem, GridItemKind } from '@/lib/mockData';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { addItemToCollection, getProfileCollections } from '@/lib/collections';
import SelectOomfModal, { SelectableOomf } from './SelectOomfModal';

interface PostComposerProps {
  onAddPost?: (post: Post) => void;
  onClose?: () => void;
  defaultType?: 'standard' | 'carousel' | 'board' | 'link_card' | 'grid';
  targetUser?: User;
  compact?: boolean;
  collections?: Collection[];
  linkCollections?: Collection[];
  defaultLinkCollectionId?: string | null;
}

interface DraftMediaItem {
  id: string;
  url: string;
  caption: string;
}

// Helper to compress uploaded image files while preserving exact natural aspect ratio
async function compressImageFile(file: File, maxDimension = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const BADGE_PRESET_COLORS = [
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Twitter Blue', hex: '#1d9bf0' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Obsidian', hex: '#0f1419' }
];

type BadgeStyleId = 'angled' | 'glossy' | 'glow' | 'cyber' | 'sunset' | 'solid';

const BADGE_STYLE_OPTIONS: { id: BadgeStyleId; label: string }[] = [
  { id: 'angled', label: 'Angle' },
  { id: 'glossy', label: 'Gloss' },
  { id: 'glow', label: 'Glow' },
  { id: 'cyber', label: 'Sheen' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'solid', label: 'Solid' }
];

function adjustHex(hex: string, percent: number): string {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getOptimalTextColor(hex: string): string {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return '#ffffff';

  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.38 ? '#0f1419' : '#ffffff';
}

function computeBadgeBackground(base: string, style: BadgeStyleId): string {
  if (style === 'solid') return base;
  if (style === 'glossy') {
    return `linear-gradient(180deg, ${adjustHex(base, 35)} 0%, ${base} 45%, ${adjustHex(base, -15)} 50%, ${adjustHex(base, -30)} 100%)`;
  }
  if (style === 'glow') {
    return `radial-gradient(circle at 45% 35%, ${adjustHex(base, 45)} 0%, ${base} 55%, ${adjustHex(base, -25)} 100%)`;
  }
  if (style === 'cyber') {
    return `linear-gradient(135deg, ${adjustHex(base, 18)} 0%, ${adjustHex(base, -20)} 40%, ${adjustHex(base, 38)} 43%, ${base} 60%, ${adjustHex(base, -28)} 100%)`;
  }
  if (style === 'sunset') {
    return `linear-gradient(to right, ${adjustHex(base, 28)} 0%, ${base} 45%, ${adjustHex(base, -35)} 100%)`;
  }
  // 'angled' default
  return `linear-gradient(135deg, ${adjustHex(base, 25)} 0%, ${base} 45%, ${adjustHex(base, -25)} 100%)`;
}

async function compressBadgeImage(file: File): Promise<{ dataUrl: string; isLight: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // If the source image is already an authentic 88x31 pixel badge, preserve raw pixels
        const isExactRetro = img.width === 88 && img.height === 31;

        // Use 3x HiDPI resolution (264x93) for modern Retina / 4K displays
        const targetWidth = isExactRetro ? 88 : 264;
        const targetHeight = isExactRetro ? 31 : 93;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, isLight: false });
          return;
        }

        if (isExactRetro) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, 88, 31);
        } else {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const targetRatio = 88 / 31;
          const imgRatio = img.width / img.height;
          let sWidth = img.width;
          let sHeight = img.height;
          let sx = 0;
          let sy = 0;

          if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        }

        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;
        let totalLuminance = 0;
        const pixelCount = targetWidth * targetHeight;
        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const avgLuminance = totalLuminance / pixelCount / 255;
        const isLight = avgLuminance > 0.42;

        // Export as PNG for razor-sharp vector/type edges and zero JPEG compression artifacts
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, isLight });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PostComposer({
  onAddPost,
  onClose,
  defaultType = 'standard',
  targetUser,
  compact = false,
  collections,
  linkCollections,
  defaultLinkCollectionId
}: PostComposerProps) {
  const { user: authUser, profile: authProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const linkImageInputRef = useRef<HTMLInputElement | null>(null);
  const gridItemImageInputRef = useRef<HTMLInputElement | null>(null);

  const [postType, setPostType] = useState<'standard' | 'carousel' | 'board' | 'link_card' | 'grid'>(defaultType);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Curated collection selection while drafting
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(defaultLinkCollectionId || null);
  const [userPostCols, setUserPostCols] = useState<Collection[]>(collections || []);

  useEffect(() => {
    if (defaultLinkCollectionId !== undefined) {
      setSelectedCollectionId(defaultLinkCollectionId);
    }
  }, [defaultLinkCollectionId]);

  useEffect(() => {
    if (collections && collections.length > 0) {
      setUserPostCols(collections);
    } else if (authUser?.id) {
      getProfileCollections(authUser.id, 'posts').then((cols) => {
        if (cols.length > 0) setUserPostCols(cols);
      });
    }
  }, [collections, authUser?.id]);

  const availableCollections = userPostCols;
  const activeSelectedCollection = availableCollections.find((c) => c.id === selectedCollectionId);

  // Carousel & Board media state
  const [mediaItems, setMediaItems] = useState<DraftMediaItem[]>([]);
  const singleSlotFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotIndexRef = useRef<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const createBlankCarouselSlots = (): DraftMediaItem[] => [
    { id: `c_slot_${Date.now()}_1`, url: '', caption: '' },
    { id: `c_slot_${Date.now()}_2`, url: '', caption: '' },
    { id: `c_slot_${Date.now()}_3`, url: '', caption: '' },
    { id: `c_slot_${Date.now()}_4`, url: '', caption: '' },
    { id: `c_slot_${Date.now()}_5`, url: '', caption: '' },
  ];

  const createBlankBoardSlots = (): DraftMediaItem[] => [
    { id: `b_slot_${Date.now()}_1`, url: '', caption: '' },
    { id: `b_slot_${Date.now()}_2`, url: '', caption: '' },
    { id: `b_slot_${Date.now()}_3`, url: '', caption: '' },
    { id: `b_slot_${Date.now()}_4`, url: '', caption: '' },
    { id: `b_slot_${Date.now()}_5`, url: '', caption: '' },
  ];

  const handleSlotUploadClick = (index: number) => {
    targetSlotIndexRef.current = index;
    singleSlotFileInputRef.current?.click();
  };

  const handleSingleSlotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessingFiles(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageFile(file);
      const targetIdx = targetSlotIndexRef.current;
      if (targetIdx !== null && targetIdx >= 0) {
        setMediaItems((prev) =>
          prev.map((item, idx) => (idx === targetIdx ? { ...item, url: dataUrl } : item))
        );
      }
    } catch (err) {
      console.error('Error uploading slot image:', err);
      setErrorMsg('Failed to process image upload.');
    } finally {
      setIsProcessingFiles(false);
      targetSlotIndexRef.current = null;
      if (singleSlotFileInputRef.current) singleSlotFileInputRef.current.value = '';
    }
  };

  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Link card state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkSubtitle, setLinkSubtitle] = useState('');
  const [linkIcon, setLinkIcon] = useState('🌐');
  const [linkImageUrl, setLinkImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  // Grid Post state (circles = avatars, squares = generic links)
  const [gridColumns, setGridColumns] = useState<4 | 5>(5);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  // Slot draft state for the Item Builder modal
  const [slotKind, setSlotKind] = useState<GridItemKind>('avatar');
  const [slotTitle, setSlotTitle] = useState('');
  const [slotUrl, setSlotUrl] = useState('');
  const [slotSubtitle, setSlotSubtitle] = useState('');
  const [slotImageUrl, setSlotImageUrl] = useState('');
  const [slotBgColor, setSlotBgColor] = useState('#1d9bf0');
  const [slotIcon, setSlotIcon] = useState('💻');
  const [slotShowLabel, setSlotShowLabel] = useState(true);
  const [isSelectOomfModalOpen, setIsSelectOomfModalOpen] = useState(false);

  const authorUser: User = targetUser || (authProfile ? {
    id: authUser?.id || `usr_${authProfile.username}`,
    username: authProfile.username,
    name: authProfile.name || authProfile.username,
    avatar: authProfile.avatar_url || CURRENT_USER.avatar,
    banner: authProfile.banner_url || '',
    bio: authProfile.bio || '',
    joined: 'October 2026',
    followingCount: 0,
    followersCount: 0,
    oomfsCount: 0,
    links: []
  } : CURRENT_USER);

  useEffect(() => {
    setPostType(defaultType);
    if (defaultType === 'carousel') {
      setMediaItems(createBlankCarouselSlots());
    } else if (defaultType === 'board') {
      setMediaItems(createBlankBoardSlots());
    }
  }, [defaultType]);

  // Handle multi-file upload from computer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setErrorMsg(null);

    try {
      const dataUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImageFile(file);
        dataUrls.push(dataUrl);
      }

      setMediaItems((prev) => {
        let fileIdx = 0;
        // First fill empty slots in order
        const updated = prev.map((item) => {
          if (!item.url && fileIdx < dataUrls.length) {
            const filled = { ...item, url: dataUrls[fileIdx] };
            fileIdx++;
            return filled;
          }
          return item;
        });

        // If more files remain, append new slots
        while (fileIdx < dataUrls.length) {
          updated.push({
            id: `media_${Date.now()}_${fileIdx}`,
            url: dataUrls[fileIdx],
            caption: ''
          });
          fileIdx++;
        }
        return updated;
      });
    } catch (err) {
      console.error('Error processing uploaded images:', err);
      setErrorMsg('Could not process one or more image files.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle adding image via pasted URL
  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setMediaItems((prev) => [
      ...prev,
      {
        id: `media_${Date.now()}_${prev.length}`,
        url: trimmed,
        caption: ''
      }
    ]);
    setUrlInput('');
    setShowUrlInput(false);
    setErrorMsg(null);
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveMedia = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaItems.length) return;
    const updated = [...mediaItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setMediaItems(updated);
  };

  const handleGridItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessingFiles(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageFile(file, 800, 0.85);
      setSlotImageUrl(dataUrl);
    } catch (err) {
      console.error('Error processing grid item image:', err);
      setErrorMsg('Failed to process image.');
    } finally {
      setIsProcessingFiles(false);
      if (gridItemImageInputRef.current) {
        gridItemImageInputRef.current.value = '';
      }
    }
  };

  const handleOpenSlotModal = (index?: number) => {
    if (index !== undefined && index >= 0 && index < gridItems.length) {
      const item = gridItems[index];
      setEditingSlotIndex(index);
      setSlotKind(item.kind);
      setSlotTitle(item.title || '');
      setSlotUrl(item.url || '');
      setSlotSubtitle(item.subtitle || '');
      setSlotImageUrl(item.imageUrl || '');
      setSlotBgColor(item.bgColor || '#1d9bf0');
      setSlotIcon(item.icon || (item.kind === 'avatar' ? '👤' : '🔗'));
      setSlotShowLabel(item.showLabel !== false);
    } else {
      setEditingSlotIndex(null);
      setSlotKind('avatar');
      setSlotTitle('');
      setSlotUrl('');
      setSlotSubtitle('');
      setSlotImageUrl('');
      setSlotBgColor('#1d9bf0');
      setSlotIcon('💻');
      setSlotShowLabel(true);
    }
    setSlotModalOpen(true);
  };

  const handleSaveSlot = () => {
    if (!slotTitle.trim() || !slotUrl.trim()) {
      setErrorMsg('Please provide both a Title and Destination URL.');
      return;
    }

    const itemData: GridItem = {
      id: editingSlotIndex !== null && gridItems[editingSlotIndex] 
        ? gridItems[editingSlotIndex].id 
        : `gi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      kind: slotKind,
      title: slotTitle.trim(),
      url: slotUrl.trim().startsWith('http') || slotUrl.trim().startsWith('/') ? slotUrl.trim() : `https://${slotUrl.trim()}`,
      subtitle: slotSubtitle.trim() || undefined,
      imageUrl: slotImageUrl.trim() || undefined,
      bgColor: slotKind === 'link' ? slotBgColor : undefined,
      icon: slotKind === 'link' && !slotImageUrl ? slotIcon : undefined,
      showLabel: slotShowLabel
    };

    if (editingSlotIndex !== null && editingSlotIndex >= 0) {
      setGridItems((prev) => prev.map((item, idx) => idx === editingSlotIndex ? itemData : item));
    } else {
      setGridItems((prev) => [...prev, itemData]);
    }

    setSlotModalOpen(false);
    setEditingSlotIndex(null);
    setErrorMsg(null);
  };

  const handleRemoveSlot = (index: number) => {
    setGridItems((prev) => prev.filter((_, idx) => idx !== index));
    if (editingSlotIndex === index) {
      setSlotModalOpen(false);
      setEditingSlotIndex(null);
    }
  };

  const handleLoadSampleGrid = () => {
    setGridItems([
      {
        id: `gi_${Date.now()}_1`,
        kind: 'avatar',
        title: 'Kyle Vance',
        url: '/dev_kyle',
        subtitle: '@dev_kyle',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        showLabel: true
      },
      {
        id: `gi_${Date.now()}_2`,
        kind: 'link',
        title: 'GitHub',
        url: 'https://github.com',
        subtitle: 'github.com',
        bgColor: '#0f1419',
        icon: '💻',
        showLabel: true
      },
      {
        id: `gi_${Date.now()}_3`,
        kind: 'avatar',
        title: 'Sora',
        url: '/sora_arts',
        subtitle: '@sora_arts',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        showLabel: true
      },
      {
        id: `gi_${Date.now()}_4`,
        kind: 'link',
        title: 'Figma',
        url: 'https://figma.com',
        subtitle: 'figma.com',
        bgColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        icon: '🎨',
        showLabel: true
      },
      {
        id: `gi_${Date.now()}_5`,
        kind: 'avatar',
        title: 'Jack',
        url: '/jack',
        subtitle: '@jack',
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        showLabel: true
      },
      {
        id: `gi_${Date.now()}_6`,
        kind: 'link',
        title: 'Next.js',
        url: 'https://nextjs.org',
        subtitle: 'nextjs.org',
        bgColor: '#000000',
        icon: '▲',
        showLabel: false
      },
      {
        id: `gi_${Date.now()}_7`,
        kind: 'link',
        title: 'Spotify',
        url: 'https://spotify.com',
        subtitle: 'spotify.com',
        bgColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
        icon: '🎧',
        showLabel: false
      },
      {
        id: `gi_${Date.now()}_8`,
        kind: 'link',
        title: 'Neocities',
        url: 'https://neocities.org',
        subtitle: 'neocities.org',
        bgColor: '#e06800',
        icon: '👾',
        showLabel: false
      }
    ]);
    setErrorMsg(null);
  };

  const handleLinkImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessingFiles(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageFile(file, 900, 0.85);
      setLinkImageUrl(dataUrl);
    } catch (err) {
      console.error('Error processing link card image:', err);
      setErrorMsg('Failed to process image.');
    } finally {
      setIsProcessingFiles(false);
      if (linkImageInputRef.current) {
        linkImageInputRef.current.value = '';
      }
    }
  };

  // Validation check
  const canSubmit = () => {
    if (isSubmitting || isProcessingFiles) return false;
    if (postType === 'standard') return text.trim().length > 0;
    if (postType === 'carousel') return mediaItems.some((m) => m.url.trim().length > 0);
    if (postType === 'board') return mediaItems.filter((m) => m.url.trim().length > 0).length >= 3;
    if (postType === 'link_card') return linkTitle.trim().length > 0 && linkUrl.trim().length > 0;
    if (postType === 'grid') return gridItems.length >= 1;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const filledCarouselSlides = mediaItems.filter((m) => m.url.trim().length > 0);
    if (postType === 'carousel' && filledCarouselSlides.length < 1) {
      setErrorMsg('Please upload at least 1 photo for your carousel.');
      return;
    }
    const filledBoardImages = mediaItems.filter((m) => m.url.trim().length > 0);
    if (postType === 'board' && filledBoardImages.length < 3) {
      setErrorMsg('Boards require at least 3 uploaded images.');
      return;
    }
    if (postType === 'grid' && gridItems.length < 1) {
      setErrorMsg('Please add at least 1 item to your Grid.');
      return;
    }

    if (!canSubmit()) return;
    setIsSubmitting(true);

    const blockContent: any = {
      text: text.trim(),
      ...(postType === 'carousel' ? {
        carouselData: {
          slides: filledCarouselSlides.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption.trim() || undefined
          }))
        }
      } : {}),
      ...(postType === 'board' ? {
        boardData: {
          images: filledBoardImages.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption.trim() || undefined
          }))
        }
      } : {}),
      ...(postType === 'link_card' ? {
        linkData: {
          title: linkTitle.trim(),
          subtitle: linkSubtitle.trim() || undefined,
          description: linkSubtitle.trim() || undefined,
          icon: linkIcon.trim() || undefined,
          image: linkImageUrl.trim() || undefined,
          url: linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`,
          buttonText: 'Visit Link ↗',
          pageId: selectedCollectionId || 'main'
        }
      } : {}),
      ...(postType === 'grid' ? {
        gridData: {
          columns: gridColumns,
          items: gridItems
        }
      } : {})
    };

    let newPostId = `post_${Date.now()}`;

    // Save to Supabase blocks table if signed in
    if (authUser?.id) {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .insert({
            user_id: authUser.id,
            type: postType,
            content: blockContent
          })
          .select('id')
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          setErrorMsg(`Failed to save to Supabase: ${error.message}`);
          setIsSubmitting(false);
          return;
        }
        if (data?.id) {
          newPostId = data.id;
        }
      } catch (err: any) {
        console.error('Error inserting post into Supabase:', err);
        setErrorMsg('Unexpected error saving post.');
        setIsSubmitting(false);
        return;
      }
    }

    const newPost: Post = {
      id: newPostId,
      author: authorUser,
      createdAt: 'Just now',
      type: postType,
      text: blockContent.text,
      carouselData: blockContent.carouselData,
      boardData: blockContent.boardData,
      linkData: blockContent.linkData,
      gridData: blockContent.gridData,
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1'
    };

    saveSessionPost(newPost);

    const targetCollection = selectedCollectionId;

    if (targetCollection) {
      addItemToCollection(targetCollection, newPostId, authorUser.id);
    }

    if (onAddPost) {
      onAddPost(newPost);
    }

    // Broadcast globally so ProfileView updates immediately even if posted from LeftSidebar modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('oomfs:post-created', {
          detail: { post: newPost, collectionId: targetCollection }
        })
      );
    }

    // Reset state
    setSelectedCollectionId(null);
    setText('');
    setMediaItems([]);
    setLinkTitle('');
    setLinkSubtitle('');
    setLinkIcon('🌐');
    setLinkImageUrl('');
    setLinkUrl('');
    setLinkDescription('');
    setGridItems([]);
    setGridColumns(5);
    setIsSubmitting(false);

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`bg-white flex flex-col ${compact ? '' : 'border-b border-[#eff3f4]'}`}>
      <div className="p-4 flex gap-3">
          <img
            src={formatTwitterAvatar(authorUser.avatar)}
            alt={authorUser.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
          />

          <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Main Post Textarea (visible for all post types with contextual placeholder) */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            postType === 'grid'
              ? "Add thoughts or a caption for your grid... (optional)"
              : postType === 'link_card'
              ? "Add thoughts or a caption for your link... (optional)"
              : postType === 'carousel'
              ? "Add thoughts or a caption for your carousel... (optional)"
              : postType === 'board'
              ? "Add thoughts or a caption for your board... (optional)"
              : "What is happening?!"
          }
          rows={compact ? 2 : 3}
          className="w-full text-[15px] text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
        />

        {/* Hidden Single Slot File Input */}
        <input
          ref={singleSlotFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleSingleSlotFileChange}
          className="hidden"
        />

        {/* Hidden Multi-File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden Grid Item Image Input */}
        <input
          ref={gridItemImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleGridItemImageChange}
          className="hidden"
        />

        {/* Hidden Link Card Image Input */}
        <input
          ref={linkImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleLinkImageChange}
          className="hidden"
        />

        {/* CAROUSEL DRAFTING UI */}
        {postType === 'carousel' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
            {/* Horizontal Slide Previews with Upload Placeholders */}
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
              {mediaItems.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="w-48 shrink-0 bg-white border border-[#eff3f4] rounded-xl overflow-hidden flex flex-col shadow-2xs"
                >
                  <div className="relative h-36 bg-[#eff3f4] flex items-center justify-center overflow-hidden">
                    {slide.url ? (
                      <>
                        <img
                          src={slide.url}
                          alt={`Slide ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(idx, 'left')}
                              className="p-1 bg-black/65 hover:bg-black text-white rounded-full cursor-pointer"
                              title="Move left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {idx < mediaItems.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(idx, 'right')}
                              className="p-1 bg-black/65 hover:bg-black text-white rounded-full cursor-pointer"
                              title="Move right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(slide.id)}
                            className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer"
                            title="Remove slide"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => handleSlotUploadClick(idx)}
                        className="w-full h-full flex flex-col items-center justify-center text-[#536471] hover:text-[#1d9bf0] hover:bg-blue-50/50 transition-colors cursor-pointer p-3 text-center border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] rounded-t-xl"
                        title="Click to upload photo"
                      >
                        <span className="absolute top-1.5 left-1.5 bg-gray-200 text-[#536471] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMedia(slide.id);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 text-[#536471] hover:text-red-500 rounded-full cursor-pointer"
                          title="Remove slot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <Upload className="w-5 h-5 mb-1 text-[#1d9bf0]" />
                        <span className="text-[11px] font-bold">Add Photo</span>
                        <span className="text-[9px] text-[#536471]">(Click to browse)</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <input
                      type="text"
                      placeholder={`Post — ${String(idx + 1).padStart(2, '0')}`}
                      value={slide.caption}
                      onChange={(e) => handleUpdateCaption(slide.id, e.target.value)}
                      className="w-full text-xs text-[#0f1419] placeholder-[#536471]/50 bg-[#f7f9f9] border border-[#eff3f4] focus:border-[#1d9bf0] rounded-lg px-2 py-1.5 outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}

              {/* Add Slide Button */}
              <button
                type="button"
                onClick={() => {
                  setMediaItems((prev) => [
                    ...prev,
                    { id: `c_slot_${Date.now()}_${prev.length + 1}`, url: '', caption: '' }
                  ]);
                }}
                className="w-44 shrink-0 h-44 rounded-xl border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                title="Add another slide slot"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-bold">Add Slide</span>
              </button>
            </div>

            {/* Upload multi-files control */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessingFiles ? 'Processing...' : 'Upload Photos'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="bg-white border border-[#eff3f4] hover:border-gray-300 text-[#0f1419] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-[#536471]" />
                <span>Paste Image URL</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="bg-[#0f1419] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOARD DRAFTING UI */}
        {postType === 'board' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
                <span>Board Builder ({mediaItems.filter(m => m.url.trim().length > 0).length} images · min 3)</span>
              </span>
              {mediaItems.filter(m => m.url.trim().length > 0).length < 3 && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Upload at least 3 images
                </span>
              )}
            </div>

            {/* List of 5 Board Image Slots with Placeholders */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {mediaItems.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-white border border-[#eff3f4] rounded-xl overflow-hidden flex flex-col shadow-2xs"
                >
                  <div className="relative h-28 bg-[#eff3f4] flex items-center justify-center overflow-hidden">
                    {img.url ? (
                      <>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(img.id)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => handleSlotUploadClick(idx)}
                        className="w-full h-full flex flex-col items-center justify-center text-[#536471] hover:text-[#1d9bf0] hover:bg-blue-50/50 transition-colors cursor-pointer p-2 text-center border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] rounded-t-xl"
                        title="Click to upload image"
                      >
                        <span className="absolute top-1 left-1 bg-gray-200 text-[#536471] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMedia(img.id);
                          }}
                          className="absolute top-1 right-1 p-1 text-[#536471] hover:text-red-500 rounded-full cursor-pointer"
                          title="Remove slot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <Upload className="w-4 h-4 mb-0.5 text-[#1d9bf0]" />
                        <span className="text-[10px] font-bold">Add Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <input
                      type="text"
                      placeholder={`Board — ${String(idx + 1).padStart(2, '0')}`}
                      value={img.caption}
                      onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                      className="w-full text-[11px] text-[#0f1419] placeholder-[#536471]/50 bg-[#f7f9f9] border border-[#eff3f4] rounded px-1.5 py-1 outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}

              {/* Add Board Image Slot Button */}
              <button
                type="button"
                onClick={() => {
                  setMediaItems((prev) => [
                    ...prev,
                    { id: `b_slot_${Date.now()}_${prev.length + 1}`, url: '', caption: '' }
                  ]);
                }}
                className="h-36 rounded-xl border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                title="Add another board slot"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-bold">Add Slot</span>
              </button>
            </div>

            {/* Upload / Paste URL Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessingFiles ? 'Processing...' : 'Upload Board Images'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="bg-white border border-[#eff3f4] hover:border-gray-300 text-[#0f1419] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-[#536471]" />
                <span>Paste Image URL</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="bg-[#0f1419] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* IN-SITU EDITABLE BIO LINK CARD */}
        {postType === 'link_card' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-bold text-[#0f1419]">
                Bio Link Card (Edit directly in card)
              </span>
              {linkImageUrl && (
                <button
                  type="button"
                  onClick={() => setLinkImageUrl('')}
                  className="text-[11px] text-red-500 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Remove cover image</span>
                </button>
              )}
            </div>

            {/* The Interactive Card Container */}
            <div className="w-full h-32 sm:h-36 border border-[#cfd9de] focus-within:border-[#1d9bf0] rounded-2xl bg-white overflow-hidden flex flex-row shadow-2xs transition-colors">
              {/* Left Half (50%): Direct In-Card Form Inputs */}
              <div className="w-1/2 p-3 sm:p-4 flex flex-col justify-between min-w-0 pr-3">
                <div className="flex flex-col min-w-0 gap-1.5">
                  {/* Top Row: Icon Button + Title Input */}
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Click to choose icon/emoji"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] flex items-center justify-center text-lg shrink-0 transition-colors cursor-pointer select-none"
                    >
                      {linkIcon || '🌐'}
                    </button>
                    <input
                      type="text"
                      placeholder="Link Title (e.g. Portfolio)..."
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="font-bold text-[#0f1419] text-sm sm:text-base w-full bg-transparent outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-[#1d9bf0] transition-colors truncate"
                      required
                    />
                  </div>

                  {/* Subtitle Input */}
                  <input
                    type="text"
                    placeholder="Subtitle or short note..."
                    value={linkSubtitle}
                    onChange={(e) => setLinkSubtitle(e.target.value)}
                    className="text-xs text-[#536471] w-full bg-transparent outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-[#1d9bf0] transition-colors"
                  />
                </div>

                {/* Bottom URL Input */}
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#1d9bf0] font-mono min-w-0">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full text-[11px] text-[#1d9bf0] font-mono bg-transparent outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-[#1d9bf0] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Right Half (50%): Click-to-Upload Cover Image */}
              <div 
                onClick={() => linkImageInputRef.current?.click()}
                className="w-1/2 h-full overflow-hidden shrink-0 border-l border-[#eff3f4] bg-gray-50 relative cursor-pointer group flex items-center justify-center"
                title={linkImageUrl ? "Click to change cover image" : "Click to upload cover image"}
              >
                {linkImageUrl ? (
                  <>
                    <img
                      src={linkImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity">
                      <Upload className="w-4 h-4" />
                      <span>Change</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] text-[#536471] group-hover:text-[#1d9bf0] group-hover:bg-blue-50/40 transition-colors gap-1.5 p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#1d9bf0] group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold">Upload Cover Image</span>
                    <span className="text-[9px] text-[#536471]">(Click to browse)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Emoji Picker Drawer */}
            {showEmojiPicker && (
              <div className="flex flex-wrap gap-1.5 items-center p-2 bg-white rounded-xl border border-[#eff3f4] animate-in fade-in duration-100">
                <span className="text-[11px] font-bold text-[#536471] mr-1">Quick Icons:</span>
                {['🌐', '🎨', '💼', '📝', '🎧', '⚡', '☕', '🔗', '🚀', '📸', '💻', '✨', '🔥'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setLinkIcon(em);
                      setShowEmojiPicker(false);
                    }}
                    className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      linkIcon === em ? 'bg-[#1d9bf0]/15 ring-1 ring-[#1d9bf0]' : 'hover:bg-gray-100'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UNIFIED GRID (4 or 5 Columns, Circles = Avatars, Squares = Links) */}
        {postType === 'grid' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
            {/* Header controls: Columns toggle & Load sample */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#eff3f4]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0f1419]">Grid Canvas</span>
                <span className="text-[11px] text-[#536471]">
                  ({gridItems.length} {gridItems.length === 1 ? 'item' : 'items'} · circles = avatars, squares = links)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-[#eff3f4] rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setGridColumns(4)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      gridColumns === 4 ? 'bg-[#1d9bf0] text-white font-bold shadow-2xs' : 'text-[#536471] hover:text-[#0f1419]'
                    }`}
                  >
                    4 Cols
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridColumns(5)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      gridColumns === 5 ? 'bg-[#1d9bf0] text-white font-bold shadow-2xs' : 'text-[#536471] hover:text-[#0f1419]'
                    }`}
                  >
                    5 Cols
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSampleGrid}
                  className="text-xs font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Populate test avatars and square links"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample</span>
                </button>
              </div>
            </div>

            {/* Dotted outlines matrix */}
            <div className={`grid gap-2.5 sm:gap-3 p-3 bg-white rounded-xl border border-[#eff3f4] ${
              gridColumns === 4 ? 'grid-cols-4' : 'grid-cols-5'
            }`}>
              {/* Existing Items */}
              {gridItems.map((item, idx) => (
                <div
                  key={item.id || `gi_${idx}`}
                  onClick={() => handleOpenSlotModal(idx)}
                  className="group/slot relative flex flex-col items-center justify-start p-1.5 rounded-xl border border-transparent hover:border-[#1d9bf0]/40 hover:bg-[#1d9bf0]/5 transition-all cursor-pointer"
                  title={`Click to edit ${item.title}`}
                >
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSlot(idx);
                    }}
                    className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-xs cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Slot Media Shape */}
                  <div className={`overflow-hidden shrink-0 flex items-center justify-center ${
                    gridColumns === 4 
                      ? 'w-14 h-14 sm:w-16 sm:h-16' 
                      : 'w-11 h-11 sm:w-14 sm:h-14'
                  } ${
                    item.kind === 'avatar' 
                      ? 'rounded-full ring-2 ring-black/10 bg-gray-100' 
                      : 'rounded-xl border border-black/10 bg-white'
                  }`}>
                    {item.kind === 'avatar' ? (
                      item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-full pointer-events-none" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1d9bf0] to-[#8b5cf6] text-white font-bold flex items-center justify-center text-sm select-none">
                          {item.title.slice(0, 1).toUpperCase()}
                        </div>
                      )
                    ) : (
                      item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-white p-1 text-center select-none"
                          style={{ background: item.bgColor || '#0f1419' }}
                        >
                          {item.icon ? (
                            <span className="text-lg leading-none">{item.icon}</span>
                          ) : (
                            <span className="font-bold text-xs truncate max-w-full">{item.title.slice(0, 3)}</span>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Micro-label */}
                  {item.showLabel && (
                    <span className="text-[10px] font-semibold text-[#0f1419] truncate max-w-full text-center mt-1 leading-tight px-0.5">
                      {item.title}
                    </span>
                  )}
                </div>
              ))}

              {/* Dotted Empty Slot(s) */}
              {Array.from({ length: gridItems.length === 0 ? gridColumns : 1 }).map((_, emptyIdx) => (
                <div
                  key={`empty_${emptyIdx}`}
                  onClick={() => handleOpenSlotModal()}
                  className="flex flex-col items-center justify-center min-h-[76px] p-2 rounded-xl border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-all cursor-pointer group"
                  title="Click to place a circle avatar or square link"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-[#1d9bf0]/10 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-center group-hover:text-[#1d9bf0]">
                    Add Slot
                  </span>
                </div>
              ))}
            </div>

            {/* Hint & Add Slot Pill */}
            <div className="flex items-center justify-between text-xs text-[#536471] px-1">
              <span>Click any slot to customize circle or square.</span>
              <button
                type="button"
                onClick={() => handleOpenSlotModal()}
                className="text-[#1d9bf0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}

        {/* Optional Collection Assignment Selector (for all post types) */}
        {availableCollections.length > 0 && (
          <div className="flex flex-col gap-1.5 px-3 py-2 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#1d9bf0]" />
                <span className="font-bold text-[#0f1419]">Add to collection:</span>
                <select
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value || null)}
                  className="bg-white border border-[#cfd9de] focus:border-[#1d9bf0] rounded-lg px-2 py-1 text-xs text-[#0f1419] outline-none cursor-pointer"
                >
                  <option value="">None (main timeline)</option>
                  {availableCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.icon || '📁'} {col.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
          <div className="flex items-center gap-1 text-[#1d9bf0]">
            <button
              type="button"
              onClick={() => {
                if (postType === 'standard') setPostType('carousel');
                fileInputRef.current?.click();
              }}
              title="Upload images"
              className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors cursor-pointer"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                if (postType === 'carousel') {
                  setPostType('standard');
                } else {
                  setPostType('carousel');
                  if (mediaItems.length === 0) {
                    setMediaItems(createBlankCarouselSlots());
                  }
                }
              }}
              title="Create Carousel"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'carousel' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                if (postType === 'board') {
                  setPostType('standard');
                } else {
                  setPostType('board');
                  if (mediaItems.length === 0) {
                    setMediaItems(createBlankBoardSlots());
                  }
                }
              }}
              title="Create Board"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'board' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setPostType((prev) => (prev === 'link_card' ? 'standard' : 'link_card'));
              }}
              title="Create Bio Link"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'link_card' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <Link2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setPostType((prev) => (prev === 'grid' ? 'standard' : 'grid'));
              }}
              title="Avatars & Links Grid"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'grid' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <Grid2X2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-bold text-[#536471] hover:bg-[#f7f9f9] rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit()}
              className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 text-white font-bold px-5 py-2 rounded-full text-xs transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>

      {/* MODAL: Configure Grid Item (Circle Avatar or Square Generic Link) */}
      {slotModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#eff3f4]">
              <span className="font-bold text-sm text-[#0f1419]">
                {editingSlotIndex !== null ? 'Edit Grid Item' : 'Add Item to Grid'}
              </span>
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="p-1 text-[#536471] hover:bg-[#f7f9f9] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Archetype Selector (Circle Avatar vs Square Link) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSlotKind('avatar')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    slotKind === 'avatar'
                      ? 'border-[#1d9bf0] bg-[#1d9bf0]/5 ring-1 ring-[#1d9bf0]'
                      : 'border-[#eff3f4] hover:bg-[#f7f9f9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1d9bf0] flex items-center justify-center">
                      <Circle className="w-5 h-5 fill-current" />
                    </div>
                    {slotKind === 'avatar' && <Check className="w-4 h-4 text-[#1d9bf0]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#0f1419]">Avatar (Circle)</h5>
                    <p className="text-[10px] text-[#536471] leading-tight mt-0.5">
                      Mutual, friend, or user profile
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSlotKind('link')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    slotKind === 'link'
                      ? 'border-[#1d9bf0] bg-[#1d9bf0]/5 ring-1 ring-[#1d9bf0]'
                      : 'border-[#eff3f4] hover:bg-[#f7f9f9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center">
                      <Square className="w-5 h-5 fill-current" />
                    </div>
                    {slotKind === 'link' && <Check className="w-4 h-4 text-[#1d9bf0]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#0f1419]">Generic Link (Square)</h5>
                    <p className="text-[10px] text-[#536471] leading-tight mt-0.5">
                      Website, tool, portfolio, or repo
                    </p>
                  </div>
                </button>
              </div>

              {/* Live Slot Preview */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl gap-1.5">
                <div className={`w-14 h-14 overflow-hidden shrink-0 flex items-center justify-center ${
                  slotKind === 'avatar' 
                    ? 'rounded-full ring-2 ring-black/10 bg-gray-100' 
                    : 'rounded-xl border border-black/10 bg-white'
                }`}>
                  {slotKind === 'avatar' ? (
                    slotImageUrl ? (
                      <img src={slotImageUrl} alt="preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1d9bf0] to-[#8b5cf6] text-white font-bold flex items-center justify-center text-base">
                        {slotTitle ? slotTitle.slice(0, 1).toUpperCase() : '👤'}
                      </div>
                    )
                  ) : (
                    slotImageUrl ? (
                      <img src={slotImageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center text-white p-1 text-center"
                        style={{ background: slotBgColor || '#0f1419' }}
                      >
                        <span className="text-xl leading-none">{slotIcon || '🔗'}</span>
                      </div>
                    )
                  )}
                </div>
                {slotShowLabel && (
                  <span className="text-[11px] font-semibold text-[#0f1419] truncate max-w-[120px] text-center">
                    {slotTitle || 'Item Label'}
                  </span>
                )}
              </div>

              {/* Avatar Specific Options */}
              {slotKind === 'avatar' && (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSelectOomfModalOpen(true)}
                    className="w-full py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Users className="w-4 h-4" />
                    <span>Select from Mutuals & Following</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#536471]">Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Kyle Vance"
                        value={slotTitle}
                        onChange={(e) => setSlotTitle(e.target.value)}
                        className="bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#536471]">Profile URL</label>
                      <input
                        type="text"
                        placeholder="/username"
                        value={slotUrl}
                        onChange={(e) => setSlotUrl(e.target.value)}
                        className="bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#536471]">Avatar Image</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => gridItemImageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-[#cfd9de] hover:border-[#1d9bf0] text-xs font-semibold text-[#0f1419] rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        {slotImageUrl ? 'Change' : 'Upload'}
                      </button>
                      <input
                        type="text"
                        placeholder="or paste image URL..."
                        value={slotImageUrl.startsWith('data:') ? '' : slotImageUrl}
                        onChange={(e) => setSlotImageUrl(e.target.value)}
                        className="flex-1 bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Generic Link Specific Options */}
              {slotKind === 'link' && (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#536471]">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. GitHub, Figma..."
                        value={slotTitle}
                        onChange={(e) => setSlotTitle(e.target.value)}
                        className="bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#536471]">Destination URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={slotUrl}
                        onChange={(e) => setSlotUrl(e.target.value)}
                        className="bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#536471]">Cover Image (Square)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => gridItemImageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-[#cfd9de] hover:border-[#1d9bf0] text-xs font-semibold text-[#0f1419] rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        {slotImageUrl ? 'Change' : 'Upload'}
                      </button>
                      <input
                        type="text"
                        placeholder="or paste square image URL..."
                        value={slotImageUrl.startsWith('data:') ? '' : slotImageUrl}
                        onChange={(e) => setSlotImageUrl(e.target.value)}
                        className="flex-1 bg-white border border-[#eff3f4] rounded-xl px-3 py-1.5 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
                      />
                    </div>
                  </div>

                  {/* Icon & Color Fallback */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[11px] font-bold text-[#536471]">Preset Icon & Color (if no image)</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['💻', '🎨', '⚡', '▲', '🎧', '👾', '🌊', '📁', '🌐', '✨', '🔥', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSlotIcon(em)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform ${
                            slotIcon === em ? 'bg-[#1d9bf0]/20 scale-110 ring-2 ring-[#1d9bf0]' : 'hover:bg-gray-100'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        '#0f1419',
                        '#1d9bf0',
                        '#10b981',
                        '#8b5cf6',
                        '#ec4899',
                        '#ef4444',
                        '#f59e0b',
                        '#06b6d4',
                        'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
                        'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        'linear-gradient(135deg, #10b981, #06b6d4)'
                      ].map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setSlotBgColor(bg)}
                          className={`w-5 h-5 rounded-md transition-transform cursor-pointer ${
                            slotBgColor === bg ? 'scale-125 ring-2 ring-offset-1 ring-[#1d9bf0]' : 'hover:scale-110'
                          }`}
                          style={{ background: bg }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Micro-label toggle */}
              <div className="pt-2 border-t border-[#eff3f4]">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#0f1419]">
                  <input
                    type="checkbox"
                    checked={slotShowLabel}
                    onChange={(e) => setSlotShowLabel(e.target.checked)}
                    className="rounded text-[#1d9bf0] focus:ring-[#1d9bf0] w-4 h-4 cursor-pointer"
                  />
                  <span>Show text title underneath item</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
                {editingSlotIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(editingSlotIndex)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Delete Item
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-bold text-[#536471] hover:bg-[#f7f9f9] rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSlot}
                    disabled={!slotTitle.trim() || !slotUrl.trim()}
                    className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs"
                  >
                    {editingSlotIndex !== null ? 'Save Changes' : 'Add to Grid'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for selecting an OOMF / Mutual to feature in Avatar mode */}
      <SelectOomfModal
        isOpen={isSelectOomfModalOpen}
        onClose={() => setIsSelectOomfModalOpen(false)}
        currentUserId={authUser?.id}
        onSelectUser={(user) => {
          setSlotTitle(user.name);
          setSlotUrl(`/${user.username}`);
          setSlotSubtitle(`@${user.username}`);
          setSlotImageUrl(user.avatar);
          setSlotKind('avatar');
        }}
      />
    </div>
  );
}
