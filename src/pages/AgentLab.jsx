/**
 * AgentLab Page
 * Responsibility: Interactive laboratory for launching and tracking autonomous
 * TinyFish Agent runs with mandatory paid confirmation, SSE event streaming,
 * live console, goal-level success inspection, and cost calculation ($0.016/step).
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Bot,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Server,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import AgentForm from '../components/agent/AgentForm.jsx'
import AgentConfirmModal from '../components/agent/AgentConfirmModal.jsx'
import AgentConsole from '../components/agent/AgentConsole.jsx'
import AgentResultPanel from '../components/agent/AgentResultPanel.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { streamAgentRun, checkBackendHealth } from '../services/api.js'
import { isValidStreamingUrl, extractStreamingUrl } from '../services/streaming.js'
import {
  createRecord,
  updateRecord,
  extractNumOfSteps,
  cleanStaleRunningRecords,
} from '../services/runHistory.js'

export default function AgentLab() {
  const [status, setStatus] = useState('ready') // 'ready' | 'running' | 'completed' | 'goal_failed' | 'error' | 'cancelled'
  const [events, setEvents] = useState([])
  const [streamingUrl, setStreamingUrl] = useState(null)
  const [runId, setRunId] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [pendingParams, setPendingParams] = useState(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [backendHealth, setBackendHealth] = useState({
    checked: false,
    online: false,
    tinyfishConfigured: false,
  })
  const [errorDetails, setErrorDetails] = useState({
    title: '',
    message: '',
    status: null,
    isConnectionError: false,
  })

  const abortControllerRef = useRef(null)
  const activeRecordIdRef = useRef(null)
  const startTimeMsRef = useRef(null)

  // Verify backend health and key status on mount; clean stale records
  useEffect(() => {
    let isMounted = true
    cleanStaleRunningRecords()
    checkBackendHealth()
      .then((data) => {
        if (isMounted) {
          setBackendHealth({
            checked: true,
            online: true,
            tinyfishConfigured: Boolean(data?.services?.tinyfishConfigured),
          })
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendHealth({
            checked: true,
            online: false,
            tinyfishConfigured: false,
          })
        }
      })

    return () => {
      isMounted = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // User submits form -> opens confirmation dialog (Section B)
  const handleReview = (params) => {
    if (status === 'running') return
    setPendingParams(params)
    setIsConfirmModalOpen(true)
  }

  // User explicitly confirms execution in modal
  const handleConfirmLaunch = async () => {
    if (!pendingParams || status === 'running') return

    setIsConfirmModalOpen(false)
    setStatus('running')
    setEvents([])
    setStreamingUrl(null)
    setRunId(null)
    setFinalResult(null)
    setErrorDetails({ title: '', message: '', status: null, isConnectionError: false })

    abortControllerRef.current = new AbortController()

    const startTimeMs = Date.now()
    startTimeMsRef.current = startTimeMs
    const startTimeStr = new Date().toLocaleTimeString()

    const initialRecord = createRecord({
      type: 'agent',
      title: `Agent: ${pendingParams.goal.slice(0, 60)}${pendingParams.goal.length > 60 ? '...' : ''}`,
      input: {
        goal: pendingParams.goal,
        url: pendingParams.url,
      },
      status: 'running',
    })
    activeRecordIdRef.current = initialRecord.id

    await streamAgentRun(pendingParams, {
      signal: abortControllerRef.current.signal,
      onEvent: ({ event, data }) => {
        const timestamp = new Date().toLocaleTimeString()
        setEvents((prev) => [...prev, { event, data, timestamp }])

        if (event === 'STARTED' || data?.type === 'STARTED') {
          if (data?.run_id) {
            setRunId(data.run_id)
            if (activeRecordIdRef.current) {
              updateRecord(activeRecordIdRef.current, {
                providerRunId: data.run_id,
              })
            }
          }
        } else if (event === 'STREAMING_URL' || data?.type === 'STREAMING_URL' || data?.event === 'STREAMING_URL') {
          const candidateUrl = extractStreamingUrl(data)
          if (candidateUrl && isValidStreamingUrl(candidateUrl)) {
            setStreamingUrl(candidateUrl)
          }
        } else if (event === 'COMPLETE' || data?.type === 'COMPLETE') {
          const endTimeStr = new Date().toLocaleTimeString()
          const infraStatus = data?.status || 'COMPLETED'
          const durationMs = startTimeMsRef.current ? Date.now() - startTimeMsRef.current : null

          // Inspect goal-level success vs failure
          let isGoalSuccess = true
          let goalFailureReason = null

          if (infraStatus === 'FAILED' || data?.error) {
            isGoalSuccess = false
            goalFailureReason = typeof data.error === 'string' ? data.error : data.error?.message
          } else if (data?.result?.success === false || data?.result?.error) {
            isGoalSuccess = false
            goalFailureReason = data.result.error || 'Goal requirements were not fulfilled.'
          }

          const extractedSteps = extractNumOfSteps(data)

          setFinalResult({
            run_id: data?.run_id || runId,
            status: infraStatus,
            isGoalSuccess,
            goalFailureReason,
            num_of_steps: extractedSteps,
            start_time: startTimeStr,
            end_time: endTimeStr,
            result: data?.result,
            error: data?.error,
          })

          setStatus(isGoalSuccess ? 'completed' : 'goal_failed')

          if (activeRecordIdRef.current) {
            updateRecord(activeRecordIdRef.current, {
              status: isGoalSuccess ? 'completed' : 'failed',
              completedAt: new Date().toISOString(),
              durationMs,
              providerRunId: data?.run_id || runId,
              numOfSteps: extractedSteps,
              resultSummary: isGoalSuccess
                ? 'Goal accomplished successfully.'
                : (goalFailureReason || 'Goal was not fulfilled.'),
              resultPayload: {
                infraStatus,
                isGoalSuccess,
                goalFailureReason,
                result: data?.result,
                error: data?.error,
              },
              errorMessage: isGoalSuccess ? null : (goalFailureReason || 'Goal execution failed'),
            })
          }
        }
      },
      onError: (err) => {
        setStatus('error')
        const durationMs = startTimeMsRef.current ? Date.now() - startTimeMsRef.current : null

        let title = 'Agent Run Failed'
        if (err.isConnectionError) {
          title = 'Backend Service Unavailable'
        } else if (err.status === 503) {
          title = 'TinyFish API Key Required'
        } else if (err.status === 401) {
          title = 'Unauthorized API Credentials'
        } else if (err.status === 402) {
          title = 'Insufficient Wallet Funds / Allowance Exhausted'
        } else if (err.status === 429) {
          title = 'Agent Rate Limit Exceeded'
        } else if (err.status === 504) {
          title = 'Agent Run Timed Out'
        } else if (err.status === 502) {
          title = 'Upstream Agent Provider Error'
        }

        setErrorDetails({
          title,
          message: err.message,
          status: err.status,
          isConnectionError: Boolean(err.isConnectionError),
        })

        if (activeRecordIdRef.current) {
          updateRecord(activeRecordIdRef.current, {
            status: 'failed',
            completedAt: new Date().toISOString(),
            durationMs,
            resultSummary: title,
            errorMessage: err.message,
          })
        }
      },
    })
  }

  // Cancel running agent
  const handleCancelRun = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setStatus('cancelled')
      const durationMs = startTimeMsRef.current ? Date.now() - startTimeMsRef.current : null

      setEvents((prev) => [
        ...prev,
        {
          event: 'CANCELLED',
          data: { message: 'Agent execution cancelled by user.' },
          timestamp: new Date().toLocaleTimeString(),
        },
      ])

      if (activeRecordIdRef.current) {
        updateRecord(activeRecordIdRef.current, {
          status: 'cancelled',
          completedAt: new Date().toISOString(),
          durationMs,
          resultSummary: 'Execution cancelled by user.',
          errorMessage: 'User aborted the running agent stream.',
        })
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Web Agent Playground</span>
          </div>

          {/* Backend Connectivity Status */}
          <div className="flex items-center gap-2">
            {!backendHealth.checked ? (
              <span className="text-xs font-mono text-neutral-500">Checking service...</span>
            ) : backendHealth.online ? (
              backendHealth.tinyfishConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Backend Ready (Key Active)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                  <KeyRound className="h-3 w-3" />
                  <span>Server Key Needed (server/.env)</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-mono">
                <Server className="h-3 w-3" />
                <span>Backend Offline (Port 5000)</span>
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Agent Lab</h1>
        <p className="mt-1 text-sm text-neutral-400 max-w-2xl">
          Dispatch multi-step autonomous browsing agents to execute web research and structured data extraction.
        </p>

        {/* Cost Awareness and Safety Banner */}
        <div className="mt-4 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs text-neutral-300">
          <DollarSign className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300">Paid Execution Warning: </strong>
            Autonomous Agent runs consume wallet funds on your TinyFish account at the published rate of{' '}
            <strong className="text-amber-300">$0.016 USD per step</strong>. Explicit confirmation is required
            before every run. Only 1 active agent run is permitted at a time.
          </div>
        </div>
      </div>

      {/* Task Configuration Form */}
      <section aria-label="Agent Configuration">
        <AgentForm onReview={handleReview} isRunning={status === 'running'} />
      </section>

      {/* Confirmation Modal (Section B) */}
      <AgentConfirmModal
        isOpen={isConfirmModalOpen}
        params={pendingParams}
        onConfirm={handleConfirmLaunch}
        onCancel={() => setIsConfirmModalOpen(false)}
        isLoading={status === 'running'}
      />

      {/* Execution Console & Results Area */}
      <section aria-live="polite" className="space-y-6">
        {/* Error State */}
        {status === 'error' && (
          <div className="space-y-4">
            <ErrorState
              title={errorDetails.title}
              message={errorDetails.message}
              isConnectionError={errorDetails.isConnectionError}
              onRetry={() => handleReview(pendingParams)}
            />

            {errorDetails.status === 503 && !errorDetails.isConnectionError && (
              <div className="max-w-2xl mx-auto p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  <span>How to configure your TinyFish API Key:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 font-mono">
                  <li>Create a file named <code className="text-neutral-200">server/.env</code> based on <code className="text-neutral-200">server/.env.example</code></li>
                  <li>Set <code className="text-neutral-200">TINYFISH_API_KEY=your_actual_key_here</code></li>
                  <li>Restart the backend server (<code className="text-neutral-200">npm run dev</code> in /server)</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Real-time Streaming Console */}
        {(status === 'running' || events.length > 0) && (
          <AgentConsole
            events={events}
            status={status}
            streamingUrl={streamingUrl}
            runId={runId}
            onCancel={handleCancelRun}
          />
        )}

        {/* Final Result & Cost Panel */}
        {finalResult && (
          <AgentResultPanel resultData={finalResult} />
        )}
      </section>
    </div>
  )
}
