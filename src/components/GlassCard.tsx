// components/GlassCard.tsx
export function GlassCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`
        relative
        bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.2)]
        hover:-translate-y-2 hover:shadow-2xl
        transition-transform duration-300
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  )
}
