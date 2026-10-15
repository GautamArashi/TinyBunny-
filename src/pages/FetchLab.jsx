/**
 * FetchLab Page
 * Responsibility: Interactive laboratory for querying the TinyFish Fetch API,
 * testing webpage extraction modes (markdown, html, json), and inspecting retrieved content safely.
 */
import React, { useState, useEffect } from 'react'
import {
  Globe,
  Sparkles,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  Server,
  CheckCircle2,
  Info,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react'
import FetchForm from '../components/fetch/FetchForm.jsx'
import FetchResultCard from '../components/fetch/FetchResultCard.jsx'
import LoadingState from '../components/common/LoadingState.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { fetchPages, checkBackendHealth } from '../services/api.js'
import { createRecord, updateRecord } from '../services/runHistory.js'

export default function FetchLab() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'partial' | 'all_failed' | 'error'
  const [results, setResults] = useState([])
  const [errors, setErrors] = useState([])
  const [activeParams, setActiveParams] = useState(null)
  const [backendHealth, setBackendHealth] = useState({
    checked: false,
    online: false,
    tinyfishConfigured: false,
  })
  const [errorDetails, setErrorDetails] = useState({
    title: '',
    message: '',
    status: null,
    isConnectionError: false,
  })

  // Check local backend health on mount
  useEffect(() => {
    let isMounted = true
    checkBackendHealth()
      .then((data) => {
        if (isMounted) {
          setBackendHealth({
            checked: true,
            online: true,
            tinyfishConfigured: Boolean(data?.services?.tinyfishConfigured),
          })
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendHealth({
            checked: true,
            online: false,
            tinyfishConfigured: false,
          })
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleFetch = async ({ urls, format, purpose }) => {
    setActiveParams({ urls, format, purpose })
    setStatus('loading')
    setResults([])
    setErrors([])
    setErrorDetails({ title: '', message: '', status: null, isConnectionError: false })

    const startTime = Date.now()
    const firstUrl = urls[0] || 'Unknown URL'
    const title = `Fetch (${format || 'markdown'}): ${firstUrl}${urls.length > 1 ? ` (+${urls.length - 1} more)` : ''}`
    const historyRecord = createRecord({
      type: 'fetch',
      title,
      input: { urls, format, purpose },
      status: 'running',
    })

    try {
      const response = await fetchPages({ urls, format, purpose })

      const fetchedResults = Array.isArray(response?.results) ? response.results : []
      const fetchedErrors = Array.isArray(response?.errors) ? response.errors : []
      const durationMs = Date.now() - startTime

      setResults(fetchedResults)
      setErrors(fetchedErrors)

      let runStatus = 'completed'
      let resultSummary = `Extracted ${fetchedResults.length} of ${urls.length} pages (${format})`

      if (fetchedResults.length > 0 && fetchedErrors.length === 0) {
        setStatus('success')
        runStatus = 'completed'
      } else if (fetchedResults.length > 0 && fetchedErrors.length > 0) {
        setStatus('partial')
        runStatus = 'partial'
        resultSummary = `Extracted ${fetchedResults.length} succeeded, ${fetchedErrors.length} failed (${format})`
      } else {
        setStatus('all_failed')
        runStatus = 'failed'
        resultSummary = `All ${urls.length} fetch extractions failed.`
      }

      updateRecord(historyRecord.id, {
        status: runStatus,
        completedAt: new Date().toISOString(),
        durationMs,
        resultSummary,
        resultPayload: {
          resultsCount: fetchedResults.length,
          errorsCount: fetchedErrors.length,
          results: fetchedResults.slice(0, 3).map((r) => ({
            url: r.url,
            status: r.status,
            title: r.title,
            contentPreview: typeof r.content === 'string' ? r.content.slice(0, 500) : null,
          })),
          errors: fetchedErrors,
        },
      })
    } catch (err) {
      setResults([])
      setErrors([])
      setStatus('error')
      const durationMs = Date.now() - startTime

      let title = 'Fetch Operation Failed'
      if (err.isConnectionError) {
        title = 'Backend Service Unavailable'
      } else if (err.status === 503) {
        title = 'TinyFish API Key Required'
      } else if (err.status === 401) {
        title = 'Unauthorized API Credentials'
      } else if (err.status === 402) {
        title = 'Fetch Allowance / Insufficient Wallet Balance'
      } else if (err.status === 429) {
        title = 'Rate Limit Exceeded'
      } else if (err.status === 504) {
        title = 'Extraction Request Timed Out'
      } else if (err.status === 502) {
        title = 'Upstream Provider Error'
      }

      setErrorDetails({
        title,
        message: err.message,
        status: err.status,
        isConnectionError: Boolean(err.isConnectionError),
      })

      updateRecord(historyRecord.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        durationMs,
        resultSummary: title,
        errorMessage: err.message,
      })
    }
  }

  const totalAttempted = activeParams?.urls?.length || 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Content Extraction & DOM Parser</span>
          </div>

          {/* Backend & Key Connectivity Indicator */}
          <div className="flex items-center gap-2">
            {!backendHealth.checked ? (
              <span className="text-xs font-mono text-neutral-500">Checking service...</span>
            ) : backendHealth.online ? (
              backendHealth.tinyfishConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Backend Ready (Key Active)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                  <KeyRound className="h-3 w-3" />
                  <span>Server Key Needed (server/.env)</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-mono">
                <Server className="h-3 w-3" />
                <span>Backend Offline (Port 5000)</span>
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Fetch Lab</h1>
        <p className="mt-1 text-sm text-neutral-400 max-w-2xl">
          Extract clean, readable content from webpages.
        </p>

        {/* Cost Awareness and Safety Banner */}
        <div className="mt-4 p-3 rounded-lg border border-neutral-800 bg-neutral-900/40 flex items-start gap-2.5 text-xs text-neutral-400">
          <Info className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-neutral-300">Daily Free Allowance: </strong>
            TinyFish Fetch includes up to 1,000 successfully fetched URLs per day per account at no cost. Additional requests may require a positive wallet balance on your TinyFish account.
          </div>
        </div>
      </div>

      {/* URL Fetch Input Form */}
      <section aria-label="Fetch Form">
        <FetchForm onSubmit={handleFetch} isLoading={status === 'loading'} />
      </section>

      {/* Workspace Display Area */}
      <section aria-live="polite" className="min-h-[300px]">
        {/* State: Idle */}
        {status === 'idle' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-orange-500 mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-neutral-100">
              Extract Web Content
            </h2>
            <p className="mt-1.5 text-sm text-neutral-400 max-w-md">
              Enter up to 10 web URLs above to extract structured markdown, raw HTML, or clean JSON content.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Common use cases:
              </span>
              <span className="px-2 py-1 rounded bg-neutral-800/60 border border-neutral-800 text-neutral-300">
                Documentation Ingestion
              </span>
              <span className="px-2 py-1 rounded bg-neutral-800/60 border border-neutral-800 text-neutral-300">
                Article Extraction
              </span>
              <span className="px-2 py-1 rounded bg-neutral-800/60 border border-neutral-800 text-neutral-300">
                HTML DOM Parsing
              </span>
            </div>
          </div>
        )}

        {/* State: Loading */}
        {status === 'loading' && (
          <LoadingState
            message="Extracting webpage content..."
            submessage={`Processing ${totalAttempted} target URL${totalAttempted > 1 ? 's' : ''} via TinyFish Fetch API (timeout: 150s)`}
          />
        )}

        {/* State: Error / Failure */}
        {status === 'error' && (
          <div className="space-y-4">
            <ErrorState
              title={errorDetails.title}
              message={errorDetails.message}
              isConnectionError={errorDetails.isConnectionError}
              onRetry={() => activeParams && handleFetch(activeParams)}
            />

            {errorDetails.status === 503 && !errorDetails.isConnectionError && (
              <div className="max-w-2xl mx-auto p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  <span>How to configure your TinyFish API Key:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 font-mono">
                  <li>Create a file named <code className="text-neutral-200">server/.env</code> based on <code className="text-neutral-200">server/.env.example</code></li>
                  <li>Set <code className="text-neutral-200">TINYFISH_API_KEY=your_actual_key_here</code></li>
                  <li>Restart the backend server (<code className="text-neutral-200">npm run dev</code> in /server)</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* State: Partial, All Failed, or Full Success */}
        {(status === 'success' || status === 'partial' || status === 'all_failed') && (
          <div className="space-y-5">
            {/* Results Overview Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center gap-3">
                {status === 'success' && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>All {results.length} URLs Fetched Successfully</span>
                  </span>
                )}
                {status === 'partial' && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Partial Success ({results.length} succeeded, {errors.length} failed)
                    </span>
                  </span>
                )}
                {status === 'all_failed' && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>All {errors.length} URLs Failed Extraction</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                <span>Format: <strong className="text-neutral-200 uppercase">{activeParams?.format}</strong></span>
                <span>•</span>
                <span>Total: <strong className="text-neutral-200">{totalAttempted}</strong></span>
              </div>
            </div>

            {/* Successful Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">
                  Extracted Pages ({results.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.map((resItem, idx) => (
                    <FetchResultCard key={resItem.url || idx} item={resItem} isError={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Error Results */}
            {errors.length > 0 && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 px-1">
                  Extraction Failures ({errors.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {errors.map((errItem, idx) => (
                    <FetchResultCard key={errItem.url || idx} item={errItem} isError={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
