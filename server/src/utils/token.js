import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), tenantId: user.tenantId.toString() },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}