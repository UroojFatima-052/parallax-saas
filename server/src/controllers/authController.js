import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Tenant } from '../models/Tenant.js'
import { Role } from '../models/role.js'
import { User } from '../models/User.js'
import { signToken } from '../utils/token.js'

const loginSchema = z.object({
  orgSlug: z.string().trim().toLowerCase().min(1, 'Organisation is required'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export function userResponse(user, role, tenant) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: role.name,
    permissions: role.permissions,
    tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug },
  }
}

export async function login(req, res) {
  const data = loginSchema.parse(req.body)
  const invalid = () => res.status(401).json({ message: 'Invalid organisation, email or password' })

  const tenant = await Tenant.findOne({ slug: data.orgSlug, isActive: true })
  if (!tenant) return invalid()

  const user = await User.findOne({
    tenantId: tenant._id,
    email: data.email,
    isActive: true,
  }).select('+passwordHash')
  if (!user) return invalid()

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash)
  if (!passwordMatches) return invalid()

  const role = await Role.findOne({ _id: user.role, tenantId: tenant._id })

  res.json({ token: signToken(user), user: userResponse(user, role, tenant) })
}