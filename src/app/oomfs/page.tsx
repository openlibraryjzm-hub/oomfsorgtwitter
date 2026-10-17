'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { MOCK_OOMFS, CURRENT_USER, User } from '@/lib/mockData';
import { Users, CheckCircle2, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UserNetworkView from '@/components/network/UserNetworkView';

export default function OomfsDirectoryPage() {
  const { user: authUser, profile: authProfile, signInWithTwitter, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-sm text-[#536471]">Loading your network...</div>
      </MainLayout>
    );
  }

  // If user is authenticated, render the interactive 1:1 network view with OOMFs, Following, Followers tabs
  if (authUser && authProfile) {
    const currentUserObj: User = {
      id: authProfile.id,
      username: authProfile.username,
      name: authProfile.name || authProfile.username,
      avatar: authProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authProfile.username}`,
      banner: authProfile.banner_url || '',
      bio: authProfile.bio || '',
      joined: authProfile.created_at
        ? new Date(authProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'October 2026',
      followingCount: 0,
      followersCount: 0,
      oomfsCount: 0,
      isVerified: false,
      links: [],
    };

    return (
      <MainLayout>
        <UserNetworkView targetUser={currentUserObj} initialTab="oomfs" />
      </MainLayout>
    );
  }

  // Guest view: explain how OOMFS work + mock sample directory
  return (
    <MainLayout>
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-[#0f1419] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1d9bf0]" />
            Your OOMFS Network
          </h1>
          <p className="text-xs text-[#536471] mt-0.5">
            Mutual followers ($A \leftrightarrow B$) connected on oomfs.org
          </p>
        </div>
        <span className="bg-[#1d9bf0] text-white font-bold text-xs px-3 py-1.5 rounded-full">
          {CURRENT_USER.oomfsCount} Mutuals
        </span>
      </header>

      {/* Info Callout */}
      <div className="p-4 bg-gradient-to-r from-[#1d9bf0]/10 to-purple-50 border-b border-[#eff3f4]">
        <div className="flex items-center gap-2 font-bold text-sm text-[#0f1419] mb-1">
          <Sparkles className="w-4 h-4 text-[#1d9bf0]" />
          <span>How OOMFS work on oomfs.org</span>
        </div>
        <p className="text-xs text-[#536471] leading-relaxed">
          When you and another user follow each other on oomfs.org, you automatically earn an <b>OOMF badge</b> on each other&apos;s 1:1 X profiles. Put <b>oomfs.org/{CURRENT_USER.username}</b> in your X bio to invite your followers to connect!
        </p>

        <button
          onClick={() => signInWithTwitter()}
          className="mt-3 bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Connect X to see your real mutuals</span>
        </button>
      </div>

      {/* Directory List */}
      <div className="divide-y divide-[#eff3f4]">
        {MOCK_OOMFS.map((oomf) => (
          <Link
            key={oomf.id}
            href={`/${oomf.username}`}
            className="flex items-center justify-between p-4 hover:bg-[#f7f9f9] transition-colors group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={oomf.avatar}
                alt={oomf.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-[#0f1419] group-hover:underline flex items-center gap-1">
                  {oomf.name}
                  {oomf.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0] text-white inline" />
                  )}
                </span>
                <span className="text-xs text-[#536471]">
                  @{oomf.username}
                </span>
                <p className="text-xs text-[#536471] line-clamp-1 mt-1">
                  {oomf.bio}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0">
                OOMFS
              </span>
            </div>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}
