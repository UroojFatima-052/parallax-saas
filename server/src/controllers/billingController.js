import { z } from 'zod'
import { stripe } from '../config/stripe.js'
import { env } from '../config/env.js'
import { PLANS, PAID_PLAN_IDS } from '../config/plans.js'
import { Tenant } from '../models/Tenant.js'
import { AppError } from '../utils/AppError.js'

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']

const checkoutSchema = z.object({ plan: z.enum(PAID_PLAN_IDS) }).strict()

function publicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    description: plan.description,
    features: plan.features,
  }
}

async function findTenant(tenantId) {
  const tenant = await Tenant.findById(tenantId)
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Organisation not found')
  return tenant
}

async function ensureStripeCustomer(tenant, email) {
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId

  const customer = await stripe.customers.create(
    {
      name: tenant.name,
      email,
      metadata: { tenantId: tenant._id.toString(), slug: tenant.slug },
    },
    { idempotencyKey: `customer-${tenant._id}` }
  )

  tenant.stripeCustomerId = customer.id
  await tenant.save()
  return customer.id
}

export function listPlans(req, res) {
  res.json({ plans: Object.values(PLANS).map(publicPlan) })
}

export async function createCheckoutSession(req, res) {
  const { plan } = checkoutSchema.parse(req.body)
  const tenant = await findTenant(req.tenantId)

  if (ACTIVE_STATUSES.includes(tenant.subscriptionStatus)) {
    throw new AppError(409, 'ALREADY_SUBSCRIBED', 'You already have a subscription. Change your plan instead.')
  }

  const customerId = await ensureStripeCustomer(tenant, req.user.email)
  const tenantId = tenant._id.toString()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    client_reference_id: tenantId,
    metadata: { tenantId, plan },
    subscription_data: { metadata: { tenantId, plan } },
    success_url: `${env.CLIENT_URL}/billing?checkout=success`,
    cancel_url: `${env.CLIENT_URL}/billing/plans?checkout=cancelled`,
  })

  res.status(201).json({ url: session.url })
}