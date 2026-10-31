'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Bell, 
  User as UserIcon, 
  MoreHorizontal, 
  Feather,
  LayoutGrid,
  LogOut,
  LogIn,
  Bookmark,
  Settings,
  Tv
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CURRENT_USER } from '@/lib/mockData';
import { formatTwitterAvatar } from '@/lib/utils';

interface LeftSidebarProps {
  onOpenComposer?: () => void;
}

export default function LeftSidebar({ onOpenComposer }: LeftSidebarProps) {
  const pathname = usePathname();
  const { user, profile, signInWithTwitter, signOut, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Active user data (fallback to mock if not signed in)
  const activeUsername = profile?.username || (user ? 'me' : CURRENT_USER.username);
  const activeName = profile?.name || (user ? 'You' : CURRENT_USER.name);
  const activeAvatar = profile?.avatar_url || CURRENT_USER.avatar;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'localyt.tv', icon: Tv, isNonFunctional: true },
    { label: 'Bookmarks', icon: Bookmark, isNonFunctional: true },
    { label: 'Profile', href: `/${activeUsername}`, icon: UserIcon },
    { label: 'Settings', icon: Settings, isNonFunctional: true },
  ];

  return (
    <aside className="sticky top-0 h-screen flex flex-col justify-between py-3 px-2 sm:px-4 xl:w-[275px] border-r border-[#eff3f4] select-none shrink-0">
      <div className="flex flex-col gap-1">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center justify-center p-3 hover:bg-[#f7f9f9] rounded-full w-fit transition-colors group mb-1"
        >
          <div className="w-9 h-9 bg-[#1d9bf0] rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-xs group-hover:scale-105 transition-transform">
            O
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isNonFunctional && (pathname === item.href || (item.label === 'Profile' && pathname === `/${activeUsername}`));

            if (item.isNonFunctional) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-4 px-4 py-3 rounded-full transition-colors w-fit xl:w-full text-[#0f1419] hover:bg-[#f7f9f9] font-normal cursor-pointer text-left"
                  title={item.label}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="text-lg hidden xl:inline flex-1">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors w-fit xl:w-full ${
                  isActive 
                    ? 'font-bold text-[#0f1419]' 
                    : 'text-[#0f1419] hover:bg-[#f7f9f9] font-normal'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                </div>
                <span className="text-lg hidden xl:inline flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Create Board Button */}
        <button
          onClick={onOpenComposer}
          className="mt-4 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3.5 px-4 rounded-full w-fit xl:w-full flex items-center justify-center gap-2 shadow-xs transition-colors text-base cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5 xl:hidden" />
          <span className="hidden xl:inline">Create Board</span>
        </button>

        {!user && (
          <button
            onClick={() => signInWithTwitter()}
            className="mt-2 bg-[#0f1419] hover:bg-[#272c30] text-white font-bold py-2.5 px-4 rounded-full w-fit xl:w-full flex items-center justify-center gap-2 shadow-xs transition-colors text-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sign in with X</span>
          </button>
        )}
      </div>

      {/* User profile pill at bottom with Sign Out menu */}
      <div className="relative">
        {menuOpen && user && (
          <div className="absolute bottom-16 left-0 w-full bg-white border border-[#eff3f4] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in">
            <button
              onClick={() => {
                signOut();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out @{activeUsername}</span>
            </button>
          </div>
        )}

        {user ? (
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-between p-2 hover:bg-[#f7f9f9] rounded-full transition-colors w-fit xl:w-full cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={formatTwitterAvatar(activeAvatar)}
                alt={activeName}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div className="hidden xl:flex flex-col min-w-0 text-left">
                <span className="font-bold text-sm text-[#0f1419] truncate leading-tight">
                  {activeName}
                </span>
                <span className="text-xs text-[#536471] truncate">
                  @{activeUsername}
                </span>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-[#536471] hidden xl:block" />
          </div>
        ) : (
          <button
            onClick={() => signInWithTwitter()}
            className="flex items-center gap-3 p-2 hover:bg-[#f7f9f9] rounded-full transition-colors w-fit xl:w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-black text-sm">
              𝕏
            </div>
            <div className="hidden xl:flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#0f1419]">Connect Account</span>
              <span className="text-xs text-[#536471]">Sign in with X</span>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
