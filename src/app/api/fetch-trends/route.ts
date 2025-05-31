// src/app/api/fetch-trends/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Do odpytywania zewnętrznych API
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // do zapisu lepiej użyć klucza serwisowego
);

/**
 * GET /api/fetch-trends
 * 
 * 1) Pobrać top trendów z Twittera (API).
 * 2) Pobrać top trendów z YouTube (API).
 * 3) Pobrać top z TikToka i Instagrama przez ChatGPT (prompt).
 * 4) Zapis do tabeli trendy_daily (jeden rekord na każdą platformę).
 */
export async function GET() {
  try {
    const now = new Date().toISOString();

    // 1) Twitter API – GET trends/place.json dla globalnego WOEID=1
    const twitterRes = await fetch('https://api.twitter.com/2/trends/place.json?id=1', {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      }
    });
    if (!twitterRes.ok) {
      console.error('Twitter API błąd:', await twitterRes.text());
      return NextResponse.json({ success: false, message: 'Błąd Twitter API' }, { status: 502 });
    }
    const twitterJson = await twitterRes.json();
    // Zakładamy, że odpowiedź to tablica z jednym obiektem zawierającym "trends"
    const twitterTrends: string[] = Array.isArray(twitterJson) && twitterJson[0]?.trends
      ? twitterJson[0].trends.map((t: any) => t.name).slice(0, 10)
      : [];

    // 2) YouTube Data API – GET popularne filmy (chart=mostPopular)
    const youtubeRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=PL&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!youtubeRes.ok) {
      console.error('YouTube API błąd:', await youtubeRes.text());
      return NextResponse.json({ success: false, message: 'Błąd YouTube API' }, { status: 502 });
    }
    const youtubeJson = await youtubeRes.json();
    const youtubeTrends: string[] = Array.isArray(youtubeJson.items)
      ? youtubeJson.items.map((item: any) => item.snippet.title).slice(0, 10)
      : [];

    // 3) Prompt do ChatGPT (TikTok + Instagram)
    // Zakładamy, że używasz biblioteki openai (v4) – zainstaluj: npm install openai
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const promptContent = `
Podaj 5 najważniejszych trendów na TikToku i 5 najważniejszych trendów na Instagramie w dniu ${new Date().toLocaleDateString('pl-PL')}. 
Wypisz w formacie:
TikTok: #trend1, #trend2, #trend3, #trend4, #trend5
Instagram: #trendA, #trendB, #trendC, #trendD, #trendE
    `;
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: promptContent }]
    });

    const text = chatResponse.choices[0].message.content as string;
    // Proste parsowanie odpowiedzi – szukamy linii zaczynających się od "TikTok:" i "Instagram:"
    const tiktokTrends: string[] = [];
    const instagramTrends: string[] = [];
    text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('tiktok:')) {
        trimmed
          .replace(/tiktok:/i, '')
          .split(',')
          .forEach((h) => {
            const tag = h.trim();
            if (tag) tiktokTrends.push(tag);
          });
      }
      if (trimmed.toLowerCase().startsWith('instagram:')) {
        trimmed
          .replace(/instagram:/i, '')
          .split(',')
          .forEach((h) => {
            const tag = h.trim();
            if (tag) instagramTrends.push(tag);
          });
      }
    });

    // 4) Zapis do Supabase – tabela trendy_daily
    // Przygotowujemy cztery obiekty do wstawienia
    const toInsert = [
      {
        platforma: 'twitter',
        data_pobrania: now,
        trendy: twitterTrends
      },
      {
        platforma: 'youtube',
        data_pobrania: now,
        trendy: youtubeTrends
      },
      {
        platforma: 'tiktok',
        data_pobrania: now,
        trendy: tiktokTrends
      },
      {
        platforma: 'instagram',
        data_pobrania: now,
        trendy: instagramTrends
      }
    ];

    const { error: insertError } = await supabase.from('trendy_daily').insert(toInsert);
    if (insertError) {
      console.error('Błąd zapisu do trendy_daily:', insertError.message);
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: toInsert.length });
  } catch (err: any) {
    console.error('Nieoczekiwany błąd:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
