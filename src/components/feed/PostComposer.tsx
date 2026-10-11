'use client';

import React, { useState } from 'react';
import { 
  Link2, 
  Users, 
  HelpCircle, 
  Image as ImageIcon, 
  Smile, 
  Calendar, 
  MapPin,
  Sparkles
} from 'lucide-react';
import { CURRENT_USER, Post } from '@/lib/mockData';

interface PostComposerProps {
  onAddPost?: (post: Post) => void;
  compact?: boolean;
}

export default function PostComposer({ onAddPost, compact = false }: PostComposerProps) {
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<'standard' | 'link_card' | 'oomf_spotlight' | 'prompt_card'>('standard');
  
  // Custom fields
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [promptQuestion, setPromptQuestion] = useState('What is your favorite feature on oomfs.org?');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && postType === 'standard') return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: CURRENT_USER,
      createdAt: 'Just now',
      type: postType,
      text: text.trim(),
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      viewsCount: '1',
      ...(postType === 'link_card' && linkTitle && linkUrl ? {
        linkData: {
          title: linkTitle,
          url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`,
          buttonText: 'Open Link ↗'
        }
      } : {}),
      ...(postType === 'prompt_card' ? {
        promptData: {
          question: promptQuestion,
          answer: text.trim()
        }
      } : {})
    };

    if (onAddPost) {
      onAddPost(newPost);
    }

    // Reset form
    setText('');
    setLinkTitle('');
    setLinkUrl('');
    setPostType('standard');
  };

  return (
    <div className={`border-b border-[#eff3f4] bg-white p-4 flex gap-3 ${compact ? 'py-3' : ''}`}>
      <img
        src={CURRENT_USER.avatar}
        alt={CURRENT_USER.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
        {/* Post Type Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setPostType('standard')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1 ${
              postType === 'standard' 
                ? 'bg-[#0f1419] text-white' 
                : 'bg-[#f7f9f9] text-[#536471] hover:bg-[#eff3f4]'
            }`}
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setPostType('link_card')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
              postType === 'link_card' 
                ? 'bg-[#1d9bf0] text-white' 
                : 'bg-[#f7f9f9] text-[#1d9bf0] hover:bg-[#eff3f4]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            + Bio Link Card
          </button>
          <button
            type="button"
            onClick={() => setPostType('prompt_card')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
              postType === 'prompt_card' 
                ? 'bg-[#0f1419] text-white' 
                : 'bg-[#f7f9f9] text-[#536471] hover:bg-[#eff3f4]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            Q&A Prompt
          </button>
        </div>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            postType === 'link_card'
              ? "Share what this link is about..."
              : postType === 'prompt_card'
              ? "Answer your prompt..."
              : "What is happening?!"
          }
          rows={compact ? 2 : 3}
          className="w-full text-base text-[#0f1419] placeholder-[#536471] outline-none resize-none bg-transparent"
        />

        {/* Dynamic Fields based on Post Type */}
        {postType === 'link_card' && (
          <div className="bg-[#f7f9f9] border border-[#eff3f4] rounded-xl p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-[#1d9bf0] uppercase tracking-wider">
              Bio Link Details
            </span>
            <input
              type="text"
              placeholder="Link Title (e.g., My Portfolio / Spotify Playlist)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="bg-white border border-[#eff3f4] rounded-lg px-3 py-2 text-sm text-[#0f1419] outline-none focus:border-[#1d9bf0]"
            />
            <input
              type="text"
              placeholder="URL (e.g., https://amberlyn.design)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-white border border-[#eff3f4] rounded-lg px-3 py-2 text-sm text-[#0f1419] outline-none focus:border-[#1d9bf0]"
            />
          </div>
        )}

        {postType === 'prompt_card' && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Prompt Question
            </span>
            <input
              type="text"
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              className="bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm text-[#0f1419] outline-none focus:border-purple-400 font-medium"
            />
          </div>
        )}

        {/* Toolbar Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#eff3f4]">
          <div className="flex items-center gap-1 text-[#1d9bf0]">
            <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
              <Calendar className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
              <MapPin className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!text.trim() && postType === 'standard'}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white font-bold px-5 py-2 rounded-full text-sm transition-colors shadow-sm"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
