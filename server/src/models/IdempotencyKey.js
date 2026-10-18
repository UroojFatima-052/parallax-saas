import mongoose from 'mongoose'
import { tenantGuard } from '../plugins/tenantGuard.js'

const ONE_DAY_IN_SECONDS = 60 * 60 * 24

const idempotencyKeySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  status: { type: String, enum: ['processing', 'completed'], default: 'processing' },
  responseStatus: Number,
  responseBody: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, expires: ONE_DAY_IN_SECONDS },
})

idempotencyKeySchema.index({ tenantId: 1, userId: 1, key: 1 }, { unique: true })
idempotencyKeySchema.plugin(tenantGuard)

export const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema)