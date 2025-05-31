'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PortfolioListItem {
  id: string;
  slug: string;
  title: string;
  created_at: string;
}

export default function PortfolioListPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from<PortfolioListItem>('portfolios')
      .select('id, slug, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd pobierania listy portfolio:', error.message);
      setError('Nie udało się pobrać portfolio.');
    } else if (data) {
      setPortfolios(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated') fetchPortfolios();
    if (status === 'unauthenticated') router.replace('/login');
  }, [user, status, router]);

  if (!user || status !== 'authenticated') {
    return <p className="text-center mt-20">Ładuję...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Moje Portfolio (max 3)</h1>
          <Link href="/dashboard/portfolio/new">
            <a className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Nowe ➔
            </a>
          </Link>
        </div>
        {loading ? (
          <p className="text-center">Ładowanie listy...</p>
        ) : portfolios.length === 0 ? (
          <p className="text-center text-gray-500">Nie masz jeszcze żadnych portfolio.</p>
        ) : (
          <ul className="space-y-4">
            {portfolios.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{p.title}</h2>
                  <p className="text-sm text-gray-500">
                    Utworzono: {new Date(p.created_at).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <div className="space-x-3">
                  <Link href={`/portfolio/${p.slug}`}>
                    <a className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                      Podgląd
                    </a>
                  </Link>
                  <Link href={`/dashboard/portfolio/${p.slug}/edit`}>
                    <a className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm">
                      Edytuj
                    </a>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
