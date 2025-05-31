'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { PortfolioData } from '@/types/portfolio';

// 1. Definicja schematu formularza krok 1 (dane podstawowe)
const Step1Schema = z.object({
  name: z.string().nonempty('Imię i nazwisko jest wymagane'),
  tagline: z.string().nonempty('Krótki opis / motto jest wymagane'),
  template: z.enum(['minimal', 'modern'], 'Wybierz szablon'),
});

// 2. Schemat formularza krok 2 (bio + sekcje początkowe)
interface Step2Inputs {
  bio: string;
  sectionTitles: string[]; // np. ["Projekty", "Kontakt"]
  sectionContents: string[]; // HTML lub Markdown
}

// 3. Schemat formularza krok 3 (upload obrazków do sekcji)
interface Step3Inputs {
  // Tablica obiektów: { sectionIndex, files: FileList }
  images: { sectionIndex: number; files: FileList | null }[];
}

// 4. Schemat formularza krok 4 (social + extras)
const Step4Schema = z.object({
  linkedin: z.string().url('Nieprawidłowy link do LinkedIn').optional(),
  github: z.string().url('Nieprawidłowy link do GitHub').optional(),
  twitter: z.string().url('Nieprawidłowy link do Twitter').optional(),
  facebook: z.string().url('Nieprawidłowy link do Facebook').optional(),
  instagram: z.string().url('Nieprawidłowy link do Instagram').optional(),
  showDownloadCV: z.boolean(),
  cvFile: z
    .any()
    .refine((f) => !f || (f instanceof FileList && f.length === 1 && f[0].type === 'application/pdf'), {
      message: 'Dozwolony tylko 1 plik PDF',
    })
    .optional(),
  darkMode: z.boolean(),
});

type Step1Form = z.infer<typeof Step1Schema>;
type Step4Form = z.infer<typeof Step4Schema>;

export default function NewPortfolioWizard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [step, setStep] = useState(1);

  // Do przechowywania kolejnych kroków w stanie lokalnym
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Inputs | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Inputs | null>(null);
  const [step4Data, setStep4Data] = useState<Step4Form | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formularze react-hook-form dla poszczególnych kroków
  const {
    register: reg1,
    handleSubmit: handleSubmit1,
    formState: { errors: errors1 },
    watch: watch1,
  } = useForm<Step1Form>({ resolver: zodResolver(Step1Schema) });

  const {
    register: reg4,
    handleSubmit: handleSubmit4,
    formState: { errors: errors4 },
  } = useForm<Step4Form>({ resolver: zodResolver(Step4Schema), defaultValues: { showDownloadCV: false, darkMode: false } });

  useEffect(() => {
    if (!user && status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [user, status, router]);

  if (!user || status !== 'authenticated') {
    return <p className="text-center mt-20">Ładuję...</p>;
  }

  // Krok 1: dane podstawowe
  const onSubmitStep1: SubmitHandler<Step1Form> = (data) => {
    setStep1Data(data);
    setStep(2);
  };

  // Krok 2: dodawanie bio + dynamiczne sekcje
  const [sectionCount, setSectionCount] = useState(1);
  const [sectionTitles, setSectionTitles] = useState<string[]>(['Projekty']);
  const [sectionContents, setSectionContents] = useState<string[]>(['']); // zwykły <textarea> z HTML/Markdown

  const handleStep2Next = () => {
    if (!sectionTitles.every((t) => t.trim())) {
      setError('Uzupełnij wszystkie tytuły sekcji');
      return;
    }
    if (!sectionContents.every((c) => c.trim())) {
      setError('Uzupełnij treść wszystkich sekcji');
      return;
    }
    setStep2Data({ bio: bioText, sectionTitles, sectionContents });
    setError(null);
    setStep(3);
  };

  const [bioText, setBioText] = useState('');
  const addSection = () => {
    if (sectionCount >= 5) return; // maksymalnie 5 sekcji
    setSectionCount((c) => c + 1);
    setSectionTitles((prev) => [...prev, '']);
    setSectionContents((prev) => [...prev, '']);
  };
  const removeSection = (idx: number) => {
    if (sectionCount <= 1) return;
    setSectionCount((c) => c - 1);
    setSectionTitles((prev) => prev.filter((_, i) => i !== idx));
    setSectionContents((prev) => prev.filter((_, i) => i !== idx));
  };

  // Krok 3: upload obrazków do sekcji
  // Przechowujemy tablicę obiektów { sectionIndex, files: FileList | null }
  const [imagesData, setImagesData] = useState<{ sectionIndex: number; files: FileList | null }[]>(
    Array.from({ length: sectionCount }, (_, idx) => ({ sectionIndex: idx, files: null }))
  );

  useEffect(() => {
    // gdy zmienia się liczba sekcji, dopasuj długość imagesData
    setImagesData(Array.from({ length: sectionCount }, (_, idx) => imagesData[idx] || { sectionIndex: idx, files: null }));
  }, [sectionCount]);

  const handleImageChange = (idx: number, files: FileList | null) => {
    setImagesData((prev) =>
      prev.map((item) => (item.sectionIndex === idx ? { ...item, files } : item))
    );
  };

  const handleStep3Next = () => {
    setStep3Data({ images: imagesData });
    setStep(4);
  };

  // Krok 4: social + CV + darkMode, potem generacja
  const onSubmitStep4: SubmitHandler<Step4Form> = async (data) => {
    if (!step1Data || !step2Data || !step3Data) {
      setError('Brakuje danych z poprzednich kroków');
      return;
    }

    setIsCreating(true);
    try {
      // 1) Sprawdź liczbę portfolio użytkownika
      const { data: countData } = await supabase
        .from('portfolios')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if ((countData as any)?.length >= 3) {
        setError('Osiągnąłeś limit 3 portfolio. Usuń jedno, aby utworzyć nowe.');
        setIsCreating(false);
        return;
      }

      // 2) Wygeneruj unikalny slug na podstawie imienia i nazwiska
      const baseSlug = step1Data.name.trim().replace(/\s+/g, '-');
      let slug = baseSlug;
      // sprawdzenie unikalności
      let i = 0;
      while (true) {
        const { data: exists } = await supabase
          .from('portfolios')
          .select('id')
          .eq('slug', slug)
          .single();
        if (!exists) break;
        i += 1;
        slug = `${baseSlug}-${i}`;
      }

      // 3) Upload plików zdjęć do Supabase Storage (bucket: 'portfolio-images')
      // Zwrócimy tablicę URLi, pod którymi będą dostępne obrazki.
      const imagesUrls: Record<number, string[]> = {}; // key: sectionIndex, value: tablica URL
      for (const item of step3Data.images) {
        if (item.files && item.files.length > 0) {
          imagesUrls[item.sectionIndex] = []; // inicjalizuj tablicę
          for (let f = 0; f < item.files.length; f++) {
            const file = item.files[f];
            // ścieżka w storage: "userId/portfolioSlug/sectionIdx/uuid.png"
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${user.id}/${slug}/section-${item.sectionIndex}/${fileName}`;
            const { error: upErr } = await supabase.storage
              .from('portfolio-images')
              .upload(filePath, file);
            if (upErr) {
              console.error('Błąd uploadu pliku:', upErr.message);
            } else {
              // Generuj publiczny link
              const { data: urlData } = supabase.storage
                .from('portfolio-images')
                .getPublicUrl(filePath);
              imagesUrls[item.sectionIndex].push(urlData.publicUrl);
            }
          }
        } else {
          imagesUrls[item.sectionIndex] = [];
        }
      }

      // 4) Upload CV (jeśli zaznaczone)
      let cvPublicUrl: string | undefined = undefined;
      if (data.showDownloadCV && data.cvFile && data.cvFile.length === 1) {
        const cvFileObj = data.cvFile[0];
        const cvFileName = `${uuidv4()}.pdf`;
        const cvPath = `${user.id}/${slug}/cv/${cvFileName}`;
        const { error: cvErr } = await supabase.storage
          .from('portfolio-images')
          .upload(cvPath, cvFileObj);
        if (!cvErr) {
          const { data: urlData } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(cvPath);
          cvPublicUrl = urlData.publicUrl;
        }
      }

      // 5) Zbuduj obiekt PortfolioData
      const sections: SectionData[] = step2Data.sectionTitles.map((title, idx) => ({
        id: uuidv4(),
        title,
        content: step2Data.sectionContents[idx],
        imageUrls: imagesUrls[idx] || [],
      }));

      const portfolioData: PortfolioData = {
        name: step1Data.name,
        tagline: step1Data.tagline,
        bio: step2Data.bio,
        sections,
        socials: {
          linkedin: data.linkedin,
          github: data.github,
          twitter: data.twitter,
          facebook: data.facebook,
          instagram: data.instagram,
        },
        extras: {
          showDownloadCV: data.showDownloadCV,
          cvUrl: cvPublicUrl,
          darkMode: data.darkMode,
        },
      };

      // 6) Zapytanie do Supabase: INSERT
      const { error: insertErr } = await supabase.from('portfolios').insert({
        user_id: user.id,
        slug,
        title: `${step1Data.name} – Portfolio`,
        template: step1Data.template,
        data: portfolioData,
      });

      if (insertErr) {
        console.error('Błąd zapisu portfolio:', insertErr.message);
        setError('Wystąpił błąd podczas zapisu portfolio.');
        setIsCreating(false);
        return;
      }

      // 7) Przekieruj na stronę panelu: np. edycja albo od razu podgląd
      router.push(`/portfolio/${slug}`);
    } catch (e) {
      console.error(e);
      setError('Wystąpił nieoczekiwany błąd.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">Kreator One-Page Portfolio</h1>

        {/* Pasek postępu */}
        <div className="flex items-center mb-8">
          {['1', '2', '3', '4'].map((num, idx) => (
            <div key={num} className="flex-1">
              <div
                className={`mx-auto h-10 w-10 flex items-center justify-center rounded-full ${
                  step === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {num}
              </div>
              {idx < 3 && (
                <div className="h-1 bg-gray-300 -mt-1" style={{ width: '100%' }} />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* KROK 1 */}
        {step === 1 && (
          <form onSubmit={handleSubmit1(onSubmitStep1)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Imię i nazwisko</label>
              <input
                type="text"
                {...reg1('name')}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors1.name && <p className="text-red-500 text-sm mt-1">{errors1.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Krótki opis / Motto</label>
              <input
                type="text"
                {...reg1('tagline')}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors1.tagline && (
                <p className="text-red-500 text-sm mt-1">{errors1.tagline.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Wybierz szablon</label>
              <select
                {...reg1('template')}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--- Wybierz ---</option>
                <option value="minimal">Minimalistyczny</option>
                <option value="modern">Nowoczesny</option>
              </select>
              {errors1.template && (
                <p className="text-red-500 text-sm mt-1">{errors1.template.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Dalej ➔
              </button>
            </div>
          </form>
        )}

        {/* KROK 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">O mnie (HTML)</label>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={5}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Sekcje strony</h3>
              <p className="text-sm text-gray-500 mb-4">
                Dodaj maksymalnie 5 sekcji (np. „Projekty”, „Kontakt”). Wypełnij tytuł i treść (HTML/Markdown).
              </p>
              {[...Array(sectionCount)].map((_, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Sekcja #{idx + 1}</p>
                    {sectionCount > 1 && (
                      <button
                        onClick={() => removeSection(idx)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                  <label className="block text-sm font-medium text-gray-700">Tytuł</label>
                  <input
                    type="text"
                    value={sectionTitles[idx]}
                    onChange={(e) =>
                      setSectionTitles((prev) => prev.map((t, i) => (i === idx ? e.target.value : t)))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="block text-sm font-medium text-gray-700 mt-3">Treść (HTML lub Markdown)</label>
                  <textarea
                    value={sectionContents[idx]}
                    onChange={(e) =>
                      setSectionContents((prev) => prev.map((c, i) => (i === idx ? e.target.value : c)))
                    }
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              {sectionCount < 5 && (
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Dodaj kolejną sekcję
                </button>
              )}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ◀ Wstecz
              </button>
              <button
                onClick={handleStep2Next}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Dalej ➔
              </button>
            </div>
          </div>
        )}

        {/* KROK 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Dodaj zdjęcia do sekcji</h2>
            <p className="text-sm text-gray-500">Dla każdej sekcji możesz wgrać kilka plików PNG/JPG.</p>
            {imagesData.map((itm, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium mb-2">Sekcja #{idx + 1}: {sectionTitles[idx]}</p>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  multiple
                  onChange={(e) => handleImageChange(idx, e.target.files)}
                />
              </div>
            ))}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ◀ Wstecz
              </button>
              <button
                onClick={handleStep3Next}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Dalej ➔
              </button>
            </div>
          </div>
        )}

        {/* KROK 4 */}
        {step === 4 && (
          <form onSubmit={handleSubmit4(onSubmitStep4)} className="space-y-6">
            <h2 className="text-lg font-semibold">Dane kontaktowe i dodatki</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                <input
                  type="url"
                  {...reg4('linkedin')}
                  placeholder="https://linkedin.com/in/..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors4.linkedin && <p className="text-red-500 text-sm mt-1">{errors4.linkedin.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GitHub</label>
                <input
                  type="url"
                  {...reg4('github')}
                  placeholder="https://github.com/..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors4.github && <p className="text-red-500 text-sm mt-1">{errors4.github.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Twitter</label>
                <input
                  type="url"
                  {...reg4('twitter')}
                  placeholder="https://twitter.com/..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors4.twitter && <p className="text-red-500 text-sm mt-1">{errors4.twitter.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Facebook</label>
                <input
                  type="url"
                  {...reg4('facebook')}
                  placeholder="https://facebook.com/..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors4.facebook && <p className="text-red-500 text-sm mt-1">{errors4.facebook.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Instagram</label>
                <input
                  type="url"
                  {...reg4('instagram')}
                  placeholder="https://instagram.com/..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors4.instagram && <p className="text-red-500 text-sm mt-1">{errors4.instagram.message}</p>}
              </div>
            </div>

            {/* Checkbox: Pobierz CV */}
            <div className="flex items-center space-x-3">
              <input type="checkbox" {...reg4('showDownloadCV')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label className="text-sm text-gray-700">Chcę dodać przycisk pobrania CV (PDF)</label>
            </div>
            {watch1 && watch1.showDownloadCV && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Wgraj plik CV (PDF)</label>
                <input type="file" accept="application/pdf" {...reg4('cvFile')} className="mt-1" />
                {errors4.cvFile && <p className="text-red-500 text-sm mt-1">{errors4.cvFile.message}</p>}
              </div>
            )}

            {/* Checkbox: Dark Mode */}
            <div className="flex items-center space-x-3">
              <input type="checkbox" {...reg4('darkMode')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label className="text-sm text-gray-700">Włącz tryb ciemny (Dark Mode)</label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ◀ Wstecz
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isCreating ? 'Generuję...' : 'Generuj swoje portfolio'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
