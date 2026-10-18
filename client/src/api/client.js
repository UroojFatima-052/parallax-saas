const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const RETRYABLE_STATUSES = [502, 503, 504]
const SAFE_TO_RETRY_METHODS = ['GET', 'DELETE']

export class ApiError extends Error {
  constructor(message, status, code, fieldErrors = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendOnce(path, { method, body, token, idempotencyKey }) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, 'NETWORK_ERROR')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = data.error || {}
    const fieldErrors = {}
    for (const detail of error.details || []) {
      if (!fieldErrors[detail.field]) fieldErrors[detail.field] = detail.message
    }
    throw new ApiError(
      error.message || 'Something went wrong. Please try again.',
      response.status,
      error.code || 'UNKNOWN_ERROR',
      fieldErrors
    )
  }

  return data
}

export async function apiRequest(path, { method = 'GET', body, token, idempotencyKey, retries = 2 } = {}) {
  const canRetry = SAFE_TO_RETRY_METHODS.includes(method) || Boolean(idempotencyKey)

  for (let attempt = 0; ; attempt++) {
    try {
      return await sendOnce(path, { method, body, token, idempotencyKey })
    } catch (error) {
      const isTemporary = error.status === 0 || RETRYABLE_STATUSES.includes(error.status)

      if (method === 'DELETE' && attempt > 0 && error.status === 404) {
        return null
      }

      if (!canRetry || !isTemporary || attempt >= retries) {
        throw error
      }

      await wait(500 * 2 ** attempt)
    }
  }
}