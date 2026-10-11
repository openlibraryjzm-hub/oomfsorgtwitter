'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { CURRENT_USER } from '@/lib/mockData';

export default function NotificationsPage() {
  return (
    <MainLayout>
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] p-4">
        <h1 className="font-extrabold text-xl text-[#0f1419]">Notifications</h1>
      </header>

      <div className="p-8 flex flex-col items-center text-center justify-center min-h-[60vh] max-w-md mx-auto">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="font-black text-2xl text-[#0f1419] tracking-tight mb-2">
          Notifications Coming Soon
        </h2>
        <p className="text-sm text-[#536471] leading-relaxed mb-6">
          You'll be notified here whenever another Twitter/X user follows you back on oomfs.org and becomes an official OOMF.
        </p>
        <Link
          href={`/${CURRENT_USER.username}`}
          className="bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>Back to Profile</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MainLayout>
  );
}
