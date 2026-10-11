import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Tenant } from '../models/Tenant.js'
import { Role, PERMISSIONS, MEMBER_PERMISSIONS } from '../models/Role.js'
import { User } from '../models/User.js'
import { signToken } from '../utils/token.js'

const onboardSchema = z.object({
  orgName: z.string().trim().min(2, 'Organisation name is too short'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'URL must be at least 3 characters')
    .max(40, 'URL is too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and dashes'),
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z.object({
  orgSlug: z.string().trim().toLowerCase().min(1, 'Organisation is required'),
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

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

export async function onboardOrganisation(req, res) {
  const data = onboardSchema.parse(req.body)

  const slugTaken = await Tenant.exists({ slug: data.slug })
  if (slugTaken) {
    return res.status(409).json({ message: 'This organisation URL is already taken' })
  }

  const tenant = await Tenant.create({ name: data.orgName, slug: data.slug })

  try {
    const [adminRole] = await Role.insertMany([
      { tenantId: tenant._id, name: 'admin', permissions: PERMISSIONS },
      { tenantId: tenant._id, name: 'member', permissions: MEMBER_PERMISSIONS },
    ])

    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await User.create({
      tenantId: tenant._id,
      name: data.name,
      email: data.email,
      passwordHash,
      role: adminRole._id,
    })

    res.status(201).json({ token: signToken(user), user: userResponse(user, adminRole, tenant) })
  } catch (err) {
    await Role.deleteMany({ tenantId: tenant._id })
    await Tenant.deleteOne({ _id: tenant._id })
    throw err
  }
}

export async function register(req, res) {
  const data = registerSchema.parse(req.body)

  const tenant = await Tenant.findOne({ slug: data.orgSlug, isActive: true })
  if (!tenant) {
    return res.status(404).json({ message: 'Organisation not found' })
  }

  const memberRole = await Role.findOne({ tenantId: tenant._id, name: 'member' })
  const passwordHash = await bcrypt.hash(data.password, 10)

  const user = await User.create({
    tenantId: tenant._id,
    name: data.name,
    email: data.email,
    passwordHash,
    role: memberRole._id,
  })

  res.status(201).json({ token: signToken(user), user: userResponse(user, memberRole, tenant) })
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