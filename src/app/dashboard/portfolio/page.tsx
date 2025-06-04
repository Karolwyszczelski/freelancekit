'use client';

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/components/ImageUploader';
import TagList from '@/components/TagList';
import SocialIcons from '@/components/SocialIcons';
import type { PortfolioBase, PortfolioImage, PortfolioTheme } from '@/types/portfolio';

/**
 * Typ, który reprezentuje istniejące portfolio (pełne pola z bazy).
 */
interface ExistingPortfolio extends PortfolioBase {
  // id, user_id, slug, template_id, name, headline, about, skills,
  // contact_email, contact_phone, socials, created_at, updated_at, settings?
}

/**
 * Typ dla pojedynczego projektu w kroku Portfolio.
 */
interface Project {
  title: string;
  description: string;
  images: string[];
}

export default function PortfolioCreatorPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ------------------------------------------------------------------------
  // 1) STANY FORMULARZA / EDYCJI / ISTNIEJĄCE PORTFOLIO
  // ------------------------------------------------------------------------

  // — GŁÓWNE DANE FORMULARZA —
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Linki społecznościowe: dla podstawy (templateId 1,2) tylko trzy stałe, dla premium dynamicznie
  const [basicFacebook, setBasicFacebook] = useState('');
  const [basicInstagram, setBasicInstagram] = useState('');
  const [basicLinkedin, setBasicLinkedin] = useState('');

  const [socials, setSocials] = useState<{ [k: string]: string }>({
    // dynamiczne dla premium
    github: '',
    twitter: '',
    website: '',
    // można dodać kolejne
  });

  // 1.1) Wybór szablonu:
  //    1 = Developer (podstawowy)
  //    2 = Freelancer (podstawowy)
  //    3 = Premium (zaawansowany z wyborem kolorów, czcionek, itd.)
  //    4 = Na zamówienie (z modalem kontaktowym)
  const [templateId, setTemplateId] = useState<1 | 2 | 3 | 4>(1);

  // referencja dla slidera w kroku 1
  const sliderRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------------
  // 1.2) Paleta kolorów i inne ustawienia
  // ------------------------------------------------------------------------
  // Dla podstawowych (1, 2): bardzo ograniczona paleta (jasne/ciemne)
  // Dla Premium (3): pełna paleta 3 kolorów + czcionki + styl przycisków
  const [basicColorChoice, setBasicColorChoice] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');   // domyślnie Indigo-600
  const [secondaryColor, setSecondaryColor] = useState('#9333ea'); // domyślnie Purple-700
  const [buttonColor, setButtonColor] = useState('#ef4444');     // domyślnie Red-500

  // Dodatkowe opcje premium
  const [fontFamily, setFontFamily] = useState<'sans-serif' | 'serif' | 'monospace' | 'cursive'>('sans-serif');
  const [buttonStyle, setButtonStyle] = useState<'rounded' | 'square'>('rounded');

  // ------------------------------------------------------------------------
  // 1.3) Upload obrazów – rozbite na kategorie
  // ------------------------------------------------------------------------
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [personalPhoto, setPersonalPhoto] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);       // tylko Premium
  const [aboutImage, setAboutImage] = useState<string | null>(null);     // tylko Premium
  const [additionalImages, setAdditionalImages] = useState<string[]>([]); // 1 dla podstawowych, do 3 dla Premium

  // Nowy krok „Portfolio” – lista projektów
  const [projects, setProjects] = useState<Project[]>([]);
  // Wstępny stan dla edycji jednego projektu w UI
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectImages, setNewProjectImages] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // — EDYCJA ISTNIEJĄCEGO —
  const [isEditing, setIsEditing] = useState(false);
  const [editPortfolioId, setEditPortfolioId] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // — ISTNIEJĄCE PORTFOLIO UŻYTKOWNIKA —
  const [existingPortfolios, setExistingPortfolios] = useState<ExistingPortfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);

  // — MOTYW KOLORÓW Z BAZY (PRISET DLA EDYCJI) —
  const [existingTheme, setExistingTheme] = useState<PortfolioTheme | null>(null);

  // — KROK (step) w wieloetapowym formularzu (1–6) —
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // ------------------------------------------------------------------------
  // 2) FETCH: pobierz istniejące portfolio dla bieżącego user_id
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setExistingPortfolios([]);
      setLoadingPortfolios(false);
      return;
    }

    const fetchExisting = async () => {
      setLoadingPortfolios(true);
      const { data, error } = await supabase
        .from<ExistingPortfolio>('portfolios')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Błąd przy pobieraniu istniejących portfolio:', error);
        setExistingPortfolios([]);
      } else {
        setExistingPortfolios(data || []);
      }
      setLoadingPortfolios(false);
    };

    fetchExisting();
  }, [user]);

  // ------------------------------------------------------------------------
  // 3) POMOCNICZE: dodawanie/usuwanie umiejętności
  // ------------------------------------------------------------------------
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };
  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // ------------------------------------------------------------------------
  // 4) DODAWANIE/USUWANIE PROJEKTÓW (KROK 5)
  // ------------------------------------------------------------------------
  const handleAddProject = () => {
    if (!newProjectTitle.trim()) {
      alert('Podaj tytuł projektu.');
      return;
    }
    const limitBasic = 2;
    if ((templateId === 1 || templateId === 2) && projects.length >= limitBasic) {
      alert(`W podstawowym pakiecie możesz dodać maksymalnie ${limitBasic} projekty.`);
      return;
    }
    setProjects([
      ...projects,
      {
        title: newProjectTitle.trim(),
        description: newProjectDescription.trim(),
        images: newProjectImages,
      },
    ]);
    // Reset pól
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectImages([]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // ------------------------------------------------------------------------
  // 5) USUWANIE PORTFOLIO
  // ------------------------------------------------------------------------
  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to portfolio?')) return;
    const { error } = await supabase.from('portfolios').delete().eq('id', id);
    if (error) {
      console.error('Błąd przy usuwaniu portfolio:', error);
      alert('Wystąpił problem przy usuwaniu.');
      return;
    }
    // odśwież listę
    await refreshExistingList();
  };

  // ------------------------------------------------------------------------
  // 6) ZAPIS DANYCH DO SUPABASE (INSERT lub UPDATE)
  // ------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Musisz być zalogowany, aby zarządzać portfolio.');
      return;
    }
    if (!name.trim()) {
      alert('Podaj imię i nazwisko (lub nazwę portfolio).');
      return;
    }
    if (![1, 2, 3, 4].includes(templateId)) {
      alert('Wybierz poprawny szablon.');
      return;
    }

    setIsSubmitting(true);

    // 6.1) Generowanie slugCandidate (tylko podczas tworzenia; w edycji slug zostaje)
    let slugToUse = '';
    if (!isEditing) {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
      slugToUse = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    // 6.2) Przygotowanie obiektu do wrzucenia
    type InsertPortfolio = Omit<PortfolioBase, 'id' | 'created_at' | 'updated_at'>;
    const newOrUpdatedPortfolio: InsertPortfolio = {
      user_id: user.id,
      slug: isEditing
        ? existingPortfolios.find((p) => p.id === editPortfolioId)!.slug
        : slugToUse,
      template_id: templateId,
      name: name.trim(),
      headline: headline.trim() || null,
      about: about.trim() || null,
      skills,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      socials:
        templateId === 1 || templateId === 2
          ? {
              facebook: basicFacebook.trim() || null,
              instagram: basicInstagram.trim() || null,
              linkedin: basicLinkedin.trim() || null,
            }
          : Object.keys(socials).reduce((acc, key) => {
              const val = socials[key].trim();
              if (val) acc[key] = val;
              return acc;
            }, {} as { [k: string]: string }), // premium: dynamiczne linki
      // Dodatkowo w tabeli portfolio można zapisać czcionkę i styl przycisków (pole JSON)
      // Zakładamy, że kolumna `settings` w PortfolioBase to JSONB
      settings:
        templateId === 3
          ? { fontFamily, buttonStyle }
          : { basicColorChoice },
    };

    // 6.3) Jeżeli edytujemy – UPDATE, w przeciwnym razie – INSERT
    let portfolioId: string | null = null;
    if (isEditing && editPortfolioId) {
      const { error } = await supabase
        .from<PortfolioBase>('portfolios')
        .update(newOrUpdatedPortfolio)
        .eq('id', editPortfolioId);

      if (error) {
        console.error('Błąd przy aktualizacji portfolio:', {
          message: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint,
        });
        alert('Wystąpił problem podczas zapisywania zmian.');
        setIsSubmitting(false);
        return;
      }
      portfolioId = editPortfolioId;
      // slug dla edycji
      const existingSlug = existingPortfolios.find((p) => p.id === editPortfolioId)!.slug;
      setCurrentSlug(existingSlug);
    } else {
      const { data: portfolioData, error: portfolioError } = await supabase
        .from<PortfolioBase>('portfolios')
        .insert(newOrUpdatedPortfolio)
        .select('id')
        .single();

      if (portfolioError || !portfolioData) {
        console.error('Błąd przy tworzeniu portfolio:', {
          message: portfolioError?.message,
          details: portfolioError?.details,
          code: portfolioError?.code,
          hint: portfolioError?.hint,
        });
        alert('Wystąpił problem podczas tworzenia portfolio.');
        setIsSubmitting(false);
        return;
      }
      portfolioId = portfolioData.id;
      setCurrentSlug(slugToUse);
    }

    // 6.4) Obsługa motywu kolorystycznego
    if (portfolioId) {
      if (templateId === 3) {
        // Premium: usuń stary motyw i dodaj nowy
        if (isEditing) {
          const { error: delErr } = await supabase
            .from<PortfolioTheme>('portfolio_themes')
            .delete()
            .eq('portfolio_id', portfolioId);
          if (delErr) console.error('Błąd przy usuwaniu starego motywu:', delErr);
        }
        const { error: themeError } = await supabase
          .from<PortfolioTheme>('portfolio_themes')
          .insert({
            portfolio_id: portfolioId,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            button_color: buttonColor,
          });
        if (themeError) console.error('Błąd przy zapisie motywu:', themeError);
      } else {
        // Jeśli było wcześniej zapisane cokolwiek w portfolio_themes, usuń
        if (isEditing) {
          const { error: delErr2 } = await supabase
            .from<PortfolioTheme>('portfolio_themes')
            .delete()
            .eq('portfolio_id', portfolioId);
          if (delErr2) console.error('Błąd przy czyszczeniu motywu (podstawowe):', delErr2);
        }
      }
    }

    // 6.5) Wrzucanie obrazów – w edycji usuwamy najpierw stare wpisy
    if (portfolioId) {
      if (isEditing) {
        const { error: delErr } = await supabase
          .from<PortfolioImage>('portfolio_images')
          .delete()
          .eq('portfolio_id', portfolioId);
        if (delErr) {
          console.error('Błąd przy usuwaniu starych obrazów:', delErr);
        }
      }

      // 6.5.1) Kolejność zapisywania obrazów:
      //     [logo, personalPhoto, (hero, aboutImage tylko Premium), ...additionalImages, projekty...]
      const imageUrlsToSave: string[] = [];
      if (logoImage) {
        imageUrlsToSave.push(logoImage);
      }
      if (personalPhoto) {
        imageUrlsToSave.push(personalPhoto);
      }
      if (templateId === 3) {
        // Premium: hero + about
        if (heroImage) {
          imageUrlsToSave.push(heroImage);
        }
        if (aboutImage) {
          imageUrlsToSave.push(aboutImage);
        }
        // dodatkowe zdjęcia (max do 3)
        additionalImages.forEach((url) => imageUrlsToSave.push(url));
      } else {
        // Szablony podstawowe: tylko jedno dodatkowe (jeśli jest)
        additionalImages.slice(0, 1).forEach((url) => imageUrlsToSave.push(url));
      }

      for (let i = 0; i < imageUrlsToSave.length; i++) {
        const imageUrl = imageUrlsToSave[i];
        const { error: imgError } = await supabase
          .from<PortfolioImage>('portfolio_images')
          .insert({
            portfolio_id: portfolioId,
            image_url: imageUrl,
            sort_order: i,
          });
        if (imgError) {
          console.error(`Błąd przy zapisie obrazu #${i}:`, imgError);
        }
      }

      // 6.5.2) Projekty: zapisujemy opisy i obrazy pod kolejnym sort_order
      // Zakładamy, że tabela 'portfolio_projects' istnieje:
      let sortIndex = imageUrlsToSave.length;
      for (let pi = 0; pi < projects.length; pi++) {
        // Zapis opisu projektu
        const proj = projects[pi];
        const { data: projData, error: projErr } = await supabase
          .from('portfolio_projects')
          .insert({
            portfolio_id: portfolioId,
            title: proj.title,
            description: proj.description,
          })
          .select('id')
          .single();
        if (projErr || !projData) {
          console.error(`Błąd przy zapisie projektu #${pi}:`, {
            message: projErr?.message,
            details: projErr?.details,
            code: projErr?.code,
            hint: projErr?.hint,
          });
          continue;
        }
        const projectId = projData.id;
        // Zapis obrazów do tabeli 'project_images'
        for (let imgUrl of proj.images) {
          const { error: prImgErr } = await supabase
            .from('project_images')
            .insert({
              project_id: projectId,
              image_url: imgUrl,
              sort_order: sortIndex,
            });
          if (prImgErr) console.error(`Błąd przy zapisie obrazu projektu #${pi}:`, prImgErr);
          sortIndex++;
        }
      }
    }

    // 6.6) Reset trybów i odświeżenie listy existingPortfolios
    setIsSubmitting(false);
    setIsEditing(false);
    setEditPortfolioId(null);
    await refreshExistingList();

    // 6.7) Przekierowanie, jeśli to nowo utworzone portfolio
    if (!isEditing && currentSlug) {
      router.push(`/portfolio/${currentSlug}`);
    } else {
      setCurrentStep(1);
    }
  };

  // ------------------------------------------------------------------------
  // 7) Odśwież listę istniejących portfolio
  // ------------------------------------------------------------------------
  const refreshExistingList = async () => {
    if (!user) return;
    setLoadingPortfolios(true);
    const { data, error } = await supabase
      .from<ExistingPortfolio>('portfolios')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Błąd przy pobieraniu istniejących portfolio:', error);
      setExistingPortfolios([]);
    } else {
      setExistingPortfolios(data || []);
    }
    setLoadingPortfolios(false);
  };

  // ------------------------------------------------------------------------
  // 8) PRZYGOTOWANIE STANÓW DO EDYCJI: gdy użytkownik kliknie „Edytuj”
  // ------------------------------------------------------------------------
  const startEditing = async (port: ExistingPortfolio) => {
    setIsEditing(true);
    setEditPortfolioId(port.id!);
    setCurrentSlug(port.slug);

    // 8.1) Wczytujemy dane do formularza
    setName(port.name || '');
    setHeadline(port.headline || '');
    setAbout(port.about || '');
    setSkills(port.skills || []);
    setContactEmail(port.contact_email || '');
    setContactPhone(port.contact_phone || '');

    if (port.template_id === 1 || port.template_id === 2) {
      setBasicFacebook((port.socials as any)?.facebook || '');
      setBasicInstagram((port.socials as any)?.instagram || '');
      setBasicLinkedin((port.socials as any)?.linkedin || '');
      setSocials({ github: '', twitter: '', website: '' });
      setBasicColorChoice(
        ((port as any).settings?.basicColorChoice as 'light' | 'dark') || 'light'
      );
    } else {
      setBasicFacebook('');
      setBasicInstagram('');
      setBasicLinkedin('');
      setSocials(port.socials || { github: '', twitter: '', website: '' });
    }

    setTemplateId(port.template_id || 1);

    // 8.2) Pobieramy motyw, jeśli istnieje (tylko dla Premium=3)
    if (port.template_id === 3 && port.id) {
      const { data: themeData, error: themeErr } = await supabase
        .from<PortfolioTheme>('portfolio_themes')
        .select('*')
        .eq('portfolio_id', port.id)
        .single();
      if (!themeErr && themeData) {
        setExistingTheme(themeData);
        setPrimaryColor(themeData.primary_color);
        setSecondaryColor(themeData.secondary_color);
        setButtonColor(themeData.button_color);
      } else {
        setExistingTheme(null);
        setPrimaryColor('#4f46e5');
        setSecondaryColor('#9333ea');
        setButtonColor('#ef4444');
      }
      // Pobierzemy również ustawienia czcionki i stylu przycisku (zakładając, że kolumna settings jest JSONB)
      if ((port as any).settings) {
        setFontFamily(((port as any).settings as any).fontFamily || 'sans-serif');
        setButtonStyle(((port as any).settings as any).buttonStyle || 'rounded');
      } else {
        setFontFamily('sans-serif');
        setButtonStyle('rounded');
      }
    } else {
      setExistingTheme(null);
      setPrimaryColor('#4f46e5');
      setSecondaryColor('#9333ea');
      setButtonColor('#ef4444');
      if (port.template_id !== 1 && port.template_id !== 2) {
        setBasicColorChoice('light');
      }
      setFontFamily('sans-serif');
      setButtonStyle('rounded');
    }

    // 8.3) Pobieramy obrazy powiązane z tym portfolio i rozdzielamy na kategorie
    if (port.id) {
      const { data: imgData, error: imgErr } = await supabase
        .from<PortfolioImage>('portfolio_images')
        .select('image_url')
        .eq('portfolio_id', port.id)
        .order('sort_order', { ascending: true });
      if (!imgErr && imgData) {
        const urls = imgData.map((r) => r.image_url);
        // Kolejność: logo, personal, hero (tylko premium), about (tylko premium), dodatkowe...
        setLogoImage(urls[0] || null);
        setPersonalPhoto(urls[1] || null);
        if (port.template_id === 3) {
          setHeroImage(urls[2] || null);
          setAboutImage(urls[3] || null);
          setAdditionalImages(urls.slice(4));
        } else {
          setHeroImage(null);
          setAboutImage(null);
          setAdditionalImages(urls.slice(2, 3)); // tylko jedno dodatkowe w podstawowych
        }
      } else {
        setLogoImage(null);
        setPersonalPhoto(null);
        setHeroImage(null);
        setAboutImage(null);
        setAdditionalImages([]);
      }

      // 8.3.1) Pobierz projekty i zdjęcia projektów (jeśli istnieją)
      const { data: projectData, error: projectErr } = await supabase
        .from('portfolio_projects')
        .select('id, title, description')
        .eq('portfolio_id', port.id);
      if (!projectErr && projectData) {
        const loadedProjects: Project[] = [];
        for (let pd of projectData) {
          const { data: imgs, error: imgsErr } = await supabase
            .from('project_images')
            .select('image_url')
            .eq('project_id', pd.id)
            .order('sort_order', { ascending: true });
          if (!imgsErr && imgs) {
            loadedProjects.push({
              title: pd.title,
              description: pd.description,
              images: imgs.map((i) => i.image_url),
            });
          }
        }
        setProjects(loadedProjects);
      } else {
        setProjects([]);
      }
    } else {
      setLogoImage(null);
      setPersonalPhoto(null);
      setHeroImage(null);
      setAboutImage(null);
      setAdditionalImages([]);
      setProjects([]);
    }

    // 8.4) Przejdź do kroku 3 (dane tekstowe)
    setCurrentStep(3);

    // 8.5) Scroll do formularza
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ------------------------------------------------------------------------
  // 9) RESETUJEMY STAN FORMULARZA (tworzenie nowego)
  // ------------------------------------------------------------------------
  const clearForm = () => {
    setName('');
    setHeadline('');
    setAbout('');
    setSkills([]);
    setNewSkill('');
    setContactEmail('');
    setContactPhone('');
    setBasicFacebook('');
    setBasicInstagram('');
    setBasicLinkedin('');
    setSocials({ github: '', twitter: '', website: '' });
    setTemplateId(1);
    setBasicColorChoice('light');
    setPrimaryColor('#4f46e5');
    setSecondaryColor('#9333ea');
    setButtonColor('#ef4444');
    setFontFamily('sans-serif');
    setButtonStyle('rounded');
    setLogoImage(null);
    setPersonalPhoto(null);
    setHeroImage(null);
    setAboutImage(null);
    setAdditionalImages([]);
    setProjects([]);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectImages([]);
    setEditPortfolioId(null);
    setIsEditing(true); // aby pokazać formularz zamiast listy
    setExistingTheme(null);
    setCurrentStep(1);
    setCurrentSlug(null);
  };

  // ------------------------------------------------------------------------
  // 10) RENDER: KROKOWY FORMULARZ (1–6) + LISTA + PRZYCISKI
  // ------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-global py-10 px-6">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Tytuł stronki */}
        <h1 className="text-4xl font-extrabold text-white text-center tracking-wide">
          Kreator Portfolio
        </h1>

        {/* Jeśli jeszcze ładujemy listę portfolio – pokaż komunikat */}
        {loadingPortfolios && (
          <p className="text-center text-gray-300">Ładowanie istniejących portfolio…</p>
        )}

        {/* Jeśli użytkownik ma już portfolio i nie jest w trybie edycji ani tworzenia nowego – pokaż listę */}
        {!loadingPortfolios && existingPortfolios.length > 0 && !isEditing && (
          <div className="space-y-8">
            <button
              onClick={clearForm}
              className="inline-block rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-white font-medium shadow-lg hover:from-indigo-600 hover:to-purple-600 transition"
            >
              Utwórz nowe Portfolio
            </button>

            <div className="rounded-xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
              <h2 className="mb-4 text-2xl font-semibold text-white">Twoje istniejące portfolio</h2>
              <ul className="space-y-4">
                {existingPortfolios.map((port) => (
                  <li
                    key={port.id}
                    className="flex items-center justify-between rounded-lg bg-white/10 backdrop-blur-lg px-4 py-3 shadow-md border border-white/20 hover:bg-white/20 transition"
                  >
                    <div>
                      <p className="text-lg font-medium text-white">{port.name}</p>
                      <p className="text-sm text-gray-300">
                        Slug: <span className="font-mono">{port.slug}</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(port)}
                        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 transition"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(port.id!)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 transition"
                      >
                        Usuń
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Jeśli użytkownik nie ma żadnego portfolio lub w trybie edycji/tworzenia → pokaż kroki */}
        {((!loadingPortfolios && existingPortfolios.length === 0) || isEditing) && (
          <>
            {/* --- KROKI NAWIGACJI --- */}
            <div className="flex items-center justify-center gap-3">
              {[
                { step: 1, label: 'Szablon' },
                { step: 2, label: 'Kolory' },
                { step: 3, label: 'Dane' },
                { step: 4, label: 'Obrazy' },
                { step: 5, label: 'Projekty' },
                { step: 6, label: 'Podgląd' },
              ].map(({ step, label }) => (
                <button
                  key={step}
                  onClick={() => step <= currentStep && setCurrentStep(step as 1 | 2 | 3 | 4 | 5 | 6)}
                  className={`
                    flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition
                    ${currentStep === step
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'}
                    ${step > currentStep ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* --- KROK 1: WYBÓR SZABLONU z efektem slidera --- */}
            {currentStep === 1 && (
              <div className="relative rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 1: Wybierz szablon</h2>
                <div className="relative">
                  {/* Lewa strzałka */}
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm text-white hover:bg-white/30 transition"
                  >
                    &#8592;
                  </button>
                  {/* Kontener slidera */}
                  <div
                    ref={sliderRef}
                    className="no-scrollbar flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory"
                  >
                    {/* Szablon 1: Developer */}
                    <div
                      onClick={() => setTemplateId(1)}
                      className={`
                        snap-center flex-shrink-0 w-64 flex flex-col justify-between rounded-lg border-2 p-6 transition
                        ${templateId === 1
                          ? 'border-indigo-400 bg-white/20'
                          : 'border-white/20 bg-white/10 hover:bg-white/20'}
                      `}
                    >
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-white">Szablon 1: Developer</h3>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                          <span className="text-white opacity-80">Podgląd Dev</span>
                        </div>
                      </div>
                      {templateId === 1 && (
                        <span className="self-end mt-4 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                          Wybrano
                        </span>
                      )}
                    </div>

                    {/* Szablon 2: Freelancer */}
                    <div
                      onClick={() => setTemplateId(2)}
                      className={`
                        snap-center flex-shrink-0 w-64 flex flex-col justify-between rounded-lg border-2 p-6 transition
                        ${templateId === 2
                          ? 'border-indigo-400 bg-white/20'
                          : 'border-white/20 bg-white/10 hover:bg-white/20'}
                      `}
                    >
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-white">Szablon 2: Freelancer</h3>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-teal-500">
                          <span className="text-white opacity-80">Podgląd Freelancer</span>
                        </div>
                      </div>
                      {templateId === 2 && (
                        <span className="self-end mt-4 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                          Wybrano
                        </span>
                      )}
                    </div>

                    {/* Szablon 3: Premium */}
                    <div
                      onClick={() => setTemplateId(3)}
                      className={`
                        snap-center flex-shrink-0 w-64 flex flex-col justify-between rounded-lg border-2 p-6 transition
                        ${templateId === 3
                          ? 'border-indigo-400 bg-white/20'
                          : 'border-white/20 bg-white/10 hover:bg-white/20'}
                      `}
                    >
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-white">Szablon 3: Premium</h3>
                        <div
                          className="flex h-32 items-center justify-center rounded-lg"
                          style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                        >
                          <span className="text-white opacity-80">Podgląd Premium</span>
                        </div>
                      </div>
                      {templateId === 3 && (
                        <span className="self-end mt-4 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                          Wybrano
                        </span>
                      )}
                    </div>

                    {/* Szablon 4: Na zamówienie */}
                    <div
                      onClick={() => setTemplateId(4)}
                      className={`
                        snap-center flex-shrink-0 w-64 flex flex-col justify-between rounded-lg border-2 p-6 transition
                        ${templateId === 4
                          ? 'border-indigo-400 bg-white/20'
                          : 'border-white/20 bg-white/10 hover:bg-white/20'}
                      `}
                    >
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-white">Szablon 4: Na zamówienie</h3>
                        <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-r from-gray-700 to-gray-800">
                          <span className="text-white opacity-80">Podgląd Custom</span>
                        </div>
                      </div>
                      {templateId === 4 && (
                        <span className="self-end mt-4 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                          Wybrano
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Prawa strzałka */}
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm text-white hover:bg-white/30 transition"
                  >
                    &#8594;
                  </button>
                </div>

                {/* Przejdź do kroku 2 */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    Następny krok &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* --- KROK 2: KOLORY + PREMIUM: CZCIONKI I STYL PRZYCISKÓW --- */}
            {currentStep === 2 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 2: Wybierz styl</h2>

                {templateId === 3 ? (
                  <>
                    {/* Premium: pełna paleta + czcionki + styl przycisków */}
                    <div className="mb-8 space-y-6">
                      <p className="text-gray-300">Szablon Premium – wybierz trzy kolory:</p>
                      <div className="grid gap-6 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-200">Kolor główny</label>
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-12 w-full rounded-lg border-0 p-0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-200">Kolor akcentowy</label>
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="h-12 w-full rounded-lg border-0 p-0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-200">Kolor przycisków</label>
                          <input
                            type="color"
                            value={buttonColor}
                            onChange={(e) => setButtonColor(e.target.value)}
                            className="h-12 w-full rounded-lg border-0 p-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8 space-y-6">
                      <p className="text-gray-300">Wybierz czcionkę (Premium):</p>
                      <select
                        value={fontFamily}
                        onChange={(e) =>
                          setFontFamily(e.target.value as 'sans-serif' | 'serif' | 'monospace' | 'cursive')
                        }
                        className="
                          w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                          focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                        "
                      >
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                      </select>
                    </div>

                    <div className="mb-8 space-y-6">
                      <p className="text-gray-300">Wybierz styl przycisków (Premium):</p>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="buttonStyle"
                            value="rounded"
                            checked={buttonStyle === 'rounded'}
                            onChange={() => setButtonStyle('rounded')}
                            className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                          />
                          <span className="text-white">Zaokrąglone</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="buttonStyle"
                            value="square"
                            checked={buttonStyle === 'square'}
                            onChange={() => setButtonStyle('square')}
                            className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                          />
                          <span className="text-white">Kwadratowe</span>
                        </label>
                      </div>
                    </div>

                    {/* Podgląd Premium */}
                    <div className="mt-8">
                      <p className="mb-2 text-gray-300">Podgląd nagłówka Premium:</p>
                      <div
                        className="rounded-lg shadow-lg"
                        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                      >
                        <button
                          className={`
                            px-6 py-2 text-base font-semibold text-white shadow transition
                            ${buttonStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'}
                          `}
                          style={{ backgroundColor: buttonColor, fontFamily }}
                        >
                          Przykładowy przycisk
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-gray-300">
                      Szablony podstawowe (ID = {templateId}) – wybierz motyw tła:
                    </p>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="basicColor"
                          value="light"
                          checked={basicColorChoice === 'light'}
                          onChange={() => setBasicColorChoice('light')}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <span className="text-white">Jasne tło</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="basicColor"
                          value="dark"
                          checked={basicColorChoice === 'dark'}
                          onChange={() => setBasicColorChoice('dark')}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <span className="text-white">Ciemne tło</span>
                      </label>
                    </div>
                    <div className="mt-8">
                      <p className="mb-2 text-gray-300">Podgląd tła:</p>
                      <div
                        className={`flex h-24 items-center justify-center rounded-lg shadow-lg ${
                          basicColorChoice === 'light' ? 'bg-gray-200' : 'bg-gray-900'
                        }`}
                      >
                        <span
                          className={`text-xl font-semibold ${
                            basicColorChoice === 'light' ? 'text-gray-900' : 'text-gray-100'
                          }`}
                        >
                          {basicColorChoice === 'light' ? 'Jasne tło' : 'Ciemne tło'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="inline-block rounded-lg bg-gray-700 px-6 py-2 text-base font-medium text-gray-300 shadow hover:bg-gray-600 transition"
                  >
                    &larr; Wróć
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    Następny krok &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* --- KROK 3: DANE TEKSTOWE (Imię, Nagłówek, O mnie, Umiejętności, Kontakt, Social) --- */}
            {currentStep === 3 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 3: Wypełnij dane</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* 3.1) Podstawowe informacje */}
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-gray-200 font-medium">Imię i Nazwisko</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="
                          w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                          focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                        "
                        placeholder="np. Anna Nowak"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-gray-200 font-medium">Nagłówek / Podtytuł</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="
                          w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                          focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                        "
                        placeholder="np. Frontend Developer"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-gray-200 font-medium">O mnie</label>
                      <textarea
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        className="
                          w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                          focus:border-indigo-500 focus:ring-indigo-500 h-28 resize-none transition backdrop-blur-sm
                        "
                        placeholder="Kilka zdań o sobie..."
                      />
                    </div>
                  </div>

                  {/* 3.2) Umiejętności */}
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Umiejętności</label>
                    <div className="mb-4 flex gap-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="
                          flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                          focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                        "
                        placeholder="Wpisz nową umiejętność"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 transition"
                      >
                        Dodaj
                      </button>
                    </div>
                    <TagList tags={skills} onRemove={handleRemoveSkill} />
                  </div>

                  {/* 3.3) Dane kontaktowe + Social Media */}
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-gray-200 font-medium">Email kontaktowy</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="
                            w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                            focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                          "
                          placeholder="np. anna@example.com"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-gray-200 font-medium">Telefon kontaktowy</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="
                            w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                            focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                          "
                          placeholder="np. +48 123 456 789"
                        />
                      </div>
                    </div>

                    {/* Linki społecznościowe */}
                    {templateId === 1 || templateId === 2 ? (
                      <div className="grid gap-6 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-gray-200 font-medium">Facebook</label>
                          <input
                            type="url"
                            value={basicFacebook}
                            onChange={(e) => setBasicFacebook(e.target.value)}
                            className="
                              w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                              focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                            "
                            placeholder="URL do Facebook"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-gray-200 font-medium">Instagram</label>
                          <input
                            type="url"
                            value={basicInstagram}
                            onChange={(e) => setBasicInstagram(e.target.value)}
                            className="
                              w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                              focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                            "
                            placeholder="URL do Instagram"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-gray-200 font-medium">LinkedIn</label>
                          <input
                            type="url"
                            value={basicLinkedin}
                            onChange={(e) => setBasicLinkedin(e.target.value)}
                            className="
                              w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                              focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                            "
                            placeholder="URL do LinkedIn"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-gray-200 font-medium">Linki do Social Media</label>
                        <SocialIcons socials={socials} setSocials={setSocials} />
                      </div>
                    )}
                  </div>

                  {/* Nawigacja pomiędzy krokami */}
                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-block rounded-lg bg-gray-700 px-6 py-2 text-base font-medium text-gray-300 shadow hover:bg-gray-600 transition"
                    >
                      &larr; Wróć
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                    >
                      Następny krok &rarr;
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- KROK 4: UPLOAD OBRAZÓW --- */}
            {currentStep === 4 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 4: Dodaj obrazy</h2>

                <div className="space-y-8">
                  {/* 4.1) Logo */}
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Logo</label>
                    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                      <ImageUploader
                        onUpload={(urls: string[]) => setLogoImage(urls[0] || null)}
                        multiple={false}
                        maxCount={1}
                      />
                      {logoImage && (
                        <p className="mt-2 text-sm text-gray-300">
                          Wybrane logo: <span className="font-mono">{logoImage}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4.2) Zdjęcie własne */}
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Zdjęcie własne</label>
                    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                      <ImageUploader
                        onUpload={(urls: string[]) => setPersonalPhoto(urls[0] || null)}
                        multiple={false}
                        maxCount={1}
                      />
                      {personalPhoto && (
                        <p className="mt-2 text-sm text-gray-300">
                          Wybrane zdjęcie: <span className="font-mono">{personalPhoto}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4.3) Dodatkowe zdjęcia: dla podstawowych tylko 1, dla Premium do 3 */}
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Dodatkowe zdjęcia</label>
                    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                      <ImageUploader
                        onUpload={(urls: string[]) => {
                          const limit = templateId === 3 ? 3 : 1;
                          setAdditionalImages(urls.slice(0, limit));
                        }}
                        multiple={templateId === 3}
                        maxCount={templateId === 3 ? 3 : 1}
                      />
                      {additionalImages.length > 0 && (
                        <div className="mt-2 text-sm text-gray-300">
                          Wybrane dodatkowe zdjęcia ({additionalImages.length}):
                          <ul className="ml-4 mt-1 list-disc space-y-1 text-gray-200">
                            {additionalImages.map((url, idx) => (
                              <li key={idx} className="font-mono">{url}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4.4) Pola tylko dla Premium (3): hero + „O mnie” */}
                  {templateId === 3 && (
                    <>
                      <div>
                        <label className="mb-2 block text-gray-200 font-medium">Zdjęcie Hero</label>
                        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                          <ImageUploader
                            onUpload={(urls: string[]) => setHeroImage(urls[0] || null)}
                            multiple={false}
                            maxCount={1}
                          />
                          {heroImage && (
                            <p className="mt-2 text-sm text-gray-300">
                              Wybrane hero: <span className="font-mono">{heroImage}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-gray-200 font-medium">Zdjęcie „O mnie”</label>
                        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                          <ImageUploader
                            onUpload={(urls: string[]) => setAboutImage(urls[0] || null)}
                            multiple={false}
                            maxCount={1}
                          />
                          {aboutImage && (
                            <p className="mt-2 text-sm text-gray-300">
                              Wybrane „O mnie”: <span className="font-mono">{aboutImage}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="inline-block rounded-lg bg-gray-700 px-6 py-2 text-base font-medium text-gray-300 shadow hover:bg-gray-600 transition"
                  >
                    &larr; Wróć
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    Następny krok &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* --- KROK 5: PORTFOLIO (projekty) --- */}
            {currentStep === 5 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 5: Projekty</h2>

                {/* Dodawanie nowego projektu */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Tytuł projektu</label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="
                        w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                        focus:border-indigo-500 focus:ring-indigo-500 transition backdrop-blur-sm
                      "
                      placeholder="np. Strona internetowa klienta"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Opis projektu</label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="
                        w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-gray-100 placeholder-gray-400
                        focus:border-indigo-500 focus:ring-indigo-500 h-24 resize-none transition backdrop-blur-sm
                      "
                      placeholder="Krótki opis projektu..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-gray-200 font-medium">Zdjęcia projektu</label>
                    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                      <ImageUploader
                        onUpload={(urls: string[]) => {
                          const limit = templateId === 3 ? urls.length : Math.min(urls.length, 3);
                          setNewProjectImages(urls.slice(0, limit));
                        }}
                        multiple
                        maxCount={templateId === 3 ? 10 : 3}
                      />
                      {newProjectImages.length > 0 && (
                        <div className="mt-2 text-sm text-gray-300">
                          Wybrane ({newProjectImages.length}):
                          <ul className="ml-4 mt-1 list-disc space-y-1 text-gray-200">
                            {newProjectImages.map((url, idx) => (
                              <li key={idx} className="font-mono">{url}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleAddProject}
                    className="inline-block rounded-lg bg-purple-600 px-6 py-2 text-base font-medium text-white shadow hover:bg-purple-700 transition"
                  >
                    Dodaj projekt
                  </button>
                </div>

                {/* Lista dodanych projektów */}
                {projects.length > 0 && (
                  <div className="mt-8 space-y-6">
                    <h3 className="text-xl font-semibold text-white">Twoje projekty</h3>
                    <ul className="space-y-4">
                      {projects.map((proj, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg bg-white/10 backdrop-blur-lg p-4 shadow-md border border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-white">{proj.title}</h4>
                            <button
                              onClick={() => handleRemoveProject(idx)}
                              className="text-red-400 hover:text-red-500 transition"
                            >
                              Usuń
                            </button>
                          </div>
                          {proj.description && (
                            <p className="mt-2 text-gray-300">{proj.description}</p>
                          )}
                          {proj.images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              {proj.images.map((img, i2) => (
                                <div key={i2} className="overflow-hidden rounded-lg shadow-lg">
                                  <img
                                    src={img}
                                    alt={`Projekt ${idx + 1} - zdjęcie ${i2 + 1}`}
                                    className="h-32 w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="inline-block rounded-lg bg-gray-700 px-6 py-2 text-base font-medium text-gray-300 shadow hover:bg-gray-600 transition"
                  >
                    &larr; Wróć
                  </button>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    Następny krok &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* --- KROK 6: PODGLĄD I ZATWIERDZENIE --- */}
            {currentStep === 6 && (
              <div className="rounded-xl bg-white/10 backdrop-blur-lg p-8 shadow-xl border border-white/20">
                <h2 className="mb-6 text-2xl font-semibold text-white">Krok 6: Podgląd i zatwierdzenie</h2>

                {/* Podgląd szablonu na pełną szerokość */}
                <div className="rounded-lg shadow-inner bg-white/5">
                  {templateId === 1 && (
                    <div
                      className={`min-h-[600px] ${basicColorChoice === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-white'}`}
                      style={{ fontFamily }}
                    >
                      {/* Przykładowy nagłówek Developer */}
                      <header
                        className={`py-16 px-8 text-center ${
                          basicColorChoice === 'light'
                            ? 'bg-gray-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                        }`}
                      >
                        <h1 className="text-5xl font-bold">{name || 'Imię i Nazwisko'}</h1>
                        <p className="mt-3 text-2xl opacity-80">{headline || 'Frontend Developer'}</p>
                      </header>
                      {/* Sekcja “O mnie” */}
                      {about && (
                        <section className="px-8 py-10">
                          <h2 className="mb-4 text-3xl font-semibold text-white">O mnie</h2>
                          <p className={`mb-6 ${basicColorChoice === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>
                            {about}
                          </p>
                          {aboutImage && (
                            <img
                              src={aboutImage}
                              alt="O mnie"
                              className="mx-auto mb-6 max-w-xs rounded-lg object-cover shadow-md"
                            />
                          )}
                        </section>
                      )}
                      {/* Sekcja umiejętności */}
                      {skills.length > 0 && (
                        <section className="px-8 py-10 bg-gray-700">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Umiejętności</h2>
                          <div className="flex flex-wrap gap-3">
                            {skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className={`rounded-full px-4 py-1 text-sm font-medium ${
                                  basicColorChoice === 'light'
                                    ? 'bg-gray-300 text-gray-900'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Galeria zdjęć */}
                      <section className="px-8 py-10">
                        <h2 className="mb-4 text-3xl font-semibold text-white">Galeria</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {/* logo */}
                          {logoImage && (
                            <div className="overflow-hidden rounded-lg border border-gray-700 bg-white shadow-md">
                              <img
                                src={logoImage}
                                alt="Logo"
                                className="h-48 w-full object-contain"
                              />
                            </div>
                          )}
                          {/* personalPhoto */}
                          {personalPhoto && (
                            <div className="overflow-hidden rounded-lg shadow-md">
                              <img
                                src={personalPhoto}
                                alt="Zdjęcie własne"
                                className="h-48 w-full object-cover"
                              />
                            </div>
                          )}
                          {/* dodatkowe (maks 1) */}
                          {additionalImages.length > 0 && (
                            <div className="overflow-hidden rounded-lg shadow-md">
                              <img
                                src={additionalImages[0]}
                                alt="Dodatkowe"
                                className="h-48 w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </section>
                      {/* Sekcja Projekty */}
                      {projects.length > 0 && (
                        <section className="px-8 py-10 bg-gray-700">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Projekty</h2>
                          <div className="space-y-8">
                            {projects.map((proj, pidx) => (
                              <div key={pidx}>
                                <h3 className="mb-2 text-2xl font-semibold text-white">{proj.title}</h3>
                                <p className="mb-4 text-gray-300">{proj.description}</p>
                                {proj.images.length > 0 && (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {proj.images.map((imgUrl, imgIdx) => (
                                      <div key={imgIdx} className="overflow-hidden rounded-lg shadow-lg">
                                        <img
                                          src={imgUrl}
                                          alt={`Projekt ${pidx + 1} - zdjęcie ${imgIdx + 1}`}
                                          className="h-48 w-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Stopka z kontaktami */}
                      <footer
                        className={`px-8 py-10 ${
                          basicColorChoice === 'light' ? 'bg-gray-200' : 'bg-gray-900'
                        }`}
                      >
                        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:justify-between">
                          <div>
                            {contactEmail && (
                              <p className="text-base text-gray-800">
                                <span className="font-semibold">Email: </span>
                                <a
                                  href={`mailto:${contactEmail}`}
                                  className={`underline ${
                                    basicColorChoice === 'light' ? 'text-gray-900' : 'text-indigo-300'
                                  } hover:text-indigo-500 transition`}
                                >
                                  {contactEmail}
                                </a>
                              </p>
                            )}
                            {contactPhone && (
                              <p className="mt-2 text-base text-gray-800">
                                <span className="font-semibold">Telefon: </span>
                                <a
                                  href={`tel:${contactPhone}`}
                                  className={`underline ${
                                    basicColorChoice === 'light' ? 'text-gray-900' : 'text-indigo-300'
                                  } hover:text-indigo-500 transition`}
                                >
                                  {contactPhone}
                                </a>
                              </p>
                            )}
                          </div>
                          <div className="flex gap-4">
                            {basicFacebook && (
                              <a
                                href={basicFacebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-indigo-300'
                                } hover:text-indigo-500 transition`}
                              >
                                Facebook
                              </a>
                            )}
                            {basicInstagram && (
                              <a
                                href={basicInstagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-indigo-300'
                                } hover:text-indigo-500 transition`}
                              >
                                Instagram
                              </a>
                            )}
                            {basicLinkedin && (
                              <a
                                href={basicLinkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-indigo-300'
                                } hover:text-indigo-500 transition`}
                              >
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                        <p
                          className={`mt-6 text-center text-sm ${
                            basicColorChoice === 'light' ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          &copy; {new Date().getFullYear()} {name || 'Twoje Imię'}. Wszystkie prawa zastrzeżone.
                        </p>
                      </footer>
                    </div>
                  )}

                  {templateId === 2 && (
                    <div
                      className={`min-h-[600px] ${basicColorChoice === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-white'}`}
                      style={{ fontFamily }}
                    >
                      {/* Szablon Freelancer */}
                      <header
                        className={`py-16 px-8 text-center ${
                          basicColorChoice === 'light'
                            ? 'bg-gray-200'
                            : 'bg-gradient-to-r from-green-600 to-teal-500'
                        }`}
                      >
                        <h1 className="text-5xl font-bold">{name || 'Imię i Nazwisko'}</h1>
                        <p className="mt-3 text-2xl opacity-80">{headline || 'Freelancer'}</p>
                      </header>
                      {about && (
                        <section className="px-8 py-10">
                          <h2 className="mb-4 text-3xl font-semibold text-white">O mnie</h2>
                          <p className={`mb-6 ${basicColorChoice === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>
                            {about}
                          </p>
                          {aboutImage && (
                            <img
                              src={aboutImage}
                              alt="O mnie"
                              className="mx-auto mb-6 max-w-xs rounded-lg object-cover shadow-md"
                            />
                          )}
                        </section>
                      )}
                      {skills.length > 0 && (
                        <section className="px-8 py-10 bg-gray-700">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Umiejętności</h2>
                          <div className="flex flex-wrap gap-3">
                            {skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className={`rounded-full px-4 py-1 text-sm font-medium ${
                                  basicColorChoice === 'light'
                                    ? 'bg-gray-300 text-gray-900'
                                    : 'bg-green-600 text-white'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                      <section className="px-8 py-10">
                        <h2 className="mb-4 text-3xl font-semibold text-white">Galeria</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {logoImage && (
                            <div className="overflow-hidden rounded-lg border border-gray-700 bg-white shadow-md">
                              <img
                                src={logoImage}
                                alt="Logo"
                                className="h-48 w-full object-contain"
                              />
                            </div>
                          )}
                          {personalPhoto && (
                            <div className="overflow-hidden rounded-lg shadow-md">
                              <img
                                src={personalPhoto}
                                alt="Zdjęcie własne"
                                className="h-48 w-full object-cover"
                              />
                            </div>
                          )}
                          {additionalImages.length > 0 && (
                            <div className="overflow-hidden rounded-lg shadow-md">
                              <img
                                src={additionalImages[0]}
                                alt="Dodatkowe"
                                className="h-48 w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </section>
                      {/* Sekcja Projekty */}
                      {projects.length > 0 && (
                        <section className="px-8 py-10 bg-gray-700">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Projekty</h2>
                          <div className="space-y-8">
                            {projects.map((proj, pidx) => (
                              <div key={pidx}>
                                <h3 className="mb-2 text-2xl font-semibold text-white">{proj.title}</h3>
                                <p className="mb-4 text-gray-300">{proj.description}</p>
                                {proj.images.length > 0 && (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {proj.images.map((imgUrl, imgIdx) => (
                                      <div key={imgIdx} className="overflow-hidden rounded-lg shadow-lg">
                                        <img
                                          src={imgUrl}
                                          alt={`Projekt ${pidx + 1} - zdjęcie ${imgIdx + 1}`}
                                          className="h-48 w-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      <footer
                        className={`px-8 py-10 ${
                          basicColorChoice === 'light' ? 'bg-gray-200' : 'bg-gray-900'
                        }`}
                      >
                        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:justify-between">
                          <div className="space-y-2">
                            {contactEmail && (
                              <p className="text-base text-gray-800">
                                <span className="font-semibold">Email: </span>
                                <a
                                  href={`mailto:${contactEmail}`}
                                  className={`underline ${
                                    basicColorChoice === 'light' ? 'text-gray-900' : 'text-teal-300'
                                  } hover:text-teal-500 transition`}
                                >
                                  {contactEmail}
                                </a>
                              </p>
                            )}
                            {contactPhone && (
                              <p className="text-base text-gray-800">
                                <span className="font-semibold">Telefon: </span>
                                <a
                                  href={`tel:${contactPhone}`}
                                  className={`underline ${
                                    basicColorChoice === 'light' ? 'text-gray-900' : 'text-teal-300'
                                  } hover:text-teal-500 transition`}
                                >
                                  {contactPhone}
                                </a>
                              </p>
                            )}
                          </div>
                          <div className="flex gap-4">
                            {basicFacebook && (
                              <a
                                href={basicFacebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-teal-300'
                                } hover:text-teal-500 transition`}
                              >
                                Facebook
                              </a>
                            )}
                            {basicInstagram && (
                              <a
                                href={basicInstagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-teal-300'
                                } hover:text-teal-500 transition`}
                              >
                                Instagram
                              </a>
                            )}
                            {basicLinkedin && (
                              <a
                                href={basicLinkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-base font-medium ${
                                  basicColorChoice === 'light' ? 'text-gray-700' : 'text-teal-300'
                                } hover:text-teal-500 transition`}
                              >
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                        <p
                          className={`mt-6 text-center text-sm ${
                            basicColorChoice === 'light' ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          &copy; {new Date().getFullYear()} {name || 'Twoje Imię'}. Wszystkie prawa zastrzeżone.
                        </p>
                      </footer>
                    </div>
                  )}

                  {templateId === 3 && (
                    // Podgląd PREMIUM z wybranymi wcześniej kolorami, czcionką i stylem przycisku
                    <div className="min-h-[600px]" style={{ backgroundColor: primaryColor, fontFamily }}>
                      <header
                        className="py-16 px-8 text-center"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <h1 className="text-5xl font-bold text-white">{name || 'Imię i Nazwisko'}</h1>
                        <p className="mt-3 text-2xl text-white opacity-80">
                          {headline || 'Premium Portfolio'}
                        </p>
                      </header>
                      {about && (
                        <section className="px-8 py-10 bg-white/10 backdrop-blur-lg">
                          <h2 className="mb-4 text-3xl font-semibold text-white">O mnie</h2>
                          <p className="mb-6 text-gray-300">{about}</p>
                          {aboutImage && (
                            <img
                              src={aboutImage}
                              alt="O mnie"
                              className="mx-auto mb-6 max-w-xs rounded-lg object-cover shadow-md"
                            />
                          )}
                        </section>
                      )}
                      {skills.length > 0 && (
                        <section className="px-8 py-10 bg-white/10 backdrop-blur-lg">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Umiejętności</h2>
                          <div className="flex flex-wrap gap-3">
                            {skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-gray-700 px-4 py-1 text-sm font-medium text-white"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                      {heroImage && (
                        <section className="px-8 py-10 bg-white/10 backdrop-blur-lg">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Hero</h2>
                          <img
                            src={heroImage}
                            alt="Hero"
                            className="mx-auto mb-6 max-w-full rounded-lg object-cover shadow-md"
                            style={{ height: '400px' }}
                          />
                        </section>
                      )}
                      {additionalImages.length > 0 && (
                        <section className="px-8 py-10 bg-white/10 backdrop-blur-lg">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Galeria</h2>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {additionalImages.map((url, idx) => (
                              <div key={idx} className="overflow-hidden rounded-lg shadow-lg">
                                <img
                                  src={url}
                                  alt={`Portfolio image ${idx + 1}`}
                                  className="h-48 w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {/* Sekcja Projekty */}
                      {projects.length > 0 && (
                        <section className="px-8 py-10 bg-white/10 backdrop-blur-lg">
                          <h2 className="mb-4 text-3xl font-semibold text-white">Projekty</h2>
                          <div className="space-y-8">
                            {projects.map((proj, pidx) => (
                              <div key={pidx}>
                                <h3 className="mb-2 text-2xl font-semibold text-white">{proj.title}</h3>
                                <p className="mb-4 text-gray-300">{proj.description}</p>
                                {proj.images.length > 0 && (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {proj.images.map((imgUrl, imgIdx) => (
                                      <div key={imgIdx} className="overflow-hidden rounded-lg shadow-lg">
                                        <img
                                          src={imgUrl}
                                          alt={`Projekt ${pidx + 1} - zdjęcie ${imgIdx + 1}`}
                                          className="h-48 w-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      <footer className="px-8 py-10 bg-white/10 backdrop-blur-lg" style={{ backgroundColor: secondaryColor }}>
                        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:justify-between">
                          <div className="space-y-2">
                            {contactEmail && (
                              <p className="text-base text-white">
                                <span className="font-semibold">Email: </span>
                                <a
                                  href={`mailto:${contactEmail}`}
                                  className="underline hover:text-gray-200 transition"
                                >
                                  {contactEmail}
                                </a>
                              </p>
                            )}
                            {contactPhone && (
                              <p className="text-base text-white">
                                <span className="font-semibold">Telefon: </span>
                                <a
                                  href={`tel:${contactPhone}`}
                                  className="underline hover:text-gray-200 transition"
                                >
                                  {contactPhone}
                                </a>
                              </p>
                            )}
                          </div>
                          <div className="flex gap-4 flex-wrap">
                            {Object.entries(socials).map(
                              ([platform, url]) =>
                                url && (
                                  <a
                                    key={platform}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base font-medium text-white hover:text-gray-200 transition"
                                  >
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                  </a>
                                )
                            )}
                          </div>
                        </div>
                        <div className="mt-6 text-center">
                          <button
                            className={`
                              px-6 py-3 text-base font-semibold text-white shadow transition
                              ${buttonStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'}
                            `}
                            style={{ backgroundColor: buttonColor, fontFamily }}
                          >
                            Przykładowy przycisk
                          </button>
                        </div>
                        <p className="mt-6 text-center text-sm text-gray-300">
                          &copy; {new Date().getFullYear()} {name || 'Twoje Imię'}. Wszystkie prawa zastrzeżone.
                        </p>
                      </footer>
                    </div>
                  )}

                  {templateId === 4 && (
                    // Podgląd „Na zamówienie” – proste CTA do kontaktu
                    <div className="min-h-[600px] bg-white/10 backdrop-blur-lg text-white">
                      <header className="flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700 py-16 px-8 text-center">
                        <div>
                          <h1 className="mb-2 text-5xl font-bold">{name || 'Twoje Portfolio'}</h1>
                          <p className="text-2xl opacity-80">{headline || 'Na zamówienie'}</p>
                        </div>
                      </header>
                      <div className="flex-grow flex items-center justify-center px-8 py-10">
                        <button
                          onClick={() => alert('Prośba o kontakt: wyślij zapytanie')}
                          className="rounded-lg bg-red-600 px-8 py-3 text-lg font-semibold text-white shadow hover:bg-red-700 transition"
                        >
                          Wyślij zapytanie
                        </button>
                      </div>
                      <footer className="bg-white/10 backdrop-blur-lg px-8 py-10 border-t border-white/20">
                        <p className="text-center text-sm text-gray-300">
                          &copy; {new Date().getFullYear()} {name || 'Twoje Imię'}. Bezpośredni kontakt w zakładce „Na zamówienie”.
                        </p>
                      </footer>
                    </div>
                  )}
                </div>

                {/* KROK 6: Przycisk „Zapisz/Zaktualizuj”, „Publikuj portfolio” i „Generuj stronę” */}
                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="inline-block rounded-lg bg-gray-700 px-6 py-2 text-base font-medium text-gray-300 shadow hover:bg-gray-600 transition"
                  >
                    &larr; Wróć do edycji
                  </button>
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <button
                        onClick={() => document.getElementById('realSubmitButton')?.click()}
                        className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-purple-700 hover:to-indigo-700 transition"
                      >
                        Zapisz zmiany
                      </button>
                    ) : (
                      <button
                        onClick={() => document.getElementById('realSubmitButton')?.click()}
                        className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-base font-medium text-white shadow hover:from-purple-700 hover:to-indigo-700 transition"
                      >
                        Utwórz portfolio
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => document.getElementById('realSubmitButton')?.click()}
                        className="rounded-lg bg-green-600 px-6 py-2 text-base font-medium text-white shadow hover:bg-green-700 transition"
                      >
                        Publikuj portfolio
                      </button>
                    )}
                    {currentSlug && (
                      <button
                        onClick={() => router.push(`/portfolio/${currentSlug}`)}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-base font-medium text-white shadow hover:bg-blue-700 transition"
                      >
                        Generuj stronę
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    form="fakeForm"
                    id="realSubmitButton"
                    className="hidden"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* --- UKRYTY FORMULARZ (wykorzystywany w kroku 6 do faktycznego submita) --- */}
            <form id="fakeForm" onSubmit={handleSubmit}></form>
          </>
        )}
      </div>
    </div>
  );
}
