import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import MinimalTemplate from '@/components/templates/MinimalTemplate';
import ModernTemplate from '@/components/templates/ModernTemplate';
import { PortfolioData } from '@/types/portfolio';

interface Props {
  params: { slug: string };
}

export default async function PortfolioPage({ params }: Props) {
  const { slug } = params;
  // Pobierz rekord z bazy
  const { data, error } = await supabase
    .from('portfolios')
    .select('template, data, public')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data || !data.public) {
    return notFound();
  }

  const portfolioData: PortfolioData = data.data;
  const template = data.template;

  // Wybierz szablon
  return (
    <>
      {template === 'minimal' && <MinimalTemplate data={portfolioData} />}
      {template === 'modern' && <ModernTemplate data={portfolioData} />}
    </>
  );
}

// Ustawienia ISR (opcjonalnie):
export const revalidate = 60; // co 60 sekund odświeża stronę z bazy
