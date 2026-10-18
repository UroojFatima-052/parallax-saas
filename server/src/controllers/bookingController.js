import { Booking } from '../models/Booking.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { createBookingSchema, updateBookingSchema, listBookingsSchema } from '../validators/bookingSchemas.js'

async function findBookingOrFail(id, tenantId) {
  const booking = await Booking.findOne({ _id: id, tenantId })
  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }
  return booking
}

export async function listBookings(req, res) {
  const query = listBookingsSchema.parse(req.query)
  const filter = { tenantId: req.tenantId }

  if (query.from || query.to) {
    filter.startTime = {}
    if (query.from) filter.startTime.$gte = query.from
    if (query.to) filter.startTime.$lt = query.to
  }
  if (query.status) filter.status = query.status

  const bookings = await Booking.find(filter).sort({ startTime: 1 })
  res.json({ bookings })
}

export async function getBooking(req, res) {
  const booking = await findBookingOrFail(req.params.id, req.tenantId)
  const creator = await User.findOne({ _id: booking.createdBy, tenantId: req.tenantId }).select('name')

  res.json({ booking: { ...booking.toObject(), createdByName: creator?.name || 'Unknown' } })
}

export async function createBooking(req, res) {
  const data = createBookingSchema.parse(req.body)

  const booking = await Booking.create({
    ...data,
    tenantId: req.tenantId,
    createdBy: req.user._id,
  })

  res.status(201).json({ booking })
}

export async function updateBooking(req, res) {
  const changes = updateBookingSchema.parse(req.body)
  const booking = await findBookingOrFail(req.params.id, req.tenantId)

  const startTime = changes.startTime ?? booking.startTime
  const endTime = changes.endTime ?? booking.endTime
  if (endTime <= startTime) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', [
      { field: 'endTime', message: 'End time must be after start time' },
    ])
  }

  Object.assign(booking, changes)
  await booking.save()

  res.json({ booking })
}

export async function deleteBooking(req, res) {
  const result = await Booking.deleteOne({ _id: req.params.id, tenantId: req.tenantId })

  if (result.deletedCount === 0) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  res.status(204).end()
}