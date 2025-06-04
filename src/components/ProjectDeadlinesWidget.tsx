// components/ProjectDeadlinesWidget.tsx
'use client'

import React from 'react'
import { parseISO } from 'date-fns'
import { GlassCard } from './GlassCard'

interface Project {
  id: string
  title: string
  deadline: string // ISO string, np. "2023-11-15"
  earnings: number
  payment_type: 'Jednorazowe' | 'Miesięczne'
  created_at?: string
}

interface Props {
  projects: Project[]
}

export function ProjectDeadlinesWidget({ projects }: Props) {
  // Obliczamy metryki: liczba aktywnych, liczba nadchodzących, zarobki w tym miesiącu
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let countActive = 0
  let countUpcoming = 0
  let earningsThisMonth = 0

  projects.forEach(p => {
    const dl = parseISO(p.deadline)
    const cr = p.created_at ? parseISO(p.created_at) : null

    // Aktywne: deadline >= teraz
    if (dl >= now) {
      countActive++
    }

    // Nadchodzące: deadline za 0–7 dni
    const diffDays = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays >= 0 && diffDays <= 7) {
      countUpcoming++
    }

    // Zarobki w tym miesiącu
    if (p.payment_type === 'Jednorazowe') {
      if (
        cr &&
        cr.getMonth() === currentMonth &&
        cr.getFullYear() === currentYear
      ) {
        earningsThisMonth += p.earnings
      }
    } else {
      if (
        cr &&
        (cr.getFullYear() < currentYear ||
          (cr.getFullYear() === currentYear && cr.getMonth() <= currentMonth))
      ) {
        earningsThisMonth += p.earnings
      }
    }
  })

  // Sformatowana wartość zarobków (z separatorami tysięcy)
  const earningsLabel = `${earningsThisMonth
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`

  return (
    <div className="flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
      {/* Aktywne projekty */}
      <GlassCard className="flex-1 p-6 relative">
        {/* Akcent: pionowa linia po lewej */}
        <span className="absolute left-0 top-0 h-full w-1 bg-cyan-400 rounded-l-xl" />
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-3xl font-extrabold text-white">
            {countActive}
          </span>
          <span className="text-sm text-gray-300 mt-2">
            Aktywne projekty
          </span>
        </div>
      </GlassCard>

      {/* Zbliżające się Deadliny */}
      <GlassCard className="flex-1 p-6 relative">
        {/* Akcent: pionowa linia po lewej */}
        <span className="absolute left-0 top-0 h-full w-1 bg-purple-400 rounded-l-xl" />
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-3xl font-extrabold text-white">
            {countUpcoming}
          </span>
          <span className="text-sm text-gray-300 mt-2">
            Zbliżające się deadline'y
          </span>
        </div>
      </GlassCard>

      {/* Zarobki w tym miesiącu */}
      <GlassCard className="flex-1 p-6 relative">
        {/* Akcent: pionowa linia po lewej */}
        <span className="absolute left-0 top-0 h-full w-1 bg-green-400 rounded-l-xl" />
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-3xl font-extrabold text-white">
            {earningsLabel}
          </span>
          <span className="text-sm text-gray-300 mt-2">
            Zarobki w tym miesiącu
          </span>
        </div>
      </GlassCard>
    </div>
  )
}
