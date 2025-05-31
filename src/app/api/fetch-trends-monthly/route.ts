// src/app/api/fetch-trends-monthly/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const now = new Date();
    const rok = now.getFullYear();
    const miesiac = now.getMonth(); // 0–11, aby objąć poprzedni miesiąc: now.getMonth() - 1

    // Jeśli chcemy agregować dane za poprzedni miesiąc, np. dziś jest 1 czerwca,
    // to interesuje nas maj (miesiac = 4, bo maj to 4 przy 0=styczeń).
    let targetYear = rok;
    let targetMonth = miesiac - 1; 
    if (targetMonth < 0) {
      // jeśli styczeń -> grupa za grudzień poprzedniego roku
      targetMonth = 11;
      targetYear = rok - 1;
    }

    // Pobierz wszystkie daily trend z poprzedniego miesiąca dla danej platformy,
    // np. użyj supabase.from('trendy_daily').select('*') z filtrem:
    // data_pobrania >= '2025-05-01' i < '2025-06-01'. Ale łatwiej: 
    const beginningOfMonth = new Date(targetYear, targetMonth, 1).toISOString();
    const beginningOfNextMonth = new Date(
      targetMonth === 11 ? targetYear + 1 : targetYear,
      targetMonth === 11 ? 0 : targetMonth + 1,
      1
    ).toISOString();

    // Najpierw pobieramy listę platform, żeby potem agregować dla każdej
    const platforms = ['twitter', 'youtube', 'tiktok', 'instagram'];

    // Przechowamy rekordy monthly do wstawienia
    const toInsertMonthly: Array<{
      platforma: string;
      rok: number;
      miesiac: number;
      top_trendy: string[];
    }> = [];

    // Dla każdej platformy:
    for (const plat of platforms) {
      // Pobierz wszystkie wpisy daily z poprzedniego miesiąca
      const { data, error } = await supabase
        .from('trendy_daily')
        .select('trendy')
        .eq('platforma', plat)
        .gte('data_pobrania', beginningOfMonth)
        .lt('data_pobrania', beginningOfNextMonth);

      if (error) {
        console.error(`Błąd pobierania daily dla ${plat}:`, error.message);
        continue;
      }

      // Zbierz wszystkie hashtagi w jedną tablicę
      const allTags: string[] = [];
      (data || []).forEach((row: any) => {
        if (Array.isArray(row.trendy)) {
          row.trendy.forEach((tag: string) => allTags.push(tag));
        }
      });

      // Zlicz wystąpienia każdego hashtagu
      const counts: Record<string, number> = {};
      allTags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });

      // Posortuj po liczbie wystąpień malejąco i weź top 10
      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      toInsertMonthly.push({
        platforma: plat,
        rok: targetYear,
        miesiac: targetMonth + 1, // żeby było 1–12
        top_trendy: sorted
      });
    }

    // Wstaw do tabeli trendy_monthly
    const { error: insertError } = await supabase.from('trendy_monthly').insert(toInsertMonthly);
    if (insertError) {
      console.error('Błąd zapisu monthly:', insertError.message);
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: toInsertMonthly.length });
  } catch (err: any) {
    console.error('Nieoczekiwany błąd monthly:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
