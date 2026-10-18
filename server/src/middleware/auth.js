import { verifyToken } from '../utils/token.js'
import { User } from '../models/User.js'
import { Role } from '../models/Role.js'
import { AppError } from '../utils/AppError.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'UNAUTHORIZED', 'You need to sign in first')
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    throw new AppError(401, 'SESSION_EXPIRED', 'Your session expired. Sign in again')
  }

  const user = await User.findOne({ _id: payload.userId, tenantId: payload.tenantId, isActive: true })
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Account not found')
  }

  const role = await Role.findOne({ _id: user.role, tenantId: user.tenantId })

  req.user = user
  req.tenantId = user.tenantId
  req.permissions = role ? role.permissions : []
  next()
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.permissions.includes(permission)) {
      throw new AppError(403, 'FORBIDDEN', 'Your role does not allow this action')
    }
    next()
  }
}