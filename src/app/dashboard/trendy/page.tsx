'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import pl from 'date-fns/locale/pl';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

// Typy platformy i trybu widoku
type Platform = 'twitter' | 'youtube' | 'tiktok' | 'instagram';
type ViewMode = 'daily' | 'weekly' | 'monthly';

// Interfejsy odczytane bezpośrednio z Supabase
interface TrendRecordDailyDB {
  platforma: Platform;
  date: string;             // np. '2025-05-28'
  trendy: {                  // tablica obiektów
    topic: string;
    description: string;
    details: string;
  }[];
}

interface TrendRecordWeeklyDB {
  platforma: Platform;
  week_start: string;       // np. '2025-05-26'
  weekly_topics: {
    topic: string;
    description: string;
    details: string;
  }[];
}

interface TrendRecordMonthlyDB {
  platforma: Platform;
  year: number;
  month: number;             // 1–12
  monthly_topics: {
    topic: string;
    description: string;
    details: string;
  }[];
}

// Ujednolicony interfejs do wyświetlania na froncie
interface TrendDisplayRecord {
  platforma: Platform;
  period_label: string;      // np. '28.05.2025' / 'Tydzień 22 (2025)' / 'Maj 2025'
  trends: {                  // lista obiektów { topic, description, details }
    topic: string;
    description: string;
    details: string;
  }[];
}

// Dynamiczny import komponentu Bar z Chart.js (wyłączamy SSR)
const Bar = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  { ssr: false }
);

// Rejestracja potrzebnych elementów Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TrendsPage() {
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [records, setRecords] = useState<TrendDisplayRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Stan wybranego tematu do modalu: { topic, description, details } lub null
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: string;
    description: string;
    details: string;
  } | null>(null);

  // Pobiera dane z odpowiedniej tabeli Supabase w zależności od viewMode
  const fetchTrends = async () => {
    setLoading(true);

    if (viewMode === 'daily') {
      // 1) Pobieramy z tabeli trends_daily
      const { data, error } = await supabase
        .from<TrendRecordDailyDB>('trends_daily')
        .select('*')
        .eq('platforma', platform)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Błąd pobierania daily:', error.message);
        setRecords([]);
      } else if (data) {
        const mapped = data.map((row) => ({
          platforma: row.platforma,
          period_label: format(new Date(row.date), 'dd.MM.yyyy', { locale: pl }),
          trends: row.trendy
        }));
        setRecords(mapped);
      }
    } else if (viewMode === 'weekly') {
      // 2) Pobieramy z tabeli trends_weekly
      const { data, error } = await supabase
        .from<TrendRecordWeeklyDB>('trends_weekly')
        .select('*')
        .eq('platforma', platform)
        .order('week_start', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Błąd pobierania weekly:', error.message);
        setRecords([]);
      } else if (data) {
        const mapped = data.map((row) => {
          const dt = new Date(row.week_start);
          const weekNumber = getWeekNumber(dt);
          return {
            platforma: row.platforma,
            period_label: `Tydzień ${weekNumber} (${format(dt, 'yyyy', { locale: pl })})`,
            trends: row.weekly_topics
          };
        });
        setRecords(mapped);
      }
    } else {
      // 3) viewMode === 'monthly'
      const { data, error } = await supabase
        .from<TrendRecordMonthlyDB>('trends_monthly')
        .select('*')
        .eq('platforma', platform)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Błąd pobierania monthly:', error.message);
        setRecords([]);
      } else if (data) {
        const mapped = data.map((row) => {
          const dt = new Date(row.year, row.month - 1, 1);
          return {
            platforma: row.platforma,
            period_label: format(dt, 'LLLL yyyy', { locale: pl }), // np. "Maj 2025"
            trends: row.monthly_topics
          };
        });
        setRecords(mapped);
      }
    }

    setLoading(false);
  };

  // Pomoc: numer tygodnia (ISO) dla daty
  const getWeekNumber = (d: Date) => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
    return weekNumber;
  };

  useEffect(() => {
    fetchTrends();
  }, [platform, viewMode]);

  // Przygotowanie danych do wykresu top 5 (na podstawie liczby wystąpień topic)
  const chartData = () => {
    const counter: Record<string, number> = {};
    records.forEach((rec) =>
      rec.trends.forEach((t) => {
        counter[t.topic] = (counter[t.topic] || 0) + 1;
      })
    );
    const sorted = Object.entries(counter)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const labels = sorted.map(([topic]) => topic);
    const dataValues = sorted.map(([, count]) => count);

    return {
      labels,
      datasets: [
        {
          label: 'Liczba wystąpień',
          data: dataValues,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      title: {
        display: true,
        text:
          viewMode === 'daily'
            ? 'Top 5 trendów dnia'
            : viewMode === 'weekly'
            ? 'Top 5 tematów tygodnia'
            : 'Top 5 tematów miesiąca'
      }
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Nagłówek z wyborem platformy i trybów */}
        <div className="flex flex-col md:flex-row md:justify-between items-center border border-white/20 bg-white/10 backdrop-blur-sm rounded-tr-3xl rounded-br-3xl p-4">
          <h1 className="text-3xl font-bold text-white">TRENDY</h1>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="bg-transparent border border-white/20 rounded-xl text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>

            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-xl ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              } transition`}
            >
              Dziennie
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-xl ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              } transition`}
            >
              Tygodniowo
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-xl ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              } transition`}
            >
              Miesięcznie
            </button>
          </div>
        </div>

        {/* Podtytuł i przycisk Odśwież */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {viewMode === 'daily'
              ? 'Ostatnie 30 dni'
              : viewMode === 'weekly'
              ? 'Ostatnie 12 tygodni'
              : 'Ostatnie 12 miesięcy'}
          </h2>
          <button
            onClick={fetchTrends}
            className="px-4 py-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition"
          >
            {loading ? 'Ładowanie...' : 'Odśwież'}
          </button>
        </div>

        {/* =========================
             Widok: Dziennie
        ========================= */}
        {viewMode === 'daily' && (
          <div>
            {/* --- Kafelki (Daily) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                <p className="text-gray-300 col-span-full text-center">Ładowanie...</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 col-span-full text-center">Brak danych do wyświetlenia.</p>
              ) : (
                records.map((rec) => (
                  <div
                    key={rec.period_label}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{rec.period_label}</h3>
                    <ul className="space-y-2">
                      {rec.trends.slice(0, 3).map((entry, idx) => (
                        <li
                          key={idx}
                          className="cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <p className="text-white font-medium">{entry.topic}</p>
                          <p className="text-gray-300 text-xs">{entry.description}</p>
                        </li>
                      ))}
                      {rec.trends.length > 3 && (
                        <li className="text-gray-400 text-xs">…</li>
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* --- Tabela (Daily) --- */}
            <div className="overflow-x-auto bg-white/10 border border-white/20 rounded-2xl mt-6">
              <table className="min-w-full text-left text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium">Data</th>
                    <th className="px-6 py-3 text-sm font-medium">Topic</th>
                    <th className="px-6 py-3 text-sm font-medium">Krótki opis</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Ładowanie…
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Brak danych do wyświetlenia.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) =>
                      rec.trends.map((entry, idx) => (
                        <tr
                          key={`${rec.period_label}-${idx}`}
                          className="border-b border-white/10 hover:bg-white/10 cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <td className="px-6 py-4 align-top">{rec.period_label}</td>
                          <td className="px-6 py-4 align-top">{entry.topic}</td>
                          <td className="px-6 py-4 align-top">{entry.description}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Wykres (Daily) --- */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mt-6">
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych do wyświetlenia.</p>
              ) : (
                <Bar data={chartData()} options={chartOptions} />
              )}
            </div>
          </div>
        )}

        {/* =========================
             Widok: Tygodniowo
        ========================= */}
        {viewMode === 'weekly' && (
          <div>
            {/* --- Kafelki (Weekly) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                <p className="text-gray-300 col-span-full text-center">Ładowanie...</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 col-span-full text-center">Brak danych do wyświetlenia.</p>
              ) : (
                records.map((rec) => (
                  <div
                    key={rec.period_label}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{rec.period_label}</h3>
                    <ul className="space-y-2">
                      {rec.trends.slice(0, 3).map((entry, idx) => (
                        <li
                          key={idx}
                          className="cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <p className="text-white font-medium">{entry.topic}</p>
                          <p className="text-gray-300 text-xs">{entry.description}</p>
                        </li>
                      ))}
                      {rec.trends.length > 3 && (
                        <li className="text-gray-400 text-xs">…</li>
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* --- Tabela (Weekly) --- */}
            <div className="overflow-x-auto bg-white/10 border border-white/20 rounded-2xl mt-6">
              <table className="min-w-full text-left text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium">Tydzień</th>
                    <th className="px-6 py-3 text-sm font-medium">Topic</th>
                    <th className="px-6 py-3 text-sm font-medium">Krótki opis</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Ładowanie…
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Brak danych do wyświetlenia.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) =>
                      rec.trends.map((entry, idx) => (
                        <tr
                          key={`${rec.period_label}-${idx}`}
                          className="border-b border-white/10 hover:bg-white/10 cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <td className="px-6 py-4 align-top">{rec.period_label}</td>
                          <td className="px-6 py-4 align-top">{entry.topic}</td>
                          <td className="px-6 py-4 align-top">{entry.description}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Wykres (Weekly) --- */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mt-6">
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych do wyświetlenia.</p>
              ) : (
                <Bar data={chartData()} options={chartOptions} />
              )}
            </div>
          </div>
        )}

        {/* =========================
             Widok: Miesięcznie
        ========================= */}
        {viewMode === 'monthly' && (
          <div>
            {/* --- Kafelki (Monthly) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                <p className="text-gray-300 col-span-full text-center">Ładowanie...</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 col-span-full text-center">Brak danych do wyświetlenia.</p>
              ) : (
                records.map((rec) => (
                  <div
                    key={rec.period_label}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{rec.period_label}</h3>
                    <ul className="space-y-2">
                      {rec.trends.slice(0, 3).map((entry, idx) => (
                        <li
                          key={idx}
                          className="cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <p className="text-white font-medium">{entry.topic}</p>
                          <p className="text-gray-300 text-xs">{entry.description}</p>
                        </li>
                      ))}
                      {rec.trends.length > 3 && (
                        <li className="text-gray-400 text-xs">…</li>
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* --- Tabela (Monthly) --- */}
            <div className="overflow-x-auto bg-white/10 border border-white/20 rounded-2xl mt-6">
              <table className="min-w-full text-left text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium">Miesiąc</th>
                    <th className="px-6 py-3 text-sm font-medium">Topic</th>
                    <th className="px-6 py-3 text-sm font-medium">Krótki opis</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Ładowanie…
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                        Brak danych do wyświetlenia.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) =>
                      rec.trends.map((entry, idx) => (
                        <tr
                          key={`${rec.period_label}-${idx}`}
                          className="border-b border-white/10 hover:bg-white/10 cursor-pointer"
                          onClick={() => setSelectedTopic(entry)}
                        >
                          <td className="px-6 py-4 align-top">{rec.period_label}</td>
                          <td className="px-6 py-4 align-top">{entry.topic}</td>
                          <td className="px-6 py-4 align-top">{entry.description}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Wykres (Monthly) --- */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mt-6">
              {loading ? (
                <p className="text-gray-300 text-center">Ładowanie…</p>
              ) : records.length === 0 ? (
                <p className="text-gray-300 text-center">Brak danych do wyświetlenia.</p>
              ) : (
                <Bar data={chartData()} options={chartOptions} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================
           Modal: szczegóły wybranego tematu
      ========================= */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl w-full max-w-lg p-6 mx-4"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Info size={20} className="text-blue-400" />
                  <h2 className="text-2xl font-semibold text-white">{selectedTopic.topic}</h2>
                </div>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-gray-300 hover:text-white transition"
                >
                  Zamknij
                </button>
              </div>
              <div className="text-gray-200 space-y-4">
                <p className="text-gray-300 italic">{selectedTopic.description}</p>
                <hr className="border-white/20" />
                <p>{selectedTopic.details}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
