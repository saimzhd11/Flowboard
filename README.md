# FlowBoard — Real-Time Collaborative Project Management

A full-stack Trello-style project management app with real-time collaboration, drag-and-drop, and role-based permissions.

**Live demo:** [your-app.vercel.app](https://your-app.vercel.app)

![FlowBoard Screenshot](./screenshot.png)

## Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS (dark theme), dnd-kit, Socket.io-client, Axios  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, bcryptjs  
**Deployed:** Vercel (frontend) + Railway (backend) + MongoDB Atlas

## Features

- **Real-time collaboration** — all connected users see changes instantly via WebSockets
- **Drag-and-drop** — reorder columns and cards using dnd-kit, with optimistic updates
- **Role-based permissions** — Owner / Admin / Member with enforced server-side access control
- **Full board management** — create boards, invite members, change roles, remove members
- **Rich card details** — description, priority levels, due dates, assignees, labels, cover colors, comments
- **Dark theme** — full dark UI throughout
- **Auth** — JWT register/login with protected routes

## Architecture

```
flowboard/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT + role enforcement
│   │   └── board.js              # Board membership loader
│   ├── models/
│   │   ├── User.js               # User + password hashing
│   │   ├── Board.js              # Board + members with roles
│   │   ├── Column.js             # Column + card ordering
│   │   └── Card.js               # Card + comments + assignees
│   ├── routes/
│   │   ├── auth.js               # Register / login / me
│   │   ├── boards.js             # CRUD + member management + column order
│   │   ├── columns.js            # CRUD + card order
│   │   └── cards.js              # CRUD + comments
│   ├── socket/handlers.js        # Socket.io room management
│   └── server.js                 # Express + Socket.io setup
└── frontend/
    └── src/
        ├── app/
        │   ├── auth/             # Login + Register pages
        │   ├── dashboard/        # Boards list
        │   └── dashboard/board/[boardId]/  # Board view
        ├── components/
        │   ├── board/            # BoardHeader, ColumnComponent, MembersPanel
        │   ├── cards/            # CardItem, CardModal
        │   ├── layout/           # Navbar
        │   └── ui/               # Avatar, PriorityBadge
        ├── context/
        │   ├── AuthContext.tsx   # Global auth state
        │   └── BoardContext.tsx  # Board state + socket listeners
        ├── lib/
        │   ├── api.ts            # Axios instance with JWT
        │   └── socket.ts         # Socket.io client singleton
        └── types/index.ts        # All TypeScript types
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas (free tier)

### 1. Clone
```bash
git clone https://github.com/yourusername/flowboard.git
cd flowboard
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in MONGO_URI and JWT_SECRET
npm run dev
# Runs on http://localhost:4000
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local already points to localhost:4000
npm run dev
# Runs on http://localhost:3000
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/boards | All my boards |
| POST | /api/boards | Create board |
| GET | /api/boards/:id | Board detail (columns + cards) |
| PUT | /api/boards/:id | Update board |
| DELETE | /api/boards/:id | Delete board (owner) |
| POST | /api/boards/:id/members | Invite member |
| PUT | /api/boards/:id/members/:uid | Change role |
| DELETE | /api/boards/:id/members/:uid | Remove member |
| PUT | /api/boards/:id/column-order | Reorder columns |

### Columns
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/columns/:boardId | Create column |
| PUT | /api/columns/:boardId/:id | Rename column |
| DELETE | /api/columns/:boardId/:id | Delete column |
| PUT | /api/columns/:boardId/:id/card-order | Reorder cards |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/cards/:boardId/:columnId | Create card |
| GET | /api/cards/:boardId/:id | Card detail |
| PUT | /api/cards/:boardId/:id | Update card |
| DELETE | /api/cards/:boardId/:id | Delete card |
| POST | /api/cards/:boardId/:id/comments | Add comment |
| DELETE | /api/cards/:boardId/:id/comments/:cid | Delete comment |

### Socket events (real-time)
| Event | Direction | Payload |
|-------|-----------|---------|
| board:join | client → server | boardId |
| board:leave | client → server | boardId |
| board:updated | server → client | Board |
| column:created | server → client | { column, columnOrder } |
| column:deleted | server → client | { columnId, columnOrder } |
| card:created | server → client | { card, columnId, cardOrder } |
| card:updated | server → client | { card } |
| card:deleted | server → client | { cardId, columnId } |
| board:memberAdded | server → client | { board } |

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import at vercel.com
3. Add env vars:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

### Backend → Railway
1. Connect GitHub repo at railway.app
2. Set root directory to `backend`
3. Add env vars:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=...
   CLIENT_URL=https://your-app.vercel.app
   PORT=4000
   ```

## Author

**Saim Bin Zahid** — Full-Stack Engineer  
[LinkedIn](https://linkedin.com/in/saim-bin-zahid) · [GitHub](https://github.com/yourusername)
