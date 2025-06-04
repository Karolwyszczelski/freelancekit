// components/GlassCard.tsx
export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden

        /* 1) Bazowe tło: ciemny granat z półprzezroczystością (60%) */
        bg-gradient-to-br from-[#1E202A]/10 to-[#232A3A]/10 bg-blur-20

        /* 2) Mocny blur, żeby widać było przez panel tło dashboardu */
        backdrop-blur-xl

        /* 3) Subtelna, biała obwódka ~10% krycia */
        border border-white/10

        /* 4) Zaokrąglone rogi */
        rounded-xl

        /* 5) Cień pod panel – delikatny, ale widoczny */
        shadow-lg

        /* 6) Płynna animacja przy hover */
        transition-transform duration-300 
        hover:scale-[1.005]

        ${className ?? ''}
      `}
    >
      {/* 
        7) Niebieska nakładka: radialny gradient w lewym górnym rogu.
           Pozwala uzyskać delikatny, „połysk” niebieskiego, który widać
           na oryginalnym widgetcie pogodowym.
      */}
      <div
        className="
          absolute inset-0 
          bg-[radial-gradient(circle_at_top_left,_rgba(0,140,255,0.2),_transparent)]
          pointer-events-none
        "
      />

      {/* 8) Zawartość kafelka ponad nakładką – używamy z-index, ale tu wystarczy
              po prostu ocenić, że wejście children jest wewnątrz elementu relative */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
