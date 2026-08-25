/**
 * Safely extract an image URL from a field that may be either:
 *   - an object  → { url, publicId }
 *   - a string   → "https://…"
 *   - empty/null
 *
 * The naive pattern `img?.url || img || ''` is a trap: when `img` is
 * `{ url: '', publicId: '' }` the first branch is falsy so the whole OBJECT
 * falls through. In a form that object then gets submitted as `thumbnail.url`
 * and the server rejects it ("Invalid thumbnail.url: [object Object]"); in an
 * <img src> it renders as the literal string "[object Object]".
 *
 * @param {object|string|null|undefined} img
 * @returns {string} a URL string, or '' when there isn't one
 */
export function imageUrl(img) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && typeof img.url === 'string') return img.url;
  return '';
}

export default imageUrl;
