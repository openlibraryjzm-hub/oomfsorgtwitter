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
  FileText,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { CURRENT_USER, Post, User } from '@/lib/mockData';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';

interface PostComposerProps {
  onAddPost?: (post: Post) => void;
  onClose?: () => void;
  defaultType?: 'standard' | 'carousel' | 'board' | 'link_card';
  targetUser?: User;
  compact?: boolean;
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

export default function PostComposer({
  onAddPost,
  onClose,
  defaultType = 'standard',
  targetUser,
  compact = false
}: PostComposerProps) {
  const { user: authUser, profile: authProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [postType, setPostType] = useState<'standard' | 'carousel' | 'board' | 'link_card'>(defaultType);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carousel state
  const [carouselHeader, setCarouselHeader] = useState('');
  const [mediaItems, setMediaItems] = useState<DraftMediaItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Link card state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  useEffect(() => {
    setPostType(defaultType);
  }, [defaultType]);

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

  // Handle multi-file upload from computer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setErrorMsg(null);

    try {
      const added: DraftMediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImageFile(file);
        added.push({
          id: `media_${Date.now()}_${i}`,
          url: dataUrl,
          caption: ''
        });
      }
      setMediaItems((prev) => [...prev, ...added]);
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

  // Validation check
  const canSubmit = () => {
    if (isSubmitting || isProcessingFiles) return false;
    if (postType === 'standard') return text.trim().length > 0;
    if (postType === 'carousel') return mediaItems.length >= 1;
    if (postType === 'board') return mediaItems.length >= 3;
    if (postType === 'link_card') return linkTitle.trim().length > 0 && linkUrl.trim().length > 0;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (postType === 'carousel' && mediaItems.length < 1) {
      setErrorMsg('Please add at least 1 image to your Carousel.');
      return;
    }
    if (postType === 'board' && mediaItems.length < 3) {
      setErrorMsg('Boards require at least 3 images (for the 3-image preview & thread board).');
      return;
    }

    if (!canSubmit()) return;
    setIsSubmitting(true);

    const blockContent: any = {
      text: text.trim(),
      ...(postType === 'carousel' ? {
        carouselData: {
          header: carouselHeader.trim() || 'Photo Carousel',
          slides: mediaItems.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption.trim() || undefined
          }))
        }
      } : {}),
      ...(postType === 'board' ? {
        boardData: {
          images: mediaItems.map((m) => ({
            id: m.id,
            url: m.url,
            caption: m.caption.trim() || undefined
          }))
        }
      } : {}),
      ...(postType === 'link_card' ? {
        linkData: {
          title: linkTitle.trim(),
          url: linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`,
          description: linkDescription.trim() || undefined,
          buttonText: 'Visit Link ↗'
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
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1'
    };

    saveSessionPost(newPost);

    if (onAddPost) {
      onAddPost(newPost);
    }

    // Broadcast globally so ProfileView updates immediately even if posted from LeftSidebar modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: newPost }));
    }

    // Reset state
    setText('');
    setCarouselHeader('');
    setMediaItems([]);
    setLinkTitle('');
    setLinkUrl('');
    setLinkDescription('');
    setIsSubmitting(false);

    if (onClose) {
      onClose();
    }
  };

  const handleLoadSampleCarousel = () => {
    setErrorMsg(null);
    if (!carouselHeader.trim()) {
      setCarouselHeader('weekend film roll 📸 (5 slides)');
    }
    setMediaItems([
      {
        id: `sample_c_${Date.now()}_1`,
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=900&fit=crop',
        caption: '01 — morning light (portrait)'
      },
      {
        id: `sample_c_${Date.now()}_2`,
        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&h=680&fit=crop',
        caption: '02 — desk setup (landscape)'
      },
      {
        id: `sample_c_${Date.now()}_3`,
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=880&fit=crop',
        caption: '03 — late night study'
      },
      {
        id: `sample_c_${Date.now()}_4`,
        url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=960&h=640&fit=crop',
        caption: '04 — shipping build v1'
      },
      {
        id: `sample_c_${Date.now()}_5`,
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=620&h=900&fit=crop',
        caption: '05 — handheld console archive'
      }
    ]);
  };

  const handleLoadSampleBoard = () => {
    setErrorMsg(null);
    setMediaItems([
      {
        id: `sample_b_${Date.now()}_1`,
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&h=950&fit=crop',
        caption: 'Concrete & warm oak facade'
      },
      {
        id: `sample_b_${Date.now()}_2`,
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=700&h=550&fit=crop',
        caption: 'Brushed aluminum details'
      },
      {
        id: `sample_b_${Date.now()}_3`,
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&h=600&fit=crop',
        caption: 'Minimalist studio lighting'
      },
      {
        id: `sample_b_${Date.now()}_4`,
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&h=920&fit=crop',
        caption: 'Mid-century lounge chair'
      },
      {
        id: `sample_b_${Date.now()}_5`,
        url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=700&h=560&fit=crop',
        caption: 'Clean modular shelving'
      }
    ]);
  };

  return (
    <div className={`bg-white p-4 flex gap-3 ${compact ? '' : 'border-b border-[#eff3f4]'}`}>
      <img
        src={formatTwitterAvatar(authorUser.avatar)}
        alt={authorUser.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
      />

      <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Post Type Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'standard', label: 'Standard', icon: FileText },
            { id: 'carousel', label: 'Carousel', icon: Layers },
            { id: 'board', label: 'Board (3+)', icon: LayoutGrid },
            { id: 'link_card', label: 'Bio Link', icon: Link2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = postType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPostType(tab.id as any);
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-[#f7f9f9] text-[#536471] hover:bg-[#eff3f4] hover:text-[#0f1419]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Post Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            postType === 'carousel'
              ? 'Write a caption for your carousel...'
              : postType === 'board'
              ? 'Describe this board / moodboard...'
              : postType === 'link_card'
              ? 'Add an optional note above your link card...'
              : 'What is happening?!'
          }
          rows={compact ? 2 : 3}
          className="w-full text-[15px] text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
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

        {/* CAROUSEL DRAFTING UI */}
        {postType === 'carousel' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1d9bf0]" />
                <span>Carousel Builder ({mediaItems.length} slides · uncapped)</span>
              </span>
            </div>

            {/* Universal Header Input */}
            <div>
              <label className="text-[11px] font-bold text-[#536471] block mb-1">
                Universal Carousel Header
              </label>
              <input
                type="text"
                placeholder="e.g., october studio & camera roll 📸"
                value={carouselHeader}
                onChange={(e) => setCarouselHeader(e.target.value)}
                className="w-full bg-white border border-[#eff3f4] focus:border-[#1d9bf0] rounded-xl px-3 py-2 text-xs font-semibold text-[#0f1419] outline-none"
              />
            </div>

            {/* Live Horizontal Slide Previews & Individual Bottom Captions */}
            {mediaItems.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                {mediaItems.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="w-48 shrink-0 bg-white border border-[#eff3f4] rounded-xl overflow-hidden flex flex-col shadow-2xs"
                  >
                    <div className="relative h-36 bg-[#eff3f4] flex items-center justify-center overflow-hidden">
                      <img
                        src={slide.url}
                        alt={`Slide ${idx + 1}`}
                        className="h-full w-auto object-cover"
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
                    </div>

                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Bottom overlay caption..."
                        value={slide.caption}
                        onChange={(e) => handleUpdateCaption(slide.id, e.target.value)}
                        className="w-full text-xs text-[#0f1419] placeholder-[#536471] bg-[#f7f9f9] border border-[#eff3f4] focus:border-[#1d9bf0] rounded-lg px-2 py-1.5 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Images Controls */}
            <div className="flex flex-wrap items-center gap-2">
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

              <button
                type="button"
                onClick={handleLoadSampleCarousel}
                className="bg-white border border-[#eff3f4] hover:border-[#1d9bf0] text-[#1d9bf0] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 5 Sample Slides</span>
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
                <span>Board Builder ({mediaItems.length} images · min 3)</span>
              </span>
              {mediaItems.length < 3 && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Add {3 - mediaItems.length} more {3 - mediaItems.length === 1 ? 'image' : 'images'}
                </span>
              )}
            </div>

            {/* Live 3-Image Split Preview when at least 3 images exist */}
            {mediaItems.length >= 3 && (
              <div>
                <span className="text-[11px] font-bold text-[#536471] block mb-1">
                  Timeline 3-Image Split Preview:
                </span>
                <div className="h-44 w-full rounded-xl overflow-hidden border border-[#eff3f4] grid grid-cols-2 gap-0.5 bg-[#eff3f4]">
                  <div className="w-full h-full overflow-hidden bg-white">
                    <img src={mediaItems[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="grid grid-rows-2 gap-0.5 w-full h-full overflow-hidden">
                    <div className="w-full h-full overflow-hidden bg-white">
                      <img src={mediaItems[1].url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative w-full h-full overflow-hidden bg-white">
                      <img src={mediaItems[2].url} alt="" className="w-full h-full object-cover" />
                      {mediaItems.length > 3 && (
                        <div className="absolute inset-0 bg-black/35 flex items-end justify-end p-2">
                          <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            +{mediaItems.length - 3} more in thread
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List of Board Images */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaItems.map((img, idx) => (
                  <div
                    key={img.id}
                    className="bg-white border border-[#eff3f4] rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="relative h-24 bg-[#eff3f4]">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {idx === 0 ? '1 (Left)' : idx === 1 ? '2 (Top-R)' : idx === 2 ? '3 (Bot-R)' : `#${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-1.5">
                      <input
                        type="text"
                        placeholder="Note (optional)..."
                        value={img.caption}
                        onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                        className="w-full text-[11px] text-[#0f1419] bg-[#f7f9f9] border border-[#eff3f4] rounded px-1.5 py-1 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload / Paste URL Buttons */}
            <div className="flex flex-wrap items-center gap-2">
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

              <button
                type="button"
                onClick={handleLoadSampleBoard}
                className="bg-white border border-[#eff3f4] hover:border-[#1d9bf0] text-[#1d9bf0] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 5 Sample Board Images</span>
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

        {/* BIO LINK CARD DRAFTING UI */}
        {postType === 'link_card' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-2">
            <span className="text-xs font-extrabold text-[#1d9bf0] uppercase tracking-wider">
              Bio Link Details
            </span>
            <input
              type="text"
              placeholder="Link Title (e.g., My 2026 Design Portfolio)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
              required
            />
            <input
              type="text"
              placeholder="URL (e.g., https://amberlyn.design)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
              required
            />
            <input
              type="text"
              placeholder="Short description (optional)"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              className="bg-white border border-[#eff3f4] rounded-xl px-3 py-2 text-xs text-[#0f1419] outline-none focus:border-[#1d9bf0]"
            />
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
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
              onClick={() => setPostType('carousel')}
              title="Create Carousel"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'carousel' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPostType('board')}
              title="Create Board"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'board' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPostType('link_card')}
              title="Create Bio Link"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                postType === 'link_card' ? 'bg-[#1d9bf0]/15 text-[#1d9bf0]' : 'hover:bg-[#1d9bf0]/10'
              }`}
            >
              <Link2 className="w-5 h-5" />
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
  );
}
