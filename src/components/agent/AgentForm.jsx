/**
 * AgentForm Component
 * Responsibility: Input form for configuring autonomous TinyFish Agent execution runs,
 * specifying goal instructions, duration limits, and safe sample goals.
 */
import React, { useState } from 'react'
import {
  Bot,
  Globe,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Play,
} from 'lucide-react'

const MAX_GOAL_LENGTH = 2000

const SAMPLE_GOALS = [
  {
    title: 'Category Discovery',
    url: 'https://example.com',
    goal:
      'Open the website, find its main product categories, and return a structured list of the category names and corresponding page URLs. Do not purchase anything, submit forms, or change account settings.',
  },
  {
    title: 'Documentation Index',
    url: 'https://example.com',
    goal:
      'Open the website, find the documentation or getting-started link, and extract the main guide section titles and URLs. Do not submit any forms or click external advertisements.',
  },
  {
    title: 'Changelog Overview',
    url: 'https://example.com',
    goal:
      'Navigate to the blog or changelog section, extract the 3 latest post titles and publication dates, and summarize their main announcements. Do not attempt to log in or create an account.',
  },
]

const DURATION_OPTIONS = [
  { value: 60, label: '60s' },
  { value: 120, label: '120s' },
  { value: 180, label: '180s (Recommended)' },
  { value: 300, label: '300s' },
]

export default function AgentForm({ onReview, isRunning = false }) {
  const [url, setUrl] = useState('https://example.com')
  const [goal, setGoal] = useState(SAMPLE_GOALS[0].goal)
  const [maxDuration, setMaxDuration] = useState(180)
  const [clientError, setClientError] = useState('')

  const trimmedUrl = url.trim()
  const trimmedGoal = goal.trim()
  const isGoalOverLimit = goal.length > MAX_GOAL_LENGTH

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isRunning) return

    if (!trimmedUrl) {
      setClientError('Starting URL is required.')
      return
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setClientError('Starting URL must begin with http:// or https://')
      return
    }

    if (!trimmedGoal) {
      setClientError('Task goal instruction cannot be empty.')
      return
    }

    if (isGoalOverLimit) {
      setClientError(`Goal cannot exceed ${MAX_GOAL_LENGTH} characters.`)
      return
    }

    setClientError('')
    onReview({
      url: trimmedUrl,
      goal: trimmedGoal,
      max_duration_seconds: maxDuration,
    })
  }

  const handleApplySample = (sample) => {
    setUrl(sample.url)
    setGoal(sample.goal)
    setClientError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Starting URL Input */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
        <label htmlFor="agent-url-input" className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Globe className="h-4 w-4 text-orange-500" />
          <span>Starting Website URL</span>
        </label>
        <input
          id="agent-url-input"
          type="url"
          value={url}
          disabled={isRunning}
          onChange={(e) => {
            setUrl(e.target.value)
            if (clientError) setClientError('')
          }}
          placeholder="https://example.com"
          className={`w-full h-11 px-3.5 rounded-lg bg-neutral-950 border font-mono text-sm text-neutral-100 placeholder-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:border-neutral-700 transition-all ${
            clientError && !trimmedUrl ? 'border-rose-500/80' : 'border-neutral-800'
          } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Goal Instruction Textarea */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="agent-goal-input" className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Bot className="h-4 w-4 text-orange-500" />
            <span>Task Goal Instruction</span>
          </label>
          <span className={`text-xs font-mono ${isGoalOverLimit ? 'text-rose-400 font-bold' : 'text-neutral-500'}`}>
            {goal.length}/{MAX_GOAL_LENGTH}
          </span>
        </div>

        <textarea
          id="agent-goal-input"
          value={goal}
          disabled={isRunning}
          onChange={(e) => {
            setGoal(e.target.value)
            if (clientError) setClientError('')
          }}
          rows={4}
          placeholder="Describe clearly what you want the browser agent to do..."
          className={`w-full rounded-lg bg-neutral-950 border p-3 text-sm text-neutral-100 placeholder-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:border-neutral-700 transition-all leading-relaxed ${
            isGoalOverLimit ? 'border-rose-500/80 focus-visible:ring-rose-500' : 'border-neutral-800'
          } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
        />

        {/* Suggested Safe Examples */}
        <div className="space-y-2 pt-2 border-t border-neutral-800/60">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
            <span>Load safe research templates:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_GOALS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                disabled={isRunning}
                onClick={() => handleApplySample(sample)}
                className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {clientError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{clientError}</span>
          </div>
        )}
      </div>

      {/* Duration Setting & Review Button */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span>Maximum Duration Ceiling</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={isRunning}
                onClick={() => setMaxDuration(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  maxDuration === opt.value
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 font-semibold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            Safety timeout limit passed as agent_config.max_duration_seconds.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="submit"
            disabled={isRunning || !trimmedUrl || !trimmedGoal || isGoalOverLimit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold text-sm transition-all shadow-md shadow-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Play className="h-4 w-4" />
            <span>Review & Confirm Run</span>
          </button>
        </div>
      </div>
    </form>
  )
}
