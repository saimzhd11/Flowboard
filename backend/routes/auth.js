const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg })
  try {
    const { name, email, password } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' })
    const user = await User.create({ name, email, password })
    res.status(201).json({ ...user.toPublic(), token: sign(user._id) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    res.json({ ...user.toPublic(), token: sign(user._id) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/me', protect, (req, res) => res.json(req.user.toPublic()))

module.exports = router
