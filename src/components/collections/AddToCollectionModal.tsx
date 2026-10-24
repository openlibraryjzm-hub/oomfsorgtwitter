'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Star, Plus, Layers, Sparkles } from 'lucide-react';
import { Collection } from '@/lib/mockData';
import { addItemToCollection, removeItemFromCollection } from '@/lib/collections';
import CreateCollectionModal from './CreateCollectionModal';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle?: string;
  itemTypeLabel?: string;
  collections: Collection[];
  userId: string;
  tabType: 'posts' | 'links';
  onUpdateCollections: (updatedCollections: Collection[]) => void;
}

export default function AddToCollectionModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  itemTypeLabel = 'post',
  collections,
  userId,
  tabType,
  onUpdateCollections
}: AddToCollectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialSelected = new Set(
        collections
          .filter((c) => c.itemIds.includes(itemId))
          .map((c) => c.id)
      );
      setSelectedIds(initialSelected);
    }
  }, [isOpen, itemId, collections]);

  if (!isOpen) return null;

  const handleToggle = async (collection: Collection) => {
    const isCurrentlyIn = selectedIds.has(collection.id);

    // Hard limit: A collection cannot exceed 100 items
    if (!isCurrentlyIn && collection.itemIds.length >= 100) {
      alert(`This collection has reached the maximum limit of 100 posts. Please remove an item before adding a new one.`);
      return;
    }

    const newSelected = new Set(selectedIds);

    if (isCurrentlyIn) {
      newSelected.delete(collection.id);
    } else {
      newSelected.add(collection.id);
    }
    setSelectedIds(newSelected);

    // Optimistically update parent collections state
    const updated = collections.map((c) => {
      if (c.id === collection.id) {
        return {
          ...c,
          itemIds: isCurrentlyIn
            ? c.itemIds.filter((id) => id !== itemId)
            : [...c.itemIds, itemId]
        };
      }
      return c;
    });

    onUpdateCollections(updated);

    // Persist to Supabase
    if (isCurrentlyIn) {
      await removeItemFromCollection(collection.id, itemId);
    } else {
      await addItemToCollection(collection.id, itemId);
    }
  };

  const handleCreatedCollection = (newCol: Collection) => {
    // Automatically add this item to the newly created collection
    const colWithItem: Collection = {
      ...newCol,
      itemIds: [itemId]
    };
    const updated = [...collections, colWithItem];
    onUpdateCollections(updated);

    setSelectedIds((prev) => new Set([...prev, newCol.id]));
    addItemToCollection(newCol.id, itemId);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#eff3f4] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#eff3f4]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center text-[#1d9bf0]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0f1419] text-base leading-tight">
                  Organize into Collections
                </h3>
                <p className="text-xs text-[#536471] truncate max-w-[280px]">
                  {itemTitle ? `"${itemTitle}"` : `Select lenses for this ${itemTypeLabel}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#536471] hover:bg-gray-100 hover:text-[#0f1419] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Add Action Banner */}
          <div className="px-4 py-2.5 bg-[#f7f9f9] border-b border-[#eff3f4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536471]">
              Assigned to {selectedIds.size} of {collections.length} {tabType} {selectedIds.size === 1 ? 'lens' : 'lenses'}
            </span>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="text-xs font-bold text-[#1d9bf0] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Preset</span>
            </button>
          </div>

          {/* Collections List with Checkboxes */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#eff3f4]">
            {collections.length > 0 ? (
              collections.map((col) => {
                const isChecked = selectedIds.has(col.id);
                const isFull = col.itemIds.length >= 100 && !isChecked;
                return (
                  <label
                    key={col.id}
                    onClick={() => handleToggle(col)}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                      isChecked ? 'bg-[#1d9bf0]/5' : isFull ? 'opacity-60 hover:bg-gray-50' : 'hover:bg-[#f7f9f9]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-[#f7f9f9] border border-black/5 flex items-center justify-center text-base shrink-0">
                        {col.icon || '📁'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-[#0f1419] flex items-center gap-1.5 truncate">
                          <span className="truncate">{col.title}</span>
                          <span className="text-[11px] font-normal text-[#536471]">
                            ({col.itemIds.length}/100)
                          </span>
                          {isFull && (
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded shrink-0">
                              Full
                            </span>
                          )}
                          {col.isPinned && (
                            <span title="Pinned" className="text-amber-500 shrink-0 flex items-center">
                              <Star className="w-3 h-3 fill-amber-500" />
                            </span>
                          )}
                          {col.isExclusive && (
                            <span 
                              className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5"
                              title="Exclusive lens: hidden from main All feed"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              Exclusive
                            </span>
                          )}
                        </div>
                        {col.description && (
                          <p className="text-xs text-[#536471] truncate">
                            {col.description}
                          </p>
                        )}
                        {col.isExclusive && (
                          <p className="text-[10px] text-amber-700 font-medium">
                            Only shown in this collection (hidden from main feed)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Checkbox Icon */}
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                      isChecked
                        ? 'bg-[#1d9bf0] border-[#1d9bf0] text-white'
                        : 'border-[#cfd9de] bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </label>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center">
                <p className="text-sm font-semibold text-[#0f1419]">No collections yet</p>
                <p className="text-xs text-[#536471] mt-1 mb-4">
                  Create your first collection to group and curate your {tabType}.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Create Collection
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#eff3f4] bg-[#f7f9f9] flex items-center justify-between">
            <span className="text-[11px] text-[#536471]">
              Changes save automatically
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#0f1419] hover:bg-[#272c30] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Submodal for creating a new collection directly from this organizer */}
      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        userId={userId}
        tabType={tabType}
        onCreated={handleCreatedCollection}
      />
    </>
  );
}
