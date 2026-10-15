/**
 * Dashboard Page
 * Responsibility: Main landing view summarizing studio capabilities, system health,
 * quick actions, and recent run metrics.
 */
import React, { useEffect } from 'react'
import { Search, Globe, Bot, Wallet, ShieldAlert, Sparkles } from 'lucide-react'
import FeatureCard from '../components/dashboard/FeatureCard.jsx'
import UsageOverview from '../components/dashboard/UsageOverview.jsx'
import RecentRuns from '../components/dashboard/RecentRuns.jsx'
import { cleanStaleRunningRecords } from '../services/runHistory.js'

const features = [
  {
    title: 'Search Lab',
    description: 'Find relevant information across the web.',
    icon: Search,
    to: '/search',
    badge: 'Discovery',
  },
  {
    title: 'Fetch Lab',
    description: 'Extract and inspect webpage content.',
    icon: Globe,
    to: '/fetch',
    badge: 'Extraction',
  },
  {
    title: 'Agent Lab',
    description: 'Run goal-oriented browser automation.',
    icon: Bot,
    to: '/agent',
    badge: 'Autonomous',
  },
]

export default function Dashboard() {
  useEffect(() => {
    cleanStaleRunningRecords()
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/90 via-neutral-900/50 to-neutral-950 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Developer Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Web Intelligence Studio
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed">
            Your workspace for web search, content extraction, and browser automation.
          </p>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="space-y-3" aria-labelledby="features-heading">
        <div className="flex items-center justify-between">
          <h2 id="features-heading" className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Exploration Labs
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              to={feature.to}
              badge={feature.badge}
            />
          ))}
        </div>
      </section>

      {/* Telemetry & Usage Overview */}
      <section className="space-y-3" aria-labelledby="telemetry-heading">
        <div className="flex items-center justify-between">
          <h2 id="telemetry-heading" className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Execution Telemetry
          </h2>
        </div>
        <UsageOverview />
      </section>

      {/* Dual Section: Recent Runs and Wallet */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Activity Log
          </h2>
          <RecentRuns />
        </div>

        {/* Wallet Section (1 col) */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Account & Billing
          </h2>
          <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400 border border-neutral-700/60">
                  Unconfigured
                </span>
              </div>
              <h3 className="text-base font-semibold text-neutral-100">
                Wallet connection not configured
              </h3>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Wallet and usage information will be added after verified TinyFish integration.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldAlert className="h-4 w-4 text-neutral-400" />
              <span>No active billing subscription</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
