'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { MOCK_OOMFS } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

export default function RightSidebar() {
  const { user, profile, signInWithTwitter } = useAuth();
  const suggestedUsers = MOCK_OOMFS.slice(0, 3);

  return (
    <aside className="w-80 xl:w-96 hidden lg:flex flex-col gap-4 py-3 pl-6 pr-4 sticky top-0 h-screen overflow-y-auto">
      {/* Search Input */}
      <div className="sticky top-0 bg-white py-1 z-10">
        <div className="relative flex items-center bg-[#eff3f4] rounded-full focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1d9bf0] focus-within:border-[#1d9bf0] border border-transparent transition-all">
          <Search className="w-4 h-4 text-[#536471] absolute left-4" />
          <input
            type="text"
            placeholder="Search oomfs.org"
            className="w-full bg-transparent py-2.5 pl-11 pr-4 text-sm text-[#0f1419] placeholder-[#536471] outline-none rounded-full"
          />
        </div>
      </div>

      {/* Claim / Connect Box */}
      {!user ? (
        <div className="bg-[#f7f9f9] rounded-2xl p-4 border border-[#eff3f4] flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[#0f1419] font-extrabold text-base">
            <span>Claim your oomfs.org URL</span>
            <Sparkles className="w-4 h-4 text-[#1d9bf0]" />
          </div>
          <p className="text-xs text-[#536471] leading-relaxed">
            Link your X account via OAuth, build your 1:1 X clone profile, and showcase your mutual followers (OOMFs).
          </p>
          <button 
            onClick={() => signInWithTwitter()}
            className="mt-1 bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-xs py-2 px-4 rounded-full w-fit transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Connect X Account</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#f7f9f9] rounded-2xl p-4 border border-[#eff3f4] flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[#0f1419] font-extrabold text-sm">
            <span>Connected as @{profile?.username || 'you'}</span>
            <span className="text-green-600 font-bold text-xs">● Active</span>
          </div>
          <p className="text-xs text-[#536471] leading-relaxed">
            Your live profile is accessible at:
          </p>
          <Link
            href={`/${profile?.username || 'me'}`}
            className="bg-white border border-[#eff3f4] rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold text-[#1d9bf0] hover:underline truncate"
          >
            oomfs.org/{profile?.username || 'me'}
          </Link>
        </div>
      )}

      {/* Who to Follow */}
      <div className="bg-[#f7f9f9] rounded-2xl border border-[#eff3f4] overflow-hidden">
        <h3 className="font-extrabold text-base text-[#0f1419] px-4 pt-3 pb-2">
          Featured OOMFs
        </h3>
        <div className="flex flex-col">
          {suggestedUsers.map((user) => (
            <Link
              key={user.id}
              href={`/${user.username}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#eff3f4]/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#0f1419] truncate group-hover:underline flex items-center gap-1">
                    {user.name}
                    {user.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0] text-white inline" />
                    )}
                  </span>
                  <span className="text-xs text-[#536471] truncate">
                    @{user.username}
                  </span>
                </div>
              </div>
              <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1d9bf0]/20">
                OOMF
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/oomfs"
          className="block px-4 py-3 text-xs text-[#1d9bf0] font-semibold hover:bg-[#eff3f4]/50 transition-colors"
        >
          Show more
        </Link>
      </div>

      {/* Footer info links */}
      <footer className="px-4 text-[11px] text-[#536471] flex flex-wrap gap-x-2 gap-y-1">
        <a href="#" className="hover:underline">Terms of Service</a>
        <span>·</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span>·</span>
        <span>© 2026 oomfs.org</span>
      </footer>
    </aside>
  );
}
