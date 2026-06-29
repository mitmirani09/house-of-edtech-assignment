/**
 * A lightweight, secure HTML sanitizer to prevent XSS attacks.
 * Strips out script tags, inline event handlers (on*), and javascript: URIs.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Remove script tags and all their inner contents
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove inline event handlers (e.g. onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)/gi, '')

  // Disallow javascript: and data: URIs in href and src attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:"\s*(javascript|data):[^"]*"|'\s*(javascript|data):[^']*'|\s*(javascript|data):[^>\s]+)/gi, '$1="#"')

  // Remove object, embed, iframe, and form tags for safety
  sanitized = sanitized.replace(/<(object|embed|iframe|form)\b[^>]*>([\s\S]*?)<\/\1>/gi, '')
  sanitized = sanitized.replace(/<(object|embed|iframe|form)\b[^>]*\/?>/gi, '')

  return sanitized
}
