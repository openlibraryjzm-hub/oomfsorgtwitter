'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Copy, 
  Pencil, 
  X, 
  Hash,
  Sparkles
} from 'lucide-react';
import { User } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';
import { isValidUuid } from '@/lib/follows';

interface HashtagsNotepadProps {
  user: User;
  isSelf: boolean;
}

const DEFAULT_AMBERLYN_HASHTAGS = [
  '#vibecoder',
  '#gamer',
  '#painter',
  '#pixelart',
  '#nightowl'
];

/**
 * Normalizes a hashtag string: ensures it starts with '#', removes illegal characters/spaces.
 */
function normalizeHashtag(tag: string): string {
  const cleaned = tag.trim().replace(/^#+/, '').replace(/\s+/g, '_').toLowerCase();
  return cleaned ? `#${cleaned}` : '';
}

/**
 * Parses raw text into unique hashtags array.
 */
function parseRawHashtags(text: string): string[] {
  const tokens = text
    .split(/[\n,\s]+/)
    .map((t) => normalizeHashtag(t))
    .filter((t) => t.length > 1);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      unique.push(t);
    }
  }
  return unique;
}

export default function HashtagsNotepad({ user, isSelf }: HashtagsNotepadProps) {
  const supabase = createClient();
  const storageKey = `oomfs_profile_hashtags_${user.id || user.username}`;
  const isDemoAmberlyn = user.username?.toLowerCase() === 'amberlyn';

  // 1. Initial Hydration: localStorage -> user.hashtags -> amberlyn defaults -> empty
  const [hashtags, setHashtags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        if (isDemoAmberlyn) {
          const altCached = localStorage.getItem('oomfs_profile_hashtags_amberlyn');
          if (altCached) {
            const parsed = JSON.parse(altCached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      } catch (err) {
        console.error('Error reading cached hashtags:', err);
      }
    }

    if (user.hashtags && user.hashtags.length > 0) {
      return user.hashtags;
    }

    if (isDemoAmberlyn) {
      return DEFAULT_AMBERLYN_HASHTAGS;
    }

    return [];
  });

  // Edit / View mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isRawTextMode, setIsRawTextMode] = useState(false);
  const [rawTextValue, setRawTextValue] = useState(() => hashtags.join(', '));
  const [inputVal, setInputVal] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const inlineInputRef = useRef<HTMLInputElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when entering Edit mode
  useEffect(() => {
    if (isEditing && !isRawTextMode && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isEditing, isRawTextMode]);

  // Sync raw text when hashtags change
  useEffect(() => {
    setRawTextValue(hashtags.join(', '));
  }, [hashtags]);

  // Persist hashtags
  const persistHashtags = (nextTags: string[]) => {
    setHashtags(nextTags);
    setSaveStatus('saving');

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextTags));
        if (isDemoAmberlyn) {
          localStorage.setItem('oomfs_profile_hashtags_amberlyn', JSON.stringify(nextTags));
        }
      } catch (e) {
        console.error('Failed to save hashtags to localStorage:', e);
      }
    }

    if (isSelf && user.id && isValidUuid(user.id)) {
      Promise.resolve(
        supabase
          .from('profiles')
          .update({ hashtags: nextTags })
          .eq('id', user.id)
      )
        .then((res: any) => {
          if (res?.error) {
            console.debug('Supabase profile hashtags update notice:', res.error.message);
          }
        })
        .catch(() => {});
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 350);
  };

  // Add multiple tags (filtering out duplicates)
  const addTags = (tagsToAdd: string[]) => {
    const existingLower = new Set(hashtags.map((t) => t.toLowerCase()));
    const filtered: string[] = [];

    for (const t of tagsToAdd) {
      const normalized = normalizeHashtag(t);
      if (normalized && normalized.length > 1 && !existingLower.has(normalized.toLowerCase())) {
        existingLower.add(normalized.toLowerCase());
        filtered.push(normalized);
      }
    }

    if (filtered.length > 0) {
      const next = [...hashtags, ...filtered];
      persistHashtags(next);
    }
  };

  // Handle typing inside inline input: typing comma immediately separates tag
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.includes(',')) {
      // Split by commas
      const parts = value.split(',');
      const tagsToCommit = parts.slice(0, -1).map(normalizeHashtag).filter(Boolean);
      const remainder = parts[parts.length - 1]; // remainder after last comma

      if (tagsToCommit.length > 0) {
        addTags(tagsToCommit);
      }
      setInputVal(remainder.replace(/^#+/, ''));
    } else {
      setInputVal(value.replace(/^#+/, ''));
    }
  };

  // Key navigation in inline input (Enter commits tag, Backspace on empty deletes previous tag)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim()) {
        const normalized = normalizeHashtag(inputVal);
        if (normalized) addTags([normalized]);
        setInputVal('');
      }
    } else if (e.key === 'Backspace' && !inputVal && hashtags.length > 0) {
      e.preventDefault();
      handleDeleteTag(hashtags.length - 1);
    }
  };

  // Delete a tag
  const handleDeleteTag = (index: number) => {
    const next = hashtags.filter((_, i) => i !== index);
    persistHashtags(next);
  };

  // Copy hashtag to clipboard
  const handleCopyTag = async (tag: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(tag);
        setCopiedTag(tag);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedTag(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Handle raw text textarea changes
  const handleRawTextChange = (text: string) => {
    setRawTextValue(text);
    const parsed = parseRawHashtags(text);
    persistHashtags(parsed);
  };

  const handleResetDefaults = () => {
    persistHashtags(DEFAULT_AMBERLYN_HASHTAGS);
    setRawTextValue(DEFAULT_AMBERLYN_HASHTAGS.join(', '));
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all hashtags from your notepad?')) {
      persistHashtags([]);
      setRawTextValue('');
    }
  };

  return (
    <div className="w-full bg-white select-text">
      {/* 1. NOTEPAD HEADER BAR */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eff3f4] bg-[#fafbfc]/70 backdrop-blur-xs text-[#536471]">
        {/* Left: Notepad Title & Tag Count */}
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-[#1d9bf0]" />
          <span className="text-[11px] font-bold tracking-wider text-[#536471] uppercase select-none">
            Notepad
          </span>
          <span className="text-xs text-[#536471]/80 font-medium select-none">
            ({hashtags.length})
          </span>
        </div>

        {/* Right: Autosave status & Edit/View Mode toggle */}
        <div className="flex items-center gap-3">
          {/* Subtle Saved indicator in Edit mode */}
          {isEditing && (
            <div className="flex items-center gap-1 text-[11px] text-[#536471] font-medium select-none">
              {saveStatus === 'saving' ? (
                <span className="text-[#1d9bf0] animate-pulse">Saving...</span>
              ) : (
                <span className="flex items-center gap-1 text-[#536471]/80">
                  <Check className="w-3 h-3 text-[#00ba7c]" />
                  Saved
                </span>
              )}
            </div>
          )}

          {/* Owner Edit / Done Toggle */}
          {isSelf && (
            <div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    // Commit any pending text before exiting edit mode
                    if (inputVal.trim()) {
                      const normalized = normalizeHashtag(inputVal);
                      if (normalized) addTags([normalized]);
                      setInputVal('');
                    }
                    setIsEditing(false);
                    setIsRawTextMode(false);
                  }}
                  className="px-3 py-1 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#0f1419] bg-[#eff3f4] hover:bg-[#e2e8f0] rounded-full transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-[#536471]" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. DENSE PARAGRAPH NOTEPAD BODY */}
      <div className="px-5 py-6 sm:px-8 sm:py-7">
        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <div>
            {hashtags.length > 0 ? (
              <p className="text-[15px] sm:text-[16px] leading-[1.8] sm:leading-[1.9] text-[#0f1419] font-normal break-words">
                {hashtags.map((tag, index) => {
                  const isLast = index === hashtags.length - 1;
                  const isJustCopied = copiedTag === tag;

                  return (
                    <React.Fragment key={`${tag}-${index}`}>
                      <span
                        onClick={() => handleCopyTag(tag)}
                        title="Click to copy hashtag"
                        className="group inline-flex items-center font-medium cursor-pointer hover:text-[#1d9bf0] transition-colors relative"
                      >
                        <span className="text-[#1d9bf0] font-bold mr-0.5 select-none">#</span>
                        <span className="text-[#0f1419] group-hover:text-[#1d9bf0] transition-colors underline-offset-2 hover:underline">
                          {tag.replace(/^#/, '')}
                        </span>

                        {/* Inline copy confirmation popup */}
                        {isJustCopied && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0f1419] text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md pointer-events-none z-10 animate-in fade-in duration-100">
                            Copied!
                          </span>
                        )}
                      </span>
                      {!isLast && <span className="text-[#536471] mr-1.5 select-none">,</span>}
                    </React.Fragment>
                  );
                })}
              </p>
            ) : (
              /* Empty state in View Mode */
              <div className="py-8 text-center text-[#536471]">
                <p className="text-sm font-semibold text-[#0f1419]">
                  {isSelf ? 'No hashtags on your notepad yet' : `@${user.username} hasn't written any hashtags yet`}
                </p>
                <p className="text-xs text-[#536471] mt-1 max-w-sm mx-auto">
                  {isSelf
                    ? 'Click Edit above to write comma-separated hashtags for yourself like #vibecoder, #gamer, #painter.'
                    : 'Check back later to see hashtags written by @' + user.username + '.'}
                </p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-1.5 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Start writing
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <div>
            {!isRawTextMode ? (
              /* Densely Packed Flow Editor with Inline Input */
              <div>
                <div className="p-3 sm:p-4 rounded-xl border border-[#1d9bf0]/40 bg-[#fcfdfd] focus-within:border-[#1d9bf0] focus-within:bg-white transition-all shadow-2xs">
                  <div className="text-[15px] sm:text-[16px] leading-[2.1] sm:leading-[2.2] text-[#0f1419] break-words flex flex-wrap items-center">
                    {/* Render existing tags inline */}
                    {hashtags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="inline-flex items-center group/tag font-medium mr-1.5 mb-1"
                      >
                        <span className="text-[#1d9bf0] font-bold select-none">#</span>
                        <span className="text-[#0f1419] font-medium">{tag.replace(/^#/, '')}</span>
                        {/* Remove Tag button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(index)}
                          title="Remove hashtag"
                          className="ml-0.5 p-0.5 text-[#536471]/60 hover:text-[#f4212e] rounded-full hover:bg-[#f4212e]/10 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="text-[#536471] select-none">,</span>
                      </span>
                    ))}

                    {/* Inline active typing field */}
                    <span className="inline-flex items-center mb-1">
                      <span className="text-[#1d9bf0] font-bold select-none">#</span>
                      <input
                        ref={inlineInputRef}
                        type="text"
                        value={inputVal}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder={hashtags.length === 0 ? "type hashtag then comma (,)..." : "type tag then comma (,)..."}
                        className="min-w-[170px] sm:min-w-[200px] bg-transparent border-none outline-none text-[15px] sm:text-[16px] font-medium text-[#0f1419] placeholder:text-[#536471]/50 py-0 px-0.5"
                      />
                    </span>
                  </div>
                </div>

                {/* Edit Mode Helper & Actions */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#536471]">
                  <span className="text-[11px] text-[#536471]/80">
                    💡 Type tag name and press <kbd className="px-1.5 py-0.5 bg-[#eff3f4] rounded font-mono text-[10px] text-[#0f1419] font-bold">,</kbd> to separate. Press <kbd className="px-1.5 py-0.5 bg-[#eff3f4] rounded font-mono text-[10px] text-[#0f1419] font-bold">Backspace</kbd> on empty input to delete last tag.
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsRawTextMode(true)}
                    className="text-[11px] text-[#1d9bf0] hover:underline cursor-pointer"
                  >
                    Edit as raw paragraph
                  </button>
                </div>
              </div>
            ) : (
              /* Raw Paragraph Textarea Mode (for pasting or bulk editing) */
              <div>
                <div className="relative rounded-xl border border-[#1d9bf0]/40 bg-[#fcfdfd] p-3 sm:p-4 focus-within:border-[#1d9bf0] focus-within:bg-white transition-all">
                  <textarea
                    rows={5}
                    value={rawTextValue}
                    onChange={(e) => handleRawTextChange(e.target.value)}
                    placeholder="#vibecoder, #gamer, #painter, #pixelart, #nightowl"
                    className="w-full bg-transparent border-none outline-none text-[15px] sm:text-[16px] leading-relaxed text-[#0f1419] placeholder:text-[#536471]/40 resize-y"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#536471]">
                    Parsed: <b className="text-[#0f1419]">{hashtags.length}</b> hashtags
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRawTextMode(false)}
                    className="text-[#1d9bf0] hover:underline cursor-pointer text-xs font-semibold"
                  >
                    Back to inline typing
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. NOTEPAD FOOTER BAR */}
      <div className="px-4 sm:px-6 py-3 border-t border-[#eff3f4] bg-[#fafbfc]/40 flex flex-wrap items-center justify-between gap-2 text-xs text-[#536471]">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[#536471]/60">•</span>
          <span>Click any hashtag to copy</span>
        </div>

        {/* Owner quick helpers */}
        {isSelf && (
          <div className="flex items-center gap-3 text-[11px]">
            {isDemoAmberlyn && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[#536471] hover:text-[#1d9bf0] transition-colors cursor-pointer"
              >
                Reset demo tags
              </button>
            )}
            {hashtags.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[#536471] hover:text-[#f4212e] transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
