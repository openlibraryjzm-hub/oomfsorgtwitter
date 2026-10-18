import { Post } from './mockData';

const STORAGE_KEY = 'oomfs_session_posts_v1';
const memoryStore = new Map<string, Post>();

export function saveSessionPost(post: Post): void {
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

export function getSessionPost(id: string): Post | null {
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
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.sessionStorage.getItem(STORAGE_KEY);
      if (existingRaw) {
        const existing: Record<string, Post> = JSON.parse(existingRaw);
        const posts = Object.values(existing);
        for (const p of posts) {
          memoryStore.set(p.id, p);
        }
        return posts;
      }
    } catch {
      return [];
    }
  }
  return Array.from(memoryStore.values());
}
