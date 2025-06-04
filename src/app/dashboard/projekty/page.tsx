// app/projects/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import pl from 'date-fns/locale/pl'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Info, Edit, Trash2 } from 'lucide-react'

// Rejestracja elementów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
)

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

// Typ filtru statusu
type StatusFilter = 'all' | 'active' | 'completed' | 'late'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // Formularz dodawanie/edycja
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formEarnings, setFormEarnings] = useState<number>(0)
  const [formPaymentType, setFormPaymentType] = useState<'Jednorazowe' | 'Miesięczne'>(
    'Jednorazowe'
  )
  const [formPeriodMonths, setFormPeriodMonths] = useState<number | null>(null)
  const [formIsIndefinite, setFormIsIndefinite] = useState(false)

  // Statystyki
  const [countAll, setCountAll] = useState(0)
  const [countActive, setCountActive] = useState(0)
  const [countUpcoming, setCountUpcoming] = useState(0)
  const [earningsThisMonth, setEarningsThisMonth] = useState(0)

  // Wyszukiwanie / filtry
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState('deadline')

  // Historia wypłat (modal)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Pobranie projektów
  const fetchProjects = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from<Project>('projects')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy, { ascending: true })

    if (error) {
      console.error('Błąd przy pobieraniu projektów:', error.message)
      setProjects([])
      setFilteredProjects([])
    } else if (data) {
      setProjects(data)
      setFilteredProjects(data)
      calculateStatistics(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy])

  // Przeliczanie statystyk
  const calculateStatistics = (allProjects: Project[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let cntAll = allProjects.length
    let cntActive = 0
    let cntUpcoming = 0
    let sumMonth = 0

    allProjects.forEach((p) => {
      const dl = new Date(p.deadline)
      if (dl >= now) cntActive++
      const diffDays = (dl.getTime() - now.getTime()) / (1000 * 3600 * 24)
      if (diffDays >= 0 && diffDays <= 7) cntUpcoming++

      if (p.payment_type === 'Jednorazowe') {
        if (p.created_at) {
          const cr = new Date(p.created_at)
          if (cr.getMonth() === currentMonth && cr.getFullYear() === currentYear) {
            sumMonth += p.earnings
          }
        }
      } else {
        if (p.created_at) {
          const cr = new Date(p.created_at)
          let endDate: Date | null = null
          if (p.period_months !== null) {
            endDate = new Date(cr)
            endDate.setMonth(endDate.getMonth() + p.period_months)
          }
          if (cr.getMonth() === currentMonth && cr.getFullYear() === currentYear) {
            sumMonth += p.earnings
          } else {
            if (cr < now && (endDate === null || endDate >= now)) {
              sumMonth += p.earnings
            }
          }
        }
      }
    })

    setCountAll(cntAll)
    setCountActive(cntActive)
    setCountUpcoming(cntUpcoming)
    setEarningsThisMonth(sumMonth)
  }

  // Filtrowanie + wyszukiwanie
  useEffect(() => {
    let temp = [...projects]
    const now = new Date()

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim()
      temp = temp.filter((p) => p.title.toLowerCase().includes(term))
    }
    if (statusFilter === 'active') {
      temp = temp.filter((p) => new Date(p.deadline) >= now)
    } else if (statusFilter === 'completed') {
      temp = temp.filter((p) => new Date(p.deadline) < now)
    } else if (statusFilter === 'late') {
      temp = temp.filter((p) => new Date(p.deadline) < now)
    }
    setFilteredProjects(temp)
  }, [searchTerm, statusFilter, projects])

  // Otwórz modal dodawania
  const openAddModal = () => {
    setIsEditing(false)
    setEditProjectId(null)
    setFormTitle('')
    setFormDeadline('')
    setFormEarnings(0)
    setFormPaymentType('Jednorazowe')
    setFormPeriodMonths(null)
    setFormIsIndefinite(false)
    setModalOpen(true)
  }

  // Otwórz modal edycji
  const openEditModal = (proj: Project) => {
    setIsEditing(true)
    setEditProjectId(proj.id)
    setFormTitle(proj.title)
    setFormDeadline(proj.deadline.slice(0, 10))
    setFormEarnings(proj.earnings)
    setFormPaymentType(proj.payment_type)
    setFormPeriodMonths(proj.period_months)
    setFormIsIndefinite(proj.payment_type === 'Miesięczne' && proj.period_months === null)
    setModalOpen(true)
  }

  // Zamknij modal
  const closeModal = () => {
    setModalOpen(false)
    setIsEditing(false)
    setEditProjectId(null)
    setFormTitle('')
    setFormDeadline('')
    setFormEarnings(0)
    setFormPaymentType('Jednorazowe')
    setFormPeriodMonths(null)
    setFormIsIndefinite(false)
  }

  // Zamknij/otwórz modal historii
  const openHistoryModal = () => setHistoryOpen(true)
  const closeHistoryModal = () => setHistoryOpen(false)

  // Zapis do bazy przy dodawaniu/edycji
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!formTitle.trim() || !formDeadline.trim()) return

    let periodValue: number | null = formPeriodMonths
    if (formPaymentType === 'Miesięczne' && formIsIndefinite) {
      periodValue = null
    }

    setLoading(true)
    if (isEditing && editProjectId) {
      const { error } = await supabase
        .from('projects')
        .update({
          title: formTitle,
          deadline: formDeadline,
          earnings: formEarnings,
          payment_type: formPaymentType,
          period_months: periodValue,
        })
        .eq('id', editProjectId)

      if (error) {
        console.error('Błąd przy aktualizacji projektu:', error.message)
      }
    } else {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            title: formTitle,
            deadline: formDeadline,
            earnings: formEarnings,
            payment_type: formPaymentType,
            period_months: periodValue,
            user_id: user.id,
          },
        ])

      if (error) {
        console.error('Błąd przy dodawaniu projektu:', error.message)
      }
    }

    await fetchProjects()
    closeModal()
    setLoading(false)
  }

  // Usuwanie
  const handleDelete = async (id: string) => {
    const confirmDeletion = window.confirm('Czy na pewno chcesz usunąć ten projekt?')
    if (!confirmDeletion) return
    setLoading(true)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) console.error('Błąd przy usuwaniu projektu:', error.message)
    else await fetchProjects()
    setLoading(false)
  }

  // Status (Aktywny / Zakończony)
  const getStatus = (deadline: string) => {
    const dl = new Date(deadline)
    const now = new Date()
    if (dl < now) return 'Zakończony'
    return 'Aktywny'
  }

  // Przygotuj dane do wykresu rozkładu statusów
  const prepareStatusBarData = () => {
    const counter: { [key: string]: number } = { Aktywny: 0, Zakończony: 0 }
    projects.forEach((p) => {
      const st = getStatus(p.deadline)
      counter[st] = (counter[st] || 0) + 1
    })
    return {
      labels: ['Aktywne', 'Zakończone'],
      datasets: [
        {
          label: 'Ilość projektów',
          data: [counter['Aktywny'], counter['Zakończony']],
          backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(239,68,68,0.7)'], // indigo-500 / red-500
          borderColor: ['rgba(99,102,241,1)', 'rgba(239,68,68,1)'],
          borderWidth: 1,
        },
      ],
    }
  }

  // Symulacja zarobków ostatnich 6 miesięcy (możesz podmienić na prawdziwe dane)
  const prepareEarningsLineData = () => {
    const now = new Date()
    const labels: string[] = []
    const dataValues: number[] = []

    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(format(dt, 'LLL yyyy', { locale: pl }))
      // Tu wstaw actual data, na razie losowo do demo:
      dataValues.push(Math.floor(1000 + Math.random() * 5000))
    }

    return {
      labels,
      datasets: [
        {
          label: 'Zarobki [PLN]',
          data: dataValues,
          fill: true,
          backgroundColor: 'rgba(12, 15, 194, 0.3)',
          borderColor: 'rgba(99,102,241,1)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(99,102,241,1)',
        },
      ],
    }
  }

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
    <div className="min-h-screen bg-abstract p-6 overflow-x-hidden">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ===== 1) Tytuł (GlassCard) ===== */}
        <div
          className="
            bg-gradient-to-r from-blue-400/10 to-indigo-500/10 backdrop-blur-md border border-white/20
            rounded-2xl px-6 py-4
            flex items-center justify-between
          "
        >
          <h1 className="text-3xl font-bold text-white">PROJEKTY</h1>
          <div className="flex space-x-4">
            <button
              onClick={openAddModal}
              className="
                px-4 py-2 rounded-lg
                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                text-white font-semibold shadow-lg
                hover:brightness-110 transition
              "
            >
              + Nowy Projekt
            </button>
            <button
              onClick={openHistoryModal}
              className="
                px-4 py-2 rounded-lg
                bg-gradient-to-r from-green-400 via-teal-500 to-cyan-500
                text-white font-semibold shadow-lg
                hover:brightness-110 transition
              "
            >
              Historia wypłat
            </button>
          </div>
        </div>

        {/* ===== 2) Metryki: prostokątne karty z akcentem z lewej ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 ">
          {[
            { label: 'Aktywne projekty', value: countActive },
            { label: 'Zbliżające się Deadliny', value: countUpcoming },
            {
              label: 'Zarobki w tym miesiącu',
              value: `${earningsThisMonth
                .toFixed(0)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="
                relative flex items-center
                bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md rounded-2xl
                h-20 px-4
                shadow-[0_4px_20px_rgba(0,0,0,0.3)]
                hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                transition-shadow duration-200
              "
            >
              {/* Pionowy pasek akcentowy (gradient indigo→purple→pink) */}
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-l-2xl" />

              <div className="ml-4 flex flex-col">
                <span className="text-2xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="text-sm text-gray-300">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ===== 3) Filtry i wyszukiwarka (w jednej linii na desktopie) ===== */}
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mt-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="
              bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md border border-white/20 rounded-xl
              text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          >
            <option value="all">Wszystkie statusy</option>
            <option value="active">Aktywne</option>
            <option value="completed">Zakończone</option>
            <option value="late">Opóźnione</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="
              bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md border border-white/20 rounded-xl
              text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          >
            <option value="deadline">Sortuj: Termin</option>
            <option value="earnings">Sortuj: Zarobki</option>
          </select>

          <input
            type="text"
            placeholder="Szukaj po tytule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              flex-1
              bg-gradient-to-r from-blue-400/20 to-indigo-500/10 backdrop-blur-md border border-white/20
              rounded-xl text-white placeholder-gray-300
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          />
        </div>

        {/* ===== 4) Tabela projektów (GlassCard style z efektem 3D) ===== */}
        <div
          className="
            bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md
            border border-white/20 rounded-2xl overflow-hidden 
            transform-gpu perspective-1000 
            shadow-[0_8px_32px_rgba(0,0,0,0.3)] 
            hover:-translate-y-2 hover:rotateX-2 
            transition-transform duration-300
          "
        >
          <table className="min-w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-sm font-medium">Tytuł</th>
                <th className="px-6 py-3 text-sm font-medium">Deadline</th>
                <th className="px-6 py-3 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-sm font-medium">Zarobki</th>
                <th className="px-6 py-3 text-sm font-medium">Płatność</th>
                <th className="px-6 py-3 text-sm font-medium">Okres (mies.)</th>
                <th className="px-6 py-3 text-sm font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-300">
                    Ładowanie projektów...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-300">
                    Brak projektów do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const status = getStatus(proj.deadline)
                  const isLate = new Date(proj.deadline) < new Date()
                  return (
                    <tr
                      key={proj.id}
                      className="border-b border-white/10 hover:bg-white/10"
                    >
                      <td className="px-6 py-4">{proj.title}</td>
                      <td className="px-6 py-4">
                        {format(new Date(proj.deadline), 'dd.MM.yyyy', { locale: pl })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`
                            px-2 py-1 rounded text-xs font-semibold 
                            ${
                              status === 'Aktywny'
                                ? 'bg-green-500/30 text-green-200'
                                : isLate
                                ? 'bg-red-500/30 text-red-200'
                                : 'bg-gray-500/30 text-gray-200'
                            }
                          `}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{proj.earnings.toFixed(2)} zł</td>
                      <td className="px-6 py-4">{proj.payment_type}</td>
                      <td className="px-6 py-4">
                        {proj.payment_type === 'Miesięczne'
                          ? proj.period_months === null
                            ? 'Bezterminowo'
                            : proj.period_months
                          : '-'}
                      </td>
                      <td className="px-6 py-4 space-x-4">
                        <button
                          onClick={() => openEditModal(proj)}
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} /> Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="text-red-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={16} /> Usuń
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ===== 5) Dwa wykresy obok siebie (Grid 2 kolumny) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 5.1) Rozkład statusów (bar chart) */}
          <div className="bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-white text-2xl font-semibold mb-4">
              Rozkład projektów wg statusu
            </h2>
            {loading || projects.length === 0 ? (
              <p className="text-gray-300 text-center">Brak danych do wykresu.</p>
            ) : (
              <div className="h-60">
                <Bar
                  data={prepareStatusBarData()}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      title: {
                        ...commonChartOptions.plugins!.title,
                        text: 'Aktywne vs Zakończone',
                      },
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* 5.2) Zarobki ostatnich 6 miesięcy (bar chart jako przykład) */}
          <div className="bg-gradient-to-r from-blue-400/10 to-indigo-500/10 bg-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-white text-2xl font-semibold mb-4">
              Zarobki – ostatnie 6 miesięcy
            </h2>
            <div className="h-60">
              <Bar
                data={prepareEarningsLineData()}
                options={{
                  ...commonChartOptions,
                  plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                      ...commonChartOptions.plugins!.title,
                      text: 'Symulacja zarobków',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 6) Modal Dodaj/Edycja (Glass, zaokrąglone prawe rogi) ===== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="
              bg-white/10 backdrop-blur-sm border border-white/20
              rounded-tr-3xl rounded-br-3xl w-full max-w-md p-6
            "
          >
            <h2 className="text-2xl font-semibold text-white mb-4">
              {isEditing ? 'Edytuj projekt' : 'Dodaj nowy projekt'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Tytuł projektu
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="
                    mt-1 block w-full
                    bg-transparent border border-white/20 rounded-lg
                    text-white placeholder-gray-400
                    px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  "
                  placeholder="np. Salon Meblowy Bartek"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="
                    mt-1 block w-full
                    bg-transparent border border-white/20 rounded-lg
                    text-white
                    px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  "
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Zarobki (PLN)
                </label>
                <input
                  type="number"
                  value={formEarnings}
                  onChange={(e) => setFormEarnings(Number(e.target.value))}
                  className="
                    mt-1 block w-full
                    bg-transparent border border-white/20 rounded-lg
                    text-white placeholder-gray-400
                    px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  "
                  min="0"
                  step="0.01"
                />
              </div>

              {/* ===== Nowe pole: rodzaj płatności ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Rodzaj płatności
                </label>
                <select
                  value={formPaymentType}
                  onChange={(e) => {
                    const value = e.target.value as 'Jednorazowe' | 'Miesięczne'
                    setFormPaymentType(value)
                    if (value === 'Jednorazowe') {
                      setFormPeriodMonths(null)
                      setFormIsIndefinite(false)
                    }
                  }}
                  className="
                    mt-1 block w-full
                    bg-transparent border border-white/20 rounded-lg
                    text-white placeholder-gray-400
                    px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  "
                >
                  <option value="Jednorazowe">Jednorazowe</option>
                  <option value="Miesięczne">Miesięczne</option>
                </select>
              </div>

              {/* ===== Gdy „Miesięczne”: pole okresu lub „Bezterminowo” ===== */}
              {formPaymentType === 'Miesięczne' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Okres (miesięcy) lub „Bezterminowo”
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <input
                      type="number"
                      value={formPeriodMonths ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormPeriodMonths(val === '' ? null : Number(val))
                        setFormIsIndefinite(false)
                      }}
                      disabled={formIsIndefinite}
                      min={1}
                      placeholder="np. 3"
                      className="
                        block w-24
                        bg-transparent border border-white/20 rounded-lg
                        text-white placeholder-gray-400
                        px-3 py-2
                        focus:outline-none focus:ring-2 focus:ring-indigo-500
                        disabled:opacity-50
                      "
                    />
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formIsIndefinite}
                        onChange={(e) => {
                          setFormIsIndefinite(e.target.checked)
                          if (e.target.checked) {
                            setFormPeriodMonths(null)
                          }
                        }}
                        className="h-4 w-4 text-indigo-400 bg-transparent border border-white/20 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Bezterminowo</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="
                    px-4 py-2
                    bg-red-500/70 hover:bg-red-600
                    text-white rounded-lg
                    transition
                  "
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    px-4 py-2
                    bg-green-500/70 hover:bg-green-600
                    text-white rounded-lg
                    transition disabled:opacity-50
                  "
                >
                  {loading
                    ? isEditing
                      ? 'Aktualizuję...'
                      : 'Dodaję...'
                    : isEditing
                    ? 'Zapisz zmiany'
                    : 'Dodaj projekt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 7) Modalka: Historia wypłat ===== */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="
              bg-white/10 backdrop-blur-sm border border-white/20
              rounded-tr-3xl rounded-br-3xl w-full max-w-2xl p-6
            "
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Historia wypłat</h2>
              <button
                onClick={closeHistoryModal}
                className="text-gray-300 hover:text-white"
              >
                Zamknij
              </button>
            </div>
            <div className="text-gray-200">
              <p className="italic text-gray-400 mb-2">
                (Przykładowa tabela z sumami wypłat w ostatnich miesiącach)
              </p>
              <div className="overflow-x-auto bg-white/10 border border-white/20 rounded-2xl">
                <table className="min-w-full text-left text-white">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium">Miesiąc</th>
                      <th className="px-4 py-2 text-sm font-medium">Suma wypłat [PLN]</th>
                      <th className="px-4 py-2 text-sm font-medium">Ilość projektów</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { month: 'Marzec 2025', sum: '12 000', count: 3 },
                      { month: 'Kwiecień 2025', sum: '8 500', count: 2 },
                      { month: 'Maj 2025', sum: '6 000', count: 1 },
                    ].map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/10 hover:bg-white/10"
                      >
                        <td className="px-4 py-2">{row.month}</td>
                        <td className="px-4 py-2">{row.sum} zł</td>
                        <td className="px-4 py-2">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
