'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Task } from './TaskCard'
import { X, Trash } from 'lucide-react'

export interface AddTaskModalProps {
  initial: Task | null
  onClose: () => void
  onSaved: () => void
}

export function AddTaskModal({ initial, onClose, onSaved }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'Wysoki'|'Średni'|'Niski'>('Średni')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState('')
  const [status, setStatus] = useState<'todo'|'in_progress'|'done'>('todo')
  const [loading, setLoading] = useState(false)

  // Initial/Editing state
  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setDueDate(initial.due_date ?? '')
      setPriority(initial.priority)
      setTags(Array.isArray(initial.tags) ? initial.tags.join(',') : '')
      setDescription(initial.description || '')
      setNotes(Array.isArray(initial.notes) ? initial.notes : [])
      setStatus((initial as any).status || 'todo')
    } else {
      setTitle('')
      setDueDate('')
      setPriority('Średni')
      setTags('')
      setDescription('')
      setNotes([])
      setStatus('todo')
    }
    setNewNote('')
  }, [initial])

  // Add new note
  const handleAddNote = () => {
    if (!newNote.trim()) return
    setNotes(n => [...n, newNote.trim()])
    setNewNote('')
  }

  // Remove note
  const handleRemoveNote = (idx: number) => {
    setNotes(n => n.filter((_, i) => i !== idx))
  }

  // USUŃ zadanie
  const handleDelete = async () => {
    if (!initial) return
    if (!window.confirm('Na pewno usunąć to zadanie?')) return
    setLoading(true)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', initial.id)
    setLoading(false)
    if (!error) {
      onSaved()
      onClose()
    } else {
      alert('Błąd przy usuwaniu zadania: ' + error.message)
      console.error(error)
    }
  }

  // Submit to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tagsArr = tags
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    setLoading(true)
    if (initial) {
      // UPDATE
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          due_date: dueDate || null,
          priority,
          tags: tagsArr,
          description,
          notes,
          status,
        })
        .eq('id', initial.id)

      setLoading(false)
      if (!error) {
        onSaved()
        onClose()
      } else {
        alert('Błąd przy aktualizacji zadania: ' + error.message)
        console.error(error)
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('tasks')
        .insert({
          title,
          due_date: dueDate || null,
          priority,
          tags: tagsArr,
          description,
          notes,
          status,
        })
      setLoading(false)
      if (!error) {
        onSaved()
        onClose()
      } else {
        alert('Błąd przy dodawaniu zadania: ' + error.message)
        console.error(error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        {/* Zamknij */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-red-400"
        >
          <X className="w-5 h-5"/>
        </button>
        {/* Usuń */}
        {initial && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-4 left-4 text-white hover:text-red-400"
            title="Usuń zadanie"
            disabled={loading}
          >
            <Trash className="w-5 h-5"/>
          </button>
        )}

        <h2 className="text-xl font-semibold text-white">
          {initial ? 'Edytuj zadanie' : 'Nowe zadanie'}
        </h2>

        {/* Tytuł */}
        <input
          type="text"
          placeholder="Tytuł"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full p-3 bg-white/20 backdrop-blur-md rounded-lg text-white"
          disabled={loading}
        />

        {/* Data + Priorytet */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="flex-1 p-3 bg-white/20 backdrop-blur-md rounded-lg text-white"
            disabled={loading}
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as any)}
            className="p-3 bg-white/20 backdrop-blur-md rounded-lg text-white"
            disabled={loading}
          >
            <option>Wysoki</option>
            <option>Średni</option>
            <option>Niski</option>
          </select>
        </div>

        {/* STATUS */}
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          className="w-full p-3 bg-white/20 backdrop-blur-md rounded-lg text-white"
          disabled={loading}
        >
          <option value="todo">Do zrobienia</option>
          <option value="in_progress">W toku</option>
          <option value="done">Zrobione</option>
        </select>

        {/* Tagi */}
        <input
          type="text"
          placeholder="Tagi (oddziel przecinkami)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full p-3 bg-white/20 backdrop-blur-md rounded-lg text-white"
          disabled={loading}
        />

        {/* Opis */}
        <textarea
          placeholder="Opis zadania..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-3 bg-white/20 backdrop-blur-md rounded-lg text-white h-24 resize-none"
          disabled={loading}
        />

        {/* Notatki */}
        <div className="space-y-2">
          <label className="text-white/80">Notatki</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nowa notatka..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="flex-1 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg text-white"
              disabled={loading}
            >
              Dodaj
            </button>
          </div>
          <ul className="list-disc list-inside text-sm text-white/70">
            {notes.map((n,i) => (
              <li key={i} className="flex justify-between items-center">
                {n}
                <button
                  type="button"
                  className="ml-2 text-red-400 hover:text-red-600 text-xs"
                  onClick={() => handleRemoveNote(i)}
                  title="Usuń notatkę"
                  disabled={loading}
                >✕</button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg text-white font-medium"
          disabled={loading}
        >
          {loading ? 'Zapisywanie...' : initial ? 'Zapisz zmiany' : 'Dodaj zadanie'}
        </button>
      </form>
    </div>
  )
}
