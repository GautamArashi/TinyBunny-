/**
 * UsageOverview Component
 * Responsibility: Visualizes system activity, request counts, and execution metrics
 * on the main dashboard view from localStorage run history.
 */
import React, { useState, useEffect } from 'react'
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { getHistoryStats } from '../../services/runHistory.js'

export default function UsageOverview() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    partial: 0,
    failed: 0,
    running: 0,
  })

  useEffect(() => {
    const s = getHistoryStats()
    setStats(s)
  }, [])

  const hasHistory = stats.total > 0

  const metrics = [
    {
      label: 'Total Runs',
      value: hasHistory ? String(stats.total) : '0',
      note: hasHistory
        ? stats.running > 0
          ? `${stats.running} currently active`
          : 'Total studio invocations'
        : 'No runs recorded yet',
      icon: Activity,
      iconColor: 'text-neutral-400',
    },
    {
      label: 'Successful Runs',
      value: hasHistory ? String(stats.completed) : '0',
      note: hasHistory
        ? stats.partial > 0
          ? `${stats.partial} partial completions`
          : 'All successful tasks'
        : 'Awaiting task execution',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Failed Runs',
      value: hasHistory ? String(stats.failed) : '0',
      note: hasHistory
        ? stats.failed === 0
          ? 'Zero execution errors'
          : `${stats.failed} task errors recorded`
        : 'Zero failures',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {metric.label}
              </span>
              <Icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold font-mono text-neutral-200">
                {metric.value}
              </span>
              <p className="mt-1 text-xs text-neutral-400">
                {metric.note}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
