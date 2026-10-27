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
  Users
} from 'lucide-react';
import { CURRENT_USER, Post, User, Collection, PostAttachment, ImageAttachment, UserAttachment, BoardItem } from '@/lib/mockData';
import { saveSessionPost } from '@/lib/postStore';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatTwitterAvatar } from '@/lib/utils';
import { addItemToCollection, getProfileCollections } from '@/lib/collections';
import SelectOomfModal, { SelectableOomf } from './SelectOomfModal';

interface PostComposerProps {
  onAddPost?: (post: Post) => void;
  onClose?: () => void;
  defaultType?: 'standard' | 'board';
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

  const [postType, setPostType] = useState<'standard' | 'board'>(defaultType || 'standard');
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

  // Standard post unified attachments (up to 4 items max: images or user avatars)
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isSelectOomfModalOpen, setIsSelectOomfModalOpen] = useState(false);

  // Board media state (supports images and user avatars)
  const [mediaItems, setMediaItems] = useState<DraftMediaItem[]>([]);
  const singleSlotFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotIndexRef = useRef<number | null>(null);
  const targetBoardSlotIndexRef = useRef<number | null>(null);

  const createBlankBoardSlots = (): DraftMediaItem[] => [
    { id: `b_slot_${Date.now()}_1`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_2`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_3`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_4`, type: 'image', url: '', caption: '' },
    { id: `b_slot_${Date.now()}_5`, type: 'image', url: '', caption: '' },
  ];

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

  useEffect(() => {
    setPostType(defaultType || 'standard');
    if (defaultType === 'board') {
      setMediaItems(createBlankBoardSlots());
    }
  }, [defaultType]);

  // Handle multi-file upload from computer for standard attachments or board images
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

      if (postType === 'standard') {
        setAttachments((prev) => {
          const remaining = 4 - prev.length;
          if (remaining <= 0) return prev;
          const newAttachments: PostAttachment[] = dataUrls.slice(0, remaining).map((url) => ({
            type: 'image' as const,
            url
          }));
          return [...prev, ...newAttachments];
        });
        if (dataUrls.length > 4 - attachments.length) {
          setErrorMsg('Standard posts support a maximum of 4 attachments.');
        }
      } else {
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
      }
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

  // Validation check
  const canSubmit = () => {
    if (isSubmitting || isProcessingFiles) return false;
    if (postType === 'standard') return text.trim().length > 0 || attachments.length > 0;
    if (postType === 'board') return mediaItems.filter((m) => m.url.trim().length > 0).length >= 3;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const filledBoardItems = mediaItems.filter((m) => m.url.trim().length > 0);
    if (postType === 'board' && filledBoardItems.length < 3) {
      setErrorMsg('Boards require at least 3 items (images or avatars).');
      return;
    }

    if (!canSubmit()) return;
    setIsSubmitting(true);

    const imageAttachments = attachments.filter((a): a is ImageAttachment => a.type === 'image');

    const blockContent: any = {
      text: text.trim(),
      ...(postType === 'standard' && attachments.length > 0 ? {
        attachments: attachments,
        images: imageAttachments.length > 0 ? imageAttachments.map((a) => a.url) : undefined
      } : {}),
      ...(postType === 'board' ? {
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
      attachments: postType === 'standard' && attachments.length > 0 ? attachments : undefined,
      images: postType === 'standard' && imageAttachments.length > 0 ? imageAttachments.map((a) => a.url) : undefined,
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
    setAttachments([]);
    setMediaItems([]);
    setIsSubmitting(false);

    if (onClose) {
      onClose();
    }
  };

  // Helper to render an attachment preview cell inside the composer tray
  const renderTrayCell = (item: PostAttachment, idx: number) => {
    return (
      <div key={idx} className="relative w-full h-full bg-[#f7f9f9] overflow-hidden group">
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt={`Attached item ${idx + 1}`}
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#f7f9f9] to-[#eff3f4] p-3 flex flex-col items-center justify-center text-center select-none">
            <img
              src={formatTwitterAvatar(item.avatar)}
              alt={item.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-black/10 shadow-xs"
            />
            <div className="mt-1.5 min-w-0 max-w-full px-2">
              <span className="font-bold text-xs sm:text-sm text-[#0f1419] truncate block">
                {item.name}
              </span>
              <span className="text-[11px] text-[#536471] truncate block">
                @{item.username}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-opacity cursor-pointer shadow-sm z-10"
          title="Remove attachment"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
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
          {/* Main Post Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              postType === 'board'
                ? "Add thoughts or a caption for your board... (optional)"
                : "What is happening?!"
            }
            rows={compact ? 2 : 3}
            className="w-full text-[15px] text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
          />

          {/* Standard Post Attachment Preview Tray (1-4 Items: Photos or User Avatars) */}
          {postType === 'standard' && attachments.length > 0 && (
            <div className="w-full">
              {attachments.length === 1 && (
                <div className={`relative w-full rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#f7f9f9] ${
                  attachments[0].type === 'image' ? 'max-h-72 sm:max-h-80' : 'h-44 sm:h-48'
                }`}>
                  {renderTrayCell(attachments[0], 0)}
                </div>
              )}

              {attachments.length === 2 && (
                <div className="grid grid-cols-2 gap-1.5 h-48 sm:h-56 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4]">
                  {attachments.map((item, idx) => renderTrayCell(item, idx))}
                </div>
              )}

              {attachments.length === 3 && (
                <div className="grid grid-cols-2 gap-1.5 h-52 sm:h-64 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4]">
                  {renderTrayCell(attachments[0], 0)}
                  <div className="grid grid-rows-2 gap-1.5 w-full h-full">
                    {renderTrayCell(attachments[1], 1)}
                    {renderTrayCell(attachments[2], 2)}
                  </div>
                </div>
              )}

              {attachments.length === 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5 h-52 sm:h-64 rounded-2xl overflow-hidden border border-[#eff3f4] bg-[#eff3f4]">
                  {attachments.map((item, idx) => renderTrayCell(item, idx))}
                </div>
              )}
            </div>
          )}

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

          {/* BOARD DRAFTING UI */}
          {postType === 'board' && (
            <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0f1419] uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#1d9bf0]" />
                  <span>Board Builder ({mediaItems.filter(m => m.url.trim().length > 0).length} items · min 3)</span>
                </span>
                {mediaItems.filter(m => m.url.trim().length > 0).length < 3 && (
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Add at least 3 items (images or avatars)
                  </span>
                )}
              </div>

              {/* List of 5 Board Item Slots with Placeholders */}
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
                            <span className="absolute top-1 left-1 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(item.id)}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full cursor-pointer"
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
                        placeholder={`Board — ${String(idx + 1).padStart(2, '0')}`}
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
          )}

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
              {/* Attach Photos button */}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={postType === 'standard' && attachments.length >= 4}
                title={
                  postType === 'standard' && attachments.length >= 4
                    ? 'Maximum 4 attachments'
                    : postType === 'board'
                    ? 'Upload images to board'
                    : 'Attach photos'
                }
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  postType === 'standard' && attachments.length >= 4
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : 'hover:bg-[#1d9bf0]/10 text-[#1d9bf0]'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Attach Mutual / Avatar button */}
              <button
                type="button"
                onClick={() => {
                  if (postType === 'board') {
                    targetBoardSlotIndexRef.current = null;
                  }
                  setIsSelectOomfModalOpen(true);
                }}
                disabled={postType === 'standard' && attachments.length >= 4}
                title={
                  postType === 'board'
                    ? 'Attach mutual avatar to board'
                    : attachments.length >= 4
                    ? 'Maximum 4 attachments'
                    : 'Attach mutual avatar'
                }
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  postType === 'standard' && attachments.length >= 4
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : 'hover:bg-[#1d9bf0]/10 text-[#1d9bf0]'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>

              {/* Create Board button */}
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

      {/* Modal for selecting an OOMF / Mutual to attach */}
      <SelectOomfModal
        isOpen={isSelectOomfModalOpen}
        onClose={() => {
          setIsSelectOomfModalOpen(false);
          targetBoardSlotIndexRef.current = null;
        }}
        currentUserId={authUser?.id}
        onSelectUser={(user) => {
          if (postType === 'board') {
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
          } else {
            if (attachments.length < 4) {
              setAttachments((prev) => [
                ...prev,
                {
                  type: 'user',
                  username: user.username,
                  name: user.name,
                  avatar: user.avatar,
                  id: user.id
                }
              ]);
            }
          }
          setIsSelectOomfModalOpen(false);
        }}
      />
    </div>
  );
}
