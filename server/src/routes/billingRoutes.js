import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { idempotency } from '../middleware/idempotency.js'
import {
  listPlans,
  getSubscription,
  createCheckoutSession,
  changePlan,
  cancelSubscription,
  resumeSubscription,
  listInvoices,
} from '../controllers/billingController.js'

const router = Router()
const manageBilling = requirePermission('billing:manage')
const safeRetry = idempotency({ required: false })

router.use(requireAuth)

router.get('/plans', listPlans)
router.get('/subscription', getSubscription)

router.post('/checkout', manageBilling, safeRetry, createCheckoutSession)
router.post('/change-plan', manageBilling, safeRetry, changePlan)
router.post('/cancel', manageBilling, safeRetry, cancelSubscription)
router.post('/resume', manageBilling, safeRetry, resumeSubscription)
router.get('/invoices', manageBilling, listInvoices)

export default router