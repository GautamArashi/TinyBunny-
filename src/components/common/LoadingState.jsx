/**
 * LoadingState Component
 * Responsibility: Reusable loading indicator/spinner for asynchronous requests
 * and laboratory execution states.
 */
import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingState({
  message = 'Loading search results...',
  submessage = 'Connecting to backend search service',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4"
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-neutral-800 border-t-orange-500 animate-spin flex items-center justify-center text-orange-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-neutral-200">{message}</p>
        {submessage && (
          <p className="mt-1 text-xs text-neutral-400 font-mono">{submessage}</p>
        )}
      </div>

      {/* Subtle skeleton cards to preview content placeholder */}
      <div className="w-full max-w-lg mt-4 space-y-3 pt-4 border-t border-neutral-800/60 opacity-60">
        <div className="h-16 rounded-lg bg-neutral-800/40 animate-pulse" />
        <div className="h-16 rounded-lg bg-neutral-800/20 animate-pulse" />
      </div>
    </div>
  )
}
