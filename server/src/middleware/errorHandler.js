import { ZodError } from 'zod'
import { AppError } from '../utils/AppError.js'

function sendError(res, status, code, message, details) {
  const body = { error: { code, message } }
  if (details) body.error.details = details
  res.status(status).json(body)
}

export function notFoundHandler(req) {
  throw new AppError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.originalUrl}`)
}

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details)
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }))
    return sendError(res, 400, 'VALIDATION_ERROR', 'Some fields are invalid', details)
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON')
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, 'INVALID_ID', 'That ID is not valid')
  }

  if (err.code === 11000) {
    if (err.keyPattern?.email) {
      return sendError(res, 409, 'EMAIL_TAKEN', 'This email is already registered in this organisation')
    }
    return sendError(res, 409, 'DUPLICATE', 'This already exists')
  }

  console.error(err)
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong on our side')
}
