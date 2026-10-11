/**
 * Converts standard Twitter low-res avatar (_normal = 48x48)
 * into high-definition 400x400 avatar (_400x400)
 */
export function formatTwitterAvatar(url?: string): string {
  if (!url) return '';
  return url.replace('_normal.', '_400x400.');
}
