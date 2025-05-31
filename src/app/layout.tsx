// app/layout.tsx
'use client';

import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/sidebar';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl">
      <head />
      {/* 
        Przypinamy klasę .bg-abstract z globals.css, aby cały body miał 
        abstrakcyjny neonowo-purpurowy gradient. 
      */}
      <body className="bg-abstract min-h-screen flex flex-col font-sans">
        {/* ===========================
            1) Opcjonalny header z efektem „glassmorphism”
           =========================== */}
        <header
          className="
            p-4 flex justify-between items-center
            bg-white/10 backdrop-blur-sm 
            border-b border-white/20
          "
        >
          <h1 className="text-2xl font-bold text-white">FreelanceKit</h1>
          <nav className="space-x-4">
            {/* Używamy Link bez wewnętrznego <a> */}
            <Link href="/" className="text-white hover:underline">
              Start
            </Link>
            <Link href="/login" className="text-white hover:underline">
              Logowanie
            </Link>
          </nav>
        </header>

        {/* 
          2) Najpierw opakowujemy wszystko w SessionProvider, 
             aby useSession() z next-auth działało poprawnie. 
          3) Wewnątrz SessionProvider umieszczamy AuthProvider (Twój własny kontekst), 
             a potem cały układ (Sidebar + główna zawartość).
        */}
        <SessionProvider>
          <AuthProvider>
            <div className="flex flex-1 overflow-hidden">
              {/* ===========================
                  4) Sidebar po lewej
                 =========================== */}
              <Sidebar />

              {/* ===========================
                  5) Główna zawartość (tu trafiają wszystkie children) 
                 =========================== */}
              <main className="flex-1 overflow-auto relative">
                {children}
              </main>
            </div>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
