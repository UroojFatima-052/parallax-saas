import { Booking } from '../models/Booking.js'

export async function listBookings(req, res) {
  const bookings = await Booking.find({ tenantId: req.tenantId }).sort({ startTime: 1 })
  res.json({ bookings })
}

export async function deleteBooking(req, res) {
  const result = await Booking.deleteOne({ _id: req.params.id, tenantId: req.tenantId })

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Booking not found' })
  }

  res.status(204).end()
}