'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { MOCK_OOMFS, CURRENT_USER } from '@/lib/mockData';
import { Users, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';

export default function OomfsDirectoryPage() {
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
          When you and another user follow each other on oomfs.org, you automatically earn an <b>OOMF badge</b> on each other's 1:1 X profiles. Put <b>oomfs.org/{CURRENT_USER.username}</b> in your X bio to invite your followers to connect!
        </p>
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
              <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1d9bf0]/20">
                OOMF
              </span>
            </div>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}
