import crypto from 'node:crypto'
import { IdempotencyKey } from '../models/IdempotencyKey.js'
import { AppError } from '../utils/AppError.js'

function hashRequest(req) {
  return crypto
    .createHash('sha256')
    .update(`${req.method} ${req.originalUrl} ${JSON.stringify(req.body ?? {})}`)
    .digest('hex')
}

export function idempotency({ required = true } = {}) {
  return async (req, res, next) => {
    const key = req.get('Idempotency-Key')

    if (!key) {
      if (required) {
        throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header with this request')
      }
      return next()
    }

    if (key.length < 8 || key.length > 100) {
      throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8 to 100 characters')
    }

    const scope = { tenantId: req.tenantId, userId: req.user._id, key }
    const requestHash = hashRequest(req)

    let record
    try {
      record = await IdempotencyKey.create({ ...scope, requestHash })
    } catch (err) {
      if (err.code !== 11000) throw err

      const existing = await IdempotencyKey.findOne(scope)

      if (existing.requestHash !== requestHash) {
        throw new AppError(422, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used for a different request')
      }
      if (existing.status === 'processing') {
        throw new AppError(409, 'IDEMPOTENCY_IN_PROGRESS', 'This request is still being processed. Try again in a moment')
      }

      res.set('Idempotent-Replayed', 'true')
      return res.status(existing.responseStatus).json(existing.responseBody)
    }

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode >= 500) {
        IdempotencyKey.deleteOne({ _id: record._id, tenantId: req.tenantId }).catch(() => {})
      } else {
        IdempotencyKey.updateOne(
          { _id: record._id, tenantId: req.tenantId },
          { status: 'completed', responseStatus: res.statusCode, responseBody: body }
        ).catch(() => {})
      }
      return originalJson(body)
    }

    next()
  }
}