/**
 * Ticket attachment URL helpers.
 * getUploadUrl: build backend URL for a stored file path.
 * openAttachment: fetch URL (so SW can cache), then open in new tab via blob — works offline.
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function getUploadUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  const pathUnderUploads = filePath.replace(/^uploads\/?/, '');
  return `${API_BASE}/uploads/${pathUnderUploads}`;
}

/**
 * Opens an attachment in a new tab by fetching it (so the service worker can cache it)
 * and then opening the response as a blob URL. Enables offline viewing after first open.
 */
export async function openAttachment(url: string | null, _fileName?: string | null): Promise<void> {
  if (!url) return;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!w) {
      URL.revokeObjectURL(blobUrl);
      throw new Error('Popup blocked');
    }
    // Revoke when the new tab is closed is not possible; revoke after a delay to avoid leaks if tab stays open
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to open file';
    throw new Error(message);
  }
}
