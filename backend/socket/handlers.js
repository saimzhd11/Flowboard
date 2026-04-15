const jwt = require('jsonwebtoken')
const User = require('../models/User')

const registerSocketHandlers = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`)

    // Join a board room to receive real-time updates
    socket.on('board:join', (boardId) => {
      socket.join(`board:${boardId}`)
      socket.to(`board:${boardId}`).emit('user:joined', {
        user: socket.user.toPublic ? socket.user.toPublic() : {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email
        }
      })
      console.log(`${socket.user.name} joined board ${boardId}`)
    })

    // Leave a board room
    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`)
      socket.to(`board:${boardId}`).emit('user:left', { userId: socket.user._id })
    })

    // Broadcast cursor/presence updates
    socket.on('cursor:move', ({ boardId, cardId }) => {
      socket.to(`board:${boardId}`).emit('cursor:update', {
        userId: socket.user._id,
        name: socket.user.name,
        cardId
      })
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`)
    })
  })
}

module.exports = { registerSocketHandlers }
