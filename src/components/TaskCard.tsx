'use client'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import React from 'react'

export type Task = {
  id: string
  title: string
  due_date: string | null
  priority: 'Wysoki' | 'Średni' | 'Niski'
  tags?: string[]
  description?: string
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // zapobiega scrollowaniu podczas drag
  }

  const dotColor =
    task.priority === 'Wysoki'   ? 'bg-red-500'  :
    task.priority === 'Średni'   ? 'bg-yellow-400':
                                  'bg-green-400'

  return (
    // 1. Cały div reaguje na onClick
    <div
      ref={setNodeRef}
      style={style}
      className="
        p-4 mb-3 
        bg-white/10 backdrop-blur-md 
        rounded-2xl 
        cursor-pointer 
        hover:bg-white/20 
        transition-colors
      "
      onClick={onClick}
    >
      {/* 2. Pasek-handle do drag&drop */}
      <div
        {...attributes}
        {...listeners}
        className="w-full h-4 mb-2 cursor-grab"
      >
        {/* Tu np. :: albo ikona uchwytu, zostaw puste lub wstaw SVG */}
      </div>

      {/* 3. Reszta treści */}
      <div className="font-semibold text-white mb-1">{task.title}</div>
      <div className="flex items-center text-sm text-white/70 mb-2">
        <span className={`w-2 h-2 rounded-full mr-2 ${dotColor}`} />
        <span>{task.due_date ?? '—'}</span>
      </div>
      {task.description && (
        <p className="text-xs text-white/80 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {task.tags?.map(tag => (
          <span
            key={tag}
            className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/90"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
