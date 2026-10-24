import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import billingRoutes from './routes/billingRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({ origin: env.CLIENT_URL, exposedHeaders: ['Idempotent-Replayed'] }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/billing', billingRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

await connectDB()

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})