'use client'

import React from 'react'
import Navbar from '@/components/Start/Navbar'
import HeroSection from '@/components/Start/HeroSection'

export default function HomePage() {
  return (
    <div className="bg-gray-900 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Prosta sekcja Kontakt, aby link „Kontakt” działał */}
      <section
        id="kontakt"
        className="bg-gray-800 text-white py-20"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Kontakt</h2>
          <p className="text-lg mb-4">
            Masz pytanie? Napisz do nas:
          </p>
          <a
            href="mailto:kontakt@freelancekit.com"
            className="text-blue-400 hover:underline"
          >
            kontakt@freelancekit.com
          </a>
        </div>
      </section>
    </div>
  )
}
