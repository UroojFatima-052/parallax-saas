import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
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
router.post('/', requirePermission('bookings:create'), createBooking)
router.get('/:id', requirePermission('bookings:read'), getBooking)
router.patch('/:id', requirePermission('bookings:update'), updateBooking)
router.delete('/:id', requirePermission('bookings:delete'), deleteBooking)

export default router