/**
 * Run History Service Tests
 * Tests step extraction, cost calculation, schema validation, payload truncation,
 * quota resilience, and localStorage lifecycle operations.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractNumOfSteps,
  calculateEstimatedCost,
  createRecord,
  updateRecord,
  deleteRecord,
  clearHistory,
  getHistory,
  getHistoryStats,
  cleanStaleRunningRecords,
  STORAGE_KEY,
  MAX_RECORDS,
  COST_PER_STEP_USD,
} from '../src/services/runHistory.js'

class MockStorage {
  constructor() {
    this.store = new Map()
    this.throwOnSet = false
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    if (this.throwOnSet) {
      const err = new Error('QuotaExceededError')
      err.name = 'QuotaExceededError'
      throw err
    }
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

describe('Run History Service', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = new MockStorage()
  })

  describe('extractNumOfSteps', () => {
    it('extracts integer from num_of_steps directly', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: 7 }), 7)
    })

    it('extracts integer from camelCase numOfSteps', () => {
      assert.strictEqual(extractNumOfSteps({ numOfSteps: 4 }), 4)
    })

    it('extracts integer from numeric string', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: '12' }), 12)
    })

    it('extracts integer nested in run object', () => {
      assert.strictEqual(extractNumOfSteps({ run: { num_of_steps: 9 } }), 9)
    })

    it('extracts integer nested in metadata object', () => {
      assert.strictEqual(extractNumOfSteps({ metadata: { num_of_steps: 5 } }), 5)
    })

    it('extracts steps count from an array of steps', () => {
      assert.strictEqual(extractNumOfSteps({ steps: ['navigate', 'click', 'extract'] }), 3)
    })

    it('extracts 0 steps as a valid non-negative integer', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: 0 }), 0)
    })

    it('returns null for negative numbers', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: -2 }), null)
    })

    it('returns null for non-integer floats', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: 3.14 }), null)
    })

    it('returns null for non-numeric strings', () => {
      assert.strictEqual(extractNumOfSteps({ num_of_steps: 'five' }), null)
    })

    it('returns null for null or undefined input', () => {
      assert.strictEqual(extractNumOfSteps(null), null)
      assert.strictEqual(extractNumOfSteps(undefined), null)
      assert.strictEqual(extractNumOfSteps({}), null)
    })
  })

  describe('calculateEstimatedCost', () => {
    it('calculates cost using COST_PER_STEP_USD rate', () => {
      assert.strictEqual(calculateEstimatedCost(1), COST_PER_STEP_USD)
      assert.strictEqual(calculateEstimatedCost(4), 0.064)
      assert.strictEqual(calculateEstimatedCost(0), 0)
    })

    it('returns null for invalid, negative, or non-integer steps', () => {
      assert.strictEqual(calculateEstimatedCost(null), null)
      assert.strictEqual(calculateEstimatedCost(undefined), null)
      assert.strictEqual(calculateEstimatedCost('4'), null)
      assert.strictEqual(calculateEstimatedCost(-1), null)
      assert.strictEqual(calculateEstimatedCost(2.5), null)
    })
  })

  describe('CRUD Lifecycle', () => {
    it('creates and retrieves a new run record with validated fields', () => {
      const record = createRecord(
        {
          type: 'search',
          title: 'Search: "test query"',
          input: { query: 'test query' },
          status: 'running',
        },
        mockStorage
      )

      assert.ok(record.id.startsWith('run_'))
      assert.strictEqual(record.type, 'search')
      assert.strictEqual(record.status, 'running')
      assert.ok(record.startedAt)

      const history = getHistory(mockStorage)
      assert.strictEqual(history.length, 1)
      assert.strictEqual(history[0].id, record.id)
    })

    it('updates a record with status, completion data, and computed cost', () => {
      const record = createRecord(
        {
          type: 'agent',
          title: 'Agent run test',
          status: 'running',
        },
        mockStorage
      )

      const updated = updateRecord(
        record.id,
        {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationMs: 3200,
          providerRunId: 'prov_run_abc123',
          rawCompletionData: { num_of_steps: 5 },
          resultSummary: 'Goal accomplished.',
        },
        mockStorage
      )

      assert.strictEqual(updated.status, 'completed')
      assert.strictEqual(updated.numOfSteps, 5)
      assert.strictEqual(updated.estimatedCostUsd, 0.08)
      assert.strictEqual(updated.providerRunId, 'prov_run_abc123')
      assert.strictEqual(updated.durationMs, 3200)

      const history = getHistory(mockStorage)
      assert.strictEqual(history[0].numOfSteps, 5)
      assert.strictEqual(history[0].estimatedCostUsd, 0.08)
    })

    it('deletes a single record by id', () => {
      const r1 = createRecord({ title: 'Task 1' }, mockStorage)
      const r2 = createRecord({ title: 'Task 2' }, mockStorage)

      assert.strictEqual(getHistory(mockStorage).length, 2)
      const deleted = deleteRecord(r1.id, mockStorage)
      assert.strictEqual(deleted, true)

      const history = getHistory(mockStorage)
      assert.strictEqual(history.length, 1)
      assert.strictEqual(history[0].id, r2.id)
    })

    it('clears all history records', () => {
      createRecord({ title: 'Task 1' }, mockStorage)
      createRecord({ title: 'Task 2' }, mockStorage)

      assert.strictEqual(getHistory(mockStorage).length, 2)
      clearHistory(mockStorage)
      assert.strictEqual(getHistory(mockStorage).length, 0)
    })
  })

  describe('Storage limits & Quota resilience', () => {
    it('enforces 50-record maximum ceiling', () => {
      for (let i = 0; i < 55; i++) {
        createRecord({ title: `Run ${i}`, startedAt: new Date(Date.now() + i * 1000).toISOString() }, mockStorage)
      }

      const history = getHistory(mockStorage)
      assert.strictEqual(history.length, MAX_RECORDS)
      // Newest should be Run 54
      assert.strictEqual(history[0].title, 'Run 54')
    })

    it('truncates oversized payloads exceeding 30KB threshold', () => {
      const hugeString = 'x'.repeat(40000)
      const record = createRecord(
        {
          title: 'Huge Payload Task',
          resultPayload: { content: hugeString },
        },
        mockStorage
      )

      assert.strictEqual(record.resultTruncated, true)
      assert.ok(record.resultPayload._notice)
    })

    it('cleans stale running records on mount', () => {
      createRecord({ title: 'Stale Task 1', status: 'running' }, mockStorage)
      createRecord({ title: 'Completed Task', status: 'completed' }, mockStorage)

      const cleaned = cleanStaleRunningRecords(mockStorage)
      assert.strictEqual(cleaned, 1)

      const history = getHistory(mockStorage)
      const stale = history.find((h) => h.title === 'Stale Task 1')
      assert.strictEqual(stale.status, 'cancelled')
      assert.ok(stale.resultSummary.includes('interrupted'))
    })

    it('computes aggregate history statistics correctly', () => {
      createRecord({ status: 'completed' }, mockStorage)
      createRecord({ status: 'completed' }, mockStorage)
      createRecord({ status: 'partial' }, mockStorage)
      createRecord({ status: 'failed' }, mockStorage)

      const stats = getHistoryStats(mockStorage)
      assert.strictEqual(stats.total, 4)
      assert.strictEqual(stats.completed, 2)
      assert.strictEqual(stats.partial, 1)
      assert.strictEqual(stats.failed, 1)
    })
  })
})
