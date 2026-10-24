import { z } from 'zod'
import { stripe } from '../config/stripe.js'
import { env } from '../config/env.js'
import { PLANS, PAID_PLAN_IDS } from '../config/plans.js'
import { Tenant } from '../models/Tenant.js'
import { AppError } from '../utils/AppError.js'
import { syncSubscription } from './webhookController.js'

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']

const INVOICE_REASONS = {
  subscription_create: 'New subscription',
  subscription_cycle: 'Monthly renewal',
  subscription_update: 'Plan change',
  manual: 'One-off charge',
}

const planSchema = z.object({ plan: z.enum(PAID_PLAN_IDS) }).strict()

function publicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    description: plan.description,
    features: plan.features,
  }
}

function subscriptionResponse(tenant) {
  return {
    plan: tenant.plan,
    status: tenant.subscriptionStatus,
    currentPeriodEnd: tenant.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: tenant.cancelAtPeriodEnd,
    hasSubscription: ACTIVE_STATUSES.includes(tenant.subscriptionStatus),
  }
}

async function findTenant(tenantId) {
  const tenant = await Tenant.findById(tenantId)
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'Organisation not found')
  return tenant
}

function requireSubscription(tenant) {
  if (!tenant.stripeSubscriptionId || !ACTIVE_STATUSES.includes(tenant.subscriptionStatus)) {
    throw new AppError(409, 'NO_SUBSCRIPTION', 'There is no active subscription. Choose a plan first.')
  }
}

function stripeOptions(req, action) {
  const key = req.get('Idempotency-Key')
  return key ? { idempotencyKey: `${action}-${req.tenantId}-${key}` } : undefined
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

export async function getSubscription(req, res) {
  const tenant = await findTenant(req.tenantId)
  res.json({ subscription: subscriptionResponse(tenant) })
}

export async function createCheckoutSession(req, res) {
  const { plan } = planSchema.parse(req.body)
  const tenant = await findTenant(req.tenantId)

  if (ACTIVE_STATUSES.includes(tenant.subscriptionStatus)) {
    throw new AppError(409, 'ALREADY_SUBSCRIBED', 'You already have a subscription. Change your plan instead.')
  }

  const customerId = await ensureStripeCustomer(tenant, req.user.email)
  const tenantId = tenant._id.toString()

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      client_reference_id: tenantId,
      metadata: { tenantId, plan },
      subscription_data: { metadata: { tenantId, plan } },
      success_url: `${env.CLIENT_URL}/billing?checkout=success`,
      cancel_url: `${env.CLIENT_URL}/billing/plans?checkout=cancelled`,
    },
    stripeOptions(req, 'checkout')
  )

  res.status(201).json({ url: session.url })
}

export async function changePlan(req, res) {
  const { plan } = planSchema.parse(req.body)
  const tenant = await findTenant(req.tenantId)
  requireSubscription(tenant)

  if (tenant.plan === plan && !tenant.cancelAtPeriodEnd) {
    throw new AppError(400, 'SAME_PLAN', `You're already on ${PLANS[plan].name}`)
  }

  const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId)

  await stripe.subscriptions.update(
    subscription.id,
    {
      items: [{ id: subscription.items.data[0].id, price: PLANS[plan].priceId }],
      proration_behavior: 'always_invoice',
      cancel_at_period_end: false,
      metadata: { tenantId: tenant._id.toString(), plan },
    },
    stripeOptions(req, 'change-plan')
  )

  await syncSubscription(subscription.id)
  res.json({ subscription: subscriptionResponse(await findTenant(req.tenantId)) })
}

export async function cancelSubscription(req, res) {
  const tenant = await findTenant(req.tenantId)
  requireSubscription(tenant)

  await stripe.subscriptions.update(tenant.stripeSubscriptionId, { cancel_at_period_end: true })
  await syncSubscription(tenant.stripeSubscriptionId)

  res.json({ subscription: subscriptionResponse(await findTenant(req.tenantId)) })
}

export async function resumeSubscription(req, res) {
  const tenant = await findTenant(req.tenantId)
  requireSubscription(tenant)

  if (!tenant.cancelAtPeriodEnd) {
    throw new AppError(400, 'NOT_CANCELLING', 'Your subscription is not set to cancel')
  }

  await stripe.subscriptions.update(tenant.stripeSubscriptionId, { cancel_at_period_end: false })
  await syncSubscription(tenant.stripeSubscriptionId)

  res.json({ subscription: subscriptionResponse(await findTenant(req.tenantId)) })
}

export async function listInvoices(req, res) {
  const tenant = await findTenant(req.tenantId)
  if (!tenant.stripeCustomerId) return res.json({ invoices: [] })

  const result = await stripe.invoices.list({ customer: tenant.stripeCustomerId, limit: 24 })

  const invoices = result.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    createdAt: new Date(invoice.created * 1000),
    amount: invoice.status === 'paid' ? invoice.amount_paid : invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status,
    reason: INVOICE_REASONS[invoice.billing_reason] ?? 'Subscription',
    lines: (invoice.lines?.data ?? []).map((line) => ({
      description: line.description,
      amount: line.amount,
    })),
    hostedUrl: invoice.hosted_invoice_url,
    pdfUrl: invoice.invoice_pdf,
  }))

  res.json({ invoices })
}