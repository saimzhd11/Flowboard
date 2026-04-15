const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

// Board-level role check middleware factory
const requireRole = (...roles) => async (req, res, next) => {
  const { board } = req
  if (!board) return res.status(500).json({ message: 'Board not loaded' })
  const role = board.getUserRole(req.user._id)
  if (!role || !roles.includes(role)) {
  console.log('Checking role:', role)

    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}

module.exports = { protect, requireRole }
