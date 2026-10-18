import { z } from 'zod'

const STATUSES = ['pending', 'confirmed', 'cancelled']

const bookingFields = {
  title: z.string().trim().min(2, 'Title is too short').max(120, 'Title is too long'),
  customerName: z.string().trim().min(2, 'Customer name is too short').max(120, 'Customer name is too long'),
  customerEmail: z.union([z.string().trim().toLowerCase().email('Invalid email'), z.literal('')]).optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().trim().max(2000, 'Notes are too long').optional(),
}

export const createBookingSchema = z
  .object(bookingFields)
  .strict()
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export const updateBookingSchema = z
  .object(bookingFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Send at least one field to update',
  })

export const listBookingsSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    status: z.enum(STATUSES).optional(),
  })
  .refine((query) => !query.from || !query.to || query.to > query.from, {
    message: '"to" must be after "from"',
    path: ['to'],
  })