import { Post } from './mockData';

const STORAGE_KEY = 'oomfs_session_posts_v1';
const DELETED_KEY = 'oomfs_deleted_post_ids_v1';
const memoryStore = new Map<string, Post>();
const deletedMemorySet = new Set<string>();

export function getDeletedPostIds(): Set<string> {
  const result = new Set<string>(deletedMemorySet);
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(DELETED_KEY) || window.sessionStorage.getItem(DELETED_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((id) => {
            result.add(id);
            deletedMemorySet.add(id);
          });
        }
      }
    } catch {
      // Ignore
    }
  }
  return result;
}

export function markPostAsDeleted(id: string): void {
  deletedMemorySet.add(id);
  deleteSessionPost(id);
  if (typeof window !== 'undefined') {
    try {
      const allDeleted = Array.from(getDeletedPostIds());
      if (!allDeleted.includes(id)) {
        allDeleted.push(id);
      }
      const serialized = JSON.stringify(allDeleted);
      window.localStorage.setItem(DELETED_KEY, serialized);
      window.sessionStorage.setItem(DELETED_KEY, serialized);
    } catch {
      // Ignore
    }
  }
}

export function isPostDeleted(id: string): boolean {
  return getDeletedPostIds().has(id);
}

export function saveSessionPost(post: Post): void {
  // If previously marked deleted, unmark
  deletedMemorySet.delete(post.id);
  memoryStore.set(post.id, post);
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.sessionStorage.getItem(STORAGE_KEY);
      const existing: Record<string, Post> = existingRaw ? JSON.parse(existingRaw) : {};
      existing[post.id] = post;
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // Ignore quota errors if base64 images are large
    }
  }
}

export function deleteSessionPost(id: string): void {
  memoryStore.delete(id);
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.sessionStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        const existing: Record<string, Post> = JSON.parse(existingRaw);
        delete existing[id];
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }
    } catch {
      // Ignore
    }
  }
}

export function getSessionPost(id: string): Post | null {
  if (isPostDeleted(id)) {
    return null;
  }
  if (memoryStore.has(id)) {
    return memoryStore.get(id) || null;
  }
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.sessionStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        const existing: Record<string, Post> = JSON.parse(existingRaw);
        if (existing[id]) {
          memoryStore.set(id, existing[id]);
          return existing[id];
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function getAllSessionPosts(): Post[] {
  const deleted = getDeletedPostIds();
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.sessionStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        const existing: Record<string, Post> = JSON.parse(existingRaw);
        const posts = Object.values(existing).filter((p) => !deleted.has(p.id));
        for (const p of posts) {
          memoryStore.set(p.id, p);
        }
        return posts;
      }
    } catch {
      return [];
    }
  }
  return Array.from(memoryStore.values()).filter((p) => !deleted.has(p.id));
}
