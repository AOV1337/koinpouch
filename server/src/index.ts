import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import paymentsRouter from './routes/payments'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/payments', paymentsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})