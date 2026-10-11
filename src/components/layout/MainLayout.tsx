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
        <LeftSidebar onOpenComposer={() => setComposerOpen(true)} />

        {/* Center Main Content Area */}
        <main className="flex-1 max-w-[600px] min-h-screen border-x border-[#eff3f4]">
          {children}
        </main>

        {/* Right Widgets Sidebar */}
        <RightSidebar />
      </div>

      {/* Modal Post Composer */}
      {composerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-3 border-b border-[#eff3f4]">
              <span className="font-bold text-sm text-[#0f1419]">Create OOMFS Post</span>
              <button
                onClick={() => setComposerOpen(false)}
                className="p-1.5 text-[#536471] hover:bg-[#f7f9f9] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PostComposer compact />
          </div>
        </div>
      )}
    </div>
  );
}
