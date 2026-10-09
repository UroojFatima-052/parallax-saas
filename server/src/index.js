import express from 'express'
import cors from 'cors'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

app.use(cors({ origin: env.CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    })
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'This already exists' })
  }

  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
})

await connectDB()

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})