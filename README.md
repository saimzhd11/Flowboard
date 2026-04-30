# FlowBoard — Real-Time Collaborative Project Management

A fullstack Trello-style project management app with real-time collaboration, drag-and-drop, and role-based permissions.

**Live demo:** [your-app.vercel.app](https://your-app.vercel.app)

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


## Getting Started

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


## Author

**Saim Bin Zahid** — Software Engineer  
[LinkedIn](https://linkedin.com/in/saim-bin-zahid) · [GitHub](https://github.com/saimzhd11)
