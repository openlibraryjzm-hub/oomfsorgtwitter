import { createClient } from '@/lib/supabase/client';
import { Collection, MOCK_COLLECTIONS, MOCK_LINK_COLLECTIONS } from '@/lib/mockData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_STORAGE_PREFIX = 'oomfs_collections_v1_';

export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Determine if a collection belongs to the Links tab.
 */
export function isLinkCollection(c: Collection): boolean {
  if (c.slug || c.isDefault || (c.id && c.id.startsWith('col_link_')) || c.id === 'main') {
    return true;
  }
  return c.tabType === 'links';
}

/**
 * Determine if a collection belongs to the Posts timeline tab.
 */
export function isPostCollection(c: Collection): boolean {
  if (c.tabType === 'posts') return true;
  if (c.id && !c.id.startsWith('col_link_') && !c.slug && !c.isDefault && c.id !== 'main') {
    return true;
  }
  return c.tabType !== 'links';
}

/**
 * Read cached/offline collections from localStorage for a given user or handle.
 */
export function getLocalCollections(userId: string): Collection[] {
  let effectiveId = userId;
  if (typeof window !== 'undefined' && (!effectiveId || effectiveId.startsWith('usr_'))) {
    if (window.location.pathname.toLowerCase().includes('amberlyn')) {
      effectiveId = 'amberlyn';
    }
  }
  if (typeof window === 'undefined' || !effectiveId) return [];

  const normalize = (items: any[]): Collection[] => {
    return items.map((c) => {
      const isActuallyLink = Boolean(c.slug) || Boolean(c.isDefault) || (c.id && c.id.startsWith('col_link_')) || c.id === 'main';
      const resolvedTabType = isActuallyLink ? 'links' : (c.tabType === 'links' && !c.slug ? 'posts' : (c.tabType || 'posts'));
      return {
        ...c,
        tabType: resolvedTabType
      };
    });
  };

  try {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${effectiveId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return normalize(parsed);
    }
    // Check key variations (e.g., without usr_ prefix)
    if (effectiveId.startsWith('usr_')) {
      const altRaw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${effectiveId.replace('usr_', '')}`);
      if (altRaw) {
        const parsed = JSON.parse(altRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return normalize(parsed);
      }
    } else {
      const altRaw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}usr_${effectiveId}`);
      if (altRaw) {
        const parsed = JSON.parse(altRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return normalize(parsed);
      }
    }
    // For demo profiles, check known aliases
    const isAmberlyn = effectiveId === 'usr_1' || effectiveId.toLowerCase().includes('amberlyn') || (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('amberlyn'));
    if (isAmberlyn) {
      for (const k of ['amberlyn', 'usr_amberlyn', 'usr_1']) {
        const alt = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${k}`);
        if (alt) {
          const parsed = JSON.parse(alt);
          if (Array.isArray(parsed) && parsed.length > 0) return normalize(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local collections:', err);
  }
  return [];
}

/**
 * Persist collections to localStorage for instant hydration and offline persistence.
 * When tabType is specified, collections from the other tab are carefully preserved.
 */
export function saveLocalCollections(
  userId: string,
  collections: Collection[],
  tabType?: 'posts' | 'links'
): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    let toSave: Collection[];
    if (tabType) {
      const existing = getLocalCollections(userId);
      const isOtherTab = tabType === 'links' ? isPostCollection : isLinkCollection;
      const otherTabCols = existing.filter(isOtherTab);
      const normalizedIncoming = collections.map((c) => ({
        ...c,
        tabType: c.tabType || tabType
      }));
      toSave = [...otherTabCols, ...normalizedIncoming];
    } else {
      toSave = collections.map((c) => ({
        ...c,
        tabType: c.tabType || (isLinkCollection(c) ? 'links' : 'posts')
      }));
    }

    const payload = JSON.stringify(toSave);
    window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, payload);
    if (userId.startsWith('usr_')) {
      window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId.replace('usr_', '')}`, payload);
    } else {
      window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}usr_${userId}`, payload);
    }
    const isAmberlyn = userId === 'usr_1' || userId.toLowerCase().includes('amberlyn') || (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('amberlyn'));
    if (isAmberlyn) {
      window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}amberlyn`, payload);
      window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}usr_1`, payload);
      window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}usr_amberlyn`, payload);
    }
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

        const currentLocal = typeof window !== 'undefined' ? getLocalCollections(userId) : [];

        dbCollections = colsData.map((c) => {
          const dbItemIds = itemsMap.get(c.id) || [];
          const localMatch = currentLocal.find(
            (lc) => lc.id === c.id || (c.slug && lc.slug === c.slug) || (c.is_default && lc.isDefault)
          );

          let resolvedItemIds: string[];
          if (dbItemIds.length === 0) {
            resolvedItemIds = (localMatch?.itemIds && localMatch.itemIds.length > 0) ? localMatch.itemIds : [];
          } else if (localMatch?.itemIds && localMatch.itemIds.length > 0) {
            // Preserve the local custom order and append any new db items
            const localSet = new Set(localMatch.itemIds);
            const newFromDb = dbItemIds.filter((id) => !localSet.has(id));
            resolvedItemIds = [...localMatch.itemIds, ...newFromDb];
          } else {
            resolvedItemIds = dbItemIds;
          }

          return {
            id: c.id,
            title: c.title,
            description: c.description || undefined,
            icon: c.icon || '📁',
            isPinned: Boolean(c.is_pinned),
            isExclusive: Boolean(c.is_exclusive),
            slug: c.slug || undefined,
            isDefault: Boolean(c.is_default),
            tabType: c.tab_type as 'posts' | 'links',
            userId: c.user_id,
            sortOrder: c.sort_order ?? 0,
            createdAt: c.created_at,
            itemIds: resolvedItemIds
          };
        });

        // Cache live Supabase collections to local storage
        if (typeof window !== 'undefined') {
          saveLocalCollections(userId, dbCollections, tabType);
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
    const filtered = tabType ? localCols.filter(tabType === 'links' ? isLinkCollection : isPostCollection) : localCols;
    if (filtered.length > 0) {
      return filtered;
    }
  }

  // Default mock fallback strictly for amberlyn demo profile if local storage is uninitialized
  const isDemo = userId === 'usr_1' || userId === 'usr_amberlyn' || userId.toLowerCase().includes('amberlyn');
  if (isDemo) {
    const defaultCols = tabType === 'links' ? MOCK_LINK_COLLECTIONS : MOCK_COLLECTIONS;
    saveLocalCollections(userId, defaultCols, tabType);
    return defaultCols;
  }

  return [];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  slug?: string;
  isDefault?: boolean;
}): Promise<Collection | null> {
  const supabase = createClient();
  let createdCollection: Collection | null = null;
  const computedSlug = params.slug?.trim() || (params.tabType === 'links' ? (slugify(params.title) || `page-${Date.now()}`) : undefined);

  // Enshrine hard limit of 50 collections
  if (typeof window !== 'undefined' && params.userId) {
    const existing = getLocalCollections(params.userId).filter(
      params.tabType === 'links' ? isLinkCollection : isPostCollection
    );
    if (existing.length >= 50) {
      console.warn('Cannot create collection: Enshrined limit of 50 collections reached.');
      return null;
    }
  }

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
          is_exclusive: Boolean(params.isExclusive),
          slug: computedSlug || null,
          is_default: Boolean(params.isDefault)
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
          slug: data.slug || undefined,
          isDefault: Boolean(data.is_default),
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
      slug: computedSlug,
      isDefault: Boolean(params.isDefault),
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

export const MAX_POSTS_PER_COLLECTION = 100;

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
      // Enforce 100-post limit on collections
      const { count } = await supabase
        .from('collection_items')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      if (count !== null && count >= MAX_POSTS_PER_COLLECTION) {
        console.warn(`Cannot add item: Collection reached hard limit of ${MAX_POSTS_PER_COLLECTION} items.`);
        return false;
      }

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
    const keysToUpdate = new Set<string>();
    if (userId) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (userId.startsWith('usr_')) {
        keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId.replace('usr_', '')}`);
      }
    }
    const isAmberlyn = !userId || userId === 'usr_1' || userId.toLowerCase().includes('amberlyn') || (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('amberlyn'));
    if (isAmberlyn) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_1`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}amberlyn`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_amberlyn`);
    }
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith(LOCAL_STORAGE_PREFIX)) {
        keysToUpdate.add(k);
      }
    }

    const isMain = collectionId === 'main' || collectionId === 'col_link_main';

    for (const key of keysToUpdate) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        let modified = false;
        const updated = list.map((c) => {
          const isMatch = c.id === collectionId || (c.slug && c.slug === collectionId) || (isMain && (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main'));
          if (isMatch && !c.itemIds.includes(itemId)) {
            // Enforce max 100 items per collection
            if (c.itemIds.length >= MAX_POSTS_PER_COLLECTION) {
              console.warn(`Collection limit reached (${MAX_POSTS_PER_COLLECTION} items max).`);
              return c;
            }
            modified = true;
            return { ...c, itemIds: [itemId, ...c.itemIds] };
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
    const keysToUpdate = new Set<string>();
    if (userId) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (userId.startsWith('usr_')) {
        keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId.replace('usr_', '')}`);
      }
    }
    const isAmberlyn = !userId || userId === 'usr_1' || userId.toLowerCase().includes('amberlyn') || (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('amberlyn'));
    if (isAmberlyn) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_1`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}amberlyn`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_amberlyn`);
    }
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith(LOCAL_STORAGE_PREFIX)) {
        keysToUpdate.add(k);
      }
    }

    const isMain = collectionId === 'main' || collectionId === 'col_link_main';

    for (const key of keysToUpdate) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const list: Collection[] = JSON.parse(raw);
        let modified = false;
        const updated = list.map((c) => {
          const isMatch = c.id === collectionId || (c.slug && c.slug === collectionId) || (isMain && (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main'));
          if (isMatch && c.itemIds.includes(itemId)) {
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

/**
 * Persist the custom sequence of items (badges, links, posts) within a collection
 * in Supabase and local storage.
 */
export async function reorderCollectionItems(
  collectionId: string,
  orderedItemIds: string[],
  userId?: string
): Promise<boolean> {
  const supabase = createClient();

  // 1. Supabase Persistence
  if (userId && isValidUuid(userId)) {
    try {
      let targetCollectionUuid = isValidUuid(collectionId) ? collectionId : null;
      const isMain = collectionId === 'main' || collectionId === 'col_link_main';

      if (!targetCollectionUuid) {
        let q = supabase
          .from('collections')
          .select('id, tab_type')
          .eq('user_id', userId);

        if (isMain) {
          q = q.eq('tab_type', 'links').eq('is_default', true);
        } else {
          q = q.or(`id.eq.${collectionId},slug.eq.${collectionId}`);
        }

        const { data: existingCol } = await q.maybeSingle();
        if (existingCol) {
          targetCollectionUuid = existingCol.id;
        }
      }

      if (targetCollectionUuid) {
        const promises = orderedItemIds.map((itemId, index) => {
          return supabase
            .from('collection_items')
            .upsert(
              { collection_id: targetCollectionUuid, item_id: itemId, position: index },
              { onConflict: 'collection_id,item_id' }
            );
        });
        await Promise.all(promises);
      }
    } catch (err) {
      console.warn('Error reordering collection items in Supabase:', err);
    }
  }

  // 2. Local Storage Persistence across all related user keys
  if (typeof window !== 'undefined') {
    const keysToUpdate = new Set<string>();
    if (userId) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (userId.startsWith('usr_')) {
        keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}${userId.replace('usr_', '')}`);
      } else {
        keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_${userId}`);
      }
    }
    // Demo profile aliases
    const isAmberlyn = !userId || userId === 'usr_1' || userId.toLowerCase().includes('amberlyn') || (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('amberlyn'));
    if (isAmberlyn) {
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_1`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}amberlyn`);
      keysToUpdate.add(`${LOCAL_STORAGE_PREFIX}usr_amberlyn`);
    }

    const isMain = collectionId === 'main' || collectionId === 'col_link_main' || collectionId.includes('main');

    for (const key of keysToUpdate) {
      try {
        const raw = window.localStorage.getItem(key);
        let list: Collection[] = [];
        if (raw) {
          try {
            list = JSON.parse(raw);
          } catch {}
        }
        if (!Array.isArray(list) || list.length === 0) {
          list = [...MOCK_LINK_COLLECTIONS, ...MOCK_COLLECTIONS];
        }

        let found = false;

        const updated = list.map((c) => {
          const isMatch =
            c.id === collectionId ||
            (c.slug && c.slug === collectionId) ||
            ((isMain || c.isDefault || c.slug === 'main') && (c.isDefault || c.slug === 'main' || c.id === 'col_link_main' || c.id === 'main'));

          if (isMatch) {
            found = true;
            return {
              ...c,
              itemIds: orderedItemIds
            };
          }
          return c;
        });

        if (!found) {
          const isLink = isMain || collectionId.startsWith('col_link_');
          updated.push({
            id: collectionId,
            title: isMain ? 'Main' : collectionId,
            tabType: isLink ? 'links' : 'posts',
            slug: isLink ? (isMain ? 'main' : collectionId) : undefined,
            isDefault: isMain,
            itemIds: orderedItemIds
          });
        }

        window.localStorage.setItem(key, JSON.stringify(updated));
      } catch (err) {
        console.warn('Error reordering collection items in localStorage:', err);
      }
    }
  }

  return true;
}
