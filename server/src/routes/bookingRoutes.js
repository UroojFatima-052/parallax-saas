import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { listBookings, deleteBooking } from '../controllers/bookingController.js'

const router = Router()

router.use(requireAuth)

router.get('/', requirePermission('bookings:read'), listBookings)
router.delete('/:id', requirePermission('bookings:delete'), deleteBooking)

export default router