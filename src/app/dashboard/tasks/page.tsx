// src/app/tasks/page.tsx  (lub odpowiednia ścieżka w Twoim projekcie)
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { GlassCard } from '@/components/GlassCard'
import { TaskCard, Task } from '@/components/TaskCard'
import { AddTaskModal } from '@/components/AddTaskModal'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Sliders, LayoutList, Search } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'Wysoki' | 'Średni' | 'Niski'>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Pobieranie zadań + subskrypcja realtime
  const fetchTasks = async () => {
    const { data } = await supabase
      .from<Task>('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
  }

  useEffect(() => {
    fetchTasks()
    const channel = supabase
      .channel('tasks-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        fetchTasks
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Konfiguracja sensorów do Drag'n'Drop
  const sensors = useSensors(useSensor(PointerSensor))

  // Obsługa zmiany statusu po przeciągnięciu karty
  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const newStatus = over.data.current?.sortable.containerId as Task['status']
    await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', active.id)
  }

  // Filtrowanie + wyszukiwanie
  const filtered = tasks
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
    .filter((t) => filterTag === 'all' || t.tags?.includes(filterTag))
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))

  // Podział na kolumny Kanban
  const columns: Record<'todo' | 'in_progress' | 'done', Task[]> = {
    todo: filtered.filter((t) => t.status === 'todo'),
    in_progress: filtered.filter((t) => t.status === 'in_progress'),
    done: filtered.filter((t) => t.status === 'done'),
  }

  // Otwórz modal do edycji zadania
  const openEdit = (task: Task) => {
    setEditing(task)
    setShowModal(true)
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-abstract p-6">
      {/* Nagłówek strony */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Zadania</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditing(null)
              setShowModal(true)
            }}
            className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg text-white shadow-lg hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> Dodaj zadanie
          </button>
          <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition">
            <Sliders className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition">
            <LayoutList className="w-5 h-5" />
          </button>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-white/70" />
            <input
              type="text"
              placeholder="Szukaj..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Filtry */}
      <div className="flex gap-4 flex-wrap mb-6">
        {[
          {
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              ['all', 'Status'],
              ['todo', 'Do zrobienia'],
              ['in_progress', 'W toku'],
              ['done', 'Zrobione'],
            ],
          },
          {
            value: filterPriority,
            onChange: setFilterPriority,
            options: [
              ['all', 'Priorytet'],
              ['Wysoki', 'Wysoki'],
              ['Średni', 'Średni'],
              ['Niski', 'Niski'],
            ],
          },
          {
            value: filterTag,
            onChange: setFilterTag,
            options: [
              ['all', 'Tagi'],
              ['Funkcja', 'Funkcja'],
              ['Bug', 'Bug'],
            ],
          },
        ].map(({ value, onChange, options }, idx) => (
          <select
            key={idx}
            value={value}
            onChange={(e) => onChange(e.target.value as any)}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Kanban – kolumny z zadaniami */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-auto h-[calc(100vh-240px)]">
          {(Object.keys(columns) as (keyof typeof columns)[]).map((status) => (
            <SortableContext
              key={status}
              items={columns[status].map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              <GlassCard className="flex-1 p-4 flex flex-col bg-black/10 backdrop-blur-md hover:backdrop-blur-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    {status === 'todo'
                      ? 'Do zrobienia'
                      : status === 'in_progress'
                      ? 'W toku'
                      : 'Zrobione'}
                  </h3>
                  <span className="text-white/70">{columns[status].length}</span>
                </div>
                <div className="flex-1 overflow-auto space-y-3 pr-1">
                  {columns[status].map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openEdit(task)}
                      className="cursor-pointer"
                    >
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </SortableContext>
          ))}
        </div>
      </DndContext>

      {/* Modal dodawania/edycji zadania */}
      {showModal && (
        <AddTaskModal
          initial={editing}
          onClose={() => setShowModal(false)}
          onSaved={fetchTasks}
        />
      )}
    </div>
  )
}
