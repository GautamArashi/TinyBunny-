/**
 * AgentResultPanel Component
 * Responsibility: Displays final Agent execution outputs, goal-level success/failure,
 * step count, estimated usage cost calculation ($0.016/step), and copyable result viewer.
 */
import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Footprints,
  Clock,
  Key,
} from 'lucide-react'

import { extractNumOfSteps } from '../../services/runHistory.js'

const COST_PER_STEP_USD = 0.016

export default function AgentResultPanel({ resultData }) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!resultData) return null

  const {
    run_id,
    status, // 'COMPLETED' | 'FAILED' | etc.
    isGoalSuccess = true,
    goalFailureReason = null,
    start_time,
    end_time,
    result,
    error,
  } = resultData

  // Validate step count defensively
  const num_of_steps =
    resultData.num_of_steps !== undefined
      ? extractNumOfSteps({ num_of_steps: resultData.num_of_steps })
      : extractNumOfSteps(resultData)

  // Cost calculation based strictly on valid num_of_steps
  let estimatedCostStr = 'Cost unavailable'
  if (typeof num_of_steps === 'number' && Number.isInteger(num_of_steps) && num_of_steps >= 0) {
    const totalCost = (num_of_steps * COST_PER_STEP_USD).toFixed(3)
    estimatedCostStr = `$${totalCost} USD (${num_of_steps} steps × $${COST_PER_STEP_USD}/step)`
  }

  // Format result payload as string
  let formattedResult = ''
  if (result !== undefined && result !== null) {
    if (typeof result === 'object') {
      try {
        formattedResult = JSON.stringify(result, null, 2)
      } catch {
        formattedResult = String(result)
      }
    } else {
      formattedResult = String(result)
    }
  }

  const handleCopy = async () => {
    if (!formattedResult) return
    try {
      await navigator.clipboard.writeText(formattedResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const isLong = formattedResult.length > 500
  const displayedContent = isLong && !isExpanded
    ? formattedResult.slice(0, 500) + '\n\n... [Output truncated — click "Show full result" below]'
    : formattedResult

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6">
      {/* Top Meta Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isGoalSuccess
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isGoalSuccess ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{isGoalSuccess ? 'Goal Accomplished' : 'Goal Unsuccessful'}</span>
              <span className="text-xs font-mono font-normal text-neutral-400">
                (Infra Status: {status || 'COMPLETED'})
              </span>
            </h3>
            {run_id && (
              <p className="text-xs font-mono text-neutral-500 mt-0.5">
                Run ID: <span className="text-neutral-400">{run_id}</span>
              </p>
            )}
          </div>
        </div>

        {/* Copy Result Button */}
        {formattedResult && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Result</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Result JSON</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Metrics Row: Steps & Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Step Count */}
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
            <Footprints className="h-3.5 w-3.5 text-orange-400" />
            <span>Execution Steps</span>
          </span>
          <p className="text-lg font-bold font-mono text-neutral-200">
            {typeof num_of_steps === 'number' ? num_of_steps : '—'}
          </p>
        </div>

        {/* Cost Display */}
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span>Estimated Usage Cost</span>
          </span>
          <p className="text-sm font-bold font-mono text-emerald-400">
            {estimatedCostStr}
          </p>
          <p className="text-[10px] text-neutral-500 font-mono">
            Based on published $0.016/step rate.
          </p>
        </div>

        {/* Timestamps */}
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Execution Timing</span>
          </span>
          <p className="text-xs font-mono text-neutral-300">
            {end_time || 'Finished recently'}
          </p>
        </div>
      </div>

      {/* Goal Failure Details (if applicable) */}
      {!isGoalSuccess && goalFailureReason && (
        <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs text-rose-300 space-y-1">
          <span className="font-semibold text-rose-400">Goal Failure Explanation:</span>
          <p className="leading-relaxed">{goalFailureReason}</p>
        </div>
      )}

      {/* Error Output (if error property present) */}
      {error && (
        <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs text-rose-300 space-y-1">
          <span className="font-semibold text-rose-400">Error:</span>
          <p className="font-mono">{typeof error === 'object' ? JSON.stringify(error) : error}</p>
        </div>
      )}

      {/* Extracted Structured Result */}
      {formattedResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-mono">Extracted Output Payload</span>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
              >
                <span>{isExpanded ? 'Collapse' : 'Show full result'}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-4 max-h-[460px] overflow-y-auto">
            <pre className="font-mono text-xs text-neutral-200 whitespace-pre-wrap break-words leading-relaxed">
              <code>{displayedContent}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
