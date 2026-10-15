/**
 * AgentConfirmModal Component
 * Responsibility: Displays an explicit confirmation dialog before executing a paid
 * TinyFish Agent run, detailing the starting URL, goal, published per-step pricing,
 * and cost warning.
 */
import React from 'react'
import { AlertTriangle, DollarSign, X, Check, ShieldAlert, Globe, Bot } from 'lucide-react'

export default function AgentConfirmModal({
  isOpen,
  params,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen || !params) return null

  const { url, goal, max_duration_seconds } = params

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="confirm-modal-title" className="text-base font-bold text-white">
                Confirm Paid Agent Execution
              </h2>
              <p className="text-xs text-neutral-400 font-mono">TinyFish Autonomous Web Agent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task Details Summary */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="font-semibold text-neutral-400 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-orange-400" />
              <span>Starting URL:</span>
            </span>
            <p className="font-mono text-neutral-200 break-all">{url}</p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="font-semibold text-neutral-400 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-orange-400" />
              <span>Task Goal:</span>
            </span>
            <p className="text-neutral-200 leading-relaxed max-h-28 overflow-y-auto pr-1">{goal}</p>
          </div>
        </div>

        {/* Pricing & Wallet Warning Notice */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>Pricing Notice: $0.016 USD per Agent step</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-300 leading-relaxed font-mono text-[11px]">
            <li>Agent runs consume wallet funds on your TinyFish account.</li>
            <li>Total run cost depends on the number of execution steps taken.</li>
            <li>Maximum duration ({max_duration_seconds}s) acts as a safety timeout, not a fixed spend ceiling.</li>
            <li>Computed estimated cost will be displayed upon run completion.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Check className="h-4 w-4" />
            <span>Confirm & Launch Agent</span>
          </button>
        </div>
      </div>
    </div>
  )
}
