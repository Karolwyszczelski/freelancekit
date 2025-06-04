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
  Briefcase,
  ArrowLeftCircle,
  ArrowRightCircle
} from 'lucide-react'
import { useState, cloneElement } from 'react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { label: 'Zadania',       href: '/dashboard/tasks',                   icon: <CheckSquare /> },
  { label: 'Trendy',        href: '/dashboard/trendy',        icon: <TrendingUp /> },
  { label: 'Harmonogram',   href: '/dashboard/harmonogram',   icon: <Calendar /> },
  { label: 'Powiadomienia', href: '/dashboard/follow-up',     icon: <Bell /> },
  { label: 'Projekty',      href: '/dashboard/projekty',                icon: <Briefcase /> }
]

const functionsItems = [
  { label: 'Kreator ofert', href: '/dashboard/oferty' },
  { label: 'Portfolio',    href: '/dashboard/portfolio' },
  { label: 'Kalkulator',   href: '/dashboard/kalkulator' },
]

export default function Sidebar() {
  const path = usePathname() || ''
  const router = useRouter()
  const [showFunctions, setShowFunctions] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const toggleCollapse = () => {
    // jeśli aktualnie zwinięty, to przy rozwinięciu ukryj submenu funkcji
    if (collapsed) {
      setCollapsed(false)
      setShowFunctions(false)
    } else {
      setCollapsed(true)
      setShowFunctions(false)
    }
  }

  const toggleFunctions = () => {
    if (collapsed) {
      // jeśli jest zwinięty, to najpierw rozwiń pasek, a dopiero potem pokaż funkcje
      setCollapsed(false)
      setShowFunctions(true)
    } else {
      setShowFunctions(prev => !prev)
    }
  }

  return (
    <aside
      className={`
        ml-8 mr-4 mt-10 mb-20
        relative flex flex-col 
        ${collapsed ? 'w-24' : 'w-64'}
        max-h-[100vh] overflow-y-auto         /* niższa max-wysokość */ 

        /* tło jak w widgetcie */
        bg-gradient-to-br from-[#1E202A]/10 to-[#232A3A]/ 
        backdrop-blur-xl 
        border border-white/10
        rounded-2xl                         /* bardziej zaokrąglone rogi */

        pt-6 pb-6 pl-6 pr-6                 /* paddingi od góry, dołu i lewej/prawej */
        transition-all duration-300
      `}
    >
      {/* niebieski „połysk” w lewym górnym rogu */}
      <div
        className="
          absolute inset-0 
          bg-[radial-gradient(circle_at_top_left,_rgba(0,140,255,0.2),_transparent)]
          pointer-events-none
        "
      />

      {/* przycisk rozwijania/zwijania (nad logo, z prawej strony) */}
      <button
        onClick={toggleCollapse}
        className="
          z-20 absolute top-1 right-2 
          text-white p-1 
          hover:bg-white/10 rounded-full 
          transition
        "
      >
        {collapsed ? (
          <ArrowRightCircle size={24} className="text-white" />
        ) : (
          <ArrowLeftCircle size={24} className="text-white" />
        )}
      </button>

      {/* logo */}
      <div
        className={`
          z-10 flex items-center 
          ${collapsed ? 'justify-center' : 'justify-start'}
          mb-5 mt-4
        `}
      >
        <Home size={28} className="text-white" />
        {!collapsed && (
          <span className="ml-3 text-white text-2xl font-bold">FreelanceKit</span>
        )}
      </div>

      {/* ikonki (Dashboard, Profil, Ustawienia) */}
      <div className={`
        z-10 flex 
        ${collapsed ? 'flex-col items-center space-y-4' : 'justify-around'} 
        mb-5
      `}>
        <Link
          href="/dashboard"
          className="p-2 bg-white rounded-full hover:bg-gradient-to-r hover:purle-400 hover:to-purple-900 transition"
        >
          <Home size={20} className="text-black" />
        </Link>
        {!collapsed && (
          <>
            <Link
              href="/dashboard/profile"
              className="p-2 bg-white rounded-full hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-900 transition"
            >
              <User size={20} className="text-black" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2 bg-white rounded-full hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-900 transition"
            >
              <Settings size={20} className="text-black" />
            </Link>
          </>
        )}
      </div>

      {/* nawigacja główna */}
      <nav className="z-10 flex flex-col gap-3 flex-1">
        {navItems.map(item => {
          const active = path === item.href
          const iconSize = collapsed ? 25 : 20
          // jeśli jest zwinięty, to ikony są większe 
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 
                w-full py-2 px-4 rounded-lg 
                text-white
                text-sm
                ${active
                  ? 'bg-purple-400'
                  : 'hover:bg-white/10'}
                transition
                ${collapsed ? 'justify-center px-2' : ''}
              `}
            >
              {cloneElement(item.icon, { size: iconSize, className: 'text-white' })}
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          )
        })}

        {/* przycisk „Funkcje” */}
        <button
          onClick={toggleFunctions}
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
            w-full py-2 px-4 rounded-lg text-white
            bg-gradient-to-r from-blue-400 to-purple-500
            hover:opacity-90 transition text-sm
            ${collapsed ? 'px-2' : ''}
          `}
        >
          {cloneElement(
            <ChevronDown />,
            { size: 18, className: `text-white transition-transform ${showFunctions ? 'rotate-180' : 'rotate-0'}` }
          )}
          {!collapsed && <span>Funkcje</span>}
        </button>

        {/* podmenu Funkcje (wysuwane) */}
        {showFunctions && (
          <div className={`z-10 flex flex-col ${collapsed ? 'items-center' : 'ml-8'} mt-2 space-y-2`}>
            {functionsItems.map(f => {
              const active = path === f.href
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`
                    flex items-center gap-2
                    py-1 px-2 rounded-lg text-white text-sm
                    ${active
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                      : 'hover:bg-white/10'}
                    transition
                    ${collapsed ? 'justify-center px-1' : ''}
                  `}
                >
                  {!collapsed && <span>{f.label}</span>}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Wyloguj (na dole) */}
      <button
        onClick={handleLogout}
        className={`
          z-10 mt-auto flex items-center gap-3  
          ${collapsed ? 'justify-center' : 'justify-start'}
          w-full py-2 px-4
          bg-white/20 text-white rounded-lg
          hover:bg-red-500 hover:text-white transition

          ${collapsed ? 'px-2' : ''}
        `}
      >
        <LogOut size={18} className="text-white" />
        {!collapsed && <span>Wyloguj</span>}
      </button>
    </aside>
  )
}
