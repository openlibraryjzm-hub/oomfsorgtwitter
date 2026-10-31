import React, { useState, useEffect } from 'react';
import { X, Star, FolderPlus, Globe } from 'lucide-react';
import { Collection } from '@/lib/mockData';
import { createCollection, slugify } from '@/lib/collections';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  tabType: 'posts' | 'links';
  onCreated: (newCol: Collection) => void;
  username?: string;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  userId,
  tabType,
  onCreated,
  username
}: CreateCollectionModalProps) {
  const isLinkPage = tabType === 'links';
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugEdited && isLinkPage) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited, isLinkPage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isLinkPage ? 'Please provide a page title' : 'Please provide a preset title');
      return;
    }

    const computedSlug = isLinkPage ? (slug.trim() || slugify(title) || `page-${Date.now()}`) : undefined;

    setIsSubmitting(true);
    setError(null);

    // Call Supabase creator
    const newCol = await createCollection({
      userId,
      tabType,
      title: title.trim(),
      description: description.trim() || undefined,
      icon: '',
      isPinned,
      isExclusive: false,
      slug: computedSlug
    });

    if (newCol) {
      onCreated(newCol);
      onClose();
      // Reset form
      setTitle('');
      setSlug('');
      setSlugEdited(false);
      setDescription('');
      setIsPinned(false);
    } else {
      setError('Limit reached: A profile can feature a maximum of 50 collections.');
    }
    setIsSubmitting(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center text-[#1d9bf0]">
              {isLinkPage ? <Globe className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-[#0f1419] text-base leading-tight">
                {isLinkPage ? 'New Link Page' : 'New Preset'}
              </h3>
              <p className="text-xs text-[#536471]">
                {isLinkPage ? 'Create a distinct page for your links and web badges' : 'Create a curated preset for your boards'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0f1419]">
              {isLinkPage ? 'Page Title *' : 'Preset Title *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isLinkPage ? 'e.g. Work & Projects, Shop, Music' : 'e.g. Design Systems, Brutalism, Tokyo 35mm'}
              className="w-full bg-white border border-[#cfd9de] focus:border-[#1d9bf0] rounded-xl px-3 py-2 text-sm text-[#0f1419] outline-none"
              autoFocus
            />
          </div>

          {/* URL Slug (for Link Pages) */}
          {isLinkPage && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f1419] flex items-center justify-between">
                <span>Page URL Slug *</span>
                <span className="text-[11px] font-normal text-[#536471]">
                  oomfs.org/{username || 'you'}/links/<span className="font-mono text-[#1d9bf0] font-semibold">{slug || 'page'}</span>
                </span>
              </label>
              <div className="flex items-center bg-[#f7f9f9] border border-[#cfd9de] focus-within:border-[#1d9bf0] rounded-xl px-3 py-2 text-xs">
                <span className="text-[#536471] font-mono select-none mr-1">/links/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="portfolio"
                  className="flex-1 bg-transparent text-[#0f1419] font-mono outline-none"
                />
              </div>
            </div>
          )}

          {/* Description (Only for Link Pages) */}
          {isLinkPage && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f1419]">
                Description <span className="font-normal text-[#536471]">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Client case studies, client drops, and advisory"
                className="bg-white border border-[#cfd9de] focus:border-[#1d9bf0] rounded-xl px-3 py-2 text-xs text-[#0f1419] outline-none"
              />
            </div>
          )}

          {/* Pinned to Top Row Toggle */}
          <div className="border border-[#eff3f4] rounded-xl bg-[#f7f9f9]">
            <label className="p-3 flex items-start justify-between gap-3 cursor-pointer select-none">
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isPinned ? 'bg-blue-100 text-[#1d9bf0]' : 'bg-gray-200 text-gray-600'}`}>
                  <Star className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#0f1419]">
                    Pin to top bar
                  </div>
                  <p className="text-[11px] text-[#536471] leading-snug mt-0.5">
                    Show this preset as a quick-access rectangle directly on your profile&apos;s pinned scroll.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-[#1d9bf0] rounded border-gray-300 focus:ring-[#1d9bf0] mt-1 shrink-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eff3f4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#536471] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#0f1419] hover:bg-[#272c30] disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Creating...' : isLinkPage ? 'Create Link Page' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
