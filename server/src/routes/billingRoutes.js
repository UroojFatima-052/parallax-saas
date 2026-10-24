import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { idempotency } from '../middleware/idempotency.js'
import { listPlans, createCheckoutSession } from '../controllers/billingController.js'

const router = Router()

router.use(requireAuth)

router.get('/plans', listPlans)
router.post('/checkout', requirePermission('billing:manage'), idempotency({ required: false }), createCheckoutSession)

export default router