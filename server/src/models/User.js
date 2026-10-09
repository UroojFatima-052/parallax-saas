import mongoose from 'mongoose'
import { tenantGuard } from '../plugins/tenantGuard.js'

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    isActive: { type: Boolean, default: true },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.index({ tenantId: 1, email: 1 }, { unique: true })
userSchema.plugin(tenantGuard)

export const User = mongoose.model('User', userSchema)