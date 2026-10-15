/**
 * Run History Persistence Service
 * Responsibility: Manages local persistence of Search, Fetch, and Agent task records
 * using browser localStorage with defensive size limits, quota resilience, and step cost validation.
 */

export const STORAGE_KEY = 'tinyfish-studio:run-history:v1'
export const MAX_RECORDS = 50
export const MAX_PAYLOAD_CHARS = 30000 // 30KB safety ceiling for saved result payloads
export const COST_PER_STEP_USD = 0.016

/**
 * Validates and extracts provider-supplied execution step count from raw completion payload.
 * Strictly requires a finite, non-negative integer. Returns null if missing or invalid.
 * Does NOT infer steps from progress events or duration.
 *
 * @param {any} data - Upstream or complete event data
 * @returns {number|null} Valid step count or null
 */
export function extractNumOfSteps(data) {
  if (!data || typeof data !== 'object') return null

  const candidates = [
    data.num_of_steps,
    data.numOfSteps,
    data.num_steps,
    data.numSteps,
    data.steps_count,
    data.stepsCount,
    data.step_count,
    data.stepCount,
    data.run?.num_of_steps,
    data.run?.numOfSteps,
    data.run?.num_steps,
    data.run?.steps_count,
    data.metadata?.num_of_steps,
    data.metadata?.numOfSteps,
    data.metadata?.num_steps,
    data.metadata?.steps_count,
    data.result?.num_of_steps,
    data.result?.numOfSteps,
    data.result?.num_steps,
    data.result?.steps_count,
  ]

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      const parsed =
        typeof candidate === 'number'
          ? candidate
          : typeof candidate === 'string' && candidate.trim() !== ''
          ? Number(candidate.trim())
          : NaN

      if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 0) {
        return parsed
      }
    }
  }

  // Check if steps property is numeric
  if (typeof data.steps === 'number' && Number.isFinite(data.steps) && data.steps >= 0) {
    return Math.floor(data.steps)
  }
  if (typeof data.run?.steps === 'number' && Number.isFinite(data.run.steps) && data.run.steps >= 0) {
    return Math.floor(data.run.steps)
  }

  // Check if steps property is an array of tool execution records
  if (Array.isArray(data.steps) && data.steps.length > 0) {
    return data.steps.length
  }
  if (Array.isArray(data.run?.steps) && data.run.steps.length > 0) {
    return data.run.steps.length
  }

  return null
}

/**
 * Calculates estimated Agent usage cost based on the verified step count.
 * Returns null if step count is missing, non-numeric, or negative.
 *
 * @param {number|null} numOfSteps
 * @returns {number|null} Estimated cost in USD or null
 */
export function calculateEstimatedCost(numOfSteps) {
  if (typeof numOfSteps !== 'number' || isNaN(numOfSteps) || numOfSteps < 0 || !Number.isInteger(numOfSteps)) {
    return null
  }
  return Number((numOfSteps * COST_PER_STEP_USD).toFixed(4))
}

/**
 * Sanitizes and bounds result payloads to prevent exceeding localStorage storage limits.
 *
 * @param {any} payload
 * @returns {{ sanitizedPayload: any, isTruncated: boolean }}
 */
function sanitizeResultPayload(payload) {
  if (payload === undefined || payload === null) {
    return { sanitizedPayload: null, isTruncated: false }
  }

  try {
    const serialized = JSON.stringify(payload)
    if (serialized.length <= MAX_PAYLOAD_CHARS) {
      return { sanitizedPayload: payload, isTruncated: false }
    }

    // Payload exceeds character ceiling; preserve a compact truncated snapshot
    const truncatedString = serialized.slice(0, MAX_PAYLOAD_CHARS) + '... [Truncated for storage]'
    let safeSnapshot = truncatedString
    try {
      safeSnapshot = {
        _notice: 'Full payload truncated to conserve local storage space.',
        preview: truncatedString.slice(0, 2000),
      }
    } catch {
      // Fallback
    }

    return { sanitizedPayload: safeSnapshot, isTruncated: true }
  } catch {
    return { sanitizedPayload: String(payload).slice(0, 1000), isTruncated: true }
  }
}

/**
 * Safely reads all records from localStorage.
 *
 * @param {Storage} [storage=localStorage]
 * @returns {Array<Object>} Sorted list of run history records (newest first)
 */
export function getHistory(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return []

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
  } catch (err) {
    console.warn('[RunHistory] Failed to parse stored history records:', err)
    return []
  }
}

/**
 * Safely writes records to localStorage with quota protection and size capping.
 *
 * @param {Array<Object>} records
 * @param {Storage} [storage=localStorage]
 * @returns {boolean} Success indicator
 */
function saveRecords(records, storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return false

  // Retain maximum of MAX_RECORDS (latest 50)
  const capped = records
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
    .slice(0, MAX_RECORDS)

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(capped))
    return true
  } catch (quotaErr) {
    console.warn('[RunHistory] Storage quota exceeded. Pruning older records to make room...', quotaErr)
    try {
      // Aggressively prune to latest 25 records
      const pruned = capped.slice(0, 25)
      storage.setItem(STORAGE_KEY, JSON.stringify(pruned))
      return true
    } catch (criticalErr) {
      console.error('[RunHistory] Unable to persist records after quota pruning:', criticalErr)
      return false
    }
  }
}

/**
 * Creates and persists a new run record.
 *
 * @param {Object} data
 * @param {Storage} [storage]
 * @returns {Object} Created record
 */
export function createRecord(data, storage) {
  const records = getHistory(storage)

  const id = data.id || `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const startedAt = data.startedAt || new Date().toISOString()
  const { sanitizedPayload, isTruncated } = sanitizeResultPayload(data.resultPayload)

  const numOfSteps = extractNumOfSteps({ num_of_steps: data.numOfSteps })
  const estimatedCostUsd = calculateEstimatedCost(numOfSteps)

  const newRecord = {
    id,
    type: data.type || 'search', // 'search' | 'fetch' | 'agent'
    title: data.title || 'Untitled Operation',
    input: data.input || null,
    status: data.status || 'running', // 'running' | 'completed' | 'partial' | 'failed' | 'timed_out' | 'cancelled'
    startedAt,
    completedAt: data.completedAt || null,
    durationMs: typeof data.durationMs === 'number' ? data.durationMs : null,
    providerRunId: data.providerRunId || null,
    resultSummary: data.resultSummary || null,
    resultPayload: sanitizedPayload,
    errorMessage: data.errorMessage || null,
    numOfSteps,
    estimatedCostUsd,
    resultTruncated: Boolean(isTruncated || data.resultTruncated),
  }

  records.unshift(newRecord)
  saveRecords(records, storage)

  return newRecord
}

/**
 * Updates an existing run record by its unique ID.
 *
 * @param {string} id
 * @param {Object} updates
 * @param {Storage} [storage]
 * @returns {Object|null} Updated record or null
 */
export function updateRecord(id, updates, storage) {
  const records = getHistory(storage)
  const index = records.findIndex((r) => r.id === id)
  if (index === -1) return null

  const existing = records[index]

  let sanitizedPayload = existing.resultPayload
  let isTruncated = existing.resultTruncated

  if (updates.resultPayload !== undefined) {
    const res = sanitizeResultPayload(updates.resultPayload)
    sanitizedPayload = res.sanitizedPayload
    isTruncated = res.isTruncated || Boolean(updates.resultTruncated)
  }

  // Extract steps if updated
  let numOfSteps = existing.numOfSteps
  if (updates.numOfSteps !== undefined) {
    numOfSteps = extractNumOfSteps({ num_of_steps: updates.numOfSteps })
  } else if (updates.rawCompletionData) {
    const extracted = extractNumOfSteps(updates.rawCompletionData)
    if (extracted !== null) numOfSteps = extracted
  }

  const estimatedCostUsd = calculateEstimatedCost(numOfSteps)

  const updatedRecord = {
    ...existing,
    ...updates,
    resultPayload: sanitizedPayload,
    resultTruncated: isTruncated,
    numOfSteps,
    estimatedCostUsd,
  }

  records[index] = updatedRecord
  saveRecords(records, storage)

  return updatedRecord
}

/**
 * Deletes a single record by ID.
 *
 * @param {string} id
 * @param {Storage} [storage]
 * @returns {boolean}
 */
export function deleteRecord(id, storage) {
  const records = getHistory(storage)
  const filtered = records.filter((r) => r.id !== id)
  if (filtered.length === records.length) return false
  return saveRecords(filtered, storage)
}

/**
 * Clears all stored history records.
 *
 * @param {Storage} [storage]
 * @returns {boolean}
 */
export function clearHistory(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Exports history records as a JSON string for user download.
 *
 * @param {Storage} [storage]
 * @returns {string} Formatted JSON string
 */
export function exportHistoryJson(storage) {
  const records = getHistory(storage)
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    },
    null,
    2
  )
}

/**
 * Derives aggregate execution statistics from stored history records.
 *
 * @param {Storage} [storage]
 * @returns {{ total: number, completed: number, partial: number, failed: number, running: number }}
 */
export function getHistoryStats(storage) {
  const records = getHistory(storage)
  return {
    total: records.length,
    completed: records.filter((r) => r.status === 'completed').length,
    partial: records.filter((r) => r.status === 'partial').length,
    failed: records.filter((r) => r.status === 'failed' || r.status === 'timed_out').length,
    running: records.filter((r) => r.status === 'running').length,
  }
}

/**
 * Scans for stale "running" entries on application mount and converts them to "cancelled"
 * with an explanation that the observation was interrupted by page reload or browser closing.
 *
 * @param {Storage} [storage]
 * @returns {number} Count of cleaned records
 */
export function cleanStaleRunningRecords(storage) {
  const records = getHistory(storage)
  let cleanedCount = 0

  const updated = records.map((record) => {
    if (record.status === 'running') {
      cleanedCount++
      return {
        ...record,
        status: 'cancelled',
        completedAt: record.completedAt || new Date().toISOString(),
        resultSummary: 'Local observation interrupted by page refresh or browser closing.',
        errorMessage: 'Execution observation was interrupted before receiving a final provider status.',
      }
    }
    return record
  })

  if (cleanedCount > 0) {
    saveRecords(updated, storage)
  }

  return cleanedCount
}

/**
 * Calculates current localStorage usage telemetry for the Settings and diagnostic views.
 *
 * @param {Storage} [storage]
 * @returns {{ available: boolean, count: number, bytesUsed: number, bytesUsedKb: string, maxRecords: number }}
 */
export function getStorageUsage(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) {
    return { available: false, count: 0, bytesUsed: 0, bytesUsedKb: '0.0', maxRecords: MAX_RECORDS }
  }

  try {
    const raw = storage.getItem(STORAGE_KEY) || ''
    const bytesUsed = typeof Blob !== 'undefined' ? new Blob([raw]).size : raw.length
    const records = getHistory(storage)
    return {
      available: true,
      count: records.length,
      bytesUsed,
      bytesUsedKb: (bytesUsed / 1024).toFixed(1),
      maxRecords: MAX_RECORDS,
    }
  } catch {
    return { available: false, count: 0, bytesUsed: 0, bytesUsedKb: '0.0', maxRecords: MAX_RECORDS }
  }
}
