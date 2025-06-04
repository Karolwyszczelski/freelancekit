// components/portfolio-templates/TemplateCustom.tsx

'use client';
import React, { useState } from 'react';
import type { PortfolioBase } from '@/types/portfolio';
import { FaTimes, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

interface TemplateCustomProps {
  data: PortfolioBase;
  images: string[];
}

export default function TemplateCustom({ data, images }: TemplateCustomProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalToggle = () => {
    setModalOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#0b0c12] text-white">
      {/* =========================
            NAVBAR CUSTOM
         ========================= */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#161823]">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-pink-600 rounded-full flex items-center justify-center mr-3">
            <span className="font-bold text-lg">C</span>
          </div>
          <span className="text-2xl font-bold">{data.name || 'Na Zamówienie'}</span>
        </div>
        <button
          onClick={handleModalToggle}
          className="px-4 py-2 bg-pink-500 rounded-lg text-white hover:bg-pink-600 transition"
        >
          Zamów teraz
        </button>
      </nav>

      {/* =========================
            HERO CUSTOM
         ========================= */}
      <header className="h-80 flex items-center justify-center bg-[#161823]">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{data.headline || 'Potrzebujesz dedykowanego rozwiązania?'}</h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            {data.about || 'Napisz do nas, a stworzymy unikalną stronę, aplikację lub integrację pod Twoje potrzeby.'}
          </p>
          <button
            onClick={handleModalToggle}
            className="mt-6 px-6 py-3 bg-pink-500 rounded-full text-white font-semibold hover:bg-pink-600 transition"
          >
            Skontaktuj się
          </button>
        </div>
      </header>

      {/* =========================
         SEKCJA „GALERIA” (opcjonalna)
      ========================= */}
      {images.length > 0 && (
        <section id="gallery" className="py-16 px-8 bg-[#12131b]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6 border-b-2 border-pink-500 inline-block">
              Przykładowe Realizacje
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.slice(0, 3).map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-64 overflow-hidden rounded-lg shadow-lg group"
                >
                  <img
                    src={url}
                    alt={`Projekt ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white">Powiększ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================
        STOPKA CUSTOM (linki i dane kontaktowe)
      ========================= */}
      <footer className="bg-[#161823] py-8 px-8 text-center text-gray-400">
        <div className="space-y-4">
          {data.contact_email && (
            <p className="flex items-center justify-center space-x-2">
              <FaEnvelope />
              <a
                href={`mailto:${data.contact_email}`}
                className="underline hover:text-pink-400"
              >
                {data.contact_email}
              </a>
            </p>
          )}
          {data.contact_phone && (
            <p className="flex items-center justify-center space-x-2">
              <FaPhoneAlt />
              <a
                href={`tel:${data.contact_phone}`}
                className="underline hover:text-pink-400"
              >
                {data.contact_phone}
              </a>
            </p>
          )}
        </div>
        <p className="mt-6 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} {data.name}. Wszelkie prawa zastrzeżone.
        </p>
      </footer>

      {/* =========================
         MODAL KONTAKTOWY
      ========================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#1a1c25] rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={handleModalToggle}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-2xl font-semibold mb-4 text-center">Skontaktuj się z nami</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Imię i nazwisko"
                className="w-full bg-[#12131b] border border-pink-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="email"
                placeholder="Twój e-mail"
                className="w-full bg-[#12131b] border border-pink-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="tel"
                placeholder="Telefon"
                className="w-full bg-[#12131b] border border-pink-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <textarea
                placeholder="Opis projektu..."
                rows={4}
                className="w-full bg-[#12131b] border border-pink-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-pink-500 rounded-full text-white font-semibold hover:bg-pink-600 transition"
              >
                Wyślij zapytanie
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
