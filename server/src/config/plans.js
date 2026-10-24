import { env } from './env.js'

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    description: 'For trying Tessera out',
    features: ['Up to 2 team members', '50 bookings a month', 'Week calendar and list view'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    priceId: env.STRIPE_PRICE_PRO,
    description: 'For a busy single location',
    features: ['Up to 10 team members', 'Unlimited bookings', 'Booking notes', 'Email support'],
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 49,
    priceId: env.STRIPE_PRICE_TEAM,
    description: 'For growing businesses',
    features: ['Unlimited team members', 'Unlimited bookings', 'Collaborative notes', 'Priority support'],
  },
}

export const PAID_PLAN_IDS = ['pro', 'team']

export function planFromPriceId(priceId) {
  const plan = Object.values(PLANS).find((item) => item.priceId === priceId)
  return plan ? plan.id : null
}