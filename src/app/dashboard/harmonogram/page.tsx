// app/dashboard/schedule/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../../lib/supabaseClient'
import AddEditScheduleModal from '../../../components/AddEditScheduleModal'
import { ScheduleItem } from '../../types'
import Link from 'next/link'
import { Plus } from 'lucide-react'

// Godziny w siatce – od 8:00 do 17:00
const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i)

// Kolory eventów – dostosuj do własnych potrzeb
const eventColors: Record<string, string> = {
  Instagram: '#74b9ff',
  Facebook: '#fdcb6e',
  LinkedIn: '#0984e3',
  TikTok: '#000000',
  YouTube: '#ff7675',
  X: '#333333',
  Wydarzenie: '#a29bfe',
  Kampania: '#00b894',
  default: '#b2bec3'
}

// Nazwy dni tygodnia (PL)
const WEEKDAYS_SHORT = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd']

// Funkcja: poniedziałek tygodnia dla danej daty
const getStartOfWeek = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1 // PL: pon = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

// Generowanie dni tygodnia (7 dni od poniedziałku)
const getWeekDays = (date: Date) => {
  const start = getStartOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Mini-kalendarz do wyboru tygodnia
function MiniCalendar({
  selected,
  onChange,
}: {
  selected: Date
  onChange: (date: Date) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const firstDay = getStartOfWeek(new Date(month))
  const allDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstDay)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div
      className="
        p-3 
        rounded-2xl 
        bg-white/80 
        shadow-lg 
        border border-white/40 
        flex flex-col items-center 
        z-20 
        absolute left-0 top-full mt-2
      "
    >
      <div className="flex gap-2 mb-2">
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="
            p-1 px-2 
            rounded-lg 
            text-gray-700 
            hover:bg-blue-100 
            transition
          "
        >
          &lt;
        </button>
        <span className="font-semibold text-gray-700">
          {month.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="
            p-1 px-2 
            rounded-lg 
            text-gray-700 
            hover:bg-blue-100 
            transition
          "
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs w-full">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="font-bold text-gray-700">
            {d}
          </div>
        ))}
        {allDays.map((d, idx) => (
          <button
            key={idx}
            onClick={() => {
              onChange(getStartOfWeek(d))
            }}
            className={`
              w-8 h-8 
              rounded-xl 
              ${
                d.getMonth() === month.getMonth()
                  ? 'bg-white/80 text-gray-900'
                  : 'text-gray-300'
              }
              ${
                getStartOfWeek(selected).toDateString() ===
                getStartOfWeek(d).toDateString()
                  ? 'bg-blue-500/80 text-white font-bold'
                  : ''
              }
              ${
                d.toDateString() === now.toDateString()
                  ? 'ring-2 ring-blue-400'
                  : ''
              }
              hover:bg-blue-200 transition
            `}
            tabIndex={-1}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}



export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [type, setType] = useState('Wszystkie')
  const [channel, setChannel] = useState('Wszystkie')
  const [status, setStatus] = useState('Wszystkie')
  const [editing, setEditing] = useState<ScheduleItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [weekMonday, setWeekMonday] = useState(getStartOfWeek(new Date()))
  const [showCalendar, setShowCalendar] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week')
  const today = new Date()

  // Drag&Drop
  const [dragging, setDragging] = useState<{ event: ScheduleItem } | null>(
    null
  )

  // Tooltip
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    content: JSX.Element
  } | null>(null)
  let tooltipTimeout: any

  // Pobierz dane z Supabase
  const fetchData = async () => {
    let query = supabase.from('schedule').select('*')
    if (type !== 'Wszystkie') query = query.eq('type', type)
    if (channel !== 'Wszystkie') query = query.eq('channel', channel)
    if (status !== 'Wszystkie') query = query.eq('status', status)
    const { data } = await query
    setItems(data || [])
  }

  useEffect(() => {
    fetchData()
    const ch = supabase
      .channel('schedule-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule' },
        fetchData
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [type, channel, status])

  const weekDays = getWeekDays(weekMonday)

  // Znajdź wpis dla danego dnia/godziny
  const getItem = (date: Date, hour: number) =>
    items.filter(
      (i) =>
        new Date(i.date).toDateString() === date.toDateString() &&
        Number(i.time.split(':')[0]) === hour
    )

  // Czy dzień to dziś
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  // Liczba eventów w danym dniu
  const countEvents = (date: Date) =>
    items.filter((i) => new Date(i.date).toDateString() === date.toDateString())
      .length

  // DRAG & DROP handlers
  function handleDragStart(ev: React.DragEvent, event: ScheduleItem) {
    setDragging({ event })
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', event.id)
  }
  async function handleDrop(ev: React.DragEvent, date: Date, hour: number) {
    ev.preventDefault()
    setDragging(null)
    const id = ev.dataTransfer.getData('text/plain')
    // Update event na nową datę/godzinę
    const { error } = await supabase
      .from('schedule')
      .update({
        date: date.toISOString().slice(0, 10),
        time: hour.toString().padStart(2, '0') + ':00',
      })
      .eq('id', id)
    if (!error) fetchData()
  }
  function handleDragOver(ev: React.DragEvent) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
  }

  // Tooltip
  function showTooltip(e: React.MouseEvent, content: JSX.Element) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      x: rect.right + 12,
      y: rect.top + window.scrollY,
      content,
    })
    clearTimeout(tooltipTimeout)
  }
  function hideTooltip() {
    tooltipTimeout = setTimeout(() => setTooltip(null), 80)
  }

  // Klonowanie eventu
  const cloneEvent = async (
    ev: ScheduleItem,
    targetDate: Date,
    targetHour: number
  ) => {
    const { id, ...rest } = ev
    const newEv = {
      ...rest,
      date: targetDate.toISOString().slice(0, 10),
      time: targetHour.toString().padStart(2, '0') + ':00',
    }
    const { error } = await supabase.from('schedule').insert([newEv])
    if (!error) fetchData()
  }

  return (
    <div className="min-h-screen bg-abstract py-8 px-6 overflow-x-hidden">
      <div className="mx-auto max-w-5xl">
        {/* Nagłówek i tryby widoku */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold text-white">Harmonogram</h2>
          <div className="flex gap-2">
            <button
              className="
                flex items-center gap-2 
                px-6 py-2 
                bg-gradient-to-r from-blue-400 to-purple-500 
                hover:brightness-110 
                text-white font-semibold text-base 
                rounded-2xl shadow 
                transition
              "
              onClick={() => {
                setEditing(null)
                setShowModal(true)
              }}
            >
              <span className="text-xl font-bold">+</span> Dodaj
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="
                bg-white/20 
                rounded-xl 
                shadow 
                px-2 py-1 
                ml-2 
                text-base 
                text-white 
                border-0 
                focus:ring-2 focus:ring-blue-400 
                transition
              "
            >
              <option className="bg-white text-black" value="week">
                Tydzień
              </option>
              <option className="bg-white text-black" value="day">
                Dzień
              </option>
              <option className="bg-white text-black" value="month">
                Miesiąc
              </option>
            </select>
          </div>
        </div>

        {/* Nawigacja tygodnia */}
        {viewMode === 'week' && (
          <div className="flex items-center justify-between mb-7">
            <div className="flex gap-2 items-center relative">
              <button
                className="
                  px-3 py-1 
                  rounded-xl 
                  bg-white/20 
                  hover:bg-blue-200 
                  text-white 
                  font-bold 
                  shadow 
                  transition
                "
                onClick={() =>
                  setWeekMonday(
                    new Date(
                      weekMonday.getFullYear(),
                      weekMonday.getMonth(),
                      weekMonday.getDate() - 7
                    )
                  )
                }
              >
                ←
              </button>
              <button
                className="
                  px-3 py-1 
                  rounded-xl 
                  bg-white/20 
                  hover:bg-blue-200 
                  text-white 
                  font-bold 
                  shadow 
                  transition
                "
                onClick={() => setWeekMonday(getStartOfWeek(new Date()))}
              >
                Dzisiaj
              </button>
              <button
                className="
                  px-3 py-1 
                  rounded-xl 
                  bg-white/20 
                  hover:bg-blue-200 
                  text-white 
                  font-bold 
                  shadow 
                  transition
                "
                onClick={() =>
                  setWeekMonday(
                    new Date(
                      weekMonday.getFullYear(),
                      weekMonday.getMonth(),
                      weekMonday.getDate() + 7
                    )
                  )
                }
              >
                →
              </button>
              <button
                className="
                  ml-2 
                  px-3 py-1 
                  rounded-xl 
                  bg-white/30 
                  hover:bg-blue-200 
                  text-white 
                  font-bold 
                  shadow 
                  relative 
                  transition
                "
                onClick={() => setShowCalendar((x) => !x)}
              >
                📅
              </button>
              {showCalendar && (
                <MiniCalendar
                  selected={weekMonday}
                  onChange={(date) => {
                    setWeekMonday(date)
                    setShowCalendar(false)
                  }}
                />
              )}
            </div>
            <div className="text-white font-semibold text-base">
              {weekDays[0].toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              –{' '}
              {weekDays[6].toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        )}

        {/* Filtry */}
        <div className="flex flex-wrap gap-4 mb-7">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="
              p-3 px-5 
              rounded-xl 
              bg-white/20 
              text-white 
              shadow 
              border-0 
              focus:ring-2 focus:ring-blue-400 
              transition
            "
          >
            <option className="bg-white text-black">Wszystkie</option>
            <option className="bg-white text-black">Post</option>
            <option className="bg-white text-black">Wydarzenie</option>
            <option className="bg-white text-black">Kampania</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="
              p-3 px-5 
              rounded-xl 
              bg-white/20 
              text-white 
              shadow 
              border-0 
              focus:ring-2 focus:ring-blue-400 
              transition
            "
          >
            <option className="bg-white text-black">Wszystkie</option>
            <option className="bg-white text-black">Instagram</option>
            <option className="bg-white text-black">Facebook</option>
            <option className="bg-white text-black">LinkedIn</option>
            <option className="bg-white text-black">TikTok</option>
            <option className="bg-white text-black">YouTube</option>
            <option className="bg-white text-black">X</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              p-3 px-5 
              rounded-xl 
              bg-white/20 
              text-white 
              shadow 
              border-0 
              focus:ring-2 focus:ring-blue-400 
              transition
            "
          >
            <option className="bg-white text-black">Wszystkie</option>
            <option className="bg-white text-black">Zaplanowane</option>
            <option className="bg-white text-black">Opublikowane</option>
          </select>
        </div>

        {/* Widok TYGODNIOWY z DnD i tooltipem */}
        {viewMode === 'week' && (
          <div className="relative overflow-x-auto">
            {/* Siatka SVG w tle */}
            <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
              <svg
                width="80%"
                height="80%"
                className="w-full h-full"
                style={{ minHeight: 520 }}
              >
                {weekDays.map((_, i) => (
                  <line
                    key={i}
                    x1={`${(i + 1) * (100 / 8)}%`}
                    x2={`${(i + 1) * (100 / 8)}%`}
                    y1="0"
                    y2="100%"
                    stroke="#ffffff1a"
                    strokeWidth="1"
                  />
                ))}
                {HOURS.map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    x2="100%"
                    y1={`${(i + 1) * (100 / HOURS.length)}%`}
                    y2={`${(i + 1) * (100 / HOURS.length)}%`}
                    stroke="#ffffff1a"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-8 min-w-[1120px] z-10 relative select-none">
              {/* Dni tygodnia */}
              <div />
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`
                    text-center text-base font-semibold pb-2 relative 
                    ${
                      isToday(day)
                        ? 'text-cyan-400 underline underline-offset-4'
                        : 'text-gray-200'
                    }
                  `}
                  style={{ cursor: 'pointer' }}
                  title={`Kliknij, aby zobaczyć podsumowanie dnia`}
                  onClick={() =>
                    alert(
                      `Podgląd dnia: ${day.toLocaleDateString('pl-PL')}\nWydarzenia: ${countEvents(
                        day
                      )}`
                    )
                  }
                >
                  {day.toLocaleDateString('pl-PL', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                  {countEvents(day) > 0 && (
                    <span className="absolute -top-2 right-2 bg-cyan-400 text-white text-xs rounded-full px-1.5 py-0.5">
                      {countEvents(day)}
                    </span>
                  )}
                </div>
              ))}

              {/* Siatka godzin i eventów */}
              {HOURS.map((hour) => (
                <div className="contents" key={hour}>
                  <div className="text-right text-sm font-medium text-gray-300 pr-3 py-2">
                    {hour}:00
                  </div>
                  {weekDays.map((day) => {
                    const events = getItem(day, hour)
                    return (
                      <div
                        key={day.toISOString() + hour}
                        className={`
                          py-2 
                          flex items-center justify-center 
                          min-h-[56px] 
                          group relative 
                          ${
                            isToday(day) ? 'bg-cyan-900/20' : ''
                          }
                        `}
                        onDrop={(e) => handleDrop(e, day, hour)}
                        onDragOver={handleDragOver}
                      >
                        {events.map((item, i) => (
                          <div
                            key={item.id || i}
                            className="
                              rounded-xl 
                              px-4 py-2 
                              font-semibold 
                              text-white 
                              shadow-md 
                              text-sm 
                              cursor-pointer 
                              group-hover:scale-[1.03] 
                              transition
                              "
                            draggable
                            onDragStart={(ev) => handleDragStart(ev, item)}
                            onClick={() => {
                              setEditing(item)
                              setShowModal(true)
                            }}
                            onMouseEnter={(e) =>
                              showTooltip(
                                e,
                                <div className="
                                    bg-white/95 
                                    p-4 
                                    rounded-xl 
                                    shadow-xl 
                                    border border-gray-200 
                                    min-w-[240px] 
                                    max-w-[340px]
                                  ">
                                  <div className="font-bold text-base text-black">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mb-2">
                                    {item.date} {item.time}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm mb-1">
                                      {item.description}
                                    </div>
                                  )}
                                  {item.hashtags && item.hashtags.length > 0 && (
                                    <div className="mb-1">
                                      <span className="font-semibold text-xs">#</span>{' '}
                                      {item.hashtags.map((h: string, idx: number) => (
                                        <span
                                          key={h + idx}
                                          className="
                                            inline-block 
                                            bg-cyan-100 
                                            text-cyan-800 
                                            px-2 py-0.5 
                                            rounded-full 
                                            text-xs 
                                            mr-1
                                          "
                                        >
                                          {h}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && item.notes.length > 0 && (
                                    <div className="mb-1 text-xs text-gray-700">
                                      Notatki: {item.notes.join(', ')}
                                    </div>
                                  )}
                                  {item.attachments && item.attachments.length > 0 && (
                                    <div className="mb-1 text-xs">
                                      Załączniki:{' '}
                                      {item.attachments.map((a: string, idx: number) => (
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
                                  {item.reminder_time && (
                                    <div className="mb-1 text-xs">
                                      ⏰ Powiadomienie: {item.reminder_time.replace('T', ' ')}
                                    </div>
                                  )}
                                  {item.is_important && (
                                    <div className="mb-1 text-xs text-pink-600 font-bold">
                                      Priorytet!
                                    </div>
                                  )}
                                  {/* Szybkie akcje */}
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      className="
                                        px-2 py-1 
                                        rounded 
                                        bg-cyan-100 
                                        hover:bg-cyan-200 
                                        text-cyan-800 
                                        text-xs
                                      "
                                      onClick={() => {
                                        setEditing(item)
                                        setShowModal(true)
                                        setTooltip(null)
                                      }}
                                    >
                                      Edytuj
                                    </button>
                                    <button
                                      className="
                                        px-2 py-1 
                                        rounded 
                                        bg-green-100 
                                        hover:bg-green-200 
                                        text-green-800 
                                        text-xs
                                      "
                                      onClick={() => {
                                        cloneEvent(item, day, hour)
                                        setTooltip(null)
                                      }}
                                    >
                                      Sklonuj
                                    </button>
                                  </div>
                                </div>
                              )
                            }
                            onMouseLeave={hideTooltip}
                            style={{
                              background:
                                eventColors[item.channel] ||
                                eventColors[item.type] ||
                                eventColors.default,
                              boxShadow: '0 1.5px 8px 0 rgba(30,30,70,0.08)',
                            }}
                          >
                            {item.title}
                            {item.description && (
                              <div className="text-xs font-normal text-white/90 mt-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* TOOLTIP z PORTALEM */}
            {tooltip &&
              createPortal(
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(tooltip.x, window.innerWidth - 360),
                    top: Math.max(tooltip.y, 12),
                    zIndex: 9999,
                  }}
                  onMouseEnter={() => clearTimeout(tooltipTimeout)}
                  onMouseLeave={hideTooltip}
                >
                  {tooltip.content}
                </div>,
                typeof window !== 'undefined' ? document.body : (null as any)
              )}
          </div>
        )}

        {/* Widok dzień */}
        {viewMode === 'day' && (
          <div className="p-4 rounded-2xl bg-white/20 shadow-md mt-3">
            <h3 className="font-bold mb-2 text-lg text-white">
              {weekDays.find((d) => isToday(d))
                ? weekDays
                    .find((d) => isToday(d))
                    ?.toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })
                : 'Dzień'}
            </h3>
            <ul>
              {items.filter((i) => isToday(new Date(i.date))).length === 0 && (
                <li className="text-gray-300 italic text-center py-4">
                  Brak wydarzeń na dziś.
                </li>
              )}
              {items
                .filter((i) => isToday(new Date(i.date)))
                .map((i) => (
                  <li
                    key={i.id}
                    className="
                      mb-3 
                      bg-white/20 
                      rounded-xl 
                      px-4 py-2 
                      shadow 
                      flex flex-col sm:flex-row sm:items-center sm:justify-between
                    "
                  >
                    <div>
                      <div className="font-semibold text-base text-white">
                        {i.title}
                      </div>
                      <div className="text-xs text-gray-300">{i.time}</div>
                      {i.description && (
                        <div className="text-sm text-gray-200">
                          {i.description}
                        </div>
                      )}
                    </div>
                    <button
                      className="
                        px-3 py-1 
                        bg-gradient-to-r from-blue-400 to-purple-500 
                        text-white 
                        rounded-xl 
                        text-xs 
                        mt-2 sm:mt-0 
                        shadow 
                        hover:brightness-110 
                        transition
                      "
                      onClick={() => {
                        setEditing(i)
                        setShowModal(true)
                      }}
                    >
                      Edytuj
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Widok miesiąc */}
        {viewMode === 'month' && (
          <div className="p-4 rounded-2xl bg-white/20 shadow-md mt-3">
            <h3 className="font-bold mb-2 text-lg text-white">
              {weekMonday.toLocaleDateString('pl-PL', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 31 }, (_, i) => {
                const d = new Date(
                  weekMonday.getFullYear(),
                  weekMonday.getMonth(),
                  i + 1
                )
                const dayEvents = items.filter(
                  (ev) => new Date(ev.date).toDateString() === d.toDateString()
                )
                return (
                  <div
                    key={i}
                    className={`
                      rounded-xl 
                      p-2 
                      min-h-[64px] 
                      flex flex-col 
                      bg-white/30 
                      ${
                        isToday(d)
                          ? 'ring-2 ring-cyan-400'
                          : 'border border-white/20'
                      }
                    `}
                  >
                    <div className="text-xs font-semibold text-white mb-1">
                      {d.getDate()}
                    </div>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="
                          bg-cyan-500/70 
                          text-xs 
                          text-white 
                          rounded 
                          px-2 py-0.5 
                          mb-1 
                          cursor-pointer 
                          hover:brightness-110 
                          transition
                        "
                        onClick={() => {
                          setEditing(ev)
                          setShowModal(true)
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal dodawania/edycji */}
        {showModal && (
          <AddEditScheduleModal
            initial={editing}
            onClose={() => setShowModal(false)}
            onSaved={fetchData}
          />
        )}
      </div>
    </div>
  )
}
