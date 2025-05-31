// src/components/ScheduleWidget.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ScheduleItem } from '@/types'
import { createPortal } from 'react-dom'
import AddEditScheduleModal from './AddEditScheduleModal'
import { Plus } from 'lucide-react'

/**
 * Kolory przypisane do kanałów/typów (neonowe odcienie).
 */
const eventColors: Record<string, string> = {
  Instagram: '#74b9ff',
  Facebook: '#fdcb6e',
  LinkedIn: '#0984e3',
  TikTok: '#000000',
  YouTube: '#ff7675',
  X: '#333333',
  Wydarzenie: '#a29bfe',
  Kampania: '#00b894',
  default: '#b2bec3',
}

export default function ScheduleWidget() {
  const [isClient, setIsClient] = useState(false)
  const [todayItems, setTodayItems] = useState<ScheduleItem[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: ScheduleItem } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ScheduleItem | null>(null)

  // Zapisujemy dzisiejszą datę w formacie YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10)

  // Po zamontowaniu komponentu
  useEffect(() => {
    setIsClient(true)

    const fetchData = async () => {
      const { data } = await supabase
        .from<ScheduleItem>('schedule')
        .select('*')
        .eq('date', todayStr)
        .order('time', { ascending: true })
      setTodayItems(data || [])
    }

    fetchData()

    // Subskrypcja Realtime: aktualizuj za każdym razem, gdy zmieni się tabela „schedule”
    const channel = supabase
      .channel('schedule-realtime-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, fetchData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [todayStr])

  /**
   * Generuje tablicę godzin od teraz (round down do pełnej godziny)
   * w przód o `count` godzin (domyślnie 6: aktualna + 5 kolejnych).
   */
  const HOURS = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours()
    const count = 4 // ile godzin w przód (aktualna + 5 następnych)
    const arr: number[] = []
    for (let i = 0; i < count; i++) {
      const h = currentHour + i
      // Jeżeli przekroczy północ, „wracamy” mod 24
      arr.push(h % 24)
    }
    return arr
  }, [new Date().getHours()]) // przeliczamy, gdy zmieni się godzina

  /**
   * Znajduje wydarzenie rozpoczynające się o danej godzinie.
   * `item.time` ma format 'HH:MM:SS' lub 'HH:MM', więc bierzemy część przed ':'
   */
  const getEventAtHour = (hour: number) =>
    todayItems.find((ev) => {
      const evHour = Number(ev.time.split(':')[0])
      return evHour === hour
    })

  /**
   * Po zapisaniu/edytowaniu wydarzenia chcemy przeładować dane
   */
  const handleSaved = () => {
    setShowModal(false)
    supabase
      .from<ScheduleItem>('schedule')
      .select('*')
      .eq('date', todayStr)
      .order('time', { ascending: true })
      .then(({ data }) => setTodayItems(data || []))
  }

  return (
    <div
      className="p-4 rounded-2xl backdrop-blur-md shadow-lg w-full max-w-sm relative"
      style={{
        boxShadow: '0 4px 24px 0 rgba(80,100,255,0.10), 0 0.5px 1px #fff4',
      }}
    >
      {/* Górny pasek z tytułem i przyciskiem dodawania */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Dzisiaj</h2>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:opacity-90 transition shadow"
          title="Dodaj nowe wydarzenie"
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Główna część: siatka czasu */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        {/* Kolumna z godzinami */}
        <div className="flex flex-col gap-1">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="text-xs text-white/60 text-right pr-1 h-6 flex items-center justify-end"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Kolumna z wydarzeniami */}
        <div className="flex flex-col gap-1">
          {HOURS.map((hour) => {
            const ev = getEventAtHour(hour)
            return (
              <div key={hour} className="h-6 flex items-center">
                {ev ? (
                  <div
                    className="w-full rounded-lg px-2 flex items-center gap-2 text-xs font-semibold text-white shadow transition cursor-pointer hover:scale-105 relative"
                    style={{
                      background:
                        eventColors[ev.channel] ||
                        eventColors[ev.type] ||
                        eventColors.default,
                      boxShadow: '0 1.5px 8px 0 rgba(30,30,70,0.11)',
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({
                        x: rect.right + 10,
                        y: rect.top,
                        item: ev,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => {
                      setEditing(ev)
                      setShowModal(true)
                    }}
                  >
                    <span className="truncate">{ev.title}</span>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-lg bg-white/10" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip z podglądem szczegółów */}
      {tooltip && isClient && typeof window !== 'undefined' && (
        <div
          className="fixed z-50 p-4 rounded-xl bg-white/90 shadow-xl border border-blue-200 min-w-[220px] max-w-[340px] text-black text-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="font-bold text-base mb-1">{tooltip.item.title}</div>
          <div className="text-xs text-gray-700 mb-1">
            {tooltip.item.channel} • {tooltip.item.type} • {tooltip.item.time}
          </div>
          {tooltip.item.description && (
            <div className="mb-1">{tooltip.item.description}</div>
          )}
          {tooltip.item.hashtags && tooltip.item.hashtags.length > 0 && (
            <div className="mb-1">
              <span className="font-semibold text-xs">#</span>{' '}
              {tooltip.item.hashtags.map((h: string, idx: number) => (
                <span
                  key={h + idx}
                  className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs mr-1"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
          {tooltip.item.notes && tooltip.item.notes.length > 0 && (
            <div className="mb-1 text-xs text-gray-600">
              Notatki: {tooltip.item.notes.join(', ')}
            </div>
          )}
          {tooltip.item.attachments && tooltip.item.attachments.length > 0 && (
            <div className="mb-1 text-xs">
              Załączniki:{' '}
              {tooltip.item.attachments.map((a: string, idx: number) => (
                <a
                  key={a + idx}
                  href={a}
                  className="underline ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a.slice(0, 16)}...
                </a>
              ))}
            </div>
          )}
          {tooltip.item.is_important && (
            <div className="mb-1 text-xs text-pink-600 font-bold">Priorytet!</div>
          )}
        </div>
      )}

      {/* Gdy brak wydarzeń na dziś */}
      {todayItems.length === 0 && (
        <div className="text-white/60 text-sm text-center py-4">
          Brak wydarzeń na dziś
        </div>
      )}

      {/* Modal dodawania/edycji – wrzucamy go do portalu nad całą stroną */}
      {showModal &&
        isClient &&
        typeof window !== 'undefined' &&
        document.body &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40">
            <AddEditScheduleModal
              initial={editing}
              onClose={() => setShowModal(false)}
              onSaved={handleSaved}
            />
          </div>,
          document.body
        )}
    </div>
  )
}
