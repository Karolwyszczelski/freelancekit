// app/dashboard/page.tsx
'use client'

import { useEffect, useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { parseISO } from 'date-fns'

import TrendWidget from '@/components/TrendWidget'
import { GlassCard } from '@/components/GlassCard'
import TasksWidget from '@/components/TasksWidget'
import ScheduleWidget from '@/components/ScheduleWidget'
import NotificationsWidget from '@/components/NotificationsWidget'
import { ProjectDeadlinesWidget } from '@/components/ProjectDeadlinesWidget'

import {
  Calendar,
  CheckSquare,
  Bell,
  FileText,
  FolderOpen,
  Calculator,
  User,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  deadline: string
  earnings: number
  payment_type: 'Jednorazowe' | 'Miesięczne'
  period_months: number | null
  created_at?: string
  user_id: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Wartość zapytania wyszukiwarki
  const [searchQuery, setSearchQuery] = useState('')

  // Metryki
  const [countActive, setCountActive] = useState(0)
  const [countUpcoming, setCountUpcoming] = useState(0)
  const [earningsThisMonth, setEarningsThisMonth] = useState(0)

  // Pobranie projektów + statystyk
  const fetchProjectsAndStats = async () => {
    if (!user) return
    setLoadingProjects(true)

    const { data, error } = await supabase
      .from<Project>('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline', { ascending: true })

    if (error) {
      console.error('Błąd przy pobieraniu projektów:', error.message)
      setProjects([])
      setCountActive(0)
      setCountUpcoming(0)
      setEarningsThisMonth(0)
    } else if (data) {
      setProjects(data)
      calculateStatistics(data)
    }

    setLoadingProjects(false)
  }

  useEffect(() => {
    fetchProjectsAndStats()
  }, [user])

  const calculateStatistics = (allProjects: Project[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let cntActive = 0
    let cntUpcoming = 0
    let sumMonth = 0

    allProjects.forEach((p) => {
      const dl = parseISO(p.deadline)
      const cr = p.created_at ? parseISO(p.created_at) : null

      // Aktywne: deadline ≥ teraz
      if (dl >= now) cntActive++

      // Zbliżające się: deadline za 0–7 dni
      const diffDays = (dl.getTime() - now.getTime()) / (1000 * 3600 * 24)
      if (diffDays >= 0 && diffDays <= 7) cntUpcoming++

      // Zarobki w tym miesiącu
      if (p.payment_type === 'Jednorazowe') {
        if (
          cr &&
          cr.getMonth() === currentMonth &&
          cr.getFullYear() === currentYear
        ) {
          sumMonth += p.earnings
        }
      } else {
        if (
          cr &&
          (cr.getFullYear() < currentYear ||
            (cr.getFullYear() === currentYear && cr.getMonth() <= currentMonth))
        ) {
          sumMonth += p.earnings
        }
      }
    })

    setCountActive(cntActive)
    setCountUpcoming(cntUpcoming)
    setEarningsThisMonth(sumMonth)
  }

  // Skróty do najważniejszych funkcji
  const shortcuts = [
    {
      label: 'Generator ofert',
      href: '/dashboard/oferty',
      icon: <FileText size={24} />,
      gradient: 'from-yellow-400 via-orange-400 to-red-400',
    },
    {
      label: 'Generator portfolio',
      href: '/dashboard/portfolio/new',
      icon: <FolderOpen size={24} />,
      gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    },
    {
      label: 'Kalkulator projektu',
      href: '/dashboard/kalkulator',
      icon: <Calculator size={24} />,
      gradient: 'from-green-400 via-teal-400 to-blue-400',
    },
  ]

  // Obsługa naciśnięcia Enter w polu wyszukiwania
  const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim().toLowerCase()

      // Sprawdź, czy query pasuje do etykiety któregoś skrótu
      const matchedShortcut = shortcuts.find((item) =>
        item.label.toLowerCase().includes(query)
      )

      if (matchedShortcut) {
        // Przenieś na odpowiednią stronę
        router.push(matchedShortcut.href)
        return
      }
      // W przeciwnym razie, ProjectDeadlinesWidget samo filtrowanie obsługuje po `searchQuery`
    }
  }

  return (
    <div className="min-h-screen bg-abstract py-8 px-0 pr-6 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-3">

        {/* ======= Pasek użytkownika i wyszukiwarka ======= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Lewa: ikona profilu + dane */}
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12
                         bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400
                         p-[2px] rounded-full"
              title="Profil użytkownika"
            >
              <div className="h-full w-full bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-medium text-base truncate">
                {user?.email}
              </span>
              <span className="text-gray-300 text-sm">Profesja</span>
            </div>
          </div>

          {/* Środek: wyszukiwarka */}
          <div className="flex-1 px-2">
            <input
              type="text"
              placeholder="Szukaj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              className="
                w-full h-12
                bg-white/10 backdrop-blur-md 
                border border-white/10 
                rounded-full 
                py-2 px-4 
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-cyan-400
              "
              aria-label="Pole wyszukiwania"
              title="Wpisz 'Generator ofert', 'Generator portfolio' lub 'Kalkulator projektu' i naciśnij Enter"
            />
          </div>

          {/* Prawa: ikonki ustawienia i powiadomienia */}
          <div className="flex items-center gap-3">
            <button
              className="h-12 w-12
                         bg-gradient-to-br from-gray-700/50 via-gray-800/50 to-gray-700/50
                         backdrop-blur-md rounded-full border border-white/10
                         flex items-center justify-center
                         hover:scale-105 hover:bg-gray-700/70 hover:shadow-lg
                         active:scale-95 active:shadow-sm
                         transition-all duration-200"
              aria-label="Powiadomienia"
              title="Powiadomienia"
            >
              <Bell size={24} className="text-white" />
            </button>
            <button
              className="h-12 w-12
                         bg-gradient-to-br from-gray-700/50 via-gray-800/50 to-gray-700/50
                         backdrop-blur-md rounded-full border border-white/10
                         flex items-center justify-center
                         hover:scale-105 hover:bg-gray-700/70 hover:shadow-lg
                         active:scale-95 active:shadow-sm
                         transition-all duration-200"
              aria-label="Ustawienia"
              title="Ustawienia"
            >
              <Settings size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* ======= Sekcja Skrótów „Funkcje” ======= */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {shortcuts.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="
        relative
        h-20                    /* trochę niższa wysokość, by pasować do innych kart */
        rounded-2xl
        bg-white/10 
        backdrop-blur-md 
        border border-white/20
        shadow-[0_8px_24px_rgba(0,0,0,0.3)]
        flex items-center justify-center gap-3
        hover:scale-105 hover:shadow-[0_12px_35px_rgba(0,0,0,0.5)]
        active:scale-95 active:shadow-[0_4px_12px_rgba(0,0,0,0.2)]
        transition-all duration-200
      "
      aria-label={item.label}
    >
      {/* Kolorowy akcent: cienka pionowa belka */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-l-2xl" />

      {/* Treść wewnątrz */}
      <div className="flex items-center gap-3 z-10">
        {/* Ikona w kółku */}
        <div
          className="
            h-10 w-10
            rounded-full
            bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-500
            flex items-center justify-center
            text-white
            shadow-lg
          "
          title={item.label}
        >
          {item.icon}
        </div>
        {/* Etykieta */}
        <span className="text-white font-semibold text-base drop-shadow-md">
          {item.label}
        </span>
      </div>
    </Link>
  ))}
</div>

        {/* ======= Sekcja „Deadline projektów” (pełna szerokość) ======= */}
        <ProjectDeadlinesWidget
          projects={projects}
          searchQuery={searchQuery}
        />

        {/* ======= Trzeci wiersz: Grid 3 kolumnowy ======= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Trendy na 2025 */}
          <GlassCard className="h-[22rem] p-6 flex flex-col">
            <h2 className="text-white text-2xl font-semibold mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
              <span className="block w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded" />
              Trendy na 2025
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <TrendWidget />
            </div>
          </GlassCard>

          {/* Harmonogram */}
          <GlassCard className="h-[22rem] p-6 flex flex-col">
            <h2 className="text-white text-2xl font-semibold mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
              <Calendar className="w-7 h-7 text-cyan-400" /> Harmonogram
            </h2>
            <div className="flex-1">
              <ScheduleWidget />
            </div>
          </GlassCard>

          {/* Powiadomienia i Zadania (stackowane) */}
          <div className="flex flex-col gap-3">
            
            <GlassCard className="h-[22rem] p-5 flex flex-col">
              <h2 className="text-white text-xl font-semibold mb-3 flex items-center gap-3 border-b border-white/10 pb-2">
                <CheckSquare className="w-6 h-6 text-green-400" /> Zadania
              </h2>
              <div className="flex-1 overflow-auto">
                <TasksWidget small />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
