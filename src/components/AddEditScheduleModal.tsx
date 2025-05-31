// components/AddEditScheduleModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ScheduleItem } from '../app/types'
import { Instagram, Facebook, Linkedin, Youtube, X } from 'lucide-react'

const TikTokIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black">
    <path d="M18.09 8.67V6.36c-.47-.04-.93-.13-1.36-.28a3.49 3.49 0 0 1-1.14-.65 3.27 3.27 0 0 1-.86-1.03A3.17 3.17 0 0 1 14.2 2h-2.18v13.19a1.58 1.58 0 1 1-1.59-1.58v-2.16a3.75 3.75 0 1 0 3.17 3.69V7.94a5.33 5.33 0 0 0 2.38 1.05c.44.07.9.12 1.36.13z"/>
  </svg>
)

const channelOptions = [
  { label: 'Instagram', value: 'Instagram', icon: <Instagram className="w-4 h-4 text-[#74b9ff]" /> },
  { label: 'Facebook', value: 'Facebook', icon: <Facebook className="w-4 h-4 text-[#fdcb6e]" /> },
  { label: 'LinkedIn', value: 'LinkedIn', icon: <Linkedin className="w-4 h-4 text-[#0984e3]" /> },
  { label: 'TikTok', value: 'TikTok', icon: TikTokIcon },
  { label: 'YouTube', value: 'YouTube', icon: <Youtube className="w-4 h-4 text-[#ff7675]" /> },
  { label: 'X', value: 'X', icon: <X className="w-4 h-4 text-black" /> }
]
const typeOptions = ['Post', 'Wydarzenie', 'Kampania']
const statusOptions = ['Zaplanowane', 'Opublikowane']
const colorOptions = [
  { name: 'Niebieski', value: '#74b9ff' },
  { name: 'Fioletowy', value: '#a29bfe' },
  { name: 'Pomarańczowy', value: '#fab1a0' },
  { name: 'Zielony', value: '#55efc4' },
  { name: 'Różowy', value: '#fd79a8' },
]

export default function AddEditScheduleModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ScheduleItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const [userId, setUserId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(typeOptions[0])
  const [channel, setChannel] = useState(channelOptions[0].value)
  const [status, setStatus] = useState(statusOptions[0])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [color, setColor] = useState(colorOptions[0].value)
  const [notes, setNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [attachmentInput, setAttachmentInput] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [budget, setBudget] = useState<number | ''>('')
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)

  // Pobranie aktualnego użytkownika
  useEffect(() => {
    ; (async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id ?? null)
    })()
  }, [])

  // Przy pierwszym renderze wypełnij formularz, jeśli mamy tryb edycji
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '')
      setDescription(initial.description || '')
      setType(initial.type || typeOptions[0])
      setChannel(initial.channel || channelOptions[0].value)
      setStatus(initial.status || statusOptions[0])
      setDate(initial.date || '')
      setTime(initial.time || '')
      setColor(initial.color || colorOptions[0].value)
      setNotes(initial.notes || [])
      setHashtags(initial.hashtags || [])
      setAttachments(initial.attachments || [])
      setReminderTime(initial.reminder_time ? initial.reminder_time.slice(0, 16) : '')
      setIsImportant(initial.is_important || false)
      setBudget(initial.budget ?? '')
      setLink(initial.link || '')
    } else {
      setTitle('')
      setDescription('')
      setType(typeOptions[0])
      setChannel(channelOptions[0].value)
      setStatus(statusOptions[0])
      setDate('')
      setTime('')
      setColor(colorOptions[0].value)
      setNotes([])
      setHashtags([])
      setAttachments([])
      setReminderTime('')
      setIsImportant(false)
      setBudget('')
      setLink('')
    }
  }, [initial])

  // Obsługa notatek
  const addNote = () => {
    if (newNote.trim()) setNotes([...notes, newNote.trim()])
    setNewNote('')
  }
  const removeNote = (idx: number) => setNotes(notes.filter((_, i) => i !== idx))

  // Obsługa hashtagów
  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()])
    }
    setHashtagInput('')
  }
  const removeHashtag = (idx: number) => setHashtags(hashtags.filter((_, i) => i !== idx))

  // Obsługa załączników
  const addAttachment = () => {
    if (attachmentInput.trim()) setAttachments([...attachments, attachmentInput.trim()])
    setAttachmentInput('')
  }
  const removeAttachment = (idx: number) => setAttachments(attachments.filter((_, i) => i !== idx))

  // Przygotowanie payloadu do Supabase
  const payload: any = {
    user_id: userId,
    title,
    description: description || null,
    type,
    channel,
    status,
    date,
    time,
    color,
    notes: notes || [],
    hashtags: hashtags || [],
    attachments: attachments || [],
    reminder_time: reminderTime || null,
    is_important: isImportant,
    budget: type === 'Kampania' && budget !== '' ? budget : null,
    link: link || null,
  }

  // Zapis do bazy: insert lub update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!userId) {
      alert('Brak użytkownika – zaloguj się!')
      setLoading(false)
      return
    }
    if (initial && initial.id) {
      // update
      const { error } = await supabase.from('schedule').update(payload).eq('id', initial.id)
      if (error) {
        alert(`Błąd przy edycji: ${error.message}`)
      } else {
        onSaved()
        onClose()
      }
    } else {
      // insert
      const { error } = await supabase.from('schedule').insert([payload])
      if (error) {
        alert(`Błąd przy dodaniu: ${error.message}`)
      } else {
        onSaved()
        onClose()
      }
    }
    setLoading(false)
  }

  // Usuwanie wpisu (tylko gdy edycja)
  const handleDelete = async () => {
    if (!initial?.id) return
    if (!confirm('Na pewno usunąć?')) return
    setLoading(true)
    const { error } = await supabase.from('schedule').delete().eq('id', initial.id)
    if (error) {
      alert(`Błąd przy usuwaniu: ${error.message}`)
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <form
        onSubmit={handleSubmit}
        className="
          bg-white/10 backdrop-blur-xl 
          border border-white/10 
          shadow-2xl 
          rounded-2xl 
          p-4 md:p-6 
          w-full max-w-[600px] mx-auto
          max-h-[95vh] overflow-y-auto 
          space-y-5
        "
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.20)',
        }}
      >
        {/* Nagłówek modal */}
        <h3 className="text-xl font-semibold text-white">
          {initial ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
        </h3>

        {/* Tytuł */}
        <input
          type="text"
          className="w-full p-2 rounded-xl bg-white/60 shadow-inner placeholder-gray-700 text-black focus:outline-blue-400"
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Kanał i rodzaj */}
        <div className="flex gap-2">
          <select
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {channelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {typeOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Status, kolor, priorytet */}
        <div className="flex gap-2">
          <select
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {colorOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 ml-2">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="accent-pink-500"
            />
            <span className="text-white font-medium">Priorytet</span>
          </label>
        </div>

        {/* Opis */}
        <textarea
          className="w-full p-2 rounded-xl bg-white/60 shadow-inner text-black placeholder-gray-700 min-h-[60px] resize-y"
          placeholder="Opis wydarzenia, brief, szczegóły"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Data, godzina, powiadomienie */}
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="flex-1 p-2 rounded-xl bg-white/60 text-black"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            placeholder="Powiadomienie"
          />
        </div>

        {/* Hashtagi */}
        <div>
          <div className="flex gap-2 items-center mb-1">
            <input
              type="text"
              className="flex-1 p-2 rounded-xl bg-white/60 text-black placeholder-gray-700"
              placeholder="#hashtag"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addHashtag}
              className="
                bg-black 
                rounded-xl 
                px-3 py-1 
                text-white 
                shadow 
                hover:bg-gray-800 
                transition
              "
            >
              Dodaj
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((h, i) => (
              <span
                key={h}
                className="
                  bg-blue-100 
                  text-blue-700 
                  px-2 py-0.5 
                  rounded-full 
                  text-xs 
                  flex items-center gap-1
                "
              >
                {h}
                <button
                  type="button"
                  onClick={() => removeHashtag(i)}
                  className="text-red-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Notatki */}
        <div>
          <div className="flex gap-2 items-center mb-1">
            <input
              type="text"
              className="flex-1 p-2 rounded-xl bg-white/60 text-black placeholder-gray-700"
              placeholder="Dodaj notatkę"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button
              type="button"
              onClick={addNote}
              className="
                bg-black 
                rounded-xl 
                px-3 py-1 
                text-white 
                shadow 
                hover:bg-gray-800 
                transition
              "
            >
              Dodaj
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1 text-white">
            {notes.map((n, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-white">{n}</span>
                <button
                  type="button"
                  onClick={() => removeNote(i)}
                  className="text-xs text-red-400 ml-2"
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Załączniki */}
        <div>
          <div className="flex gap-2 items-center mb-1">
            <input
              type="text"
              className="flex-1 p-2 rounded-xl bg-white/60 text-black placeholder-gray-700"
              placeholder="URL załącznika"
              value={attachmentInput}
              onChange={(e) => setAttachmentInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addAttachment}
              className="
                bg-black 
                rounded-xl 
                px-3 py-1 
                text-white 
                shadow 
                hover:bg-gray-800 
                transition
              "
            >
              Dodaj
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center justify-between">
                <a
                  href={a}
                  target="_blank"
                  rel="noopener"
                  className="underline text-blue-300"
                >
                  {a}
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="text-xs text-red-400 ml-2"
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Budżet i link (tylko przy kampanii) */}
        {type === 'Kampania' && (
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              className="flex-1 p-2 rounded-xl bg-white/60 text-black placeholder-gray-700"
              placeholder="Budżet (zł)"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <input
              type="text"
              className="flex-1 p-2 rounded-xl bg-white/60 text-black placeholder-gray-700"
              placeholder="Link do kampanii/posta"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        )}

        {/* Przyciski akcji */}
        <div className="flex gap-2 justify-between">
          <button
            type="button"
            onClick={onClose}
            className="
              py-2 px-4 
              bg-gray-200 
              rounded-xl 
              hover:bg-gray-300 
              text-black 
              transition
            "
            disabled={loading}
          >
            Anuluj
          </button>
          {initial?.id && (
            <button
              type="button"
              onClick={handleDelete}
              className="
                py-2 px-4 
                bg-red-500 
                text-white 
                rounded-xl 
                hover:bg-red-600 
                shadow 
                transition
              "
              disabled={loading}
            >
              Usuń
            </button>
          )}
          <button
            type="submit"
            className="
              py-2 px-4 
              bg-blue-500 
              text-white 
              rounded-xl 
              hover:bg-blue-600 
              shadow-lg 
              transition
            "
            disabled={loading}
          >
            {initial ? 'Zapisz' : 'Dodaj'}
          </button>
        </div>
      </form>
    </div>
  )
}
