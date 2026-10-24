import mongoose from 'mongoose'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

const stripeEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['processing', 'processed'], default: 'processing' },
  createdAt: { type: Date, default: Date.now, expires: THIRTY_DAYS_IN_SECONDS },
})

export const StripeEvent = mongoose.model('StripeEvent', stripeEventSchema)