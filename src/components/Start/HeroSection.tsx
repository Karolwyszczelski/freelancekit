// components/HeroSection.tsx
'use client'

import React from 'react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex items-center justify-center text-white"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* 
        Kontener z glass-morphism (szklane tło) 
        - px-3 ⇒ 12px padding poziomo
        - pt-[5px] ⇒ 5px padding od góry
        - pb-3 ⇒ 12px padding od dołu
        - max-w-7xl, mx-auto ⇒ centrowanie
      */}
      <div
        className="
          w-full max-w-7xl mx-auto
          bg-white/10 backdrop-blur-xl
          rounded-3xl
          px-3 pt-[5px] pb-3
        "
      >
        <div className="flex flex-col md:flex-row items-center">
          {/* Lewa kolumna: tekst + przycisk (35%) */}
          <div className="w-full md:w-[35%] px-3 text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              Platforma dla freelancerów
            </h1>
            <p className="text-base md:text-xl mb-6">
              Zarządzaj swoimi projektami, ofertami i harmonogramem w jednym miejscu
            </p>
            <Link href="/dashboard">
              <button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white px-6 py-3 rounded-lg text-base md:text-lg transition">
                Rozpocznij
              </button>
            </Link>
          </div>

          {/* Prawa kolumna: obrazek (65%) */}
          <div className="w-full md:w-[65%] flex items-center justify-center px-3">
            {/* Upewnij się, że plik hero.png znajduje się w katalogu public/hero.png */}
            <img
              src="/hero.png"
              alt="Ilustracja platformy dla freelancerów"
              className="max-w-full h-auto rounded-md shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
