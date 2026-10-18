'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, Users } from 'lucide-react';
import { User, MOCK_USERS } from '@/lib/mockData';
import { getMutualOomfs, getUserFollowing, isValidUuid } from '@/lib/follows';
import { formatTwitterAvatar } from '@/lib/utils';

export interface SelectableOomf {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isMutual?: boolean;
}

interface SelectOomfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: SelectableOomf) => void;
  currentUserId?: string;
}

export default function SelectOomfModal({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId
}: SelectOomfModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<SelectableOomf[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const results: SelectableOomf[] = [];
        const seenUsernames = new Set<string>();

        if (currentUserId && isValidUuid(currentUserId)) {
          const [mutuals, following] = await Promise.all([
            getMutualOomfs(currentUserId),
            getUserFollowing(currentUserId)
          ]);

          if (mutuals && Array.isArray(mutuals)) {
            for (const m of mutuals) {
              if (m && m.username && !seenUsernames.has(m.username.toLowerCase())) {
                seenUsernames.add(m.username.toLowerCase());
                results.push({
                  id: m.id,
                  username: m.username,
                  name: m.name || m.username,
                  avatar: m.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.username,
                  isMutual: true
                });
              }
            }
          }

          if (following && Array.isArray(following)) {
            for (const f of following) {
              if (f && f.username && !seenUsernames.has(f.username.toLowerCase())) {
                seenUsernames.add(f.username.toLowerCase());
                results.push({
                  id: f.id,
                  username: f.username,
                  name: f.name || f.username,
                  avatar: f.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + f.username,
                  isMutual: false
                });
              }
            }
          }
        }

        // Demo / fallback users from MOCK_USERS
        const mockList: User[] = Object.values(MOCK_USERS);
        for (const u of mockList) {
          if (!seenUsernames.has(u.username.toLowerCase())) {
            seenUsernames.add(u.username.toLowerCase());
            results.push({
              id: u.id,
              username: u.username,
              name: u.name,
              avatar: u.avatar,
              isMutual: Boolean(u.isOomf)
            });
          }
        }

        setAccounts(results);
      } catch (err) {
        console.warn('Error loading selectable accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, currentUserId]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.username.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center text-[#1d9bf0]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0f1419] text-base leading-tight">
                Select an OOMF
              </h3>
              <p className="text-xs text-[#536471]">
                Pick a mutual or friend to feature as an Avatar Badge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-[#536471] hover:text-[#0f1419] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eff3f4] bg-[#f7f9f9]/60">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#536471] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-white rounded-full text-xs text-[#0f1419] border border-[#eff3f4] focus:outline-hidden focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] transition-all"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#eff3f4] min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#536471] text-xs">
              <span className="w-4 h-4 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin mr-2" />
              Loading accounts...
            </div>
          ) : filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => {
                  onSelectUser(account);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 hover:bg-[#f7f9f9] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <img
                    src={formatTwitterAvatar(account.avatar)}
                    alt={account.name}
                    className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                  />
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[#0f1419] text-sm truncate group-hover:text-[#1d9bf0] transition-colors">
                        {account.name}
                      </span>
                      {account.isMutual && (
                        <span className="bg-[#1d9bf0]/10 text-[#1d9bf0] text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                          OOMFS
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#536471] truncate">
                      @{account.username}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="bg-[#0f1419] group-hover:bg-[#1d9bf0] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shrink-0 shadow-2xs"
                >
                  Feature
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 text-[#536471] text-xs">
              No accounts found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
