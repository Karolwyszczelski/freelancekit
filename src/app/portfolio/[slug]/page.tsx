// File: src/app/portfolio/[slug]/page.tsx
// ------------------------------------------------
// Ten komponent jest **Server Component** (App Router w Next.js 13+)
// Nic tu nie pop-upodwieszamy w zakresie `use client`
// ------------------------------------------------

import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { PortfolioBase, PortfolioImage } from '@/types/portfolio';
import TemplateDev from '@/components/portfolio-templates/TemplateDev';
import TemplateFreelancer from '@/components/portfolio-templates/TemplateFreelancer';
import TemplatePremium from '@/components/portfolio-templates/TemplatePremium';

// Typy zdefiniowane w '@/types/portfolio':
// interface PortfolioBase {
//   id: string;
//   user_id: string;
//   slug: string;
//   template_id: number;
//   name: string;
//   headline: string | null;
//   about: string | null;
//   skills: string[];
//   contact_email: string | null;
//   contact_phone: string | null;
//   socials: { [key: string]: string } | null;
//   settings: { fontFamily: string; buttonStyle: string } | null;
//   created_at: string;
//   updated_at: string;
// }

// interface PortfolioImage {
//   portfolio_id: string;
//   image_url: string;
//   sort_order: number;
// }

// Dodajmy też typy dla projektów:
// interface Project {
//   id: string;
//   title: string;
//   description: string | null;
//   images: string[];
// }

interface PortfolioPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PortfolioPageProps) {
  return {
    title: `Portfolio – ${params.slug}`,
    description: `Podgląd portfolio użytkownika o slugu ${params.slug}`,
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = params;

  //
  // 1) Pobieramy wiersz z tabeli `portfolios` o podanym slug
  //
  const { data: portfolioData, error: portfolioError } = await supabase
    .from<PortfolioBase>('portfolios')
    .select('*')
    .eq('slug', slug)
    .single();

  if (portfolioError || !portfolioData) {
    // Jeżeli nie ma takiego slug w bazie – Next.js zwraca 404
    notFound();
    return;
  }

  const {
    id: portfolioId,
    template_id: templateId,
    name,
    headline,
    about,
    skills,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    socials,
    settings,
  } = portfolioData;

  //
  // 2) Pobieramy obrazy z tabeli `portfolio_images`
  //    Kolumna sort_order definiuje kolejność: [0] = logo, [1] = personalPhoto,
  //    (dla Premium: [2] = heroImage, [3] = aboutImage, [4..] = additionalImages)
  //
  const { data: imgData, error: imgError } = await supabase
    .from<PortfolioImage>('portfolio_images')
    .select('image_url, sort_order')
    .eq('portfolio_id', portfolioId)
    .order('sort_order', { ascending: true });

  // Jeśli błąd lub brak danych, zamieniamy na pustą tablicę
  const imageRows = imgError || !imgData ? [] : imgData;

  // Zebrane URL-e w kolejności sort_order:
  const allImageUrls: string[] = imageRows.map((row) => row.image_url);

  // Wydzielamy poszczególne sloty:
  // Dla Developer/Freelancer (templateId 1 lub 2):
  //   [0] → logoImage
  //   [1] → personalPhoto
  //   [2] → dodatkoweImage (opcjonalnie)
  //
  // Dla Premium (templateId 3):
  //   [0] → logoImage
  //   [1] → personalPhoto
  //   [2] → heroImage
  //   [3] → aboutImage
  //   [4..] → additionalImages[]
  //
  // Dla pewności sprawdzamy długość tablicy:
  let logoImage: string | null = null;
  let personalPhoto: string | null = null;
  let additionalImage: string | null = null; // dla szablonów 1/2
  let heroImage: string | null = null;
  let aboutImage: string | null = null;
  let additionalImages: string[] = [];

  if (templateId === 1 || templateId === 2) {
    // Developer / Freelancer
    logoImage = allImageUrls[0] || null;
    personalPhoto = allImageUrls[1] || null;
    additionalImage = allImageUrls[2] || null; // jeżeli jest trzeci w kolejności
    // Nie używamy hero/ about / dodatkowych tablicowo w podstawowych
  } else if (templateId === 3) {
    // Premium
    logoImage = allImageUrls[0] || null;
    personalPhoto = allImageUrls[1] || null;
    heroImage = allImageUrls[2] || null;
    aboutImage = allImageUrls[3] || null;
    // Pozostałe URL-e od 4 wzwyż to dodatkowe (do dowolnej liczby)
    additionalImages = allImageUrls.slice(4).filter((u) => u && u.length > 0);
  }

  //
  // 3) Pobieramy projekty (jeżeli tabela `portfolio_projects` istnieje)
  //    i dla każdego projektu pobieramy jego obrazy
  //
  interface ProjectRow {
    id: string;
    title: string;
    description: string | null;
  }

  const { data: projectRows, error: projectError } = await supabase
    .from<ProjectRow>('portfolio_projects')
    .select('id, title, description')
    .eq('portfolio_id', portfolioId);

  // Jeśli błąd lub brak wierszy – domyślnie pusta tablica
  const projects: Array<{ title: string; description: string | null; images: string[] }> =
    [];

  if (!projectError && projectRows) {
    for (const proj of projectRows) {
      // Dla każdego projektu wyciągamy jego obrazy
      const { data: projImgRows, error: projImgError } = await supabase
        .from<{ image_url: string }>('project_images')
        .select('image_url')
        .eq('project_id', proj.id)
        .order('sort_order', { ascending: true });

      const projImageUrls =
        projImgError || !projImgRows
          ? []
          : projImgRows.map((r) => r.image_url);

      projects.push({
        title: proj.title,
        description: proj.description,
        images: projImageUrls,
      });
    }
  }

  //
  // 4) Pobieramy motyw kolorystyczny (tylko dla Premium = templateId 3)
  //    z tabeli `portfolio_themes` (o ile istnieje)
  //
  let primaryColor = '#4f46e5';
  let secondaryColor = '#9333ea';
  let buttonColor = '#ef4444';
  let fontFamily: string = 'sans-serif';
  let buttonStyle: 'rounded' | 'square' = 'rounded';

  if (templateId === 3) {
    const { data: themeData, error: themeError } = await supabase
      .from<{ primary_color: string; secondary_color: string; button_color: string }>(
        'portfolio_themes'
      )
      .select('primary_color, secondary_color, button_color')
      .eq('portfolio_id', portfolioId)
      .single();

    if (!themeError && themeData) {
      primaryColor = themeData.primary_color;
      secondaryColor = themeData.secondary_color;
      buttonColor = themeData.button_color;
    }

    // Czcionka i styl przycisku pobierane z JSON‐owego pola `settings` w `portfolioData`
    if (portfolioData.settings) {
      const { fontFamily: ff, buttonStyle: bs } = portfolioData.settings as {
        fontFamily: string;
        buttonStyle: 'rounded' | 'square';
      };
      fontFamily = ff || fontFamily;
      buttonStyle = bs || buttonStyle;
    }
  }

  //
  // 5) W zależności od `templateId` wybieramy komponent i przekazujemy wszystkie props
  //
  if (templateId === 1) {
    // Szablon Developer
    return (
      <TemplateDev
        name={name}
        headline={headline}
        about={about}
        skills={skills || []}
        logoImage={logoImage}
        personalPhoto={personalPhoto}
        additionalImage={additionalImage}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        facebook={(socials as any)?.facebook || null}
        instagram={(socials as any)?.instagram || null}
        linkedin={(socials as any)?.linkedin || null}
        fontFamily={'sans-serif'} // w dev/freelancer korzystamy z domyślnej
        basicColorChoice={(settings as any)?.basicColorChoice || 'light'}
        // zakładam, że w `settings` na potrzeby szablonu 1/2 przechowujesz tylko `basicColorChoice`
      />
    );
  }

  if (templateId === 2) {
    // Szablon Freelancer
    return (
      <TemplateFreelancer
        name={name}
        headline={headline}
        about={about}
        skills={skills || []}
        logoImage={logoImage}
        personalPhoto={personalPhoto}
        additionalImage={additionalImage}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        facebook={(socials as any)?.facebook || null}
        instagram={(socials as any)?.instagram || null}
        linkedin={(socials as any)?.linkedin || null}
        fontFamily={'sans-serif'}
        basicColorChoice={(settings as any)?.basicColorChoice || 'light'}
        // analogicznie: w settings przechowujesz `basicColorChoice` dla dev/freelancer
      />
    );
  }

  if (templateId === 3) {
    // Szablon Premium
    return (
      <TemplatePremium
        name={name}
        headline={headline}
        about={about}
        skills={skills || []}
        logoImage={logoImage}
        personalPhoto={personalPhoto}
        heroImage={heroImage}
        aboutImage={aboutImage}
        additionalImages={additionalImages}
        projects={projects}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        socials={socials || {}}
        fontFamily={fontFamily}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        buttonColor={buttonColor}
        buttonStyle={buttonStyle}
      />
    );
  }

  // Jeśli templateId ma wartość 4 albo inną nieobsługiwaną – daj prosty fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F1F1F]">
      <p className="text-white text-lg">Nieznany szablon portfolio.</p>
    </div>
  );
}
