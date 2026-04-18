export type Role = 'owner' | 'admin' | 'member'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type CardStatus = 'todo' | 'in-progress' | 'done'

export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

export interface AuthUser extends User {
  token: string
}

export interface Member {
  user: User
  role: Role
}

export interface Comment {
  _id: string
  author: User
  text: string
  createdAt: string
}

export interface Card {
  _id: string
  title: string
  description: string
  board: string
  column: string
  priority: Priority
  assignees: User[]
  dueDate?: string | null
  labels: string[]
  comments: Comment[]
  coverColor?: string
  createdAt: string
  updatedAt: string
}

export interface Column {
  _id: string
  title: string
  board: string
  cardOrder: Card[]
}

export interface Board {
  _id: string
  title: string
  description: string
  color: string
  members: Member[]
  columnOrder: Column[]
  createdAt: string
  updatedAt: string
}

export interface BoardSummary {
  _id: string
  title: string
  description: string
  color: string
  members: Member[]
  updatedAt: string
}

// Drag and drop
export type DragType = 'COLUMN' | 'CARD'

export interface DragItem {
  type: DragType
  id: string
  columnId?: string
}


// board
export type CreateBoardForm = {
  title: string
  description: string
  color: string
}