/**
 * Streaming Service Utilities
 * Responsibility: Secure parsing, validation, and domain-checking for live agent
 * browser streaming URLs received via SSE events.
 */

/**
 * Validates that an agent streaming URL is an HTTPS URL on a TinyFish-controlled
 * domain or verified browser streaming infrastructure (e.g. Unikraft microVMs, Browserbase).
 * Permits localhost/127.0.0.1 for local development and test environments.
 *
 * @param {string|null|undefined} urlStr - URL candidate to validate
 * @returns {boolean} True if URL is secure and matches allowed streaming hosts
 */
export function isValidStreamingUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false
  const trimmed = urlStr.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    const isLocal =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      (parsed.protocol === 'http:' || parsed.protocol === 'https:')

    if (parsed.protocol !== 'https:' && !isLocal) return false
    if (isLocal) return true

    const host = parsed.hostname.toLowerCase()

    // Official TinyFish root and subdomains (e.g., tinyfish.ai, streaming.tinyfish.ai, agent.tinyfish.ai)
    if (host === 'tinyfish.ai' || host.endsWith('.tinyfish.ai')) return true

    // Official TinyFish Unikraft streaming microVM infrastructure (e.g. tf-xyz.fra0-tinyfish.unikraft.app, *.unikraft.app)
    if (host.endsWith('.unikraft.app') || host.endsWith('-tinyfish.unikraft.app')) return true

    // Verified cloud browser automation infrastructure
    if (
      host === 'browserbase.com' ||
      host.endsWith('.browserbase.com') ||
      host === 'steel.dev' ||
      host.endsWith('.steel.dev') ||
      host === 'hyperbeam.com' ||
      host.endsWith('.hyperbeam.com')
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Safely extracts a candidate streaming URL from a STREAMING_URL SSE event payload.
 * Checks official TinyFish `streaming_url` property first, then fallback `url`,
 * `stream_url`, `live_url`, `live_viewer_url`, and `streamingUrl`.
 * Ignores status messages, non-URL text, and non-object payloads unless they are valid URL strings.
 *
 * @param {any} data - SSE event data payload
 * @returns {string|null} Trimmed candidate URL string or null
 */
export function extractStreamingUrl(data) {
  if (!data) return null

  let raw = null
  if (typeof data === 'object') {
    raw =
      data.streaming_url ||
      data.url ||
      data.stream_url ||
      data.live_url ||
      data.live_viewer_url ||
      data.streamingUrl ||
      null
  } else if (
    typeof data === 'string' &&
    (data.startsWith('http://') || data.startsWith('https://'))
  ) {
    raw = data
  }

  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed || null
}

/**
 * Safely extracts hostname for display without throwing on un-prefixed or malformed URLs.
 *
 * @param {string|null|undefined} urlStr
 * @returns {string} Hostname or fallback message
 */
export function safeHostname(urlStr) {
  if (!urlStr || typeof urlStr !== 'string' || !urlStr.trim()) return 'No preview session'
  try {
    const candidate =
      urlStr.startsWith('http://') || urlStr.startsWith('https://')
        ? urlStr
        : `https://${urlStr}`
    return new URL(candidate).hostname || urlStr
  } catch {
    return urlStr
  }
}
