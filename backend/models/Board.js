const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }
}, { _id: false })

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  color: { type: String, default: '#6366f1' },
  members: [memberSchema],
  columnOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }]
}, { timestamps: true })

// Helper: get role of a user on this board
boardSchema.methods.getUserRole = function (userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString())
  return member ? member.role : null
}

boardSchema.methods.isMember = function (userId) {
  return this.members.some(m => m.user.toString() === userId.toString())
}

module.exports = mongoose.model('Board', boardSchema)
