import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { idempotency } from '../middleware/idempotency.js'
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../controllers/bookingController.js'

const router = Router()

router.use(requireAuth)

router.get('/', requirePermission('bookings:read'), listBookings)
router.post('/', requirePermission('bookings:create'), idempotency(), createBooking)
router.get('/:id', requirePermission('bookings:read'), getBooking)
router.patch('/:id', requirePermission('bookings:update'), idempotency({ required: false }), updateBooking)
router.delete('/:id', requirePermission('bookings:delete'), deleteBooking)

export default router