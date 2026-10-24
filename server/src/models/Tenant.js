import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
    isActive: { type: Boolean, default: true },

    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
    subscriptionStatus: { type: String, default: 'none' },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Tenant = mongoose.model('Tenant', tenantSchema)