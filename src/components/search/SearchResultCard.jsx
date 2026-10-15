/**
 * SearchResultCard Component
 * Responsibility: Renders a single normalized search result item with title,
 * snippet, domain badge, publication date, authors, and secure external source link.
 */
import React from 'react'
import { ExternalLink, Globe, Calendar, FileText, Award, User } from 'lucide-react'

export default function SearchResultCard({ result }) {
  if (!result) return null

  const {
    title = 'Untitled Result',
    url,
    domain,
    siteName,
    snippet,
    date,
    publisher,
    authors,
    venue,
    citedByCount,
    pdfUrl,
  } = result

  return (
    <article className="group rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-200">
      <div className="flex flex-col gap-2.5">
        {/* Source Domain & Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700 text-neutral-300">
            <Globe className="h-3 w-3 text-orange-500" />
            <span>{siteName || domain || 'web'}</span>
          </span>

          {date && (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <Calendar className="h-3 w-3" />
              <span>{date}</span>
            </span>
          )}

          {citedByCount !== null && (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <Award className="h-3 w-3 text-amber-500" />
              <span>Cited by {citedByCount}</span>
            </span>
          )}

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>PDF</span>
            </a>
          )}

          {url && (
            <span className="text-neutral-500 truncate max-w-sm hidden md:inline ml-auto" title={url}>
              {url}
            </span>
          )}
        </div>

        {/* Title with External Link */}
        <h3 className="text-base sm:text-lg font-semibold text-neutral-100 group-hover:text-orange-400 transition-colors">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            >
              <span>{title}</span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:text-orange-400 transition-opacity flex-shrink-0" />
            </a>
          ) : (
            <span>{title}</span>
          )}
        </h3>

        {/* Snippet */}
        {snippet ? (
          <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3">
            {snippet}
          </p>
        ) : (
          <p className="text-xs text-neutral-500 italic">
            No snippet available for this source.
          </p>
        )}

        {/* Extended Metadata (Authors, Venue, Publisher) */}
        {(authors || venue || publisher) && (
          <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono">
            {authors && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 text-neutral-500" />
                <span>{authors}</span>
              </span>
            )}
            {venue && <span>• {venue}</span>}
            {publisher && !venue && <span>• {publisher}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
