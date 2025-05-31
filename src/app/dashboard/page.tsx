// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import pl from 'date-fns/locale/pl'

import TrendWidget from '../../components/TrendWidget'
import { GlassCard } from '../../components/GlassCard'
import TasksWidget from '../../components/TasksWidget'
import ScheduleWidget from '../../components/ScheduleWidget'
import NotificationsWidget from '@/components/NotificationsWidget'

import { Calendar, CheckSquare, Bell, FileText, FolderOpen, Calculator } from 'lucide-react'
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
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

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
      const dl = new Date(p.deadline)
      const cr = p.created_at ? new Date(p.created_at) : null

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
        // Płatność miesięczna: liczymy, jeśli stworzone ≤ bieżący miesiąc
        if (
          cr &&
          (cr.getFullYear() < currentYear ||
            (cr.getFullYear() === currentYear &&
              cr.getMonth() <= currentMonth))
        ) {
          sumMonth += p.earnings
        }
      }
    })

    setCountActive(cntActive)
    setCountUpcoming(cntUpcoming)
    setEarningsThisMonth(sumMonth)
  }

  return (
    <div className="min-h-screen bg-abstract py-8 px-6 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* ======= Sekcja A: Nagłówek i metryki ======= */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white text-center">
            Panel Główny
          </h1>
          {/* Metryki: 3 kółka */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-4">
            {[
              {
                label: 'Aktywne projekty',
                value: loadingProjects ? '…' : countActive,
                colorFrom: 'from-cyan-400',
                colorTo: 'to-blue-500',
              },
              {
                label: 'Zbliżające się Deadliny',
                value: loadingProjects ? '…' : countUpcoming,
                colorFrom: 'from-purple-400',
                colorTo: 'to-pink-500',
              },
              {
                label: 'Zarobki',
                value: loadingProjects
                  ? '…'
                  : `${earningsThisMonth
                      .toFixed(0)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`,
                colorFrom: 'from-green-400',
                colorTo: 'to-teal-500',
              },
            ].map((stat, idx) => (
              <div key={idx} className="relative h-44 w-44 mx-auto">
                {/* Gradientowa obwódka */}
                <div
                  className={`
                    absolute inset-0
                    h-44 w-44
                    rounded-full
                    bg-gradient-to-r ${stat.colorFrom} ${stat.colorTo}
                    transform-gpu perspective-1000
                    shadow-[0_12px_35px_rgba(0,0,0,0.3)]
                    hover:-translate-y-2 hover:scale-105
                    transition-all duration-300
                  `}
                />
                {/* Wnętrze (maskujące): półprzezroczyste, by było widać tło “bg-abstract” */}
                <div
                  className="
                    absolute inset-1
                    h-[170px] w-[170px]
                    rounded-full
                    bg-abstract
                    flex flex-col items-center justify-center
                  "
                >
                  <span className="text-4xl font-extrabold text-white leading-none">
                    {stat.value}
                  </span>
                  <span className="text-sm text-gray-200 mt-1">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======= NOWY BLOK: Skróty do najważniejszych funkcji ======= */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-4 text-center">
            Skróty do najważniejszych funkcji
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* 1) Generator ofert */}
            <Link
              href="/dashboard/oferty"
              className="
                relative h-32
                rounded-3xl
                bg-white/10 backdrop-blur-md border border-white/20
                flex flex-col items-center justify-center gap-2
                hover:scale-105
                transition-transform duration-200
              "
            >
              <div className="
                h-12 w-12
                rounded-full
                bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400
                flex items-center justify-center
                text-white text-xl
                shadow-lg
              ">
                <FileText size={24} />
              </div>
              <span className="text-white font-medium">Generator ofert</span>
            </Link>

            {/* 2) Generator portfolio */}
            <Link
              href="/dashboard/portfolio-wizard"
              className="
                relative h-32
                rounded-3xl
                bg-white/10 backdrop-blur-md border border-white/20
                flex flex-col items-center justify-center gap-2
                hover:scale-105
                transition-transform duration-200
              "
            >
              <div className="
                h-12 w-12
                rounded-full
                bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500
                flex items-center justify-center
                text-white text-xl
                shadow-lg
              ">
                <FolderOpen size={24} />
              </div>
              <span className="text-white font-medium">Generator portfolio</span>
            </Link>

            {/* 3) Kalkulator projektu */}
            <Link
              href="/dashboard/kalkulator"
              className="
                relative h-32
                rounded-3xl
                bg-white/10 backdrop-blur-md border border-white/20
                flex flex-col items-center justify-center gap-2
                hover:scale-105
                transition-transform duration-200
              "
            >
              <div className="
                h-12 w-12
                rounded-full
                bg-gradient-to-r from-green-400 via-teal-400 to-blue-400
                flex items-center justify-center
                text-white text-xl
                shadow-lg
              ">
                <Calculator size={24} />
              </div>
              <span className="text-white font-medium">Kalkulator projektu</span>
            </Link>
          </div>
        </div>

        {/* ======= Sekcja B: Widgety ======= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ––––– Trendy na 2025 ––––– */}
          <GlassCard className="h-[22rem] p-6 flex flex-col col-span-1">
            <h2 className="text-white text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="block w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded"></span>
              Trendy na 2025
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <TrendWidget />
            </div>
          </GlassCard>

          {/* ––––– Harmonogram ––––– */}
          <GlassCard className="h-[22rem] p-6 flex flex-col col-span-1">
            <h2 className="text-white text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" /> Harmonogram
            </h2>
            <div className="flex-1">
              <ScheduleWidget />
            </div>
          </GlassCard>

          {/* ––––– Kolumna z Zadaniami i Powiadomieniami ––––– */}
          <div className="flex flex-col gap-8 col-span-1">
            {/* Zadania */}
            <GlassCard className="h-[10rem] p-5 flex flex-col">
              <h2 className="text-white text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-400" /> Zadania
              </h2>
              <div className="flex-1 overflow-auto">
                <TasksWidget small />
              </div>
            </GlassCard>

            {/* Powiadomienia */}
            <GlassCard className="h-[10rem] p-5 flex flex-col">
              <h2 className="text-white text-xl font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-400" /> Powiadomienia
              </h2>
              <div className="flex-1 overflow-auto">
                <NotificationsWidget userId={user?.id || ''} small />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
