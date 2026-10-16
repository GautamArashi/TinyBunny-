/**
 * API Service Client
 * Responsibility: Centralized HTTP client interface for communicating with
 * the backend API endpoints (health, search, fetch, agent).
 */
import axios from 'axios'

// Configurable backend base URL from Vite environment with local development fallback

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'

export const API_BASE_URL = rawBaseUrl
  .replace(/\/+$/, '')
  .endsWith('/api')
  ? rawBaseUrl.replace(/\/+$/, '')
  : `${rawBaseUrl.replace(/\/+$/, '')}/api`

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})


/**
 * Checks local backend service health status.
 *
 * @returns {Promise<Object>} Health response payload
 */
export async function checkBackendHealth() {
  const response = await apiClient.get('/health')
  return response.data
}

/**
 * Dispatches a search query to the backend TinyFish proxy endpoint.
 *
 * @param {Object} params
 * @param {string} params.query - The user search query string
 * @returns {Promise<Object>} The API response payload
 */
export async function searchTinyFish({ query }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('A valid search query is required.')
  }

  try {
    const response = await apiClient.post('/tinyfish/search', {
      query: query.trim(),
    })
    return response.data
  } catch (error) {
    const isNetworkError =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      !error.response

    if (isNetworkError) {
      const err = new Error(
        `The backend server is currently unreachable at ${API_BASE_URL}. Ensure the local server is running (npm run dev in /server).`
      )
      err.isConnectionError = true
      err.status = 503
      throw err
    }

    const status = error.response.status
    const serverMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      `Request failed with status ${status}`

    const formattedError = new Error(serverMessage)
    formattedError.status = status
    formattedError.isConnectionError = false
    throw formattedError
  }
}

/**
 * Dispatches a webpage content extraction request to the backend TinyFish fetch proxy endpoint.
 *
 * @param {Object} params
 * @param {string[]} params.urls - Array of 1 to 10 URLs to fetch
 * @param {string} [params.format='markdown'] - Desired output format ('markdown' | 'html' | 'json')
 * @param {string} [params.purpose] - Optional purpose description
 * @returns {Promise<Object>} Object with results and errors arrays
 */
export async function fetchPages({ urls, format = 'markdown', purpose }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('At least one URL is required.')
  }

  const payload = {
    urls,
    format,
  }

  if (purpose && typeof purpose === 'string' && purpose.trim()) {
    payload.purpose = purpose.trim()
  }

  try {
    const response = await apiClient.post('/tinyfish/fetch', payload, {
      timeout: 160000, // 160 seconds to accommodate upstream 150s timeout
    })
    return response.data
  } catch (error) {
    const isNetworkError =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      !error.response

    if (isNetworkError) {
      const err = new Error(
        `The backend server is currently unreachable at ${API_BASE_URL}. Ensure the local server is running (npm run dev in /server).`
      )
      err.isConnectionError = true
      err.status = 503
      throw err
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const err = new Error(
        'The fetch request timed out. Content extraction from the target pages took longer than 150 seconds.'
      )
      err.status = 504
      err.isConnectionError = false
      throw err
    }

    const status = error.response?.status || 500
    const serverMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      `Request failed with status ${status}`

    const formattedError = new Error(serverMessage)
    formattedError.status = status
    formattedError.isConnectionError = false
    throw formattedError
  }
}

/**
 * Initiates an incremental SSE stream for an Agent run.
 * Relays event chunks (STARTED, STREAMING_URL, PROGRESS, HEARTBEAT, COMPLETE) to onEvent callback.
 *
 * @param {Object} params
 * @param {string} params.url - Starting URL
 * @param {string} params.goal - Task goal instruction
 * @param {number} [params.max_duration_seconds=180] - Maximum duration
 * @param {Object} handlers
 * @param {Function} handlers.onEvent - Callback invoked on each parsed SSE event: ({ event, data }) => void
 * @param {Function} handlers.onError - Callback invoked on error
 * @param {AbortSignal} [handlers.signal] - Optional abort signal
 */
export async function streamAgentRun(
  { url, goal, max_duration_seconds = 180 },
  { onEvent, onError, signal }
) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/tinyfish/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        goal,
        max_duration_seconds,
      }),
      signal,
    })
  } catch (fetchErr) {
    if (signal?.aborted) {
      return
    }
    const err = new Error(
      `The backend server is currently unreachable at ${API_BASE_URL}. Ensure the local server is running.`
    )
    err.isConnectionError = true
    err.status = 503
    onError(err)
    return
  }

  // Handle HTTP error responses prior to SSE initialization
  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = null
    }

    const message =
      errorData?.error?.message ||
      `Agent run failed with status ${response.status}`

    const err = new Error(message)
    err.status = response.status
    err.isConnectionError = false
    onError(err)
    return
  }

  // Parse SSE stream incrementally
  if (!response.body) {
    onError(new Error('Response body stream is unavailable.'))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      // Normalize line breaks to \n for standard SSE chunking
      const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const blocks = normalized.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        if (!block.trim()) continue

        let eventType = 'message'
        let dataStr = ''

        const lines = block.split('\n')
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            const d = line.slice(5).trim()
            dataStr = dataStr ? `${dataStr}\n${d}` : d
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr)
            onEvent({ event: eventType, data: parsed })
          } catch {
            onEvent({ event: eventType, data: dataStr })
          }
        }
      }
    }

    // Flush any trailing block
    const trailing = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
    if (trailing) {
      const lines = trailing.split('\n')
      let eventType = 'message'
      let dataStr = ''
      for (const line of lines) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim()
        else if (line.startsWith('data:')) {
          const d = line.slice(5).trim()
          dataStr = dataStr ? `${dataStr}\n${d}` : d
        }
      }
      if (dataStr) {
        try {
          onEvent({ event: eventType, data: JSON.parse(dataStr) })
        } catch {
          onEvent({ event: eventType, data: dataStr })
        }
      }
    }
  } catch (streamErr) {
    if (signal?.aborted) return
    onError(new Error('Agent SSE stream reading error: ' + streamErr.message))
  }
}
