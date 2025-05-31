'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  User,
  Settings,
  CheckSquare,
  TrendingUp,
  Calendar,
  Bell,
  ChevronDown,
  LogOut,
  Briefcase
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { label: 'Zadania',       href: '../../tasks',      icon: <CheckSquare size={18}/> },
  { label: 'Trendy',        href: '/dashboard/trendy',       icon: <TrendingUp size={18}/> },
  { label: 'Harmonogram',   href: '/dashboard/harmonogram',  icon: <Calendar size={18}/> },
  { label: 'Powiadomienia', href: '/dashboard/follow-up',    icon: <Bell size={18}/> },
  { label: 'Projekty',      href: '/projekty',              icon: <Briefcase size={18}/> },
]

const functionsItems = [
  { label: 'Kreator ofert', href: '/dashboard/oferty' },
  { label: 'Portfolio',    href: '/dashboard/portfolio' },
  { label: 'Kalkulator',   href: '/dashboard/kalkulator' },
  { label: 'Projekty',     href: '/dashboard/projekty' },
]

export default function Sidebar() {
  const path = usePathname() || ''
  const router = useRouter()
  const [showFunctions, setShowFunctions] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside
      className="
        flex flex-col 
        w-64 
        p-4 
        bg-white/10 backdrop-blur-[10px]; border border-white/20
      "
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <Home size={28} className="text-white"/>
        <span className="ml-2 text-white text-2xl font-bold">FreelanceKit</span>
      </div>

      {/* Ikonki */}
      <div className="flex justify-around mb-8">
        <Link
          href="/dashboard"
          className="p-2 bg-white/20 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 transition"
        >
          <Home size={20} className="text-white"/>
        </Link>
        <Link
          href="/dashboard/profile"
          className="p-2 bg-white/20 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 transition"
        >
          <User size={20} className="text-white"/>
        </Link>
        <Link
          href="/dashboard/settings"
          className="p-2 bg-white/20 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 transition"
        >
          <Settings size={20} className="text-white"/>
        </Link>
      </div>

      {/* Nawigacja główna */}
      <nav className="flex flex-col gap-3">
        {navItems.map(item => {
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 w-full py-2 px-4 rounded-lg text-white
                ${active
                  ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                  : 'border border-blue-400/50 hover:bg-white/10'}
                transition
              `}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}

        {/* Przycisk „Funkcje” */}
        <button
          onClick={() => setShowFunctions(!showFunctions)}
          className={`
            flex items-center justify-between w-full py-2 px-4 rounded-lg text-white
            bg-gradient-to-r from-blue-400 to-purple-500
            hover:opacity-90 transition
          `}
        >
          <span>Funkcje</span>
          <ChevronDown
            size={18}
            className={`transition-transform ${showFunctions ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {/* Podmenu Funkcje (wysuwane) */}
        {showFunctions && (
          <div className="flex flex-col ml-8 mt-2 space-y-2">
            {functionsItems.map(f => {
              const active = path === f.href
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`
                    py-1 px-2 rounded-lg text-white text-sm
                    ${active
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                      : 'hover:bg-white/10'}
                    transition
                  `}
                >
                  {f.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Wyloguj (przesunięty na dół) */}
      <button
        onClick={handleLogout}
        className="
          mt-auto flex items-center gap-3 w-full py-2 px-4
          bg-white/20 text-white rounded-lg
          hover:bg-red-500 hover:text-white transition
        "
      >
        <LogOut size={18}/>
        <span>Wyloguj</span>
      </button>
    </aside>
  )
}
