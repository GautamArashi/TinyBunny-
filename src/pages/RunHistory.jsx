/**
 * RunHistory Page
 * Responsibility: Historical log view of past search, fetch, and agent operations,
 * supporting filtering, detail inspection, JSON export, single/bulk deletion, and audit telemetry.
 */
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  Sparkles,
  Search,
  Globe,
  Bot,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Footprints,
  X,
  Copy,
  Check,
  ChevronRight,
  Filter,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  getHistory,
  getHistoryStats,
  deleteRecord,
  clearHistory,
  exportHistoryJson,
  cleanStaleRunningRecords,
} from '../services/runHistory.js'

export default function RunHistory() {
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'search' | 'fetch' | 'agent'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'completed' | 'partial' | 'failed' | 'other'

  // Refresh records from localStorage
  const loadRecords = () => {
    cleanStaleRunningRecords()
    const history = getHistory()
    setRecords(history)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = records.length
    const completed = records.filter((r) => r.status === 'completed').length
    const partial = records.filter((r) => r.status === 'partial').length
    const failed = records.filter((r) => r.status === 'failed' || r.status === 'timed_out').length

    let totalCost = 0
    records.forEach((r) => {
      if (typeof r.estimatedCostUsd === 'number') {
        totalCost += r.estimatedCostUsd
      }
    })

    return {
      total,
      completed,
      partial,
      failed,
      totalCost: totalCost.toFixed(3),
    }
  }, [records])

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Type filter
      if (typeFilter !== 'all' && rec.type !== typeFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && rec.status !== 'completed') return false
        if (statusFilter === 'partial' && rec.status !== 'partial') return false
        if (statusFilter === 'failed' && rec.status !== 'failed' && rec.status !== 'timed_out') return false
        if (statusFilter === 'other' && rec.status !== 'running' && rec.status !== 'cancelled') return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const titleMatch = rec.title?.toLowerCase().includes(query)
        const summaryMatch = rec.resultSummary?.toLowerCase().includes(query)
        const idMatch = rec.id?.toLowerCase().includes(query) || rec.providerRunId?.toLowerCase().includes(query)
        const errorMatch = rec.errorMessage?.toLowerCase().includes(query)
        const inputMatch = JSON.stringify(rec.input || {}).toLowerCase().includes(query)

        return titleMatch || summaryMatch || idMatch || errorMatch || inputMatch
      }

      return true
    })
  }, [records, typeFilter, statusFilter, searchQuery])

  // Handle Export
  const handleExportJson = () => {
    const jsonStr = exportHistoryJson()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tinyfish-run-history-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Handle Delete Single Record
  const handleDeleteRecord = (id, e) => {
    e.stopPropagation()
    deleteRecord(id)
    if (selectedRecord?.id === id) {
      setSelectedRecord(null)
    }
    loadRecords()
  }

  // Handle Clear All Records
  const handleConfirmClear = () => {
    clearHistory()
    setSelectedRecord(null)
    setIsClearModalOpen(false)
    loadRecords()
  }

  // Format Duration Helper
  const formatDuration = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms)) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Format Timestamp Helper
  const formatTime = (isoString) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return isoString
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return isoString
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPayload(true)
      setTimeout(() => setCopiedPayload(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-orange-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Execution Telemetry & Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Run History</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Review past query invocations, inspect step timings, and audit historical task telemetry.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Client-Side Local Storage • Independent of TinyFish cloud account usage</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors border border-neutral-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Download className="h-3.5 w-3.5 text-neutral-400" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:hover:bg-rose-500/10 text-rose-400 text-xs font-medium transition-colors border border-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Total Invocations</span>
            <Layers className="h-4 w-4 text-neutral-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-2">{stats.completed}</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Partial</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-2">{stats.partial}</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Failed / Timed Out</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-2">{stats.failed}</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Est. Agent Spend</span>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-orange-400 mt-2">${stats.totalCost}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by query, target URL, goal, run ID..."
              className="w-full pl-10 pr-9 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-mono text-neutral-500 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Type:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'search', label: 'Search' },
              { id: 'fetch', label: 'Fetch' },
              { id: 'agent', label: 'Agent' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === tab.id
                    ? 'bg-neutral-800 text-orange-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-mono text-neutral-500 mr-1">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'partial', label: 'Partial' },
              { id: 'failed', label: 'Failed' },
              { id: 'other', label: 'Cancelled / Other' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-neutral-800 text-orange-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Table / Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
            <History className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-neutral-100">
            {records.length === 0 ? 'No History Records Found' : 'No Records Match Filters'}
          </h2>
          <p className="mt-1.5 text-sm text-neutral-400 max-w-md">
            {records.length === 0
              ? 'Execute tasks in Search Lab, Fetch Lab, or Agent Lab to generate persistent execution telemetry.'
              : 'Try clearing your search query or adjusting your type and status filter criteria.'}
          </p>
          {records.length === 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search Lab</span>
              </Link>
              <Link
                to="/fetch"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Fetch Lab</span>
              </Link>
              <Link
                to="/agent"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-medium transition-colors"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Agent Lab</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/70 border-b border-neutral-800 text-xs font-mono uppercase text-neutral-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Operation</th>
                  <th className="px-4 py-3.5 font-medium">Type</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium">Steps / Cost</th>
                  <th className="px-4 py-3.5 font-medium">Duration</th>
                  <th className="px-4 py-3.5 font-medium">Started</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredRecords.map((record) => {
                  const isAgent = record.type === 'agent'
                  const isSearch = record.type === 'search'
                  const isFetch = record.type === 'fetch'

                  return (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Operation Title */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-md">
                        <div className="flex flex-col">
                          <span className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                            {record.title}
                          </span>
                          {record.resultSummary && (
                            <span className="text-xs text-neutral-400 truncate mt-0.5">
                              {record.resultSummary}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isSearch && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Search className="h-3 w-3" />
                            <span>Search</span>
                          </span>
                        )}
                        {isFetch && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <Globe className="h-3 w-3" />
                            <span>Fetch</span>
                          </span>
                        )}
                        {isAgent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400">
                            <Bot className="h-3 w-3" />
                            <span>Agent</span>
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.status === 'completed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {record.status === 'partial' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Partial</span>
                          </span>
                        )}
                        {(record.status === 'failed' || record.status === 'timed_out') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>{record.status === 'timed_out' ? 'Timed Out' : 'Failed'}</span>
                          </span>
                        )}
                        {record.status === 'running' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400 animate-pulse">
                            <Activity className="h-3 w-3" />
                            <span>Running</span>
                          </span>
                        )}
                        {record.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-neutral-800 border border-neutral-700 text-neutral-400">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Steps & Cost */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-neutral-300">
                        {isAgent ? (
                          typeof record.numOfSteps === 'number' ? (
                            <span>
                              {record.numOfSteps} steps{' '}
                              <span className="text-orange-400">
                                (${record.estimatedCostUsd !== null ? `$${record.estimatedCostUsd}` : '—'})
                              </span>
                            </span>
                          ) : (
                            <span className="text-neutral-500">Steps —</span>
                          )
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-neutral-400">
                        {formatDuration(record.durationMs)}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-neutral-400">
                        <div>{formatTime(record.startedAt)}</div>
                        <div className="text-[10px] text-neutral-500">{formatDate(record.startedAt)}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRecord(record)
                            }}
                            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title="Inspect Run Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRecord(record.id, e)}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Slideover / Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono ${
                    selectedRecord.type === 'search'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : selectedRecord.type === 'fetch'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}
                >
                  {selectedRecord.type.toUpperCase()} RUN
                </span>
                <span className="text-xs font-mono text-neutral-400 truncate max-w-xs">
                  {selectedRecord.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Status */}
              <div>
                <h3 className="text-lg font-bold text-white">{selectedRecord.title}</h3>
                {selectedRecord.resultSummary && (
                  <p className="mt-1 text-sm text-neutral-300">{selectedRecord.resultSummary}</p>
                )}
              </div>

              {/* Error Alert if Failed */}
              {selectedRecord.errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                      Error Message
                    </span>
                    <p className="text-sm text-rose-200 mt-0.5 font-mono break-words">
                      {selectedRecord.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Status</span>
                  <p className="text-sm font-semibold text-neutral-200 capitalize mt-0.5">
                    {selectedRecord.status}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Duration</span>
                  <p className="text-sm font-semibold font-mono text-neutral-200 mt-0.5">
                    {formatDuration(selectedRecord.durationMs)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Steps</span>
                  <p className="text-sm font-semibold font-mono text-neutral-200 mt-0.5">
                    {typeof selectedRecord.numOfSteps === 'number' ? selectedRecord.numOfSteps : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Est. Cost</span>
                  <p className="text-sm font-semibold font-mono text-orange-400 mt-0.5">
                    {selectedRecord.estimatedCostUsd !== null ? `$${selectedRecord.estimatedCostUsd} USD` : '—'}
                  </p>
                </div>
              </div>

              {/* Timings & IDs */}
              <div className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs font-mono space-y-1.5 text-neutral-400">
                <div className="flex justify-between">
                  <span>Started At:</span>
                  <span className="text-neutral-200">{selectedRecord.startedAt}</span>
                </div>
                {selectedRecord.completedAt && (
                  <div className="flex justify-between">
                    <span>Completed At:</span>
                    <span className="text-neutral-200">{selectedRecord.completedAt}</span>
                  </div>
                )}
                {selectedRecord.providerRunId && (
                  <div className="flex justify-between">
                    <span>Provider Run ID:</span>
                    <span className="text-orange-400 font-bold">{selectedRecord.providerRunId}</span>
                  </div>
                )}
              </div>

              {/* Input Parameters */}
              {selectedRecord.input && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                    Input Parameters
                  </span>
                  <pre className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto">
                    {JSON.stringify(selectedRecord.input, null, 2)}
                  </pre>
                </div>
              )}

              {/* Result Payload Preview */}
              {selectedRecord.resultPayload && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                      Result Payload
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedRecord.resultTruncated && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          Truncated for Storage
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(selectedRecord.resultPayload, null, 2))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors"
                      >
                        {copiedPayload ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-60 p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 overflow-auto">
                    {JSON.stringify(selectedRecord.resultPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex justify-between items-center">
              <button
                type="button"
                onClick={(e) => handleDeleteRecord(selectedRecord.id, e)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete this record</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Clear All Run History?</h3>
              <p className="mt-1.5 text-xs text-neutral-400">
                This action will delete all locally cached task telemetry records from browser storage. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm"
              >
                Yes, Clear All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
