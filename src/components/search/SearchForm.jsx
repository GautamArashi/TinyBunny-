/**
 * SearchForm Component
 * Responsibility: Input form for configuring and dispatching TinyFish Search queries
 * with parameter controls (query string, limits, filters).
 */
import React, { useState } from 'react'
import { Search, X, Loader2, SlidersHorizontal } from 'lucide-react'

const MAX_QUERY_LENGTH = 500

export default function SearchForm({
  onSearch,
  isLoading = false,
  initialQuery = '',
  displayLimit = null,
  onDisplayLimitChange,
}) {
  const [query, setQuery] = useState(initialQuery)
  const [validationError, setValidationError] = useState('')

  const trimmedQuery = query.trim()
  const isTooLong = query.length > MAX_QUERY_LENGTH

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isLoading) return

    if (!trimmedQuery) {
      setValidationError('Please enter a search query.')
      return
    }

    if (isTooLong) {
      setValidationError(`Query cannot exceed ${MAX_QUERY_LENGTH} characters.`)
      return
    }

    setValidationError('')
    onSearch(trimmedQuery)
  }

  const handleClear = () => {
    setQuery('')
    setValidationError('')
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4 pointer-events-none text-neutral-400">
            <Search className="h-5 w-5" />
          </div>

          {/* Large Input */}
          <input
            type="text"
            value={query}
            disabled={isLoading}
            onChange={(e) => {
              setQuery(e.target.value)
              if (validationError) setValidationError('')
            }}
            placeholder="Search for websites, topics, documentation..."
            maxLength={MAX_QUERY_LENGTH + 20}
            className={`w-full h-14 pl-12 pr-28 rounded-xl bg-neutral-900 border text-base text-neutral-100 placeholder-neutral-500 shadow-sm transition-all focus:bg-neutral-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
              validationError
                ? 'border-rose-500/80 focus-visible:ring-rose-500'
                : 'border-neutral-800 hover:border-neutral-700'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label="Search query"
          />

          {/* Action Buttons inside Input */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {query && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !trimmedQuery || isTooLong}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>
          </div>
        </div>

        {/* Character count & validation message */}
        <div className="flex items-center justify-between px-2 pt-2 text-xs">
          <div>
            {validationError ? (
              <span className="text-rose-400 font-medium">{validationError}</span>
            ) : (
              <span className="text-neutral-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">Enter</kbd> to search
              </span>
            )}
          </div>
          <div className={`font-mono ${query.length > MAX_QUERY_LENGTH ? 'text-rose-400' : 'text-neutral-500'}`}>
            {query.length}/{MAX_QUERY_LENGTH}
          </div>
        </div>
      </form>

      {/* Query Options & Frontend Display Limit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-neutral-400">Display limit:</span>
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900/80 p-0.5">
            {[
              { label: 'All', value: null },
              { label: '5', value: 5 },
              { label: '10', value: 10 },
              { label: '20', value: 20 },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onDisplayLimitChange && onDisplayLimitChange(option.value)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 ${
                  displayLimit === option.value
                    ? 'bg-neutral-800 text-orange-400 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                }`}
                title={`Display up to ${option.label} results on screen`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            (Client-side display limit)
          </span>
        </div>

        <span className="text-[11px] text-neutral-400 font-mono">
          Upstream Payload: <code className="text-orange-400">{JSON.stringify({ query: trimmedQuery || '...' })}</code>
        </span>
      </div>
    </div>
  )
}
