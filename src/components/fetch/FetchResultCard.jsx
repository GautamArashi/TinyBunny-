/**
 * FetchResultCard Component
 * Responsibility: Displays fetched webpage result content (markdown, html, json)
 * with metadata, copy action, safe HTML escaping, and source links.
 * Also handles rendering per-URL error entries.
 */
import React, { useState } from 'react'
import {
  ExternalLink,
  Copy,
  Check,
  Globe,
  Calendar,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode,
  Languages,
} from 'lucide-react'

export default function FetchResultCard({ item, isError = false }) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!item) return null

  // Handle per-URL error card
  if (isError) {
    const errorUrl = item.url || item.target || 'Target URL'
    const errorMsg =
      item.error ||
      item.message ||
      'Extraction failed for this target page.'

    return (
      <article className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">Extraction Failed</span>
          </div>
          {item.status && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              HTTP {item.status}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-mono text-neutral-300 break-all">{errorUrl}</p>
          <p className="text-sm text-rose-300 leading-relaxed">{errorMsg}</p>
        </div>
      </article>
    )
  }

  // Handle successful item
  const {
    url,
    final_url,
    title,
    description,
    language,
    author,
    published_date,
    text = '',
    format = 'markdown',
  } = item

  const displayTitle = title || 'Untitled Page'
  const displayUrl = final_url || url || ''
  const isDifferentFinalUrl = final_url && url && final_url !== url

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const isLongContent = text && text.length > 500
  const displayedContent = isLongContent && !isExpanded
    ? text.slice(0, 500) + '...\n\n[Content truncated — click "Show full content" below]'
    : text

  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 hover:border-neutral-700 transition-colors">
      {/* Header & Metadata Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase font-semibold">
              <FileCode className="h-3 w-3" />
              <span>{format}</span>
            </span>

            {language && (
              <span className="inline-flex items-center gap-1 text-neutral-400">
                <Languages className="h-3 w-3" />
                <span>{language.toUpperCase()}</span>
              </span>
            )}

            {published_date && (
              <span className="inline-flex items-center gap-1 text-neutral-400">
                <Calendar className="h-3 w-3" />
                <span>{published_date}</span>
              </span>
            )}

            {author && (
              <span className="inline-flex items-center gap-1 text-neutral-400">
                <User className="h-3 w-3" />
                <span>{author}</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-neutral-100 tracking-tight">
            {displayTitle}
          </h3>

          <div className="flex flex-col gap-0.5 text-xs font-mono text-neutral-500">
            {url && (
              <span className="truncate" title={url}>
                Origin: <span className="text-neutral-400">{url}</span>
              </span>
            )}
            {isDifferentFinalUrl && (
              <span className="truncate" title={final_url}>
                Redirected to: <span className="text-neutral-400">{final_url}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            title="Copy extracted text"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              title="Open source URL in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>

      {/* Optional Description */}
      {description && (
        <p className="text-xs text-neutral-400 leading-relaxed italic border-l-2 border-neutral-700 pl-3">
          {description}
        </p>
      )}

      {/* Extracted Content Body (Escaped / Safe Text Viewer) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>Extracted Content ({text ? text.length.toLocaleString() : 0} characters)</span>
          {isLongContent && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
            >
              <span>{isExpanded ? 'Collapse' : 'Show full content'}</span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        <div className="rounded-lg bg-neutral-950 border border-neutral-800/80 p-4 max-h-[420px] overflow-y-auto">
          {text ? (
            <pre className="font-mono text-xs text-neutral-200 whitespace-pre-wrap break-words leading-relaxed">
              <code>{displayedContent}</code>
            </pre>
          ) : (
            <p className="text-xs text-neutral-500 italic">No content extracted for this page.</p>
          )}
        </div>
      </div>
    </article>
  )
}
