// app/dashboard/trendy/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { format } from 'date-fns'
import pl from 'date-fns/locale/pl'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'
import { GlassCard } from '@/components/GlassCard'

// Rejestracja Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
)

type Platform = 'twitter' | 'youtube' | 'tiktok' | 'instagram'
type ViewMode = 'daily' | 'weekly' | 'monthly'

interface TrendRecordDailyDB {
  platforma: Platform
  date: string
  trendy: { topic: string; description: string; details: string }[]
}

interface TrendRecordWeeklyDB {
  platforma: Platform
  week_start: string
  weekly_topics: { topic: string; description: string; details: string }[]
}

interface TrendRecordMonthlyDB {
  platforma: Platform
  year: number
  month: number
  monthly_topics: { topic: string; description: string; details: string }[]
}

interface TrendDisplayRecord {
  platforma: Platform
  period_label: string
  trends: { topic: string; description: string; details: string }[]
}

export default function TrendsPage() {
  const [platform, setPlatform] = useState<Platform>('twitter')
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [records, setRecords] = useState<TrendDisplayRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: string
    description: string
    details: string
  } | null>(null)
  const [expandedLast3, setExpandedLast3] = useState(false)

  // Helper: oblicza numer tygodnia (ISO)
  const getWeekNumber = (d: Date) => {
    const target = new Date(d.valueOf())
    const dayNr = (d.getUTCDay() + 6) % 7
    target.setUTCDate(target.getUTCDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setUTCMonth(0, 1)
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7)
    }
    return 1 + Math.round((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000))
  }

  // Fetch danych z Supabase w zależności od viewMode
  const fetchTrends = async () => {
    setLoading(true)
    if (viewMode === 'daily') {
      const { data, error } = await supabase
        .from<TrendRecordDailyDB>('trends_daily')
        .select('*')
        .eq('platforma', platform)
        .order('date', { ascending: false })
        .limit(30)
      if (!error && data) {
        const mapped = data.map((row) => ({
          platforma: row.platforma,
          period_label: format(new Date(row.date), 'dd.MM.yyyy', { locale: pl }),
          trends: row.trendy,
        }))
        setRecords(mapped)
      } else {
        console.error(error?.message)
        setRecords([])
      }
    } else if (viewMode === 'weekly') {
      const { data, error } = await supabase
        .from<TrendRecordWeeklyDB>('trends_weekly')
        .select('*')
        .eq('platforma', platform)
        .order('week_start', { ascending: false })
        .limit(12)
      if (!error && data) {
        const mapped = data.map((row) => {
          const dt = new Date(row.week_start)
          const weekNumber = getWeekNumber(dt)
          return {
            platforma: row.platforma,
            period_label: `Tydzień ${weekNumber} (${format(
              dt,
              'yyyy',
              { locale: pl }
            )})`,
            trends: row.weekly_topics,
          }
        })
        setRecords(mapped)
      } else {
        console.error(error?.message)
        setRecords([])
      }
    } else {
      // viewMode === 'monthly'
      const { data, error } = await supabase
        .from<TrendRecordMonthlyDB>('trends_monthly')
        .select('*')
        .eq('platforma', platform)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12)
      if (!error && data) {
        const mapped = data.map((row) => {
          const dt = new Date(row.year, row.month - 1, 1)
          return {
            platforma: row.platforma,
            period_label: format(dt, 'LLLL yyyy', { locale: pl }),
            trends: row.monthly_topics,
          }
        })
        setRecords(mapped)
      } else {
        console.error(error?.message)
        setRecords([])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTrends()
  }, [platform, viewMode])

  // Przygotowuje dane do histogramu (Bar chart)
  const prepareBarData = () => {
    const counter: Record<string, number> = {}
    records.forEach((rec) =>
      rec.trends.forEach((t) => {
        counter[t.topic] = (counter[t.topic] || 0) + 1
      })
    )
    const sorted = Object.entries(counter)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    const labels = sorted.map(([topic]) => topic)
    const dataValues = sorted.map(([, count]) => count)
    return {
      labels,
      datasets: [
        {
          label:
            viewMode === 'daily'
              ? 'Dziennie'
              : viewMode === 'weekly'
              ? 'Tygodniowo'
              : 'Miesięcznie',
          data: dataValues,
          backgroundColor: [
            'rgba(99,102,241,0.7)', // indigo-500
            'rgba(79,70,229,0.7)',  // indigo-600
            'rgba(129,140,248,0.7)',// indigo-300
            'rgba(56,189,248,0.7)', // sky-400
            'rgba(16,185,129,0.7)', // teal-500
          ],
          borderColor: [
            'rgba(99,102,241,1)',
            'rgba(79,70,229,1)',
            'rgba(129,140,248,1)',
            'rgba(56,189,248,1)',
            'rgba(16,185,129,1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  // Przygotowuje dane do wykresu okrągłego (Doughnut chart)
  const prepareDoughnutData = () => {
    const counter: Record<string, number> = {}
    records.forEach((rec) =>
      rec.trends.forEach((t) => {
        counter[t.topic] = (counter[t.topic] || 0) + 1
      })
    )
    const sorted = Object.entries(counter)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    const labels = sorted.map(([topic]) => topic)
    const dataValues = sorted.map(([, count]) => count)
    return {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: [
            'rgba(79,70,229,0.7)',  // indigo-600
            'rgba(99,102,241,0.7)', // indigo-500
            'rgba(129,140,248,0.7)',// indigo-300
            'rgba(56,189,248,0.7)', // sky-400
            'rgba(16,185,129,0.7)', // teal-500
          ],
          borderColor: [
            'rgba(79,70,229,1)',
            'rgba(99,102,241,1)',
            'rgba(129,140,248,1)',
            'rgba(56,189,248,1)',
            'rgba(16,185,129,1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  // Wspólne opcje wykresów
  const commonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#fff' },
      },
      title: {
        display: true,
        color: '#fff',
        font: { size: 18 },
      },
      tooltip: {
        titleColor: '#fff',
        bodyColor: '#fff',
        backgroundColor: 'rgba(0,0,0,0.7)',
      },
    },
    scales: {
      x: {
        ticks: { color: '#fff', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#fff', font: { size: 12 } },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  }

  return (
    <div className="min-h-screen bg-abstract py-6 px-6 overflow-x-hidden">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ===== Nagłówek + Filtry ===== */}
        <GlassCard className="flex flex-col md:flex-row items-center justify-between p-6">
          <h1 className="text-3xl font-bold text-white">TRENDY</h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="
                bg-indigo-700/30 backdrop-blur-md
                border border-indigo-500
                rounded-2xl
                text-white px-4 py-2
                focus:outline-none focus:ring-2 focus:ring-indigo-400
                transition
              "
            >
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>

            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-2xl ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-900 text-white'
                  : 'bg-indigo-700/30 text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              } transition`}
            >
              Dziennie
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-2xl ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-900 text-white'
                  : 'bg-indigo-700/30 text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              } transition`}
            >
              Tygodniowo
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-2xl ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-900 text-white'
                  : 'bg-indigo-700/30 text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              } transition`}
            >
              Miesięcznie
            </button>

            <button
              onClick={fetchTrends}
              className="ml-4 px-4 py-2 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 transition"
            >
              {loading ? 'Ładowanie…' : 'Odśwież'}
            </button>
          </div>
        </GlassCard>

        {/* ===== Podtytuł ===== */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {viewMode === 'daily'
              ? 'Ostatnie 30 dni'
              : viewMode === 'weekly'
              ? 'Ostatnie 12 tygodni'
              : 'Ostatnie 12 miesięcy'}
          </h2>
        </div>

        {/* =========================
             TRYB: DZIENNIE
        ========================= */}
        {viewMode === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1) Histogram (Bar) – lewy panel */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Histogram: Top 5 tematów (dni)
              </h3>
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych.</p>
              ) : (
                <Bar
                  data={prepareBarData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Top 5 tematów (ostatnie 30 dni)',
                      },
                    },
                  }}
                />
              )}
            </GlassCard>

            {/* 2) Wykres kołowy (Doughnut) – środek */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Dystrybucja top 5 (dni)
              </h3>
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych.</p>
              ) : (
                <Doughnut
                  data={prepareDoughnutData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Procentowy udział top 5 (ostatnie 30 dni)',
                      },
                      legend: {
                        ...commonChartOptions.plugins!.legend,
                        position: 'right',
                      },
                    },
                    cutout: '50%',
                  }}
                />
              )}
            </GlassCard>

            {/* 3) Mini–Tabela: Ostatnie 3 dni – prawy panel */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Ostatnie 3 dni – podgląd
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-separate border-spacing-0 bg-indigo-900/30 border border-indigo-500 rounded-2xl">
                  <thead className="bg-indigo-800/40">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-white">Data</th>
                      <th className="px-4 py-2 text-sm font-medium text-white">Topic</th>
                      <th className="px-4 py-2 text-sm font-medium text-white">Opis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-300">
                          Ładowanie…
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-300">
                          Brak danych.
                        </td>
                      </tr>
                    ) : (
                      // Pokazujemy 3 pierwsze dni
                      records.slice(0, 3).map((rec) =>
                        rec.trends.map((entry, idx) => (
                          <tr
                            key={`${rec.period_label}-${idx}`}
                            className="border-b border-indigo-700 hover:bg-indigo-800/50 cursor-pointer"
                            onClick={() => setSelectedTopic(entry)}
                          >
                            <td className="px-4 py-2 align-top text-white">
                              {rec.period_label}
                            </td>
                            <td className="px-4 py-2 align-top text-white">{entry.topic}</td>
                            <td className="px-4 py-2 align-top text-white">
                              {entry.description}
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* =========================
             TRYB: TYGODNIOWO
        ========================= */}
        {viewMode === 'weekly' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1) Histogram (Bar) – lewy panel */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Histogram: Top 5 tematów (tygodnie)
              </h3>
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych.</p>
              ) : (
                <Bar
                  data={prepareBarData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Top 5 tematów (ostatnie 12 tygodni)',
                      },
                    },
                  }}
                />
              )}
            </GlassCard>

            {/* 2) Wykres kołowy (Doughnut) – środek */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Dystrybucja top 5 (tygodnie)
              </h3>
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych.</p>
              ) : (
                <Doughnut
                  data={prepareDoughnutData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Procentowy udział top 5 (ostatnie 12 tygodni)',
                      },
                      legend: {
                        ...commonChartOptions.plugins!.legend,
                        position: 'right',
                      },
                    },
                    cutout: '50%',
                  }}
                />
              )}
            </GlassCard>

            {/* 3) Mini–Tabela: Ostatnie 3 tygodnie – prawy panel */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Ostatnie 3 tygodnie – podgląd
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-separate border-spacing-0 bg-indigo-900/30 border border-indigo-500 rounded-2xl">
                  <thead className="bg-indigo-800/40">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-white">Tydzień</th>
                      <th className="px-4 py-2 text-sm font-medium text-white">Topic</th>
                      <th className="px-4 py-2 text-sm font-medium text-white">Opis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-300">
                          Ładowanie…
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-300">
                          Brak danych.
                        </td>
                      </tr>
                    ) : (
                      // Pokazujemy 3 pierwsze tygodnie
                      records.slice(0, 3).map((rec) =>
                        rec.trends.map((entry, idx) => (
                          <tr
                            key={`${rec.period_label}-${idx}`}
                            className="border-b border-indigo-700 hover:bg-indigo-800/50 cursor-pointer"
                            onClick={() => setSelectedTopic(entry)}
                          >
                            <td className="px-4 py-2 align-top text-white">
                              {rec.period_label}
                            </td>
                            <td className="px-4 py-2 align-top text-white">{entry.topic}</td>
                            <td className="px-4 py-2 align-top text-white">
                              {entry.description}
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* =========================
             TRYB: MIESIĘCZNIE (70% / 30%)
        ========================= */}
        {viewMode === 'monthly' && (
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
            {/* ===== Lewa kolumna (70%): Histogram (Bar) ===== */}
            <GlassCard className="p-4 border-indigo-500/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Histogram: Top 5 tematów (ostatnie 12 miesięcy)
              </h3>
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych.</p>
              ) : (
                <Bar
                  data={prepareBarData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Top 5 tematów (ostatnie 12 miesięcy)',
                      },
                    },
                  }}
                />
              )}
            </GlassCard>

            {/* ===== Prawa kolumna (30%): Doughnut + Rozwijalna lista ===== */}
            <div className="space-y-6">
              {/* 1) Wykres kołowy (Doughnut) */}
              <GlassCard className="p-4 border-indigo-500/50">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Dystrybucja top 5 (miesiące)
                </h3>
                {loading ? (
                  <p className="text-gray-300 text-center">Ładowanie…</p>
                ) : records.length === 0 ? (
                  <p className="text-gray-300 text-center">Brak danych.</p>
                ) : (
                  <Doughnut
                    data={prepareDoughnutData()}
                    options={{
                      ...commonChartOptions,
                      plugins: {
                        ...commonChartOptions.plugins,
                        title: {
                          ...commonChartOptions.plugins!.title,
                          text: 'Procentowy udział top 5',
                        },
                        legend: {
                          ...commonChartOptions.plugins!.legend,
                          position: 'bottom',
                        },
                      },
                      cutout: '60%',
                    }}
                  />
                )}
              </GlassCard>

              {/* 2) Rozwijalna lista: Ostatnie 3 miesiące */}
              <GlassCard className="p-4 border-indigo-500/50">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLast3(!expandedLast3)}
                >
                  <h3 className="text-lg font-semibold text-white">
                    Ostatnie 3 miesiące – podgląd
                  </h3>
                  <span className="text-indigo-400">
                    {expandedLast3 ? '▲' : '▼'}
                  </span>
                </div>

                <AnimatePresence>
                  {expandedLast3 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-separate border-spacing-0 bg-indigo-900/30 border border-indigo-500 rounded-2xl">
                          <thead className="bg-indigo-800/40">
                            <tr>
                              <th className="px-4 py-2 text-sm font-medium text-white">
                                Miesiąc
                              </th>
                              <th className="px-4 py-2 text-sm font-medium text-white">
                                Topic
                              </th>
                              <th className="px-4 py-2 text-sm font-medium text-white">
                                Opis
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.slice(0, 3).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-4 text-center text-gray-300"
                                >
                                  Brak danych.
                                </td>
                              </tr>
                            ) : (
                              records.slice(0, 3).map((rec) =>
                                rec.trends.map((entry, idx) => (
                                  <tr
                                    key={`${rec.period_label}-${idx}`}
                                    className="border-b border-indigo-700 hover:bg-indigo-800/50 cursor-pointer"
                                    onClick={() => setSelectedTopic(entry)}
                                  >
                                    <td className="px-4 py-2 align-top text-white">
                                      {rec.period_label}
                                    </td>
                                    <td className="px-4 py-2 align-top text-white">
                                      {entry.topic}
                                    </td>
                                    <td className="px-4 py-2 align-top text-white">
                                      {entry.description}
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      {/* ===== Modal: Szczegóły wybranego tematu ===== */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl w-full max-w-lg p-6 mx-4"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Info size={20} className="text-indigo-400" />
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedTopic.topic}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-gray-300 hover:text-white transition"
                >
                  Zamknij
                </button>
              </div>
              <div className="text-gray-200 space-y-4">
                <p className="text-gray-300 italic">
                  {selectedTopic.description}
                </p>
                <hr className="border-white/20" />
                <p className="text-white">{selectedTopic.details}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
