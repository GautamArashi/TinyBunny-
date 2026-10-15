/**
 * SearchLab Page
 * Responsibility: Interactive laboratory for querying the TinyFish Search API,
 * testing search parameter configurations, and viewing structured search results.
 */
import React, { useState, useEffect } from 'react'
import {
  Search,
  Compass,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  Server,
  CheckCircle2,
} from 'lucide-react'
import SearchForm from '../components/search/SearchForm.jsx'
import SearchResultCard from '../components/search/SearchResultCard.jsx'
import LoadingState from '../components/common/LoadingState.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { searchTinyFish, checkBackendHealth } from '../services/api.js'
import { normalizeSearchResults } from '../utils/normalizeSearchResults.js'
import { createRecord, updateRecord } from '../services/runHistory.js'

export default function SearchLab() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'empty' | 'error'
  const [results, setResults] = useState([])
  const [totalApiResults, setTotalApiResults] = useState(0)
  const [activeQuery, setActiveQuery] = useState('')
  const [displayLimit, setDisplayLimit] = useState(null) // null = all, or 5, 10, 20
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

  const handleSearch = async (query) => {
    setActiveQuery(query)
    setStatus('loading')
    setErrorDetails({ title: '', message: '', status: null, isConnectionError: false })

    const startTime = Date.now()
    const historyRecord = createRecord({
      type: 'search',
      title: `Search: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
      input: { query },
      status: 'running',
    })

    try {
      const response = await searchTinyFish({ query })
      const normalized = normalizeSearchResults(response)
      const reportedTotal =
        typeof response?.total_results === 'number'
          ? response.total_results
          : normalized.length

      setTotalApiResults(reportedTotal)
      const durationMs = Date.now() - startTime

      if (normalized.length === 0) {
        setResults([])
        setStatus('empty')
        updateRecord(historyRecord.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationMs,
          resultSummary: 'Returned 0 search results.',
          resultPayload: { total_results: 0, results: [] },
        })
      } else {
        setResults(normalized)
        setStatus('success')
        updateRecord(historyRecord.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationMs,
          resultSummary: `Found ${reportedTotal} search results.`,
          resultPayload: {
            total_results: reportedTotal,
            results: normalized.slice(0, 10),
          },
        })
      }
    } catch (err) {
      setResults([])
      setStatus('error')
      const durationMs = Date.now() - startTime

      let title = 'Search Query Failed'
      if (err.isConnectionError) {
        title = 'Backend Service Unavailable'
      } else if (err.status === 503) {
        title = 'TinyFish API Key Required'
      } else if (err.status === 401) {
        title = 'Unauthorized API Credentials'
      } else if (err.status === 402) {
        title = 'Search Allowance / Billing Issue'
      } else if (err.status === 429) {
        title = 'Rate Limit Exceeded'
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

  // Filter displayed results strictly by the client-side display limit
  const visibleResults = displayLimit && results.length > displayLimit
    ? results.slice(0, displayLimit)
    : results

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Search Intelligence Playground</span>
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

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Search Lab</h1>
        <p className="mt-1 text-sm text-neutral-400 max-w-2xl">
          Discover relevant web information and explore source links.
        </p>
      </div>

      {/* Search Input Section */}
      <section aria-label="Search Form">
        <SearchForm
          onSearch={handleSearch}
          isLoading={status === 'loading'}
          initialQuery={activeQuery}
          displayLimit={displayLimit}
          onDisplayLimitChange={setDisplayLimit}
        />
      </section>

      {/* Workspace Display Area */}
      <section aria-live="polite" className="min-h-[300px]">
        {/* State: Idle / Initial Empty State */}
        {status === 'idle' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-orange-500 mb-4">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-neutral-100">
              Search across the web
            </h2>
            <p className="mt-1.5 text-sm text-neutral-400 max-w-md">
              Enter a topic, URL, or question above to explore live search extraction results.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-neutral-400 flex items-center gap-1 mr-1">
                <HelpCircle className="h-3.5 w-3.5" /> Suggestions:
              </span>
              {[
                'React.js official documentation',
                'Autonomous web agent architecture',
                'Modern JavaScript build performance',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSearch(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* State: Loading */}
        {status === 'loading' && (
          <LoadingState
            message="Querying TinyFish search index..."
            submessage={`Dispatching request for "${activeQuery}" via local backend`}
          />
        )}

        {/* State: Error / Categorized failure */}
        {status === 'error' && (
          <div className="space-y-4">
            <ErrorState
              title={errorDetails.title}
              message={errorDetails.message}
              isConnectionError={errorDetails.isConnectionError}
              onRetry={() => handleSearch(activeQuery)}
            />

            {/* Helper Guidance Box for 503 Missing Key */}
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

        {/* State: Empty Results */}
        {status === 'empty' && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-neutral-100">No results found</h2>
            <p className="mt-1.5 text-sm text-neutral-400 max-w-sm">
              The TinyFish index returned 0 matching records for &ldquo;{activeQuery}&rdquo;. Try using broader terms or different keywords.
            </p>
          </div>
        )}

        {/* State: Success */}
        {status === 'success' && (
          <div className="space-y-4">
            {/* Result Header & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-400 px-1 border-b border-neutral-800 pb-2">
              <div>
                Showing <strong className="text-neutral-200">{visibleResults.length}</strong>
                {displayLimit && results.length > displayLimit ? (
                  <span> of <strong className="text-neutral-200">{results.length}</strong> retrieved</span>
                ) : null}
                {totalApiResults > results.length ? (
                  <span> ({totalApiResults} total reported by index)</span>
                ) : null}
                <span> for &ldquo;<span className="text-orange-400 font-medium">{activeQuery}</span>&rdquo;</span>
              </div>
              <span className="font-mono text-[11px] text-neutral-400">
                Verified TinyFish Response
              </span>
            </div>

            {/* Results List */}
            <div className="grid grid-cols-1 gap-3">
              {visibleResults.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
