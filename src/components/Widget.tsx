// components/Widget.tsx
'use client'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface WidgetProps {
  title?: string
  className?: string
  children: ReactNode
}

export function Widget({ title, className = '', children }: WidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      // → usunąłem whileHover!
      className={`
        relative overflow-hidden rounded-3xl
        p-[1.5px]
        bg-gradient-to-br from-gradientStart to-gradientEnd
        shadow-[0_0_20px_rgba(79,70,229,0.5),0_0_30px_rgba(59,130,246,0.5)]
        ${className}
      `}
    >
      <div
        className="
          relative w-full h-full
          bg-black/40 backdrop-blur-lg rounded-3xl
          p-6 text-white flex flex-col
        "
      >
        {title && (
          <h3 className="text-2xl font-semibold mb-4">
            {title}
          </h3>
        )}
        {children}
      </div>
    </motion.div>
  )
}
