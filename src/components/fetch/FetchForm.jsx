/**
 * FetchForm Component
 * Responsibility: Input form for configuring and triggering TinyFish Fetch operations,
 * including multiline URLs textarea, 1-10 URL validation, format selector, and purpose.
 */
import React, { useState } from 'react'
import {
  Globe,
  Loader2,
  X,
  FileCode,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react'

const MAX_URLS = 10
const MAX_PURPOSE_LENGTH = 2000

const FORMAT_OPTIONS = [
  { value: 'markdown', label: 'Markdown', description: 'Clean structured text (Default)' },
  { value: 'html', label: 'HTML', description: 'Extracted markup' },
  { value: 'json', label: 'JSON', description: 'Structured JSON output' },
]

export default function FetchForm({ onSubmit, isLoading = false }) {
  const [urlText, setUrlText] = useState('')
  const [format, setFormat] = useState('markdown')
  const [purpose, setPurpose] = useState('')
  const [clientError, setClientError] = useState('')

  // Split lines into non-empty URL array
  const parsedUrls = urlText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const urlCount = parsedUrls.length
  const isOverUrlLimit = urlCount > MAX_URLS
  const isPurposeOverLimit = purpose.length > MAX_PURPOSE_LENGTH

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isLoading) return

    if (urlCount === 0) {
      setClientError('Please enter at least one URL to fetch.')
      return
    }

    if (isOverUrlLimit) {
      setClientError(`You can fetch a maximum of ${MAX_URLS} URLs per request.`)
      return
    }

    if (isPurposeOverLimit) {
      setClientError(`Purpose description cannot exceed ${MAX_PURPOSE_LENGTH} characters.`)
      return
    }

    // Quick client-side sanity check on protocol
    const invalidProtocols = parsedUrls.filter((u) => !/^https?:\/\//i.test(u))
    if (invalidProtocols.length > 0) {
      setClientError(`All URLs must begin with http:// or https://: "${invalidProtocols[0]}"`)
      return
    }

    setClientError('')
    onSubmit({
      urls: parsedUrls,
      format,
      purpose: purpose.trim() || undefined,
    })
  }

  const handleClear = () => {
    setUrlText('')
    setPurpose('')
    setClientError('')
  }

  const handleLoadExample = () => {
    setUrlText('https://example.com\nhttps://docs.tinyfish.ai/fetch-api/reference')
    setClientError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* URL Textarea Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="fetch-urls-input" className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Globe className="h-4 w-4 text-orange-500" />
            <span>Target URLs</span>
            <span className="text-xs text-neutral-400 font-normal">(One per line)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadExample}
              disabled={isLoading}
              className="text-xs text-neutral-400 hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded px-1.5 py-0.5"
            >
              Load Example
            </button>
            {urlText && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded px-1.5 py-0.5"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isOverUrlLimit
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold'
                  : urlCount > 0
                  ? 'border-neutral-700 bg-neutral-800 text-neutral-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500'
              }`}
            >
              {urlCount}/{MAX_URLS} URLs
            </span>
          </div>
        </div>

        <textarea
          id="fetch-urls-input"
          value={urlText}
          disabled={isLoading}
          onChange={(e) => {
            setUrlText(e.target.value)
            if (clientError) setClientError('')
          }}
          rows={5}
          placeholder="https://example.com&#10;https://docs.tinyfish.ai/fetch-api/reference"
          className={`w-full rounded-lg bg-neutral-950 border p-3 font-mono text-sm text-neutral-100 placeholder-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-all ${
            clientError || isOverUrlLimit
              ? 'border-rose-500/80 focus-visible:ring-rose-500'
              : 'border-neutral-800 hover:border-neutral-700'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        />

        {clientError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{clientError}</span>
          </div>
        )}
      </div>

      {/* Options Row: Format & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Format Selector */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-orange-500" />
            <span>Output Format</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={isLoading}
                onClick={() => setFormat(opt.value)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  format === opt.value
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 font-semibold shadow-sm'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <span className="font-mono">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            {FORMAT_OPTIONS.find((o) => o.value === format)?.description}
          </p>
        </div>

        {/* Optional Purpose Description */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="fetch-purpose-input" className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Extraction Purpose</span>
              <span className="text-xs text-neutral-500 font-normal">(Optional)</span>
            </label>
            <span className={`text-xs font-mono ${isPurposeOverLimit ? 'text-rose-400' : 'text-neutral-500'}`}>
              {purpose.length}/{MAX_PURPOSE_LENGTH}
            </span>
          </div>

          <input
            id="fetch-purpose-input"
            type="text"
            value={purpose}
            disabled={isLoading}
            onChange={(e) => {
              setPurpose(e.target.value)
              if (clientError) setClientError('')
            }}
            placeholder="e.g. Extract main article text and metadata"
            maxLength={MAX_PURPOSE_LENGTH + 20}
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:border-neutral-700 transition-all"
          />
          <p className="text-[11px] text-neutral-500 font-mono">
            Guiding context provided to the extraction engine.
          </p>
        </div>
      </div>

      {/* Submit Button & Payload Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
          <span>Payload:</span>
          <code className="text-neutral-300">
            {JSON.stringify({
              urls: urlCount ? `${urlCount} URL${urlCount > 1 ? 's' : ''}` : [],
              format,
              ...(purpose ? { purpose: purpose.slice(0, 20) + '...' } : {}),
            })}
          </code>
        </div>

        <button
          type="submit"
          disabled={isLoading || urlCount === 0 || isOverUrlLimit || isPurposeOverLimit}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold text-sm transition-all shadow-md shadow-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Fetching Content...</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span>Fetch Content</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
