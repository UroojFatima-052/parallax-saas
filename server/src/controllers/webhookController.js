import { stripe } from '../config/stripe.js'
import { env } from '../config/env.js'
import { planFromPriceId } from '../config/plans.js'
import { Tenant } from '../models/Tenant.js'
import { StripeEvent } from '../models/StripeEvent.js'
import { AppError } from '../utils/AppError.js'

const FREE_STATUSES = ['canceled', 'incomplete_expired', 'unpaid']

function subscriptionIdFromInvoice(invoice) {
  return invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null
}

function subscriptionIdFromEvent(event) {
  const object = event.data.object

  switch (event.type) {
    case 'checkout.session.completed':
      return object.mode === 'subscription' ? object.subscription : null
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return object.id
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return subscriptionIdFromInvoice(object)
    default:
      return null
  }
}

async function findTenantForSubscription(subscription) {
  const tenantId = subscription.metadata?.tenantId
  if (tenantId) {
    const tenant = await Tenant.findById(tenantId)
    if (tenant) return tenant
  }
  return Tenant.findOne({ stripeCustomerId: subscription.customer })
}

export async function syncSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const tenant = await findTenantForSubscription(subscription)

  if (!tenant) {
    console.warn(`Webhook: no tenant found for subscription ${subscriptionId}`)
    return
  }

  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end ?? subscription.current_period_end
  const endsSubscription = FREE_STATUSES.includes(subscription.status)

  tenant.stripeCustomerId = subscription.customer
  tenant.subscriptionStatus = subscription.status
  tenant.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)

  if (endsSubscription) {
    tenant.plan = 'free'
    tenant.stripeSubscriptionId = undefined
    tenant.currentPeriodEnd = undefined
  } else {
    tenant.plan = planFromPriceId(item?.price?.id) ?? tenant.plan
    tenant.stripeSubscriptionId = subscription.id
    tenant.currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : undefined
  }

  await tenant.save()
  console.log(`Webhook: ${tenant.slug} is now on ${tenant.plan} (${subscription.status})`)
}

export async function handleStripeWebhook(req, res) {
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)
  } catch {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Webhook signature verification failed')
  }

  try {
    await StripeEvent.create({ eventId: event.id, type: event.type })
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ received: true, duplicate: true })
    }
    throw err
  }

  try {
    const subscriptionId = subscriptionIdFromEvent(event)
    if (subscriptionId) await syncSubscription(subscriptionId)

    await StripeEvent.updateOne({ eventId: event.id }, { status: 'processed' })
  } catch (err) {
    await StripeEvent.deleteOne({ eventId: event.id })
    throw err
  }

  res.json({ received: true })
}