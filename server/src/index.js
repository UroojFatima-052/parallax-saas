import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'

const app = express()

app.use(cors({ origin: env.CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

await connectDB()

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})