/**
 * Normalizes raw API search responses into a standardized result array.
 * Ensures resilient field mapping and preserves documented TinyFish Search API attributes.
 *
 * Official TinyFish Search attributes supported:
 * position, site_name, title, snippet, url, date, publisher, authors, venue, year, cited_by_count, pdf_url
 *
 * @param {any} data - Raw payload from the backend response
 * @returns {Array<Object>} Normalized search results list
 */
export function normalizeSearchResults(data) {
  if (!data) return []

  let rawList = []

  if (Array.isArray(data)) {
    rawList = data
  } else if (Array.isArray(data.results)) {
    rawList = data.results
  } else if (Array.isArray(data.data)) {
    rawList = data.data
  } else if (Array.isArray(data.items)) {
    rawList = data.items
  } else if (typeof data === 'object') {
    if (data.url || data.title) {
      rawList = [data]
    }
  }

  return rawList.map((item, index) => {
    const title =
      typeof item.title === 'string' && item.title.trim()
        ? item.title.trim()
        : typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : 'Untitled Result'

    const rawUrl =
      typeof item.url === 'string' && item.url.trim()
        ? item.url.trim()
        : typeof item.link === 'string' && item.link.trim()
        ? item.link.trim()
        : ''

    let domain = ''
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl)
        domain = parsed.hostname.replace(/^www\./, '')
      } catch {
        domain = rawUrl
      }
    }

    const snippet =
      typeof item.snippet === 'string' && item.snippet.trim()
        ? item.snippet.trim()
        : typeof item.description === 'string' && item.description.trim()
        ? item.description.trim()
        : typeof item.content === 'string' && item.content.trim()
        ? item.content.trim()
        : typeof item.summary === 'string' && item.summary.trim()
        ? item.summary.trim()
        : ''

    const siteName =
      typeof item.site_name === 'string' && item.site_name.trim()
        ? item.site_name.trim()
        : domain || ''

    const date =
      typeof item.date === 'string' && item.date.trim()
        ? item.date.trim()
        : typeof item.year === 'number' || typeof item.year === 'string'
        ? String(item.year)
        : null

    const publisher =
      typeof item.publisher === 'string' && item.publisher.trim()
        ? item.publisher.trim()
        : null

    const venue =
      typeof item.venue === 'string' && item.venue.trim()
        ? item.venue.trim()
        : null

    const authors = Array.isArray(item.authors)
      ? item.authors.filter((a) => typeof a === 'string' && a.trim()).join(', ')
      : typeof item.authors === 'string' && item.authors.trim()
      ? item.authors.trim()
      : null

    const citedByCount =
      typeof item.cited_by_count === 'number'
        ? item.cited_by_count
        : null

    const pdfUrl =
      typeof item.pdf_url === 'string' && item.pdf_url.trim()
        ? item.pdf_url.trim()
        : null

    const position =
      typeof item.position === 'number'
        ? item.position
        : index + 1

    return {
      id: item.id || `tinyfish-${position}-${index}`,
      position,
      title,
      url: rawUrl,
      domain,
      siteName,
      snippet,
      date,
      publisher,
      venue,
      authors,
      citedByCount,
      pdfUrl,
    }
  })
}
