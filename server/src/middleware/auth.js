import { verifyToken } from '../utils/token.js'
import { User } from '../models/User.js'
import { Role } from '../models/Role.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not logged in' })
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid, please log in again' })
  }

  const user = await User.findOne({ _id: payload.userId, tenantId: payload.tenantId, isActive: true })
  if (!user) {
    return res.status(401).json({ message: 'Account not found' })
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
      return res.status(403).json({ message: 'You do not have permission to do this' })
    }
    next()
  }
}