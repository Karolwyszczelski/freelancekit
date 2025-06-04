// components/OfferAiForm.tsx
'use client'

import { useState, useRef } from 'react'
import { GlassCard } from './GlassCard'
import {
  LayoutTemplate,
  Feather,
  Stars,
  Briefcase,
  Lightbulb,
  Sparkles,
  X as CloseIcon,
} from 'lucide-react'

const TEMPLATES = [
  { key: 'modern',   name: 'Nowoczesny',      icon: <LayoutTemplate className="w-6 h-6 text-blue-400" /> },
  { key: 'minimal',  name: 'Minimalistyczny', icon: <Feather        className="w-6 h-6 text-purple-400" /> },
  { key: 'creative', name: 'Kreatywny',       icon: <Stars          className="w-6 h-6 text-pink-400" /> },
  { key: 'formal',   name: 'Formalny',        icon: <Briefcase      className="w-6 h-6 text-gray-600" /> },
  { key: 'startup',  name: 'Startupowy',      icon: <Lightbulb      className="w-6 h-6 text-yellow-400" /> },
]

const DEADLINE_OPTIONS = ['7 dni', '14 dni', '30 dni', 'Do uzgodnienia']
const PAYMENT_TERMS_OPTIONS = ['7 dni', '14 dni', 'Z góry', 'Po wykonaniu', 'Etapami', 'Zaliczka 30%']
const OFFER_VALIDITY_OPTIONS = ['7 dni', '14 dni', '30 dni', 'Do odwołania']

type FormState = {
  client:        string
  contact:       string
  email:         string
  service:       string
  pricing:       string
  template:      'modern' | 'minimal' | 'creative' | 'formal' | 'startup'
  scope:         string
  deliverables:  string
  deadline:      string
  paymentTerms:  string
  offerValidity: string
  notes:         string
}

const initialState: FormState = {
  client:        '',
  contact:       '',
  email:         '',
  service:       '',
  pricing:       '',
  template:      'modern',
  scope:         '',
  deliverables:  '',
  deadline:      '',
  paymentTerms:  '',
  offerValidity: '',
  notes:         '',
}

const OFFER_PROMPTS: Record<string, (d: FormState) => string> = {
  modern: (d) => `
Jesteś specjalistą od tworzenia ofert handlowych. Twoim zadaniem jest stworzenie profesjonalnej, nowoczesnej oferty w czystym HTML, bazującej na poniższych danych:

- Klient: ${d.client}
- Usługa: ${d.service}
- Zakres prac: ${d.scope || 'Brak'}
- Rezultaty: ${d.deliverables || 'Brak'}
- Cena: ${d.pricing}
- Termin realizacji: ${d.deadline || 'Do uzgodnienia'}
- Warunki płatności: ${d.paymentTerms || 'Do uzgodnienia'}
- Oferta ważna do: ${d.offerValidity || 'Do odwołania'}
- Dodatkowe notatki: ${d.notes || 'Brak'}

Wymagania:
1. Użyj wyłącznie elementów HTML (np. <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>).
2. Zadbaj o czytelny układ i wyraźne nagłówki.
3. Umieść sekcje: Wprowadzenie (krótkie opisanie, czym zajmuje się Twój zespół), Opis usługi, Zakres prac (w punktach), Rezultaty (w punktach lub krótkim akapicie), Cena (ze wskazaniem wartości i ewentualnego rozbicia), Termin realizacji, Warunki płatności, Okres ważności oferty, Dodatkowe notatki, Stopka (dane kontaktowe i zakończenie „Z poważaniem, Zespół”).
4. Zastosuj nowoczesne sformułowania – podkreśl innowacyjne podejście, korzyści dla klienta, przewagi konkurencyjne.
5. Całość ma być bogata w tekst opisujący zalety i wartość usługi, ale bez zbędnych ozdobników wizualnych (wszystko w czystym HTML).

Wygeneruj wynikowy kod HTML jako jedną całość, np.:
<h1>Oferta dla …</h1>
<p>…</p>
<ul>…</ul>
<…>
`.trim(),

  minimal: (d) => `
Jesteś specjalistą od tworzenia ofert handlowych. Twoim zadaniem jest stworzenie maksymalnie przejrzystej, minimalistycznej oferty w czystym HTML, bazującej na danych:

- Klient: ${d.client}
- Usługa: ${d.service}
- Zakres prac: ${d.scope || 'Brak'}
- Rezultaty: ${d.deliverables || 'Brak'}
- Cena: ${d.pricing}
- Termin realizacji: ${d.deadline || 'Do uzgodnienia'}
- Warunki płatności: ${d.paymentTerms || 'Do uzgodnienia'}
- Oferta ważna do: ${d.offerValidity || 'Do odwołania'}
- Dodatkowe notatki: ${d.notes || 'Brak'}

Wymagania:
1. Użyj tylko najprostszych tagów HTML: <h1>, <h2>, <p>, <ul>, <li>, <strong>.
2. Ogranicz liczbę elementów – zamiast wielopoziomowych nagłówków używaj tylko niezbędnych.
3. Całość powinna być stonowana, bez żadnych dodatkowych stylów czy skomplikowanych struktur.
4. Struktura dokumentu:
   <h1>Oferta dla {Klient}</h1>
   <p>[Krótkie zdanie wprowadzające – kim jesteśmy i dlaczego warto wybrać naszą usługę]</p>
   <h2>Usługa</h2>
   <p>{Usługa}</p>
   <h2>Zakres prac</h2>
   <ul>
     <li>{punkt 1}</li>
     <li>…</li>
   </ul>
   <h2>Rezultaty</h2>
   <p>{Rezultaty lub “Brak”}</p>
   <h2>Cena</h2>
   <p>{Cena}</p>
   <h2>Termin realizacji</h2>
   <p>{Termin}</p>
   <h2>Warunki płatności</h2>
   <p>{Warunki}</p>
   <h2>Oferta ważna do</h2>
   <p>{Data}</p>
   <h2>Dodatkowe notatki</h2>
   <p>{Notatki lub “Brak”}</p>
   <p><strong>Z poważaniem, Zespół</strong></p>
5. Tekst ma być bardzo krótki, ale zawierający wszystkie niezbędne informacje – eliminujemy ozdobniki, skupiamy się na faktach.

`.trim(),

  creative: (d) => `
Jesteś specjalistą od tworzenia ofert handlowych. Twoim zadaniem jest stworzenie kreatywnej, angażującej oferty w czystym HTML, wykorzystującej poniższe dane:

- Klient: ${d.client}
- Usługa: ${d.service}
- Zakres prac: ${d.scope || 'Brak'}
- Rezultaty: ${d.deliverables || 'Brak'}
- Cena: ${d.pricing}
- Termin realizacji: ${d.deadline || 'Do uzgodnienia'}
- Warunki płatności: ${d.paymentTerms || 'Do uzgodnienia'}
- Oferta ważna do: ${d.offerValidity || 'Do odwołania'}
- Dodatkowe notatki: ${d.notes || 'Brak'}

Wymagania:
1. Użyj elementów HTML: <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>, <blockquote> – ale bez CSS czy skryptów.
2. Zacznij od krótkiego, chwytliwego tytułu w <h1>, np. „Gotowi na rewolucję w {branża/usługa}?”.
3. W sekcji Opis usługi zastosuj storytelling – opisz problem klienta i proponujesz rozwiązanie (Twoja usługa).
4. W części Zakres prac użyj listy punktowanej (<ul> / <li>), ale wpleć w opisie elementy metafory, np. „Przeprowadzimy badanie niczym detektyw analizujący każdy szczegół...”.
5. Sekcja Rezultaty powinna zawierać nagłówek <h2> i krótki, kreatywny opis – np. „Rezultaty, które zrobią wrażenie:”.
6. Cena – przedstaw ją jako wartość inwestycji w rozwój, np. <p><strong>Cena inwestycji:</strong> {Cena}.</p>.
7. Harmonogram w formie prostego akapitu, ale w stylu dynamicznym, np. „Startujemy 15 czerwca 2025 – pełna gotowość w 4 tygodnie.”
8. Warunki płatności i okres ważności – podaj je w dwóch osobnych <p>, ale wpleć element motywacyjny, np. „Rezerwuj miejsce już dziś! Oferta ważna do {Data}.”
9. Dodatkowe notatki – użyj <blockquote> lub <em> dla podkreślenia ważnych uwag.
10. Zakończ stopką w <p> z podpisem „Z poważaniem, zespół pełen pasji”.

Całość powinna być zwięzła, ale pełna wyobraźni i emocji – klient musi poczuć, że to nie jest zwykła oferta, lecz zaproszenie do wspólnej przygody. 

`.trim(),

  formal: (d) => `
Jesteś specjalistą od tworzenia ofert handlowych. Twoim zadaniem jest przygotowanie formalnej, eleganckiej oferty w czystym HTML, wykorzystując poniższe dane:

- Klient: ${d.client}
- Usługa: ${d.service}
- Zakres prac: ${d.scope || 'Brak'}
- Rezultaty: ${d.deliverables || 'Brak'}
- Cena: ${d.pricing}
- Termin realizacji: ${d.deadline || 'Do uzgodnienia'}
- Warunki płatności: ${d.paymentTerms || 'Do uzgodnienia'}
- Oferta ważna do: ${d.offerValidity || 'Do odwołania'}
- Dodatkowe notatki: ${d.notes || 'Brak'}

Wymagania:
1. Zastosuj wyłącznie elementy HTML: <h1>, <h2>, <p>, <ul>, <li>, <strong>.
2. Używaj formalnego, uprzejmego stylu języka (bez potocznych zwrotów).
3. Struktura dokumentu:
   <h1>Oferta Handlowa</h1>
   <p>Szanowni Państwo,</p>
   <p>przedstawiamy ofertę dla: <strong>${d.client}</strong></p>
   <h2>1. Przedmiot oferty</h2>
   <p>Usługa: ${d.service}</p>
   <h2>2. Zakres prac</h2>
   <ul>
     ${d.scope && d.scope !== '' && d.scope !== 'Brak'
       ? d.scope
           .split('\n')
           .map((linia) => `<li>${linia}</li>`)
           .join('')
       : '<li>Zakres do uzgodnienia</li>'}
   </ul>
   <h2>3. Rezultaty</h2>
   <p>${d.deliverables && d.deliverables !== '' && d.deliverables !== 'Brak'
       ? d.deliverables
       : 'Rezultaty do określenia podczas konsultacji'}</p>
   <h2>4. Cena</h2>
   <p>${d.pricing}</p>
   <h2>5. Harmonogram</h2>
   <p>${d.deadline && d.deadline !== '' && d.deadline !== 'Do uzgodnienia'
       ? d.deadline
       : 'Termin do ustalenia'}</p>
   <h2>6. Warunki płatności</h2>
   <p>${d.paymentTerms && d.paymentTerms !== '' && d.paymentTerms !== 'Do uzgodnienia'
       ? d.paymentTerms
       : 'Warunki płatności do omówienia'}</p>
   <h2>7. Oferta ważna do</h2>
   <p>${d.offerValidity && d.offerValidity !== '' && d.offerValidity !== 'Do odwołania'
       ? d.offerValidity
       : 'Oferta ważna do odwołania'}</p>
   <h2>8. Dodatkowe notatki</h2>
   <p>${d.notes && d.notes !== '' && d.notes !== 'Brak'
       ? d.notes
       : 'Brak dodatkowych notatek'}</p>
   <p>Z poważaniem,<br>Zespół</p>
`.trim(),

  startup: (d) => `
Jesteś specjalistą od tworzenia ofert handlowych. Twoim zadaniem jest przygotowanie dynamicznej, startupowej oferty w czystym HTML, wykorzystując poniższe dane:

- Klient: ${d.client}
- Usługa: ${d.service}
- Zakres prac: ${d.scope || 'Brak'}
- Rezultaty: ${d.deliverables || 'Brak'}
- Cena: ${d.pricing}
- Termin realizacji: ${d.deadline || 'Do uzgodnienia'}
- Warunki płatności: ${d.paymentTerms || 'Do uzgodnienia'}
- Oferta ważna do: ${d.offerValidity || 'Do odwołania'}
- Dodatkowe notatki: ${d.notes || 'Brak'}

Wymagania:
1. Użyj elementów HTML: <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>.
2. Stylizacja powinna być energiczna i motywująca, bez zbędnych formalności.
3. Struktura dokumentu:
   <h1>Hey ${d.client}!</h1>
   <p>Przygotowaliśmy dla Ciebie ofertę na <strong>${d.service}</strong>, którą znajdziesz poniżej:</p>
   <h2>Co i jak?</h2>
   <p>Zakres prac:</p>
   <ul>
     ${d.scope && d.scope !== '' && d.scope !== 'Brak'
       ? d.scope
           .split('\n')
           .map((linia) => `<li>${linia}</li>`)
           .join('')
       : '<li>Zakres do uzgodnienia</li>'}
   </ul>
   <h2>Dlaczego warto?</h2>
   <p>Rezultaty, których możesz się spodziewać:</p>
   <ul>
     ${d.deliverables && d.deliverables !== '' && d.deliverables !== 'Brak'
       ? d.deliverables
           .split('\n')
           .map((linia) => `<li>${linia}</li>`)
           .join('')
       : '<li>Rezultaty do określenia podczas konsultacji</li>'}
   </ul>
   <h2>Ile to kosztuje?</h2>
   <p><strong>${d.pricing}</strong> – inwestycja w rozwój Twojego projektu.</p>
   <h2>Kiedy start?</h2>
   <p>${d.deadline && d.deadline !== '' && d.deadline !== 'Do uzgodnienia'
       ? d.deadline
       : 'Termin do ustalenia'}.</p>
   <h2>Płatności</h2>
   <p>${d.paymentTerms && d.paymentTerms !== '' && d.paymentTerms !== 'Do uzgodnienia'
       ? d.paymentTerms
       : 'Warunki płatności do omówienia'}</p>
   <h2>Oferta ważna do</h2>
   <p>${d.offerValidity && d.offerValidity !== '' && d.offerValidity !== 'Do odwołania'
       ? d.offerValidity
       : 'Oferta ważna do odwołania'}</p>
   <h2>Kilka słów na koniec</h2>
   <p>${d.notes && d.notes !== '' && d.notes !== 'Brak'
       ? d.notes
       : 'Brak dodatkowych notatek'}</p>
   <p><em>Zespół pełen pasji czeka na start!</em></p>
   <p><strong>Z poważaniem,<br>Zespół</strong></p>
`.trim(),
};

export default function OfferAiForm({
  onOfferSaved,
}: {
  onOfferSaved?: (offer: any | null) => void
}) {
  const [form, setForm]       = useState<FormState>(initialState)
  const [step, setStep]       = useState<1 | 2>(1)
  const [offer, setOffer]     = useState<string>('')
  const [error, setError]     = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }))
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1) WALIDACJA
    const requiredFields: (keyof FormState)[] = [
      'client', 'contact', 'email', 'service', 'pricing'
    ]
    if (requiredFields.some((k) => !form[k])) {
      setError('Wszystkie pola oznaczone * są wymagane.')
      setLoading(false)
      return
    }

    // 2) BUDUJEMY PLAIN‐TEXT PROMPT
    const textPrompt = OFFER_PROMPTS[form.template](form)

    try {
      // 3) WYŚLIJ PROMPT DO BACKENDU
      const res = await fetch('/api/generate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textPrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd generowania oferty AI.')

      // 4) USTAWIAMY WYNIK AI (TYLKO data.offer!)
      setOffer(data.offer.trim())
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          offer_content: offer,
          created_at: new Date().toISOString(),
          status: 'nowa',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onOfferSaved?.(data)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleDownloadPDF = async () => {
    if (!ref.current) return
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .set({
        filename: 'oferta.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(ref.current)
      .save()
  }

  const closeModal = () => {
    setForm(initialState)
    setOffer('')
    setStep(1)
    setError('')
    onOfferSaved?.(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <GlassCard className="relative w-full max-w-3xl max-h-[95vh] overflow-y-auto text-black p-6">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-900"
          aria-label="Zamknij"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          Kreator Oferty AI
        </h2>

        {step === 1 && (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex gap-4">
              {TEMPLATES.map((t) => (
                <label
                  key={t.key}
                  className={`
                    p-3 rounded-xl border cursor-pointer flex-1 text-center
                    ${form.template === t.key ? 'bg-white border-blue-500' : 'bg-white/50'}
                  `}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.key}
                    checked={form.template === t.key}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1">
                    {t.icon}
                    <span className="text-sm font-semibold">{t.name}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                name="client"
                value={form.client}
                onChange={handleChange}
                required
                placeholder="Nazwa firmy"
                className="p-2 rounded border bg-white/90"
              />
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                required
                placeholder="Kontakt (osoba/telefon)"
                className="p-2 rounded border bg-white/90"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="E-mail"
                type="email"
                className="col-span-2 p-2 rounded border bg-white/90"
              />
            </div>

            <input
              name="service"
              value={form.service}
              onChange={handleChange}
              required
              placeholder="Usługa / Produkt"
              className="w-full p-2 rounded border bg-white/90"
            />
            <input
              name="scope"
              value={form.scope}
              onChange={handleChange}
              placeholder="Zakres prac (opcjonalnie)"
              className="w-full p-2 rounded border bg-white/90"
            />
            <input
              name="deliverables"
              value={form.deliverables}
              onChange={handleChange}
              placeholder="Rezultaty (opcjonalnie)"
              className="w-full p-2 rounded border bg-white/90"
            />
            <input
              name="pricing"
              value={form.pricing}
              onChange={handleChange}
              required
              placeholder="Cena (np. 2500 PLN)"
              className="w-full p-2 rounded border bg-white/90"
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full p-2 rounded border bg-white/90"
              >
                <option value="">Termin realizacji</option>
                {DEADLINE_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <select
                name="paymentTerms"
                value={form.paymentTerms}
                onChange={handleChange}
                className="w-full p-2 rounded border bg-white/90"
              >
                <option value="">Warunki płatności</option>
                {PAYMENT_TERMS_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <select
                name="offerValidity"
                value={form.offerValidity}
                onChange={handleChange}
                className="w-full p-2 rounded border bg-white/90"
              >
                <option value="">Oferta ważna do</option>
                {OFFER_VALIDITY_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Dodatkowe notatki (opcjonalnie)"
              className="w-full p-2 rounded border bg-white/90 min-h-[80px]"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              {loading ? 'Generuję...' : 'Wygeneruj ofertę'}
            </button>
            {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStep(1)}
                className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
              >
                Cofnij do edycji
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Nowa
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Zapisz
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
              >
                Pobierz PDF
              </button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* TU WYŚWIETLAMY TYLKO odp AI (data.offer), nie prompt! */}
            <div
              ref={ref}
              className="bg-white rounded shadow-inner text-black p-4 whitespace-pre-wrap font-sans text-base leading-relaxed overflow-auto"
              style={{
                width: '210mm',    // szerokość A4
    minHeight: '297mm', // wysokość A4
    boxSizing: 'border-box',
              }}
            >
              {offer}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
