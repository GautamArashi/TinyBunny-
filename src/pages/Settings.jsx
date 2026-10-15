/**
 * Settings Page
 * Responsibility: Application diagnostics, backend connection health status,
 * safe TinyFish configuration inspection, local setup instructions, and feature readiness telemetry.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Info,
  ExternalLink,
  Search,
  Globe,
  Bot,
  History,
  Database,
  Terminal,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { checkBackendHealth, API_BASE_URL } from '../services/api.js'
import { getStorageUsage } from '../services/runHistory.js'

export default function Settings() {
  const [healthStatus, setHealthStatus] = useState('checking') // 'checking' | 'connected' | 'unreachable'
  const [healthData, setHealthData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastCheckedTime, setLastCheckedTime] = useState(null)
  const [storageUsage, setStorageUsage] = useState(null)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  // Fetch real health data from backend
  const fetchHealth = useCallback(async () => {
    setHealthStatus('checking')
    setErrorMessage('')

    try {
      const data = await checkBackendHealth()
      setHealthData(data)
      setHealthStatus('connected')
      setLastCheckedTime(new Date().toLocaleTimeString())
    } catch (err) {
      setHealthData(null)
      setHealthStatus('unreachable')
      setLastCheckedTime(new Date().toLocaleTimeString())

      let readableMsg = 'Backend server is not responding at ' + API_BASE_URL
      if (err.isConnectionError || err.code === 'ERR_NETWORK') {
        readableMsg = `Unable to connect to local backend at ${API_BASE_URL}. Ensure the server is running on port 5000 (npm run dev in /server).`
      } else if (err.message) {
        readableMsg = err.message
      }
      setErrorMessage(readableMsg)
    }

    // Refresh localStorage telemetry
    setStorageUsage(getStorageUsage())
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const isConfigured = Boolean(healthData?.services?.tinyfishConfigured)

  const formatUptime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '—'
    const mins = Math.floor(seconds / 60)
    const hours = Math.floor(mins / 60)
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`
    }
    if (mins > 0) {
      return `${mins}m ${Math.floor(seconds % 60)}s`
    }
    return `${Math.floor(seconds)}s`
  }

  const handleCopySnippet = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSnippet(true)
      setTimeout(() => setCopiedSnippet(false), 2000)
    } catch {
      // Fallback
    }
  }

  const envSnippet = `# server/.env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# TinyFish API Key (Required for Search, Fetch, and Agent APIs)
TINYFISH_API_KEY=your_actual_key`

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-orange-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Studio Diagnostics & Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Backend connection health, credential security status, and feature readiness telemetry.
            </p>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={fetchHealth}
            disabled={healthStatus === 'checking'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium transition-colors border border-neutral-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-neutral-400 ${healthStatus === 'checking' ? 'animate-spin text-orange-400' : ''}`} />
            <span>{healthStatus === 'checking' ? 'Checking Health...' : 'Refresh Status'}</span>
          </button>
        </div>
      </div>

      {/* SECTION A: Connection Status */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-300">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Local Backend Connection</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time reachability check via Express health endpoint (/api/health)
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div>
            {healthStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 border border-sky-500/30 text-sky-400 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Checking...</span>
              </span>
            )}
            {healthStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Connected</span>
              </span>
            )}
            {healthStatus === 'unreachable' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Not Reachable</span>
              </span>
            )}
          </div>
        </div>

        {/* Unreachable Alert if Backend Down */}
        {healthStatus === 'unreachable' && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                Connection Failure
              </span>
              <p className="text-xs text-rose-200 leading-relaxed">
                {errorMessage}
              </p>
              <p className="text-[11px] text-rose-300/80 font-mono pt-1">
                Run: <code className="px-1.5 py-0.5 rounded bg-black/40 border border-rose-500/20 text-rose-200">cd server && npm run dev</code>
              </p>
            </div>
          </div>
        )}

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Backend Base URL</span>
            <p className="text-xs font-mono font-medium text-neutral-200 truncate" title={API_BASE_URL}>
              {API_BASE_URL}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Last Health Check</span>
            <p className="text-xs font-mono font-medium text-neutral-200">
              {lastCheckedTime || 'Pending initial check'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Backend Process Uptime</span>
            <p className="text-xs font-mono font-medium text-neutral-200">
              {healthStatus === 'connected' ? formatUptime(healthData?.uptime) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: TinyFish Configuration */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">TinyFish API Configuration</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Safe server-side credential verification without exposing API key secrets
              </p>
            </div>
          </div>

          {/* Key State Badge */}
          <div>
            {healthStatus === 'unreachable' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-neutral-800 border border-neutral-700 text-neutral-400">
                <span>Unknown (Server Offline)</span>
              </span>
            ) : isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Not Configured</span>
              </span>
            )}
          </div>
        </div>

        {/* Security Guarantee Notice */}
        <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 space-y-1">
          <div className="flex items-center gap-2 text-neutral-200 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zero-Exposure Key Protection</span>
          </div>
          <p className="text-neutral-400 leading-relaxed">
            The TinyFish API key value is <strong>never transmitted to the browser</strong>, stored in browser memory, or exposed in API responses. The status indicator above reflects only whether the backend environment loaded a non-empty key from <code className="text-orange-400">server/.env</code>.
          </p>
        </div>

        {/* Service Readiness Breakdown */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
            Upstream API Integration Readiness
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search API Readiness */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Search API</span>
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isConfigured ? 'Ready to Call' : 'Key Needed'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                POST /api/tinyfish/search proxy with input validation, rate limiting, and 15s timeout.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
                Verification: <span className="text-neutral-400">On manual query</span>
              </div>
            </div>

            {/* Fetch API Readiness */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-purple-400" />
                  <span>Fetch API</span>
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isConfigured ? 'Ready to Call' : 'Key Needed'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                POST /api/tinyfish/fetch proxy with SSRF protection, format selection, and 150s timeout.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
                Verification: <span className="text-neutral-400">On manual extraction</span>
              </div>
            </div>

            {/* Agent API Readiness */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-orange-400" />
                  <span>Agent API</span>
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isConfigured ? 'Ready to Call' : 'Key Needed'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                POST /api/tinyfish/agent/stream SSE relay with paid modal confirmation and cost tracking.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
                Verification: <span className="text-neutral-400">On manual confirmation</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 pt-1">
            <Info className="h-3.5 w-3.5 text-neutral-400" />
            <span>
              External TinyFish requests are never dispatched automatically by the Settings page to prevent consuming search allowances or wallet funds.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION C: API Key Setup Instructions */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-neutral-800/80 pb-4">
          <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-300">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Local API Key Setup Instructions</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              How to configure your TinyFish API key securely on your local development machine
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-xs text-neutral-300">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-mono font-bold text-orange-400 shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">Open the server environment file</p>
              <p className="text-neutral-400 leading-relaxed">
                In your project workspace, navigate to <code className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-orange-400 font-mono">server/.env</code>. If this file does not exist, copy <code className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">server/.env.example</code> to <code className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">server/.env</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-mono font-bold text-orange-400 shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">Set your TINYFISH_API_KEY</p>
              <p className="text-neutral-400 leading-relaxed">
                Paste your secret API key from the TinyFish Console into the <code className="text-neutral-200 font-mono">TINYFISH_API_KEY</code> variable:
              </p>
            </div>
          </div>

          {/* Code Snippet Block */}
          <div className="relative ml-9">
            <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
              {envSnippet}
            </pre>
            <button
              type="button"
              onClick={() => handleCopySnippet(envSnippet)}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors border border-neutral-700"
            >
              {copiedSnippet ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-mono font-bold text-orange-400 shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">Restart the server process</p>
              <p className="text-neutral-400 leading-relaxed">
                Because environment variables are loaded at Node.js startup, restart your development server to apply the updated key:
              </p>
              <div className="pt-1">
                <code className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-[11px]">
                  npm run dev
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Security Rules Checklist */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2">
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
            Security Best Practices Enforced
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Key never requested in browser UI</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Key never stored in localStorage / session</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Never bundled into client VITE_ builds</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Omitted from responses and error traces</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D: Feature Readiness */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Studio Feature Readiness</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Current status and architecture breakdown for each studio capability
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Lab Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Search className="h-4 w-4 text-cyan-400" />
                  <span>Search Lab</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    healthStatus === 'connected' && isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {healthStatus === 'connected' && isConfigured ? 'Ready' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Connects to the official TinyFish Search API through Express backend. Supports web queries, pagination limits, and source exploration.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">Route: /search</span>
              <Link
                to="/search"
                className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Open Lab</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Fetch Lab Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Globe className="h-4 w-4 text-purple-400" />
                  <span>Fetch Lab</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    healthStatus === 'connected' && isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {healthStatus === 'connected' && isConfigured ? 'Ready' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Extracts webpage content in Markdown, HTML, or structured JSON via the TinyFish Fetch API. Includes SSRF protection and multi-URL batching.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">Route: /fetch</span>
              <Link
                to="/fetch"
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Open Lab</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Agent Lab Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Bot className="h-4 w-4 text-orange-400" />
                  <span>Agent Lab</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    healthStatus === 'connected' && isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {healthStatus === 'connected' && isConfigured ? 'Ready' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Autonomous browser execution with real-time SSE event relay, paid confirmation modal, live console streaming, and strict $0.016/step cost tracking.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">Route: /agent</span>
              <Link
                to="/agent"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                <span>Open Lab</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Run History Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <History className="h-4 w-4 text-emerald-400" />
                  <span>Run History</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready (Client LocalStorage)
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Persistent local telemetry log. Stores Search, Fetch, and Agent task records with defensive 50-item ceiling and 30KB payload truncation.
              </p>
              {storageUsage && (
                <div className="mt-3 p-2.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>Capacity: {storageUsage.count} / {storageUsage.maxRecords} records</span>
                  <span>{storageUsage.bytesUsedKb} KB stored</span>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">Route: /history</span>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Open History</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
