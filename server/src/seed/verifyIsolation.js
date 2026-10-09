import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { Tenant } from '../models/Tenant.js'
import { User } from '../models/User.js'
import { Booking } from '../models/Booking.js'

let failures = 0

function check(description, passed) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${description}`)
  if (!passed) failures++
}

async function throwsError(queryFn) {
  try {
    await queryFn()
    return false
  } catch {
    return true
  }
}

async function verify() {
  await connectDB()
  console.log('')

  const clinic = await Tenant.findOne({ slug: 'city-clinic' })
  const salon = await Tenant.findOne({ slug: 'glow-salon' })
  const gym = await Tenant.findOne({ slug: 'fitzone-gym' })

  // 1. Scoped query only returns that tenant's data
  const clinicBookings = await Booking.find({ tenantId: clinic._id })
  check(
    'Clinic query returns only clinic bookings',
    clinicBookings.length > 0 && clinicBookings.every((b) => b.tenantId.equals(clinic._id))
  )

  // 2. Guard blocks queries without tenantId
  check('Booking.find({}) is blocked', await throwsError(() => Booking.find({})))
  check('User.find({}) is blocked', await throwsError(() => User.find({})))

  const anyBooking = await Booking.findOne({ tenantId: salon._id })
  check('Booking.findById() is blocked', await throwsError(() => Booking.findById(anyBooking._id)))
  check(
    'Booking.deleteMany({}) is blocked',
    await throwsError(() => Booking.deleteMany({}))
  )

  // 3. One tenant cannot reach another tenant's record, even with its exact ID
  const salonBookingFromClinic = await Booking.findOne({ _id: anyBooking._id, tenantId: clinic._id })
  check('Clinic cannot read a salon booking using its ID', salonBookingFromClinic === null)

  // 4. Shared customer: same email, separate per tenant
  const fatimaAtClinic = await Booking.find({ tenantId: clinic._id, customerEmail: 'fatima@mail.test' })
  const fatimaAtSalon = await Booking.find({ tenantId: salon._id, customerEmail: 'fatima@mail.test' })
  check(
    'Shared customer: clinic and salon each see only their own booking for Fatima',
    fatimaAtClinic.length === 1 && fatimaAtSalon.length === 1
  )

  // 5. Shared staff: same email, two separate accounts
  const bilalAtClinic = await User.findOne({ tenantId: clinic._id, email: 'bilal.ahmed@mail.test' })
  const bilalAtGym = await User.findOne({ tenantId: gym._id, email: 'bilal.ahmed@mail.test' })
  check(
    'Shared staff: Bilal has separate accounts at clinic and gym',
    bilalAtClinic && bilalAtGym && !bilalAtClinic._id.equals(bilalAtGym._id)
  )

  console.log(`\n${failures === 0 ? 'All isolation checks passed' : `${failures} check(s) failed`}`)
  await mongoose.disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

verify().catch((err) => {
  console.error('Verification crashed:', err)
  process.exit(1)
})