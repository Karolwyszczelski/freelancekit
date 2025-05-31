// /components/NotificationsPanel.tsx

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Notification } from '../../../app/types'

export default function NotificationsPanel({userId}: {userId: string}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (filter === 'unread') query = query.eq('is_read', false)
      if (filter === 'read') query = query.eq('is_read', true)
      const { data } = await query
      setNotifications(data || [])
    }
    fetchData()
    const channel = supabase
      .channel('notifications-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, filter])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="max-w-1xl mx-auto bg-white/10 shadow-xl rounded-3xl p-8 mt-6 backdrop-blur-2xl border border-white/20 max-w-80vh w-full max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-white">Wszystkie powiadomienia</h2>
        <button
          onClick={markAllAsRead}
          className="bg-violet-500 text-white px-4 py-1 rounded-full font-semibold hover:bg-violet-600 transition"
        >Oznacz wszystkie jako przeczytane</button>
      </div>
      <div className="mb-4 flex gap-3">
        <button onClick={()=>setFilter('all')} className={`px-3 py-1 rounded-lg ${filter==='all'?'bg-violet-200 text-violet-900':'bg-white/80 text-gray-600'} font-semibold`}>Wszystkie</button>
        <button onClick={()=>setFilter('unread')} className={`px-3 py-1 rounded-lg ${filter==='unread'?'bg-violet-200 text-violet-900':'bg-white/80 text-gray-600'} font-semibold`}>Nieprzeczytane</button>
        <button onClick={()=>setFilter('read')} className={`px-3 py-1 rounded-lg ${filter==='read'?'bg-violet-200 text-violet-900':'bg-white/80 text-gray-600'} font-semibold`}>Przeczytane</button>
      </div>
      <div className="flex flex-col gap-4">
        {notifications.map(n => (
          <div key={n.id} className={`flex gap-4 items-center rounded-2xl p-4 ${n.is_read ? 'bg-white/60':'bg-violet-50/70'} shadow border border-white/70`}>
            <div className="flex flex-col flex-1">
              <span className="font-bold text-gray-900">{n.title}</span>
              <span className="text-gray-700">{n.message}</span>
              {n.link && <a href={n.link} className="text-xs text-blue-500 underline mt-1">Przejdź</a>}
            </div>
            <div className="text-xs text-gray-500 text-right">{new Date(n.created_at).toLocaleString('pl-PL', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</div>
            {!n.is_read && (
              <button
                className="ml-3 px-3 py-1 bg-blue-400 text-white rounded-full text-xs font-bold hover:bg-blue-600 transition"
                onClick={()=>markAsRead(n.id)}
              >Przeczytane</button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-gray-400 italic text-center py-8">Brak powiadomień</div>
        )}
      </div>
    </div>
  )
}
