/**
 * AgentConsole Component
 * Responsibility: Displays real-time SSE stream events (STARTED, STREAMING_URL,
 * PROGRESS, HEARTBEAT, COMPLETE) in a terminal-like log with security validation on live browser links.
 */
import React, { useRef, useEffect } from 'react'
import {
  Terminal,
  ExternalLink,
  Loader2,
  StopCircle,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
} from 'lucide-react'

/**
 * Validates that a streaming preview URL is strictly an HTTPS URL on a TinyFish-controlled domain.
 *
 * @param {string} urlStr
 * @returns {boolean} True if safe TinyFish streaming host
 */
export function isValidStreamingUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return host === 'tinyfish.ai' || host.endsWith('.tinyfish.ai')
  } catch {
    return false
  }
}

export default function AgentConsole({
  events = [],
  status = 'ready', // 'ready' | 'running' | 'completed' | 'goal_failed' | 'infrastructure_failed' | 'timed_out' | 'cancelled'
  streamingUrl = null,
  runId = null,
  onCancel,
}) {
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const isStreamingUrlSafe = isValidStreamingUrl(streamingUrl)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden flex flex-col">
      {/* Console Topbar */}
      <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Agent Execution Console
          </span>

          {/* Status Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
              status === 'running'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                : status === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : status === 'goal_failed'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : status === 'timed_out'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : status === 'cancelled'
                ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            {status.toUpperCase()}
          </span>

          {runId && (
            <span className="text-xs font-mono text-neutral-500 hidden sm:inline">
              ID: {runId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Live Browser Streaming Link */}
          {isStreamingUrlSafe && streamingUrl && (
            <a
              href={streamingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-mono transition-colors"
              title="Watch live agent browser session on TinyFish"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Browser Preview</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Cancel Button */}
          {status === 'running' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Cancel Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Log Area */}
      <div className="p-4 bg-neutral-950 font-mono text-xs text-neutral-300 min-h-[220px] max-h-[360px] overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-neutral-600 space-y-2">
            <Radio className="h-5 w-5" />
            <p>Awaiting execution initiation...</p>
          </div>
        ) : (
          events.map((ev, idx) => {
            const time = ev.timestamp || new Date().toLocaleTimeString()
            const type = ev.event || ev.data?.type || 'EVENT'

            let badgeColor = 'text-neutral-400'
            if (type === 'STARTED') badgeColor = 'text-cyan-400'
            else if (type === 'PROGRESS') badgeColor = 'text-orange-400'
            else if (type === 'STREAMING_URL') badgeColor = 'text-purple-400'
            else if (type === 'HEARTBEAT') badgeColor = 'text-neutral-500'
            else if (type === 'COMPLETE') badgeColor = 'text-emerald-400'
            else if (type === 'ERROR') badgeColor = 'text-rose-400'

            return (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-neutral-600 select-none flex-shrink-0">[{time}]</span>
                <span className={`font-semibold flex-shrink-0 ${badgeColor}`}>[{type}]</span>
                <span className="text-neutral-300 break-all">
                  {typeof ev.data === 'string'
                    ? ev.data
                    : ev.data?.message || (ev.data ? JSON.stringify(ev.data) : '')}
                </span>
              </div>
            )
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
