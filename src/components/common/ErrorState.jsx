/**
 * ErrorState Component
 * Responsibility: Reusable error display displaying error messages, fallback hints,
 * and retry triggers.
 */
import React from 'react'
import { AlertCircle, WifiOff, RotateCcw } from 'lucide-react'

export default function ErrorState({
  title = 'Request Unsuccessful',
  message,
  isConnectionError = false,
  onRetry,
}) {
  const Icon = isConnectionError ? WifiOff : AlertCircle

  return (
    <div
      role="alert"
      className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-2xl mx-auto"
    >
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
          isConnectionError
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-semibold text-neutral-100">
        {title}
      </h3>

      <p className="mt-2 text-sm text-neutral-300 max-w-lg leading-relaxed">
        {message || 'An unexpected error occurred while executing your request.'}
      </p>

      {isConnectionError && (
        <div className="mt-4 p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 text-left text-xs text-neutral-400 space-y-1 w-full max-w-md">
          <p className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Backend Integration Note
          </p>
          <p>
            The frontend search interface is functional. To receive live search results, start the local backend service on port 3000.
          </p>
        </div>
      )}

      {onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  )
}
