import mongoose from 'mongoose'
import { tenantGuard } from '../plugins/tenantGuard.js'

export const PERMISSIONS = [
  'bookings:read',
  'bookings:create',
  'bookings:update',
  'bookings:delete',
  'users:manage',
  'settings:manage',
  'billing:manage',
]

const roleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true, lowercase: true },
    permissions: [{ type: String, enum: PERMISSIONS }],
  },
  { timestamps: true }
)

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true })
roleSchema.plugin(tenantGuard)

export const Role = mongoose.model('Role', roleSchema)