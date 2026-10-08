import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { Tenant } from '../models/Tenant.js'
import { Role, PERMISSIONS } from '../models/Role.js'
import { User } from '../models/User.js'
import { Booking } from '../models/Booking.js'

const DEFAULT_PASSWORD = 'Password123!'

const MEMBER_PERMISSIONS = ['bookings:read', 'bookings:create', 'bookings:update']

const organisations = [
  {
    name: 'City Clinic',
    slug: 'city-clinic',
    plan: 'pro',
    users: [
      { name: 'Ayesha Khan', email: 'ayesha@cityclinic.test', role: 'admin' },
      { name: 'Bilal Ahmed', email: 'bilal.ahmed@mail.test', role: 'member' },
      { name: 'Sana Raza', email: 'sana@cityclinic.test', role: 'member' },
    ],
    bookings: [
      { title: 'General checkup', customerName: 'Hamza Ali', customerEmail: 'hamza@mail.test', day: 1, hour: 10, minutes: 30, status: 'confirmed' },
      { title: 'Blood test', customerName: 'Fatima Noor', customerEmail: 'fatima@mail.test', day: 1, hour: 11, minutes: 15, status: 'pending' },
      { title: 'Follow-up visit', customerName: 'Usman Tariq', day: 2, hour: 14, minutes: 30, status: 'confirmed', notes: 'Bring previous reports' },
      { title: 'Vaccination', customerName: 'Zara Sheikh', day: 3, hour: 9, minutes: 15, status: 'cancelled' },
    ],
  },
  {
    name: 'Glow Salon',
    slug: 'glow-salon',
    plan: 'free',
    users: [
      { name: 'Mehwish Iqbal', email: 'mehwish@glowsalon.test', role: 'admin' },
      { name: 'Rabia Saleem', email: 'rabia@glowsalon.test', role: 'member' },
    ],
    bookings: [
      { title: 'Haircut', customerName: 'Hina Javed', customerEmail: 'hina@mail.test', day: 1, hour: 12, minutes: 45, status: 'confirmed' },
      { title: 'Bridal makeup trial', customerName: 'Maham Aslam', day: 2, hour: 16, minutes: 90, status: 'pending', notes: 'Prefers soft glam look' },
      { title: 'Facial', customerName: 'Fatima Noor', customerEmail: 'fatima@mail.test', day: 4, hour: 11, minutes: 60, status: 'confirmed' },
    ],
  },
  {
    name: 'FitZone Gym',
    slug: 'fitzone-gym',
    plan: 'free',
    users: [
      { name: 'Danish Mirza', email: 'danish@fitzone.test', role: 'admin' },
      { name: 'Bilal Ahmed', email: 'bilal.ahmed@mail.test', role: 'member' },
    ],
    bookings: [
      { title: 'Personal training session', customerName: 'Ali Raza', day: 1, hour: 7, minutes: 60, status: 'confirmed' },
      { title: 'Fitness assessment', customerName: 'Saad Hussain', customerEmail: 'saad@mail.test', day: 2, hour: 18, minutes: 45, status: 'pending' },
      { title: 'Yoga class', customerName: 'Nida Farooq', day: 3, hour: 8, minutes: 60, status: 'confirmed' },
    ],
  },
]

function timeFromToday(day, hour) {
  const date = new Date()
  date.setDate(date.getDate() + day)
  date.setHours(hour, 0, 0, 0)
  return date
}

async function seed() {
  await connectDB()

  await Booking.deleteMany({})
  await User.deleteMany({})
  await Role.deleteMany({})
  await Tenant.deleteMany({})
  console.log('Old data cleared\n')

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  for (const org of organisations) {
    const tenant = await Tenant.create({ name: org.name, slug: org.slug, plan: org.plan })

    const adminRole = await Role.create({ tenantId: tenant._id, name: 'admin', permissions: PERMISSIONS })
    const memberRole = await Role.create({ tenantId: tenant._id, name: 'member', permissions: MEMBER_PERMISSIONS })
    const roles = { admin: adminRole, member: memberRole }

    const users = await User.insertMany(
      org.users.map((user) => ({
        tenantId: tenant._id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: roles[user.role]._id,
      }))
    )

    await Booking.insertMany(
      org.bookings.map((booking, index) => {
        const startTime = timeFromToday(booking.day, booking.hour)
        const endTime = new Date(startTime.getTime() + booking.minutes * 60 * 1000)

        return {
          tenantId: tenant._id,
          title: booking.title,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          startTime,
          endTime,
          status: booking.status,
          notes: booking.notes || '',
          createdBy: users[index % users.length]._id,
        }
      })
    )

    console.log(`${org.name} (${org.slug}): ${users.length} users, ${org.bookings.length} bookings`)
  }

  console.log(`\nAll users have the password: ${DEFAULT_PASSWORD}`)
  console.log('Shared staff: bilal.ahmed@mail.test works at city-clinic and fitzone-gym')
  console.log('Shared customer: fatima@mail.test has bookings at city-clinic and glow-salon')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})