// src/components/NotificationsWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Notification } from '../app/types'

function getRelativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff} sek.`
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz.`
  return `${Math.floor(diff / 86400)} dni`
}

const iconData: Record<string, { icon: React.ReactNode; bg: string }> = {
  task_done: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#A78BFA" />
        <path
          d="M7 11.5L10 14L15 9"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    bg: 'bg-violet-200',
  },
  deadline: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#FCA5A5" />
        <path
          d="M11 7v4l2.5 2.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    bg: 'bg-red-200',
  },
  message: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#60A5FA" />
        <path d="M7 11h8l-4 4v-8l4 4H7z" fill="#fff" />
      </svg>
    ),
    bg: 'bg-blue-100',
  },
  trend_alert: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#A78BFA" />
        <path
          d="M11 7v5l3 3"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    bg: 'bg-violet-200',
  },
  event_today: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#FCD34D" />
        <path d="M7 11h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: 'bg-yellow-100',
  },
  default: {
    icon: <span>🔔</span>,
    bg: 'bg-gray-100',
  },
}

export default function NotificationsWidget({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      setNotifications(data || [])
    }
    fetchData()

    // realtime
    const channel = supabase
      .channel('notifications-widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        fetchData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <div
      className="rounded-3xl p-4 shadow-xl w-full flex flex-col"
      style={{ boxShadow: '0 8px 32px 0 rgba(80,70,200,0.14)' }}
    >
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-semibold text-white">Powiadomienia</span>
        <span className="ml-2 bg-violet-400 text-white rounded-full px-2 py-0.5 text-sm font-bold shadow">
          {notifications.filter((n) => !n.is_read).length}
        </span>
      </div>

      {/* Lista powiadomień */}
      <div className="flex flex-col gap-2 overflow-auto max-h-[280px]">
        {notifications.map((n) => (
          <a
            key={n.id}
            href={n.link || '#'}
            className="flex items-center gap-3 bg-white/60 rounded-2xl py-2 px-3 shadow transition hover:bg-white/80 border border-white/60 group"
            style={{ minHeight: '50px' }}
          >
            <span
              className={`w-9 h-9 flex items-center justify-center rounded-full ${
                iconData[n.type]?.bg || iconData.default.bg
              } shadow`}
            >
              {iconData[n.type]?.icon || iconData.default.icon}
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-gray-900 text-sm truncate leading-snug">
                {n.title}
              </div>
              {n.message && (
                <div className="text-gray-700 text-xs truncate leading-snug">
                  {n.message}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap ml-2">
              {getRelativeTime(n.created_at)}
            </span>
          </a>
        ))}

        {notifications.length === 0 && (
          <div className="text-gray-500 italic text-center py-4">
            Brak powiadomień
          </div>
        )}
      </div>
    </div>
  )
}
