// /components/NotificationsSettings.tsx

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const NOTIFY_TYPES = [
  { key: 'task_done', label: 'Powiadom o ukończonym zadaniu' },
  { key: 'deadline', label: 'Przypomnij o kończącym się terminie' },
  { key: 'event_today', label: 'Pokaż ważne wydarzenia dzisiaj' },
  { key: 'trend_alert', label: 'Alerty o trendach' },
  { key: 'message', label: 'Nowa wiadomość od zespołu/klienta' }
]

// W bazie możesz mieć tabelę notification_settings (user_id, key, enabled)
export default function NotificationsSettings({userId}: {userId: string}) {
  const [settings, setSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!userId) return;
    // pobierz ustawienia z supabase!
    // Przykładowy mock:
    setSettings({
      task_done: true,
      deadline: true,
      event_today: true,
      trend_alert: false,
      message: true
    })
  }, [userId])

  const handleToggle = (key: string) => {
    setSettings(s => ({...s, [key]: !s[key]}))
    // zapis do bazy!
  }

  return (
    <div className="max-w-lg mx-auto bg-white/50 rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Ustawienia powiadomień</h2>
      <div className="flex flex-col gap-4">
        {NOTIFY_TYPES.map(n => (
          <label key={n.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!settings[n.key]}
              onChange={()=>handleToggle(n.key)}
              className="w-5 h-5 accent-violet-500"
            />
            <span className="font-medium">{n.label}</span>
          </label>
        ))}
      </div>
      <div className="text-gray-500 text-xs mt-5">Wybierz, jakie powiadomienia chcesz otrzymywać. Ustawienia są zapisywane automatycznie.</div>
    </div>
  )
}
