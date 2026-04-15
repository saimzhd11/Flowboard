const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const { registerSocketHandlers } = require('./socket/handlers')

dotenv.config()
connectDB()

const app = express()
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Attach io to app so routes can emit events
app.set('io', io)

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/boards', require('./routes/boards'))
app.use('/api/columns', require('./routes/columns'))
app.use('/api/cards', require('./routes/cards'))

app.get('/api/health', (_, res) => res.json({ status: 'OK' }))

// Socket.io
registerSocketHandlers(io)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`FlowBoard server running on port ${PORT}`))
