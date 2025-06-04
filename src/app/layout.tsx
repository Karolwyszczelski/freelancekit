// app/layout.tsx
'use client'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/sidebar'
import { usePathname } from 'next/navigation'
import React from 'react'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname() || ''
  const isDashboardRoute = pathname.startsWith('/dashboard')

  return (
    <html lang="pl">
      <head />
      <body className="bg-abstract min-h-screen flex flex-col font-sans">
        <SessionProvider>
          <AuthProvider>
            <div className="flex flex-1 overflow-hidden">
              {/* 
                WARUNKOWO: Sidebar i „globalny header” (jeśli chciałbyś)
                mają się wyświetlać tylko w obrębie /dashboard*
              */}
              {isDashboardRoute && (
                <>
                  {/* ===========================
                      TU JEST SIDEBAR PO LEWEJ
                     =========================== */}
                  <Sidebar />
                  {/* (opcjonalnie: jeśli chcesz mieć jakiś ekstra header wewnątrz dashboardu, 
                     możesz tu go wstawić, lub zostawić tylko sidebar) */}
                </>
              )}

              {/* ===========================
                  GŁÓWNA ZAWARTOŚĆ (children)
                 =========================== */}
              <main className={`${isDashboardRoute ? 'flex-1 overflow-auto relative' : 'w-full'}`}>
                {children}
              </main>
            </div>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
