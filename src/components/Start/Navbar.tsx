// components/Navbar.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FiMenu, FiX } from 'react-icons/fi'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* LOGO PO LEWEJ */}
        <div className="flex items-center">
          <Link href="/">
            <span className="text-2xl font-bold text-white">FreelanceKit</span>
          </Link>
        </div>

        {/* MENU POŚRODKU (desktop) */}
        <ul className="hidden md:flex space-x-8 text-white font-medium">
          <li>
            <a href="#hero" className="hover:text-blue-300 transition">
              Start
            </a>
          </li>
          <li>
            <a href="#kontakt" className="hover:text-blue-300 transition">
              Kontakt
            </a>
          </li>
        </ul>

        {/* PRZYCISK „Rozpocznij” PO PRAWEJ */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <button className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
              Rozpocznij
            </button>
          </Link>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* MENU MOBILNE (pojawi się po kliknięciu w hamburgera) */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-90">
          <ul className="flex flex-col items-center space-y-4 py-6 text-white">
            <li>
              <a
                href="#hero"
                className="text-lg hover:text-blue-300 transition"
                onClick={() => setMenuOpen(false)}
              >
                Start
              </a>
            </li>
            <li>
              <a
                href="#kontakt"
                className="text-lg hover:text-blue-300 transition"
                onClick={() => setMenuOpen(false)}
              >
                Kontakt
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
