'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, Sparkles, Heart, Coins, ArrowRight, ExternalLink, Check, SlidersHorizontal, Info, Calculator, Plus, Trash2, RotateCcw, Users, Camera } from 'lucide-react';
import Link from 'next/link';
import { Supporter, DEFAULT_SUPPORTERS } from '@/lib/mockData';
import { formatTwitterAvatar, compressImageFile } from '@/lib/utils';
import { CatShushIcon } from './ProfileView';
import { SUPPORTER_SCENARIOS, ScenarioPreset, AVATAR_POOL } from '@/lib/supporterPresets';
import { packSupporterCircles } from '@/lib/circlePacking';

interface SupporterModalProps {
  isOpen: boolean;
  name: string;
  username: string;
  supporters: Supporter[];
  onClose: () => void;
  onScenarioChange?: (newSupporters: Supporter[]) => void;
  onAddTip?: (newSupporter: Supporter) => void;
}

export interface SandboxPerson {
  id: string;
  name: string;
  username: string;
  avatar: string;
  areaShare: number; // percentage of total area budget (sums to 100)
}

export default function SupporterModal({
  isOpen,
  name,
  username,
  supporters = [],
  onClose,
  onScenarioChange,
  onAddTip,
}: SupporterModalProps) {
  // Mode: Presets vs Custom Math Sandbox
  const [activeTab, setActiveTab] = useState<'presets' | 'sandbox'>('sandbox');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('default_coins');
  const [selectedSupporterId, setSelectedSupporterId] = useState<string | null>(null);

  // Helper to convert incoming supporters list to SandboxPerson[]
  const initPeopleFromSupporters = (source: Supporter[]): SandboxPerson[] => {
    const list = source && source.length > 0 ? source : DEFAULT_SUPPORTERS;
    const count = list.length;
    const share = 100 / count;
    return list.map((s, i) => ({
      id: s.id || `person_${i}`,
      name: s.name,
      username: s.username,
      avatar: s.avatar,
      areaShare: share,
    }));
  };

  // Math Sandbox State: Flat list of people with autobalancing area shares
  const [people, setPeople] = useState<SandboxPerson[]>(() => {
    return initPeopleFromSupporters(supporters);
  });

  // Re-sync people whenever modal opens with current profile supporters
  useEffect(() => {
    if (isOpen) {
      setPeople(initPeopleFromSupporters(supporters));
    }
  }, [isOpen]);

  // Interactive Tip Form State
  const [tipTier, setTipTier] = useState<number>(10);
  const [tipNote, setTipNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justTipped, setJustTipped] = useState(false);

  // Compute dynamic circle packing with ZERO overlapping and organic nesting
  const packedModalCircles = useMemo(
    () => packSupporterCircles(supporters, { containerRadius: 49.2, minGap: 1.2, targetFillDensity: 0.83, autoScaleToEdge: true }),
    [supporters]
  );

  // Set default selected supporter when opening or supporters change
  useEffect(() => {
    if (isOpen && supporters.length > 0) {
      const top = [...supporters].sort((a, b) => b.amount - a.amount)[0];
      setSelectedSupporterId(top.id);
    } else {
      setSelectedSupporterId(null);
    }
  }, [isOpen, supporters]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sortedSupporters = [...supporters].sort((a, b) => b.amount - a.amount);
  const activeSupporter = sortedSupporters.find((s) => s.id === selectedSupporterId) || sortedSupporters[0];
  const totalRaised = supporters.reduce((acc, s) => acc + s.amount, 0);

  // Helper to sync people list with the circle packing engine & profile TipCircle
  const syncPeopleToSupporters = (peopleList: SandboxPerson[]) => {
    const list: Supporter[] = peopleList.map((p) => {
      // Area Share = p.areaShare % of total available disk area
      // radius = sqrt((areaShare / 100) * 0.83) * 49.2
      const radius = Math.sqrt((Math.max(p.areaShare, 0.5) / 100) * 0.83) * 49.2;
      const simulatedAmount = Math.max(1, Math.round(p.areaShare * 1.5));
      return {
        id: p.id,
        name: p.name,
        username: p.username,
        avatar: p.avatar,
        amount: simulatedAmount,
        tier: simulatedAmount >= 50 ? 'hero' : simulatedAmount >= 20 ? 'patron' : 'supporter',
        message: `${Math.round(p.areaShare)}% of total circle area`,
        createdAt: 'Just now',
        isMutual: true,
        customRadius: radius,
      };
    });

    if (onScenarioChange) {
      onScenarioChange(list);
    }
    if (list.length > 0 && (!selectedSupporterId || !list.some((s) => s.id === selectedSupporterId))) {
      setSelectedSupporterId(list[0].id);
    }
  };

  // Sync on mount or tab switch to sandbox
  useEffect(() => {
    if (activeTab === 'sandbox' && isOpen) {
      syncPeopleToSupporters(people);
    }
  }, [activeTab, isOpen]);

  // Autobalancing slider handler: When one person moves, others scale proportionally
  const handleSliderChange = (personId: string, newShare: number) => {
    const clampedNew = Math.min(Math.max(newShare, 1), 85);
    const currentPerson = people.find((p) => p.id === personId);
    if (!currentPerson) return;

    const oldShare = currentPerson.areaShare;
    const remainingNew = 100 - clampedNew;
    const remainingOld = 100 - oldShare;

    const otherCount = people.length - 1;
    if (otherCount === 0) return;

    const updated = people.map((p) => {
      if (p.id === personId) {
        return { ...p, areaShare: clampedNew };
      }
      if (remainingOld <= 0.01) {
        // Distribute equally if previously 100%
        return { ...p, areaShare: remainingNew / otherCount };
      }
      // Scale proportionally based on their previous share
      const ratio = p.areaShare / remainingOld;
      return { ...p, areaShare: Math.max(0.5, ratio * remainingNew) };
    });

    // Normalize to guarantee exact sum = 100
    const sum = updated.reduce((acc, p) => acc + p.areaShare, 0);
    const normalized = updated.map((p) => ({
      ...p,
      areaShare: (p.areaShare / sum) * 100,
    }));

    setPeople(normalized);
    syncPeopleToSupporters(normalized);
  };

  // Add person: grabs next avatar from pool and shares evenly
  const handleAddPerson = () => {
    const nextIdx = people.length;
    const p = AVATAR_POOL[nextIdx % AVATAR_POOL.length];
    const newCount = people.length + 1;
    const newPersonShare = 100 / newCount;

    // Scale existing down to make room
    const scaleFactor = (100 - newPersonShare) / 100;
    const updated = people.map((person) => ({
      ...person,
      areaShare: person.areaShare * scaleFactor,
    }));

    const newPerson: SandboxPerson = {
      id: `person_${Date.now()}`,
      name: p.name,
      username: `${p.username}_${nextIdx}`,
      avatar: p.avatar,
      areaShare: newPersonShare,
    };

    const finalList = [...updated, newPerson];
    setPeople(finalList);
    syncPeopleToSupporters(finalList);
  };

  // Remove person and distribute their share proportionally
  const handleRemovePerson = (personId: string) => {
    if (people.length <= 1) return;
    const removing = people.find((p) => p.id === personId);
    const filtered = people.filter((p) => p.id !== personId);
    if (!removing) return;

    const remainingSum = filtered.reduce((acc, p) => acc + p.areaShare, 0);
    const normalized = filtered.map((p) => ({
      ...p,
      areaShare: (p.areaShare / remainingSum) * 100,
    }));

    setPeople(normalized);
    syncPeopleToSupporters(normalized);
  };

  // Equalize all: gives everyone exactly 100 / N%
  const handleEqualizeAll = () => {
    const count = people.length;
    const equalShare = 100 / count;
    const equalized = people.map((p) => ({ ...p, areaShare: equalShare }));
    setPeople(equalized);
    syncPeopleToSupporters(equalized);
  };

  // Quick count picker: sets exact count with equal or Pareto shares
  const handleSetQuickCount = (count: number) => {
    const list: SandboxPerson[] = [];
    const equalShare = 100 / count;
    for (let i = 0; i < count; i++) {
      const p = AVATAR_POOL[i % AVATAR_POOL.length];
      list.push({
        id: `person_${i}_${Date.now()}`,
        name: p.name,
        username: p.username,
        avatar: p.avatar,
        areaShare: equalShare,
      });
    }
    setPeople(list);
    syncPeopleToSupporters(list);
  };

  // Temporary Sandbox Custom Avatar Upload (Session-only, zero persistence)
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const targetAvatarPersonIdRef = useRef<string | null>(null);

  const handleAvatarClick = (personId: string) => {
    targetAvatarPersonIdRef.current = personId;
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const personId = targetAvatarPersonIdRef.current;
    if (!file || !personId) return;

    try {
      let dataUrl: string;
      try {
        dataUrl = await compressImageFile(file, 400, 0.9);
      } catch {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (loadEvt) => resolve(loadEvt.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      if (dataUrl) {
        const updated = people.map((p) => (p.id === personId ? { ...p, avatar: dataUrl } : p));
        setPeople(updated);
        syncPeopleToSupporters(updated);
      }
    } catch (err) {
      console.warn('Failed to load avatar image:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Preset Scenario switch handler
  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setActiveScenarioId(scenario.id);
    const newSupporters = scenario.getSupporters();
    if (onScenarioChange) {
      onScenarioChange(newSupporters);
    }
    if (newSupporters.length > 0) {
      setSelectedSupporterId(newSupporters[0].id);
    } else {
      setSelectedSupporterId(null);
    }
  };

  const handleSendTip = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setJustTipped(true);

      const newSupporter: Supporter = {
        id: `sup_${Date.now()}`,
        username: 'you',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        amount: tipTier,
        tier: tipTier >= 50 ? 'hero' : tipTier >= 20 ? 'patron' : 'supporter',
        message: tipNote.trim() || 'Excited to support your work! 🚀',
        createdAt: 'Just now',
        isMutual: true,
      };

      if (onAddTip) {
        onAddTip(newSupporter);
      } else if (onScenarioChange) {
        onScenarioChange([newSupporter, ...supporters]);
      }
      setSelectedSupporterId(newSupporter.id);

      setTimeout(() => {
        setJustTipped(false);
      }, 2500);
    }, 500);
  };

  const activeScenario = SUPPORTER_SCENARIOS.find((s) => s.id === activeScenarioId) || SUPPORTER_SCENARIOS[3];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#eff3f4] flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden file input for temporary custom sandbox avatar uploads */}
        <input
          ref={avatarFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileSelect}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eff3f4] bg-[#f7f9f9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#0d8bd9] flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f1419] leading-tight flex items-center gap-1.5">
                <span>{name}&apos;s Tip Circle</span>
              </h3>
              <p className="text-xs text-[#536471]">
                {supporters.length} supporter{supporters.length === 1 ? '' : 's'} • ${totalRaised} total in orbit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Mode Toggle (Math Sandbox vs Presets) */}
            <div className="flex bg-[#eff3f4] p-0.5 rounded-lg border border-[#cfd9de]/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sandbox');
                  syncPeopleToSupporters(people);
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'sandbox'
                    ? 'bg-white text-[#1d9bf0] shadow-2xs'
                    : 'text-[#536471] hover:text-[#0f1419]'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Area Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-white text-[#0f1419] shadow-2xs'
                    : 'text-[#536471] hover:text-[#0f1419]'
                }`}
              >
                Presets
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#536471] hover:bg-[#0f1419]/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUB-HEADER: SIMPLE PEOPLE SLIDERS OR SCENARIOS                 */}
        {/* ============================================================== */}
        {activeTab === 'sandbox' ? (
          /* Simple Autobalancing People List with Sliders */
          <div className="bg-[#f0f3f4]/80 border-b border-[#eff3f4] px-4 py-2.5 flex flex-col gap-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1d9bf0]" />
                <span className="text-xs font-bold text-[#0f1419]">
                  Autobalancing Area ({people.length} people • 100% total)
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleEqualizeAll}
                  className="px-2 py-0.5 rounded bg-white border border-[#cfd9de] hover:bg-[#eff3f4] font-bold text-[#536471] transition-colors cursor-pointer"
                  title="Make everyone equal size"
                >
                  Equalize All
                </button>
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="px-2 py-0.5 rounded bg-[#0f1419] text-white hover:bg-[#272c30] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Person</span>
                </button>
              </div>
            </div>

            {/* Flat Scrollable List of People with Sliders */}
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {people.map((p) => {
                const roundedShare = Math.round(p.areaShare);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#cfd9de] shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleAvatarClick(p.id)}
                      title="Click to upload custom image"
                      className="relative w-7 h-7 rounded-full shrink-0 group/avatar cursor-pointer"
                    >
                      <img
                        src={formatTwitterAvatar(p.avatar)}
                        alt={p.name}
                        className="w-full h-full rounded-full object-cover border border-[#cfd9de] group-hover/avatar:opacity-60 transition-opacity"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                    <div className="w-24 shrink-0">
                      <p className="font-bold text-xs text-[#0f1419] truncate leading-tight">{p.name}</p>
                      <p className="text-[10px] text-[#536471] truncate leading-none">@{p.username}</p>
                    </div>

                    {/* Area Share Slider */}
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min={1}
                        max={75}
                        value={roundedShare}
                        onChange={(e) => handleSliderChange(p.id, parseFloat(e.target.value))}
                        className="w-full accent-[#1d9bf0] cursor-pointer h-1.5 bg-[#eff3f4] rounded-lg"
                      />
                      <span className="font-mono font-black text-xs text-[#0f1419] w-9 text-right">
                        {roundedShare}%
                      </span>
                    </div>

                    {/* Remove Person */}
                    {people.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(p.id)}
                        className="p-1 text-[#536471] hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                        title="Remove person"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Count Selection Bar */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#eff3f4]">
              <span className="text-[#536471]">Quick counts:</span>
              <div className="flex items-center gap-1.5">
                {[3, 5, 8, 12, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetQuickCount(count)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      people.length === count
                        ? 'bg-[#1d9bf0] text-white shadow-2xs'
                        : 'bg-white border border-[#cfd9de] text-[#536471] hover:bg-[#eff3f4]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Presets Bar */
          <div className="bg-[#f0f3f4]/70 border-b border-[#eff3f4] px-4 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f1419]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1d9bf0]" />
                <span>Scenario Presets Playground</span>
              </div>
              <span className="text-[10px] text-[#536471] bg-white/80 px-2 py-0.5 rounded-full border border-[#cfd9de]">
                {activeScenario.badge}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SUPPORTER_SCENARIOS.map((sc) => {
                const isSelected = sc.id === activeScenarioId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#0f1419] text-white shadow-xs'
                        : 'bg-white hover:bg-[#eff3f4] text-[#536471] hover:text-[#0f1419] border border-[#cfd9de]'
                    }`}
                  >
                    <span>{sc.icon}</span>
                    <span>{sc.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-[#536471] leading-tight flex items-start gap-1">
              <Info className="w-3 h-3 text-[#1d9bf0] shrink-0 mt-0.5" />
              <span>{activeScenario.description}</span>
            </p>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex flex-col items-center gap-5">
          {/* ============================================================== */}
          {/* THE EXPANDED CONSTELLATION CLOUD (Dynamic Zero-Overlap Arena)   */}
          {/* ============================================================== */}
          <div className="relative w-64 h-64 sm:w-76 sm:h-76 rounded-full bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border-4 border-white shadow-inner flex items-center justify-center select-none overflow-hidden shrink-0">
            {/* Ambient Celestial Orbit Lines */}
            <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-dashed border-[#1d9bf0]/25 pointer-events-none" />
            <div className="absolute w-52 h-52 sm:w-62 sm:h-62 rounded-full border border-dashed border-[#cbd5e1]/40 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#1d9bf0]/5 to-[#1d9bf0]/10 pointer-events-none" />

            {packedModalCircles.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {packedModalCircles.map((pc, idx) => {
                  const isSelected = selectedSupporterId === pc.item.id;
                  const isCoin = pc.item.id.startsWith('coin_') || pc.item.avatar.includes('coin') || pc.item.avatar.includes('Coin');
                  const isTopHero = !isCoin && idx === 0 && pc.item.amount >= 25;
                  const borderClass = isCoin
                    ? 'border-2 border-white/70'
                    : pc.item.amount >= 50
                    ? 'border-2 border-amber-400'
                    : pc.item.amount >= 20
                    ? 'border-2 border-[#1d9bf0]'
                    : 'border-2 border-white';

                  return (
                    <button
                      key={pc.item.id}
                      type="button"
                      onClick={() => setSelectedSupporterId(pc.item.id)}
                      title={`${pc.item.name} (@${pc.item.username}) • ${Math.round((pc.diameter / 2) ** 2 / (24.6 ** 2) * 100)}% area`}
                      style={{
                        left: `${pc.x}%`,
                        top: `${pc.y}%`,
                        width: `${pc.diameter}%`,
                        height: `${pc.diameter}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute rounded-full shadow-md overflow-hidden cursor-pointer transition-all duration-150 ${borderClass} ${
                        isSelected ? 'ring-4 ring-[#1d9bf0] z-30' : 'hover:ring-3 hover:ring-[#1d9bf0]/80 z-10'
                      }`}
                    >
                      <img
                        src={formatTwitterAvatar(pc.item.avatar)}
                        alt={pc.item.name}
                        className="w-full h-full object-cover"
                      />
                      {isTopHero && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-amber-400 text-[#451a03] flex items-center justify-center text-[9px] font-black shadow-xs pointer-events-none">
                          👑
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Cold Start in Modal */
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ffe066] via-[#f59e0b] to-[#b45309] border-2 border-[#fef08a] shadow-md flex items-center justify-center mb-2">
                  <CatShushIcon className="w-8 h-8 text-[#451a03]" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0f1419]">Empty Orbit</h4>
                <p className="text-xs text-[#536471] max-w-[190px] mt-0.5">
                  No one has tipped yet. Drop a tip below to claim the 👑 Hero spot!
                </p>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACTIVE SUPPORTER DETAIL CARD                                   */}
          {/* ============================================================== */}
          {activeSupporter ? (
            <div className="w-full bg-[#f7f9f9] border border-[#eff3f4] rounded-xl p-3.5 flex flex-col gap-2 transition-all">
              <div className="flex items-center justify-between">
                <Link
                  href={`/${activeSupporter.username}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 group/card"
                >
                  <img
                    src={formatTwitterAvatar(activeSupporter.avatar)}
                    alt={activeSupporter.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#cfd9de]"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-[#0f1419] group-hover/card:underline">
                        {activeSupporter.name}
                      </span>
                      {activeSupporter.isMutual && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#1d9bf0]/10 text-[#1d9bf0] font-bold">
                          OOMF
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#536471]">@{activeSupporter.username}</span>
                  </div>
                </Link>

                <div className="text-right">
                  <span className="text-sm font-black text-[#0f1419] bg-white border border-[#cfd9de] px-2.5 py-1 rounded-full shadow-2xs">
                    ${activeSupporter.amount}
                  </span>
                  <p className="text-[10px] text-[#536471] mt-0.5">{activeSupporter.createdAt}</p>
                </div>
              </div>

              {activeSupporter.message && (
                <p className="text-xs text-[#0f1419] italic bg-white/70 border border-[#eff3f4] rounded-lg p-2 leading-relaxed">
                  &ldquo;{activeSupporter.message}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="w-full bg-[#f7f9f9] border border-[#eff3f4] rounded-xl p-3 text-center text-xs text-[#536471]">
              Select a supporter in the orbit above to inspect their note
            </div>
          )}

          {/* ============================================================== */}
          {/* DROP A TIP / BECOME A SUPPORTER INTERACTIVE FORM               */}
          {/* ============================================================== */}
          <div className="w-full border-t border-[#eff3f4] pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f1419]">Drop an Interactive Tip</span>
              <span className="text-[11px] text-[#536471]">Your PFP immediately joins this scenario</span>
            </div>

            {/* Tier Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { amount: 5, label: '$5', icon: '☕' },
                { amount: 10, label: '$10', icon: '🌟' },
                { amount: 25, label: '$25', icon: '🚀' },
                { amount: 50, label: '$50', icon: '👑' },
              ].map((tier) => (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => setTipTier(tier.amount)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    tipTier === tier.amount
                      ? 'bg-[#0f1419] text-white border-[#0f1419] shadow-sm'
                      : 'bg-white text-[#0f1419] border-[#cfd9de] hover:border-[#0f1419]'
                  }`}
                >
                  <span className="text-base">{tier.icon}</span>
                  <span>{tier.label}</span>
                </button>
              ))}
            </div>

            {/* Note Input */}
            <input
              type="text"
              value={tipNote}
              onChange={(e) => setTipNote(e.target.value)}
              placeholder={`Leave an encouraging note for @${username}...`}
              maxLength={80}
              className="w-full px-3.5 py-2 text-xs bg-[#f7f9f9] border border-[#cfd9de] focus:border-[#1d9bf0] focus:bg-white rounded-xl focus:outline-none transition-colors"
            />

            {/* Submit CTA */}
            <button
              type="button"
              onClick={handleSendTip}
              disabled={isSubmitting}
              className={`w-full py-3 rounded-full text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                justTipped
                  ? 'bg-[#00ba7c] text-white'
                  : 'bg-[#1d9bf0] hover:bg-[#1a8cd8] active:scale-98 text-white'
              }`}
            >
              {justTipped ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Joined Orbit with ${tipTier}!</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>{isSubmitting ? 'Joining Orbit...' : `Send $${tipTier} Tip & Join Orbit`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
