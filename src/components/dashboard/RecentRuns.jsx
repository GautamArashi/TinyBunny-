/**
 * RecentRuns Component
 * Responsibility: Displays recent API invocations, execution statuses,
 * and timestamps on the dashboard, reading from localStorage run history.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Search,
  Globe,
  Bot,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { getHistory } from '../../services/runHistory.js'

export default function RecentRuns() {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    const records = getHistory()
    setRuns(records.slice(0, 5))
  }, [])

  const completedCount = runs.filter((r) => r.status === 'completed').length

  const formatDuration = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms)) return null
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">Recent Task Executions</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 font-mono">
            {completedCount} completed
          </span>
          {runs.length > 0 && (
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mb-4">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-neutral-100">No runs yet</h4>
          <p className="mt-1.5 text-sm text-neutral-400 max-w-sm">
            Your completed web tasks will appear here.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-neutral-950 font-medium text-xs transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Launch Search Lab</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-neutral-800/80">
          {runs.map((run) => {
            const isAgent = run.type === 'agent'
            const isSearch = run.type === 'search'
            const isFetch = run.type === 'fetch'
            const duration = formatDuration(run.durationMs)
            const timeStr = formatTime(run.startedAt)

            return (
              <Link
                key={run.id}
                to="/history"
                className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSearch
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : isFetch
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}
                  >
                    {isSearch && <Search className="h-4 w-4" />}
                    {isFetch && <Globe className="h-4 w-4" />}
                    {isAgent && <Bot className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-orange-400 transition-colors">
                      {run.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 font-mono">
                      <span>{run.type.toUpperCase()}</span>
                      {timeStr && <span>• {timeStr}</span>}
                      {duration && <span>• {duration}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {run.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </span>
                  )}
                  {run.status === 'partial' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Partial</span>
                    </span>
                  )}
                  {(run.status === 'failed' || run.status === 'timed_out') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>Failed</span>
                    </span>
                  )}
                  {run.status === 'running' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400 animate-pulse">
                      <Activity className="h-3 w-3" />
                      <span>Running</span>
                    </span>
                  )}
                  {run.status === 'cancelled' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 border border-neutral-700 text-neutral-400">
                      <span>Cancelled</span>
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
