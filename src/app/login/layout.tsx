// app/login/layout.tsx
'use client';
import { ReactNode } from 'react'

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700
      "
    >
      {children}
    </div>
  )
}
