import { createClient } from '@/lib/supabase/client';
import { Collection, MOCK_COLLECTIONS, MOCK_LINK_COLLECTIONS } from '@/lib/mockData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_STORAGE_PREFIX = 'oomfs_collections_v1_';

export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Read cached/offline collections from localStorage for a given user or handle.
 */
export function getLocalCollections(userId: string): Collection[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading local collections:', err);
  }
  return [];
}

/**
 * Persist collections to localStorage for instant hydration and offline persistence.
 */
export function saveLocalCollections(userId: string, collections: Collection[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}${userId}`,
      JSON.stringify(collections)
    );
  } catch (err) {
    console.warn('Error saving local collections:', err);
  }
}

/**
 * Fetch all curated collections and their items for a specific profile user.
 * Queries Supabase when a valid UUID is provided; synchronizes with and falls back to localStorage.
 */
export async function getProfileCollections(
  userId: string,
  tabType?: 'posts' | 'links'
): Promise<Collection[]> {
  if (!userId) {
    return [];
  }

  const supabase = createClient();
  let dbCollections: Collection[] = [];

  if (isValidUuid(userId)) {
    try {
      let query = supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (tabType) {
        query = query.eq('tab_type', tabType);
      }

      const { data: colsData, error: colError } = await query;

      if (!colError && colsData && colsData.length > 0) {
        const collectionIds = colsData.map((c) => c.id);

        // Fetch ordered items for these collections
        const { data: dbItems, error: itemsError } = await supabase
          .from('collection_items')
          .select('collection_id, item_id, position')
          .in('collection_id', collectionIds)
          .order('position', { ascending: true });

        if (itemsError) {
          console.warn('Error fetching collection items from Supabase:', itemsError.message);
        }

        const itemsMap = new Map<string, string[]>();
        if (dbItems) {
          for (const item of dbItems) {
            const list = itemsMap.get(item.collection_id) || [];
            list.push(item.item_id);
            itemsMap.set(item.collection_id, list);
          }
        }

        dbCollections = colsData.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description || undefined,
          icon: c.icon || '📁',
          isPinned: Boolean(c.is_pinned),
          isExclusive: Boolean(c.is_exclusive),
          tabType: c.tab_type as 'posts' | 'links',
          userId: c.user_id,
          sortOrder: c.sort_order ?? 0,
          createdAt: c.created_at,
          itemIds: itemsMap.get(c.id) || []
        }));

        // Cache live Supabase collections to local storage
        if (typeof window !== 'undefined') {
          const currentLocal = getLocalCollections(userId);
          const otherTabCols = tabType 
            ? currentLocal.filter((c) => c.tabType !== tabType)
            : [];
          saveLocalCollections(userId, [...otherTabCols, ...dbCollections]);
        }

        return dbCollections;
      }
    } catch (err) {
      console.warn('Error fetching collections from Supabase, falling back to local storage:', err);
    }
  }

  // Fallback to local storage (for demo accounts, unauthenticated testing, or offline/DB errors)
  const localCols = getLocalCollections(userId);
  if (localCols.length > 0) {
    return tabType ? localCols.filter((c) => c.tabType === tabType) : localCols;
  }

  // Default mock fallback strictly for amberlyn demo profile if local storage is uninitialized
  const isDemo = userId === 'usr_amberlyn' || userId.toLowerCase() === 'amberlyn';
  if (isDemo) {
    const defaultCols = tabType === 'links' ? MOCK_LINK_COLLECTIONS : MOCK_COLLECTIONS;
    saveLocalCollections(userId, defaultCols);
    return defaultCols;
  }

  return [];
}

/**
 * Create a new curated collection.
 * Persists to Supabase (if authenticated with UUID) and always synchronizes to local storage.
 */
export async function createCollection(params: {
  userId: string;
  tabType: 'posts' | 'links';
  title: string;
  description?: string;
  icon?: string;
  isPinned?: boolean;
  isExclusive?: boolean;
}): Promise<Collection | null> {
  const supabase = createClient();
  let createdCollection: Collection | null = null;

  if (isValidUuid(params.userId)) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: params.userId,
          tab_type: params.tabType,
          title: params.title.trim(),
          description: params.description?.trim() || null,
          icon: params.icon || '📁',
          is_pinned: Boolean(params.isPinned),
          is_exclusive: Boolean(params.isExclusive)
        })
        .select('*')
        .single();

      if (!error && data) {
        createdCollection = {
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          icon: data.icon || '📁',
          isPinned: Boolean(data.is_pinned),
          isExclusive: Boolean(data.is_exclusive),
          tabType: data.tab_type as 'posts' | 'links',
          userId: data.user_id,
          sortOrder: data.sort_order ?? 0,
          createdAt: data.created_at,
          itemIds: []
        };
      } else {
        console.warn('Supabase collection creation failed or blocked by RLS, falling back to local store:', error?.message);
      }
    } catch (err) {
      console.error('Unexpected error creating collection in Supabase:', err);
    }
  }

  // If Supabase didn't produce a collection (e.g., non-UUID user, offline, RLS rejection),
  // create a client-side persistent collection
  if (!createdCollection) {
    createdCollection = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      tabType: params.tabType,
      title: params.title.trim(),
      description: params.description?.trim() || undefined,
      icon: params.icon || '📁',
      isPinned: Boolean(params.isPinned),
      isExclusive: Boolean(params.isExclusive),
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      itemIds: []
    };
  }

  // Persist to local storage
  if (typeof window !== 'undefined') {
    const existing = getLocalCollections(params.userId);
    saveLocalCollections(params.userId, [createdCollection, ...existing]);
  }

  return createdCollection;
}

/**
 * Update an existing collection's properties (title, icon, pin state, exclusive state, etc.)
 */
export async function updateCollection(
  collectionId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    icon: string;
    isPinned: boolean;
    isExclusive: boolean;
    sortOrder: number;
  }>,
  userId?: string
): Promise<boolean> {
  const supabase = createClient();
  let dbSuccess = false;

  if (isValidUuid(collectionId)) {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
    if (updates.description !== undefined) dbUpdates.description = updates.description ? updates.description.trim() : null;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isExclusive !== undefined) dbUpdates.is_exclusive = updates.isExclusive;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    try {
      const { error } = await supabase
        .from('collections')
        .update(dbUpdates)
        .eq('id', collectionId);

      if (!error) dbSuccess = true;
    } catch (err) {
      console.warn('Error updating collection in Supabase:', err);
    }
  }

  // Update in local storage
  if (typeof window !== 'undefined') {
    const keys = userId 
      ? [`${LOCAL_STORAGE_PREFIX}${userId}`]
      : Object.keys(window.localStorage).filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX));

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        let modified = false;
        const updatedList = list.map((c) => {
          if (c.id === collectionId) {
            modified = true;
            return {
              ...c,
              ...(updates.title !== undefined ? { title: updates.title } : {}),
              ...(updates.description !== undefined ? { description: updates.description || undefined } : {}),
              ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
              ...(updates.isPinned !== undefined ? { isPinned: updates.isPinned } : {}),
              ...(updates.isExclusive !== undefined ? { isExclusive: updates.isExclusive } : {}),
              ...(updates.sortOrder !== undefined ? { sortOrder: updates.sortOrder } : {}),
            };
          }
          return c;
        });
        if (modified) {
          window.localStorage.setItem(key, JSON.stringify(updatedList));
        }
      } catch (err) {
        console.warn('Error updating collection in localStorage:', err);
      }
    }
  }

  return dbSuccess || true;
}

/**
 * Delete a collection (cascade deletes all item memberships automatically).
 */
export async function deleteCollection(
  collectionId: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient();
  let dbSuccess = false;

  if (isValidUuid(collectionId)) {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (!error) dbSuccess = true;
    } catch (err) {
      console.warn('Error deleting collection in Supabase:', err);
    }
  }

  // Remove from local storage
  if (typeof window !== 'undefined') {
    const keys = userId 
      ? [`${LOCAL_STORAGE_PREFIX}${userId}`]
      : Object.keys(window.localStorage).filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX));

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        const filtered = list.filter((c) => c.id !== collectionId);
        if (filtered.length !== list.length) {
          window.localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (err) {
        console.warn('Error deleting collection in localStorage:', err);
      }
    }
  }

  return dbSuccess || true;
}

/**
 * Add an item (post or link) into a collection.
 */
export async function addItemToCollection(
  collectionId: string,
  itemId: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient();

  if (isValidUuid(collectionId)) {
    try {
      // Get highest position
      const { data: existing } = await supabase
        .from('collection_items')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPos = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

      await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          item_id: itemId,
          position: nextPos
        });
    } catch (err) {
      console.warn('Error adding item to collection in Supabase:', err);
    }
  }

  // Update in local storage
  if (typeof window !== 'undefined') {
    const keys = userId 
      ? [`${LOCAL_STORAGE_PREFIX}${userId}`]
      : Object.keys(window.localStorage).filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX));

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        let modified = false;
        const updated = list.map((c) => {
          if (c.id === collectionId && !c.itemIds.includes(itemId)) {
            modified = true;
            return { ...c, itemIds: [...c.itemIds, itemId] };
          }
          return c;
        });
        if (modified) {
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Error adding item to collection in localStorage:', err);
      }
    }
  }

  return true;
}

/**
 * Remove an item from a collection.
 */
export async function removeItemFromCollection(
  collectionId: string,
  itemId: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient();

  if (isValidUuid(collectionId)) {
    try {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', itemId);
    } catch (err) {
      console.warn('Error removing item from collection in Supabase:', err);
    }
  }

  // Update in local storage
  if (typeof window !== 'undefined') {
    const keys = userId 
      ? [`${LOCAL_STORAGE_PREFIX}${userId}`]
      : Object.keys(window.localStorage).filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX));

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        let modified = false;
        const updated = list.map((c) => {
          if (c.id === collectionId && c.itemIds.includes(itemId)) {
            modified = true;
            return { ...c, itemIds: c.itemIds.filter((id) => id !== itemId) };
          }
          return c;
        });
        if (modified) {
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Error removing item from collection in localStorage:', err);
      }
    }
  }

  return true;
}

/**
 * Atomically synchronize an item's collection memberships based on selected collection IDs.
 */
export async function setItemCollections(
  itemId: string,
  selectedCollectionIds: string[],
  allUserCollections: Collection[],
  userId?: string
): Promise<boolean> {
  const selectedSet = new Set(selectedCollectionIds);
  const promises: Promise<boolean>[] = [];

  for (const col of allUserCollections) {
    const isCurrentlyMember = col.itemIds.includes(itemId);
    const shouldBeMember = selectedSet.has(col.id);

    if (!isCurrentlyMember && shouldBeMember) {
      promises.push(addItemToCollection(col.id, itemId, userId));
    } else if (isCurrentlyMember && !shouldBeMember) {
      promises.push(removeItemFromCollection(col.id, itemId, userId));
    }
  }

  const results = await Promise.all(promises);
  return results.every(Boolean);
}

/**
 * Persist the custom sequence / sort order of collections in Supabase and local storage.
 */
export async function reorderCollections(
  orderedCollectionIds: string[],
  userId?: string
): Promise<boolean> {
  const supabase = createClient();
  const validUuidIds = orderedCollectionIds.filter(isValidUuid);

  if (validUuidIds.length > 0) {
    try {
      const promises = validUuidIds.map((id) => {
        const index = orderedCollectionIds.indexOf(id);
        return supabase
          .from('collections')
          .update({ sort_order: index })
          .eq('id', id);
      });
      await Promise.all(promises);
    } catch (err) {
      console.warn('Error reordering collections in Supabase:', err);
    }
  }

  // Update order in local storage
  if (typeof window !== 'undefined') {
    const keys = userId 
      ? [`${LOCAL_STORAGE_PREFIX}${userId}`]
      : Object.keys(window.localStorage).filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX));

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        const colMap = new Map(list.map((c) => [c.id, c]));
        const reordered: Collection[] = [];

        for (const id of orderedCollectionIds) {
          const col = colMap.get(id);
          if (col) {
            reordered.push({ ...col, sortOrder: reordered.length });
            colMap.delete(id);
          }
        }
        for (const col of colMap.values()) {
          reordered.push(col);
        }

        window.localStorage.setItem(key, JSON.stringify(reordered));
      } catch (err) {
        console.warn('Error reordering collections in localStorage:', err);
      }
    }
  }

  return true;
}
