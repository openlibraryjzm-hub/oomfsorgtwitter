'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  X, 
  LayoutGrid, 
  Link as LinkIcon,
  FolderPlus,
  Users,
  Crop
} from 'lucide-react';
import { CURRENT_USER, Post, User, Collection, BoardItem } from '@/lib/mockData';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { addItemToCollection, getProfileCollections } from '@/lib/collections';
import SelectOomfModal from './SelectOomfModal';
import BoardCropModal from './BoardCropModal';

interface PostComposerProps {
  onAddPost?: (post: Post) => void;
  onClose?: () => void;
  defaultType?: 'board';
  targetUser?: User;
  compact?: boolean;
  collections?: Collection[];
  linkCollections?: Collection[];
  defaultLinkCollectionId?: string | null;
}

interface DraftMediaItem {
  id: string;
  type?: 'image' | 'user';
  url: string;
  caption: string;
  username?: string;
  name?: string;
  avatar?: string;
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
  targetUser,
  compact = false,
  collections,
  defaultLinkCollectionId
}: PostComposerProps) {
  const { user: authUser, profile: authProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Curated preset selection while drafting
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

  const [isSelectOomfModalOpen, setIsSelectOomfModalOpen] = useState(false);

  // Board media state (supports images and user avatars)
  const createBlankBoardSlots = (): DraftMediaItem[] => [
    { id: `b_slot_${Date.now()}_1`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_2`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_3`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_4`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_5`, type: 'image', url: '', caption: '' },
  ];

  const [mediaItems, setMediaItems] = useState<DraftMediaItem[]>(createBlankBoardSlots());
  const singleSlotFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotIndexRef = useRef<number | null>(null);
  const targetBoardSlotIndexRef = useRef<number | null>(null);

  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    slotIndex: number | null;
    imageSrc: string;
  }>({
    isOpen: false,
    slotIndex: null,
    imageSrc: ''
  });

  const handleOpenCropModal = (index: number) => {
    const item = mediaItems[index];
    if (item && item.url && item.type === 'image') {
      setCropModalState({
        isOpen: true,
        slotIndex: index,
        imageSrc: item.url
      });
    }
  };

  const handleApplyCrop = (croppedDataUrl: string) => {
    if (cropModalState.slotIndex !== null) {
      setMediaItems((prev) =>
        prev.map((item, idx) =>
          idx === cropModalState.slotIndex ? { ...item, url: croppedDataUrl } : item
        )
      );
    }
    setCropModalState({ isOpen: false, slotIndex: null, imageSrc: '' });
  };

  const handleSlotUploadClick = (index: number) => {
    targetSlotIndexRef.current = index;
    singleSlotFileInputRef.current?.click();
  };

  const handleSlotAvatarClick = (index: number) => {
    targetBoardSlotIndexRef.current = index;
    setIsSelectOomfModalOpen(true);
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
          prev.map((item, idx) => (idx === targetIdx ? { ...item, type: 'image', url: dataUrl } : item))
        );

        // For Slot 1 (Cover image), immediately open the crop viewfinder for precise 2:1 framing
        if (targetIdx === 0) {
          setCropModalState({
            isOpen: true,
            slotIndex: 0,
            imageSrc: dataUrl
          });
        }
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

  // Handle multi-file upload from computer for board images
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
            const filled = { ...item, type: 'image' as const, url: dataUrls[fileIdx] };
            fileIdx++;
            return filled;
          }
          return item;
        });

        // If more files remain, append new slots
        while (fileIdx < dataUrls.length) {
          updated.push({
            id: `media_${Date.now()}_${fileIdx}`,
            type: 'image',
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

  // Handle adding board image via pasted URL
  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setMediaItems((prev) => [
      ...prev,
      {
        id: `media_${Date.now()}_${prev.length}`,
        type: 'image',
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

  const filledBoardItems = mediaItems.filter((m) => m.url.trim().length > 0);

  // Validation check: Title required and at least 3 items filled
  const canSubmit = () => {
    if (isSubmitting || isProcessingFiles) return false;
    return title.trim().length > 0 && filledBoardItems.length >= 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please give your board a title.');
      return;
    }

    if (filledBoardItems.length < 3) {
      setErrorMsg('Boards require at least 3 items (images or mutual avatars).');
      return;
    }

    setIsSubmitting(true);

    const boardTitle = title.trim();

    const blockContent: any = {
      title: boardTitle,
      text: boardTitle,
      boardData: {
        images: filledBoardItems.map((m) => ({
          id: m.id,
          type: m.type || 'image',
          url: m.url,
          username: m.username,
          name: m.name,
          avatar: m.avatar,
          caption: m.caption.trim() || undefined
        }))
      }
    };

    let newPostId = `post_${Date.now()}`;

    // Save to Supabase blocks table if signed in
    if (authUser?.id) {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .insert({
            user_id: authUser.id,
            type: 'board',
            content: blockContent
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error saving board to Supabase blocks:', error);
        } else if (data) {
          newPostId = data.id;
        }
      } catch (err) {
        console.error('Failed to insert block:', err);
      }
    }

    const newPost: Post = {
      id: newPostId,
      author: authorUser,
      createdAt: 'Just now',
      type: 'board',
      title: boardTitle,
      text: boardTitle,
      boardData: blockContent.boardData,
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

    // Broadcast globally so ProfileView updates immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('oomfs:post-created', {
          detail: { post: newPost, collectionId: targetCollection }
        })
      );
    }

    // Reset state
    setTitle('');
    setMediaItems(createBlankBoardSlots());
    setSelectedCollectionId(null);
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
          {/* Board Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board title (e.g. Brutalist Architecture)"
            className="w-full text-base font-bold text-[#0f1419] placeholder-[#536471] outline-none bg-transparent"
            autoFocus
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

          {/* BOARD BUILDER UI */}
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
                <span>Board Items ({filledBoardItems.length} items · min 3)</span>
              </span>
              {filledBoardItems.length < 3 && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Add at least 3 items (images or avatars)
                </span>
              )}
            </div>

            {/* List of Board Item Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {mediaItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#eff3f4] rounded-xl overflow-hidden flex flex-col shadow-2xs"
                >
                  <div className="relative h-28 bg-[#eff3f4] flex items-center justify-center overflow-hidden">
                    {item.url ? (
                      item.type === 'user' ? (
                        <div
                          onClick={() => handleSlotAvatarClick(idx)}
                          className="w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] hover:bg-blue-50/40 flex flex-col items-center justify-center p-2 text-center relative select-none cursor-pointer group/user-slot transition-colors"
                          title="Click to change avatar"
                        >
                          <img
                            src={formatTwitterAvatar(item.avatar || item.url)}
                            alt={item.name || item.username || ''}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-black/10 group-hover/user-slot:ring-[#1d9bf0] shadow-xs transition-all"
                          />
                          <span className="mt-1 text-[11px] font-bold text-[#0f1419] truncate max-w-full px-1 block">
                            {item.name || item.username}
                          </span>
                          {item.username && (
                            <span className="text-[10px] text-[#536471] truncate max-w-full block">
                              @{item.username}
                            </span>
                          )}
                          <span className="absolute top-1 left-1 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(item.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer z-10"
                            title="Remove item"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          <span
                            className={`absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs ${
                              idx === 0 ? 'bg-[#1d9bf0]' : 'bg-black/65'
                            }`}
                          >
                            {idx === 0 ? '#1 Cover' : `#${idx + 1}`}
                          </span>
                          {/* Crop / Reposition Framing Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCropModal(idx);
                            }}
                            className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-xs z-10"
                            title="Frame / crop image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(item.id)}
                            className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer z-10"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )
                    ) : (
                      <div className="w-full h-full p-2 flex flex-col justify-between relative bg-white">
                        <span className="absolute top-1 left-1 bg-gray-200 text-[#536471] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="absolute top-1 right-1 p-0.5 text-[#536471] hover:text-red-500 rounded-full cursor-pointer"
                          title="Remove slot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="flex-1 flex items-center gap-1.5 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleSlotUploadClick(idx)}
                            className="flex-1 h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-colors p-1 cursor-pointer"
                            title="Upload image"
                          >
                            <Upload className="w-3.5 h-3.5 mb-0.5 text-[#1d9bf0]" />
                            <span className="text-[10px] font-bold">Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSlotAvatarClick(idx)}
                            className="flex-1 h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-colors p-1 cursor-pointer"
                            title="Attach mutual avatar"
                          >
                            <Users className="w-3.5 h-3.5 mb-0.5 text-[#1d9bf0]" />
                            <span className="text-[10px] font-bold">Avatar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <input
                      type="text"
                      placeholder={`Item ${idx + 1} caption (optional)`}
                      value={item.caption}
                      onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                      className="w-full text-[11px] text-[#0f1419] placeholder-[#536471]/50 bg-[#f7f9f9] border border-[#eff3f4] rounded px-1.5 py-1 outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}

              {/* Add Board Item Slot Button */}
              <button
                type="button"
                onClick={() => {
                  setMediaItems((prev) => [
                    ...prev,
                    { id: `b_slot_${Date.now()}_${prev.length + 1}`, type: 'image', url: '', caption: '' }
                  ]);
                }}
                className="h-36 rounded-xl border-2 border-dashed border-[#cfd9de] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 text-[#536471] hover:text-[#1d9bf0] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                title="Add another board slot"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-bold">Add Slot</span>
              </button>
            </div>

            {/* Upload / Add Avatar / Paste URL Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessingFiles ? 'Processing...' : 'Upload Images'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  targetBoardSlotIndexRef.current = null;
                  setIsSelectOomfModalOpen(true);
                }}
                className="bg-white border border-[#eff3f4] hover:border-gray-300 text-[#0f1419] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#1d9bf0]" />
                <span>Add Mutual Avatar</span>
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

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Optional Collection Assignment Selector */}
          {availableCollections.length > 0 && (
            <div className="flex flex-col gap-1.5 px-3 py-2 bg-[#f7f9f9] border border-[#eff3f4] rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#1d9bf0]" />
                  <span className="font-bold text-[#0f1419]">Add to preset:</span>
                  <select
                    value={selectedCollectionId || ''}
                    onChange={(e) => setSelectedCollectionId(e.target.value || null)}
                    className="bg-white border border-[#cfd9de] focus:border-[#1d9bf0] rounded-lg px-2 py-1 text-xs text-[#0f1419] outline-none cursor-pointer"
                  >
                    <option value="">None (all boards)</option>
                    {availableCollections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}
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
                onClick={() => fileInputRef.current?.click()}
                title="Upload images to board"
                className="p-2 rounded-full hover:bg-[#1d9bf0]/10 text-[#1d9bf0] transition-colors cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  targetBoardSlotIndexRef.current = null;
                  setIsSelectOomfModalOpen(true);
                }}
                title="Attach mutual avatar to board"
                className="p-2 rounded-full hover:bg-[#1d9bf0]/10 text-[#1d9bf0] transition-colors cursor-pointer"
              >
                <Users className="w-5 h-5" />
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
                {isSubmitting ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal for selecting an OOMF / Mutual to attach to board */}
      <SelectOomfModal
        isOpen={isSelectOomfModalOpen}
        onClose={() => {
          setIsSelectOomfModalOpen(false);
          targetBoardSlotIndexRef.current = null;
        }}
        currentUserId={authUser?.id}
        onSelectUser={(user) => {
          const targetIdx = targetBoardSlotIndexRef.current;
          if (targetIdx !== null && targetIdx >= 0) {
            setMediaItems((prev) =>
              prev.map((item, idx) =>
                idx === targetIdx
                  ? {
                      ...item,
                      type: 'user',
                      url: `/${user.username}`,
                      username: user.username,
                      name: user.name,
                      avatar: user.avatar
                    }
                  : item
              )
            );
          } else {
            setMediaItems((prev) => {
              const emptyIdx = prev.findIndex((m) => !m.url);
              const newItem: DraftMediaItem = {
                id: `b_slot_${Date.now()}`,
                type: 'user',
                url: `/${user.username}`,
                username: user.username,
                name: user.name,
                avatar: user.avatar,
                caption: ''
              };
              if (emptyIdx !== -1) {
                return prev.map((m, i) => (i === emptyIdx ? { ...m, ...newItem, id: m.id } : m));
              }
              return [...prev, newItem];
            });
          }
          targetBoardSlotIndexRef.current = null;
          setIsSelectOomfModalOpen(false);
        }}
      />

      {/* Board Hero Image Crop Viewfinder Modal */}
      <BoardCropModal
        isOpen={cropModalState.isOpen}
        imageSrc={cropModalState.imageSrc}
        onClose={() => setCropModalState({ isOpen: false, slotIndex: null, imageSrc: '' })}
        onApply={handleApplyCrop}
        aspectRatio={2.0}
      />
    </div>
  );
}
