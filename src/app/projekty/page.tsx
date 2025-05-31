'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import pl from 'date-fns/locale/pl';

interface Project {
  id: string;
  title: string;
  deadline: string;
  earnings: number;
  payment_type: 'Jednorazowe' | 'Miesięczne';
  period_months: number | null;
  created_at?: string;
  user_id: string;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'late';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Formularz (dodawanie/edycja)
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formEarnings, setFormEarnings] = useState<number>(0);

  // Nowe pola: rodzaj płatności i okres miesięczny
  const [formPaymentType, setFormPaymentType] = useState<'Jednorazowe' | 'Miesięczne'>('Jednorazowe');
  const [formPeriodMonths, setFormPeriodMonths] = useState<number | null>(null);
  const [formIsIndefinite, setFormIsIndefinite] = useState(false);

  // Statystyki
  const [countAll, setCountAll] = useState(0);
  const [countActive, setCountActive] = useState(0);
  const [countUpcoming, setCountUpcoming] = useState(0);
  const [earningsThisMonth, setEarningsThisMonth] = useState(0);

  // Wyszukiwanie / filtry
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  // Historia wypłat (modalka)
  const [historyOpen, setHistoryOpen] = useState(false);

  // Pobieranie projektów z Supabase
  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from<Project>('projects')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy, { ascending: true });

    if (error) {
      console.error('Błąd przy pobieraniu projektów:', error.message);
      setProjects([]);
      setFilteredProjects([]);
    } else if (data) {
      setProjects(data);
      setFilteredProjects(data);
      calculateStatistics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user, sortBy]);

  // Przeliczanie statystyk
  const calculateStatistics = (allProjects: Project[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let cntAll = allProjects.length;
    let cntActive = 0;
    let cntUpcoming = 0;
    let sumMonth = 0;

    allProjects.forEach((p) => {
      const dl = new Date(p.deadline);
      if (dl >= now) cntActive++;
      const diffDays = (dl.getTime() - now.getTime()) / (1000 * 3600 * 24);
      if (diffDays >= 0 && diffDays <= 7) cntUpcoming++;

      if (p.payment_type === 'Jednorazowe') {
        // Jednorazowe: jeśli utworzone w bieżącym miesiącu → uwzględnij earnings
        if (p.created_at) {
          const cr = new Date(p.created_at);
          if (cr.getMonth() === currentMonth && cr.getFullYear() === currentYear) {
            sumMonth += p.earnings;
          }
        }
      } else {
        // Miesięczne: policz, czy projekt "aktywny" w tym miesiącu
        if (p.created_at) {
          const cr = new Date(p.created_at);
          // Oblicz datę zakończenia, jeśli okres_months != null
          let endDate: Date | null = null;
          if (p.period_months !== null) {
            endDate = new Date(cr);
            endDate.setMonth(endDate.getMonth() + p.period_months);
          }
          // 1) Jeśli utworzony w bieżącym miesiącu → pierwsza wypłata
          if (cr.getMonth() === currentMonth && cr.getFullYear() === currentYear) {
            sumMonth += p.earnings;
          } else {
            // 2) Jeśli utworzony wcześniej i nadal aktywny → kolejne wypłaty
            // Projekt jest aktywny, gdy (brak endDate) lub (endDate >= teraz)
            if (cr < now && (endDate === null || endDate >= now)) {
              sumMonth += p.earnings;
            }
          }
        }
      }
    });

    setCountAll(cntAll);
    setCountActive(cntActive);
    setCountUpcoming(cntUpcoming);
    setEarningsThisMonth(sumMonth);
  };

  // Filtrowanie + wyszukiwanie
  useEffect(() => {
    let temp = [...projects];
    const now = new Date();

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      temp = temp.filter((p) => p.title.toLowerCase().includes(term));
    }
    if (statusFilter === 'active') {
      temp = temp.filter((p) => new Date(p.deadline) >= now);
    } else if (statusFilter === 'completed' || statusFilter === 'late') {
      temp = temp.filter((p) => new Date(p.deadline) < now);
    }
    if (clientFilter !== 'all') {
      // Możesz tu dodać filtr po kliencie (np. foreign key)
    }
    setFilteredProjects(temp);
  }, [searchTerm, statusFilter, clientFilter, projects]);

  // Otwórz modal – dodawanie
  const openAddModal = () => {
    setIsEditing(false);
    setEditProjectId(null);
    setFormTitle('');
    setFormDeadline('');
    setFormEarnings(0);
    setFormPaymentType('Jednorazowe');
    setFormPeriodMonths(null);
    setFormIsIndefinite(false);
    setModalOpen(true);
  };

  // Otwórz modal – edycja
  const openEditModal = (proj: Project) => {
    setIsEditing(true);
    setEditProjectId(proj.id);
    setFormTitle(proj.title);
    setFormDeadline(proj.deadline.slice(0, 10));
    setFormEarnings(proj.earnings);
    setFormPaymentType(proj.payment_type);
    setFormPeriodMonths(proj.period_months);
    setFormIsIndefinite(proj.payment_type === 'Miesięczne' && proj.period_months === null);
    setModalOpen(true);
  };

  // Zamknij modal
  const closeModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setEditProjectId(null);
    setFormTitle('');
    setFormDeadline('');
    setFormEarnings(0);
    setFormPaymentType('Jednorazowe');
    setFormPeriodMonths(null);
    setFormIsIndefinite(false);
  };

  // Obsługa otwarcia/zerwania historii wypłat
  const openHistoryModal = () => setHistoryOpen(true);
  const closeHistoryModal = () => setHistoryOpen(false);

  // Zapis do bazy (INSERT lub UPDATE)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formTitle.trim() || !formDeadline.trim()) return;

    // Jeśli miesięczne i bezterminowe, okres miesięczny = NULL
    let periodValue: number | null = formPeriodMonths;
    if (formPaymentType === 'Miesięczne' && formIsIndefinite) {
      periodValue = null;
    }

    setLoading(true);
    if (isEditing && editProjectId) {
      const { error } = await supabase
        .from('projects')
        .update({
          title: formTitle,
          deadline: formDeadline,
          earnings: formEarnings,
          payment_type: formPaymentType,
          period_months: periodValue,
        })
        .eq('id', editProjectId);

      if (error) {
        console.error('Błąd przy aktualizacji projektu:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            title: formTitle,
            deadline: formDeadline,
            earnings: formEarnings,
            payment_type: formPaymentType,
            period_months: periodValue,
            user_id: user.id,
          },
        ]);

      if (error) {
        console.error('Błąd przy dodawaniu projektu:', error.message);
      }
    }

    await fetchProjects();
    closeModal();
    setLoading(false);
  };

  // Usuwanie projektu
  const handleDelete = async (id: string) => {
    const confirmDeletion = window.confirm('Czy na pewno chcesz usunąć ten projekt?');
    if (!confirmDeletion) return;
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) console.error('Błąd przy usuwaniu projektu:', error.message);
    else await fetchProjects();
    setLoading(false);
  };

  // Pomoc: status (Aktywny / Zakończony)
  const getStatus = (deadline: string) => {
    const dl = new Date(deadline);
    const now = new Date();
    return dl < now ? 'Zakończony' : 'Aktywny';
  };

  return (
    /* Cała strona ma neonowe tło .bg-abstract */
    <div className="min-h-screen bg-abstract p-6">
      <div className="mx-auto max-w-6xl space-y-6 relative">
        {/* A) Nagłówek + przyciski */}
        <div
          className="
            flex flex-col md:flex-row md:justify-between items-center
            border border-white/20 bg-white/10 backdrop-blur-sm
            rounded-tr-3xl rounded-br-3xl rounded-bl-none rounded-tl-none
            p-4
          "
        >
          <h1 className="text-3xl font-bold text-white">PROJEKTY</h1>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <button
              onClick={openAddModal}
              className="
                px-5 py-2 rounded-xl 
                bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 
                text-white font-semibold shadow-lg 
                hover:brightness-110 transition
              "
            >
              + Nowy Projekt
            </button>
            <button
              onClick={openHistoryModal}
              className="
                px-5 py-2 rounded-xl 
                bg-gradient-to-r from-green-400 via-teal-500 to-cyan-500 
                text-white font-semibold shadow-lg 
                hover:brightness-110 transition
              "
            >
              Historia wypłat
            </button>
          </div>
        </div>

        {/* B) Pasek filtrów */}
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="
              bg-transparent border border-white/20 rounded-xl
              text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="all">Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="completed">Zakończone</option>
            <option value="late">Opóźnione</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="
              bg-transparent border border-white/20 rounded-xl
              text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="all">Klient (wszystkie)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="
              bg-transparent border border-white/20 rounded-xl
              text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="deadline">Sortuj wg Terminu</option>
            <option value="earnings">Sortuj wg Zarobków</option>
          </select>
        </div>

        {/* C) Pole wyszukiwania */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Szukaj po tytule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full 
              bg-transparent border border-white/20 
              rounded-xl text-white placeholder-gray-300 
              px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* ====== D) Kółka metryk – tylko cienka gradientowa obwódka + animacja 3D ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          {[
            { label: 'Aktywne projekty', value: countActive },
            { label: 'Zbliżające się Deadliny', value: countUpcoming },
            {
              label: 'Zarobki',
              value: `${earningsThisMonth
                .toFixed(0)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`,
            },
          ].map((stat, idx) => (
            <div key={idx} className="relative h-40 w-40 mx-auto">
              {/* Gradientowa obwódka */}
              <div
                className="
                  absolute inset-0
                  h-40 w-40
                  rounded-full
                  bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500
                  transform-gpu perspective-1000
                  shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                  hover:-translate-y-2 hover:rotateX-3
                  transition-transform duration-300
                "
              />

              {/* Maska środkowa */}
              <div
                className="
                  absolute inset-1
                  h-38 w-38
                  rounded-full
                  bg-abstract
                  flex flex-col items-center justify-center
                "
              >
                <span className="text-3xl font-extrabold text-white leading-none">
                  {stat.value}
                </span>
                <span className="text-sm text-gray-200 mt-1">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ====== E) Szklana tabela z efektami 3D ====== */}
        <div
          className="
            mt-6 
            bg-transparent
            border border-white/20 rounded-2xl overflow-hidden 
            transform-gpu perspective-1000 
            shadow-[0_10px_40px_rgba(0,0,0,0.7)] 
            hover:-translate-y-2 hover:rotateX-2 
            transition-transform duration-300
          "
        >
          <table className="min-w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-sm font-medium">Tytuł</th>
                <th className="px-6 py-3 text-sm font-medium">Deadline</th>
                <th className="px-6 py-3 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-sm font-medium">Zarobki (PLN)</th>
                <th className="px-6 py-3 text-sm font-medium">Rodzaj płatności</th>
                <th className="px-6 py-3 text-sm font-medium">Okres (mies.)</th>
                <th className="px-6 py-3 text-sm font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-300">
                    Ładowanie projektów...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-300">
                    Brak projektów do wyświetlenia.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const status = getStatus(proj.deadline);
                  const isLate = new Date(proj.deadline) < new Date();
                  return (
                    <tr
                      key={proj.id}
                      className="border-b border-white/10 hover:bg-white/10"
                    >
                      <td className="px-6 py-4">{proj.title}</td>
                      <td className="px-6 py-4">
                        {format(new Date(proj.deadline), 'dd.MM.yyyy', { locale: pl })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`
                            px-2 py-1 rounded text-xs font-semibold 
                            ${
                              status === 'Aktywny'
                                ? 'bg-green-500/30 text-green-200'
                                : isLate
                                ? 'bg-red-500/30 text-red-200'
                                : 'bg-gray-500/30 text-gray-200'
                            }
                          `}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{proj.earnings.toFixed(2)}</td>
                      <td className="px-6 py-4">{proj.payment_type}</td>
                      <td className="px-6 py-4">
                        {proj.payment_type === 'Miesięczne'
                          ? proj.period_months === null
                            ? 'Bezterminowo'
                            : proj.period_months
                          : '-'}
                      </td>
                      <td className="px-6 py-4 space-x-6">
                        <button
                          onClick={() => openEditModal(proj)}
                          className="text-blue-400 hover:underline"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="text-red-400 hover:underline"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ====== F) Modal (dodawanie/edycja) – glass, zaokrąglone prawe rogi ====== */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div
              className="
                bg-white/10 backdrop-blur-sm border border-white/20
                rounded-tr-3xl rounded-br-3xl rounded-bl-none rounded-tl-none
                w-full max-w-md p-6
              "
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                {isEditing ? 'Edytuj projekt' : 'Dodaj nowy projekt'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Tytuł projektu
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="
                      mt-1 block w-full
                      bg-transparent border border-white/20 rounded-lg
                      text-white placeholder-gray-400
                      px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                    placeholder="np. Salon Meblowy Bartek"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="
                      mt-1 block w-full
                      bg-transparent border border-white/20 rounded-lg
                      text-white
                      px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Zarobki (PLN)
                  </label>
                  <input
                    type="number"
                    value={formEarnings}
                    onChange={(e) => setFormEarnings(Number(e.target.value))}
                    className="
                      mt-1 block w-full
                      bg-transparent border border-white/20 rounded-lg
                      text-white placeholder-gray-400
                      px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* ===== Nowe pole: rodzaj płatności ===== */}
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Rodzaj płatności
                  </label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => {
                      const value = e.target.value as 'Jednorazowe' | 'Miesięczne';
                      setFormPaymentType(value);
                      // Jeśli zmieniono na jednorazowe, resetuj okres
                      if (value === 'Jednorazowe') {
                        setFormPeriodMonths(null);
                        setFormIsIndefinite(false);
                      }
                    }}
                    className="
                      mt-1 block w-full
                      bg-transparent border border-white/20 rounded-lg
                      text-white placeholder-gray-400
                      px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                  >
                    <option value="Jednorazowe">Jednorazowe</option>
                    <option value="Miesięczne">Miesięczne</option>
                  </select>
                </div>

                {/* ===== Gdy wybrano „Miesięczne”: pole okresu lub bezterminowo ===== */}
                {formPaymentType === 'Miesięczne' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Okres (miesięcy) lub wybierz „Bezterminowo”
                    </label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        type="number"
                        value={formPeriodMonths ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormPeriodMonths(val === '' ? null : Number(val));
                          setFormIsIndefinite(false);
                        }}
                        disabled={formIsIndefinite}
                        min={1}
                        placeholder="np. 3"
                        className="
                          block w-24
                          bg-transparent border border-white/20 rounded-lg
                          text-white placeholder-gray-400
                          px-3 py-2
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          disabled:opacity-50
                        "
                      />
                      <label className="inline-flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formIsIndefinite}
                          onChange={(e) => {
                            setFormIsIndefinite(e.target.checked);
                            if (e.target.checked) {
                              setFormPeriodMonths(null);
                            }
                          }}
                          className="h-4 w-4 text-blue-500 bg-transparent border border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Bezterminowo</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="
                      px-4 py-2
                      bg-red-500/70 hover:bg-red-600
                      text-white rounded-lg
                      transition
                    "
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      px-4 py-2
                      bg-green-500/70 hover:bg-green-600
                      text-white rounded-lg
                      transition disabled:opacity-50
                    "
                  >
                    {loading ? 'Zapis...' : isEditing ? 'Zapisz zmiany' : 'Dodaj projekt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== G) Modalka: Historia wypłat ====== */}
        {historyOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div
              className="
                bg-white/10 backdrop-blur-sm border border-white/20
                rounded-tr-3xl rounded-br-3xl rounded-bl-none rounded-tl-none
                w-full max-w-2xl p-6
              "
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Historia wypłat</h2>
                <button
                  onClick={closeHistoryModal}
                  className="text-gray-300 hover:text-white"
                >
                  Zamknij
                </button>
              </div>
              <div className="text-gray-200">
                {/* 
                  Tutaj w przyszłości wyświetlimy szczegółową historię wypłat miesięcznych:
                  - podział na poszczególne miesiące,
                  - suma wypłat w danym okresie,
                  - ewentualne przykładowe projekty. 
                */}
                <p>W trakcie implementacji – tutaj pojawi się szczegółowa historia wypłat.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
