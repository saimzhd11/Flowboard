import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FlowBoard — Collaborative Project Management',
  description: 'Real-time collaborative kanban board with drag-and-drop and role-based permissions',
   
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e2030',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '13px',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
