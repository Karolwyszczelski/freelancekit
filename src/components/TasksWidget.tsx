'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 1. Aktualny model Task:
type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  priority: 'Wysoki' | 'Średni' | 'Niski'
  description?: string
  tags?: string[]
  notes?: string[]
}

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [openTask, setOpenTask] = useState<Task | null>(null)

  // fetch & realtime
  const fetchTasks = async () => {
    const { data } = await supabase
      .from<Task>('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
  }
  useEffect(() => {
    fetchTasks()
    const ch = supabase
      .channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // dnd-kit: sensory
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // znajdź indeksy
    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)

    // zaktualizuj local order
    const newOrder = arrayMove(tasks, oldIndex, newIndex)
    setTasks(newOrder)
    // możesz zaktualizować kolejność w bazie, jeśli masz takie pole
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 overflow-auto h-full">
            {tasks.map(task => (
              <SortableTask key={task.id} task={task} onCardClick={() => setOpenTask(task)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {/* Modal z podglądem zadania */}
      {openTask && (
        <TaskDetailsModal task={openTask} onClose={() => setOpenTask(null)} />
      )}
    </>
  )
}

// Sortowalny podgląd pojedynczego zadania (widget)
function SortableTask({
  task,
  onCardClick,
}: {
  task: Task
  onCardClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  }
  // Kolor kropki wg priorytetu
  const dotColor =
    task.priority === 'Wysoki'   ? 'bg-red-500'  :
    task.priority === 'Średni'   ? 'bg-yellow-400':
                                   'bg-green-400'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition"
      onClick={onCardClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="font-semibold text-white">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/80">
        <span>{task.priority}</span>
        {task.due_date && <span className="ml-2">{task.due_date}</span>}
      </div>
    </div>
  )
}

// Modal – podgląd szczegółów zadania
function TaskDetailsModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md text-white relative">
        <button
          className="absolute top-4 right-4 text-white hover:text-red-400"
          onClick={onClose}
        >✕</button>
        <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${
            task.priority === 'Wysoki'
              ? 'bg-red-500'
              : task.priority === 'Średni'
              ? 'bg-yellow-400'
              : 'bg-green-400'
          }`} />
          <span>{task.priority}</span>
          {task.due_date && (
            <span className="ml-4">{task.due_date}</span>
          )}
        </div>
        {task.description && (
          <p className="mb-2">{task.description}</p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {task.tags.map((tag, i) => (
              <span key={i} className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/90">{tag}</span>
            ))}
          </div>
        )}
        {task.notes && task.notes.length > 0 && (
          <>
            <div className="mb-1 font-semibold text-white/80">Notatki:</div>
            <ul className="mb-2 list-disc ml-5 text-white/80 text-sm">
              {task.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </>
        )}
        <div className="mt-3 text-sm text-white/60">Status: {task.status === 'todo' ? 'Do zrobienia' : task.status === 'in_progress' ? 'W toku' : 'Zrealizowane'}</div>
      </div>
    </div>
  )
}
