'use client';

import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import PostComposer from '../feed/PostComposer';
import { X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#0f1419] flex justify-center">
      <div className="flex w-full max-w-[1280px] justify-between relative">
        {/* Left Navigation Sidebar */}
        <React.Suspense fallback={<div className="sticky top-0 h-screen py-3 px-2 sm:px-4 xl:w-64 border-r border-[#eff3f4]" />}>
          <LeftSidebar onOpenComposer={() => setComposerOpen(true)} />
        </React.Suspense>

        {/* Center Main Content Area */}
        <main className="flex-1 max-w-[600px] min-h-screen border-x border-[#eff3f4]">
          {children}
        </main>

        {/* Right Widgets Sidebar */}
        <RightSidebar />
      </div>

      {/* Modal Post Composer */}
      {composerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-14 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between p-3 border-b border-[#eff3f4]">
              <span className="font-bold text-sm text-[#0f1419]">Create Post</span>
              <button
                onClick={() => setComposerOpen(false)}
                className="p-1.5 text-[#536471] hover:bg-[#f7f9f9] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PostComposer compact onClose={() => setComposerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
