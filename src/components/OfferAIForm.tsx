'use client';
import { useState, useRef } from 'react';
import { Sparkles, LayoutTemplate, Feather, Stars } from 'lucide-react';
import { marked } from "marked";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// === SZABLONY OFERTY ===
const TEMPLATES = [
  { key: "modern", name: "Nowoczesny", icon: <LayoutTemplate className="w-7 h-7 text-blue-400" /> },
  { key: "minimal", name: "Minimalistyczny", icon: <Feather className="w-7 h-7 text-purple-400" /> },
  { key: "creative", name: "Kreatywny", icon: <Stars className="w-7 h-7 text-pink-400" /> }
];

// === WARTOŚCI DOMYŚLNE DLA SELECTÓW ===
const PAYMENT_TERMS_OPTIONS = [
  "7 dni", "14 dni", "Płatność z góry", "Płatność etapami", "Zaliczka 30%", "Po wykonaniu usługi", "Inne"
];
const DEADLINE_OPTIONS = [
  "7 dni", "14 dni", "30 dni", "Do uzgodnienia", "Inne"
];
const OFFER_VALIDITY_OPTIONS = [
  "7 dni", "14 dni", "30 dni", "Do odwołania", "Inne"
];

// === PROMPTY ===
const OFFER_PROMPTS: Record<string, (d: any) => string> = {
  modern: (d) => `
Jesteś nowoczesnym doradcą biznesowym. Twoim zadaniem jest wygenerowanie profesjonalnej, atrakcyjnej oferty usługowej, zwięzłej i skoncentrowanej na potrzebach klienta. 
Stwórz ofertę dla firmy: "${d.client}" (${d.contact}, ${d.email}). 
Opis oferty: "${d.service}". 
Zakres: "${d.scope || '(brak)'}". Rezultaty: "${d.deliverables || '(brak)'}". 
Cena/rozliczenie: "${d.pricing}". 
Warunki płatności: "${d.paymentTerms || '(brak)'}". 
Termin realizacji: "${d.deadline || '(brak)'}". 
Ważność oferty: "${d.offerValidity || '(brak)'}". 
Dodatkowe notatki: "${d.notes || '(brak)'}".
Wygeneruj ofertę w stylu nowoczesnym, z jasnym nagłówkiem, krótkim wstępem i z konkretnymi punktami (może być podział na sekcje: Zakres, Rezultaty, Cena, Terminy, Warunki, Kontakt).
Wyświetl całość w języku polskim, dbając o pozytywny, profesjonalny ton.
`,

  minimal: (d) => `
Przygotuj minimalistyczną, bardzo czytelną i konkretną ofertę dla klienta biznesowego. 
Klient: "${d.client}", Kontakt: ${d.contact}, Email: ${d.email}
Usługa/Produkt: "${d.service}"
Zakres: "${d.scope || '(brak)'}"
Rezultaty: "${d.deliverables || '(brak)'}"
Rozliczenie: "${d.pricing}"
Płatność: "${d.paymentTerms || '(brak)'}"
Termin: "${d.deadline || '(brak)'}"
Oferta ważna do: "${d.offerValidity || '(brak)'}"
Notatki: "${d.notes || '(brak)'}"
Stwórz przejrzystą ofertę – tylko niezbędne informacje, sekcje oddzielone nagłówkami, bez rozbudowanego języka. Zakończ krótkim, profesjonalnym zaproszeniem do współpracy.
`,

  creative: (d) => `
Stwórz kreatywną, unikalną ofertę współpracy, która przyciągnie uwagę i będzie zapamiętana. 
Klient: "${d.client}", Kontakt: ${d.contact}, Email: ${d.email}
Usługa: "${d.service}"
Zakres: "${d.scope || '(brak)'}"
Rezultaty: "${d.deliverables || '(brak)'}"
Cena: "${d.pricing}"
Warunki płatności: "${d.paymentTerms || '(brak)'}"
Termin realizacji: "${d.deadline || '(brak)'}"
Ważność oferty: "${d.offerValidity || '(brak)'}"
Dodatkowe notatki: "${d.notes || '(brak)'}"
Nie bój się swobodnego tonu – możesz użyć metafor, storytellingu lub nawet dodać kreatywny akcent graficzny (np. emoji lub symboliczne akapity). Oferta musi być zwięzła, ale wyróżniać się w tłumie. Język polski.
`
}

// === INITIAL STATE FORMULARZA ===
const initialState = {
  client: "",
  contact: "",
  email: "",
  service: "",
  pricing: "",
  template: "modern",
  scope: "",
  deliverables: "",
  deadline: "",
  deadlineOther: "",
  paymentTerms: "",
  paymentTermsOther: "",
  offerValidity: "",
  offerValidityOther: "",
  notes: "",
}

export default function OfferAiForm({ onOfferSaved }: { onOfferSaved?: (offer: any) => void }) {
  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [offer, setOffer] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [step, setStep] = useState<1 | 2>(1)
  const ref = useRef<HTMLDivElement>(null)

  // Obsługa selectów z polem "Inne"
  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'deadline' && value !== 'Inne') setForm(f => ({ ...f, deadlineOther: "" }))
    if (name === 'paymentTerms' && value !== 'Inne') setForm(f => ({ ...f, paymentTermsOther: "" }))
    if (name === 'offerValidity' && value !== 'Inne') setForm(f => ({ ...f, offerValidityOther: "" }))
  }

  // GENEROWANIE OFERTY AI
  const handleGenerate = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setOffer("")
    setError("")
    // "Inne" lub wybrana wartość
    const prompt = OFFER_PROMPTS[form.template]({
      ...form,
      deadline: form.deadline === "Inne" ? form.deadlineOther : form.deadline,
      paymentTerms: form.paymentTerms === "Inne" ? form.paymentTermsOther : form.paymentTerms,
      offerValidity: form.offerValidity === "Inne" ? form.offerValidityOther : form.offerValidity,
    })
    try {
      const res = await fetch("/api/generate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Błąd generowania")
      setOffer(data.offer ?? "")
      setStep(2)
    } catch (err: any) {
      setError(err.message || "Błąd generowania oferty.")
    }
    setLoading(false)
  }

  // ZAPIS DO BAZY (np. Supabase)
  const handleSave = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline === "Inne" ? form.deadlineOther : form.deadline,
          paymentTerms: form.paymentTerms === "Inne" ? form.paymentTermsOther : form.paymentTerms,
          offerValidity: form.offerValidity === "Inne" ? form.offerValidityOther : form.offerValidity,
          offer_content: offer,
          created_at: new Date().toISOString(),
          status: "nowa"
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Błąd zapisu.")
      if (onOfferSaved) onOfferSaved(data)
    } catch (err: any) {
      setError(err.message || "Błąd zapisu.")
    }
    setLoading(false)
  }

  // POBIERZ PDF
 const handleDownloadPDF = async () => {
  if (!ref.current) return;
  // Dodaj klasę
  ref.current.classList.add("pdf-version");
  // import html2pdf.js dynamicznie
  const imported = await import("html2pdf.js");
  const html2pdf = imported.default || imported;
  // Wygeneruj PDF
  await html2pdf().from(ref.current).set({ filename: "oferta.pdf" }).save();
  // Usuń klasę
  ref.current.classList.remove("pdf-version");
};

  // RESET
  const reset = () => {
    setForm(initialState)
    setOffer("")
    setError("")
    setStep(1)
  }

  // ================
  //   RENDER KOMPONENTU
  // ================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="
          bg-gradient-to-br from-white/30 to-purple-100/40
          p-4 sm:p-6 rounded-2xl shadow-2xl
          w-full max-w-lg sm:max-w-2xl
          border border-white/30 backdrop-blur-2xl
          relative mx-2 sm:mx-0
          max-h-[95vh] overflow-y-auto
          flex flex-col
        "
        style={{ minHeight: 0, minWidth: 0 }}
      >
        <button onClick={reset} className="absolute right-4 top-4 text-gray-600 hover:text-black text-xl">×</button>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-blue-400" /> Kreator oferty AI
        </h2>
        <div className="mb-3 bg-blue-50/60 text-blue-900 px-4 py-2 rounded-xl text-sm">
          Im więcej szczegółów uzupełnisz, tym lepszą i bardziej dopasowaną ofertę wygeneruje AI.<br />
          <span className="text-blue-500 font-semibold">
            Wskazówka: Kontakt, zakres, rezultaty, warunki płatności, ważność i deadline – to bardzo ważne pola dla profesjonalnej oferty!
          </span>
        </div>
        {/* STEP 1: FORM */}
        {step === 1 && (
          <form onSubmit={handleGenerate} className="space-y-3">
            {/* Szablony */}
            <div>
              <div className="font-semibold mb-2">Szablon oferty</div>
              <div className="flex gap-4 mb-2">
                {TEMPLATES.map(t => (
                  <label key={t.key}
                    className={`flex flex-col items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border-2 transition 
                      ${form.template === t.key ? "border-blue-500 bg-white/70" : "border-transparent bg-white/30 hover:border-blue-300"}`}>
                    <input
                      type="radio"
                      name="template"
                      value={t.key}
                      checked={form.template === t.key}
                      onChange={handleChange}
                      className="hidden"
                    />
                    {t.icon}
                    <span className={`text-sm font-medium ${form.template === t.key ? "text-blue-600" : "text-gray-700"}`}>
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Dane klienta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="p-2 rounded-xl bg-white/70 shadow-inner" name="client" value={form.client} onChange={handleChange} placeholder="Nazwa firmy klienta*" required />
              <input className="p-2 rounded-xl bg-white/70 shadow-inner" name="contact" value={form.contact} onChange={handleChange} placeholder="Osoba kontaktowa*" required />
              <input className="p-2 rounded-xl bg-white/70 shadow-inner sm:col-span-2" name="email" value={form.email} onChange={handleChange} placeholder="E-mail klienta*" required type="email" />
            </div>
            <input className="w-full p-2 rounded-xl bg-white/70 shadow-inner" name="service" value={form.service} onChange={handleChange} placeholder="Usługa/produkt*" required />

            {/* Krótkie selecty - 2 kolumny */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Warunki płatności */}
              <div>
                <select
                  name="paymentTerms"
                  className="w-full p-2 rounded-xl bg-white/70 shadow-inner"
                  value={form.paymentTerms}
                  onChange={handleChange}
                >
                  <option value="">Warunki płatności (np. 7 dni, zaliczka)</option>
                  {PAYMENT_TERMS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {form.paymentTerms === "Inne" && (
                  <input
                    name="paymentTermsOther"
                    className="w-full p-2 rounded-xl bg-white/70 shadow-inner mt-2"
                    value={form.paymentTermsOther}
                    onChange={handleChange}
                    placeholder="Wpisz własne warunki płatności"
                  />
                )}
              </div>
              {/* Termin realizacji */}
              <div>
                <select
                  name="deadline"
                  className="w-full p-2 rounded-xl bg-white/70 shadow-inner"
                  value={form.deadline}
                  onChange={handleChange}
                >
                  <option value="">Termin realizacji (data lub widełki)</option>
                  {DEADLINE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {form.deadline === "Inne" && (
                  <input
                    name="deadlineOther"
                    className="w-full p-2 rounded-xl bg-white/70 shadow-inner mt-2"
                    value={form.deadlineOther}
                    onChange={handleChange}
                    placeholder="Wpisz własny termin"
                  />
                )}
              </div>
              {/* Oferta ważna do */}
              <div className="sm:col-span-2">
                <select
                  name="offerValidity"
                  className="w-full p-2 rounded-xl bg-white/70 shadow-inner"
                  value={form.offerValidity}
                  onChange={handleChange}
                >
                  <option value="">Oferta ważna do...</option>
                  {OFFER_VALIDITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {form.offerValidity === "Inne" && (
                  <input
                    name="offerValidityOther"
                    className="w-full p-2 rounded-xl bg-white/70 shadow-inner mt-2"
                    value={form.offerValidityOther}
                    onChange={handleChange}
                    placeholder="Wpisz własną datę lub okres"
                  />
                )}
              </div>
            </div>

            {/* Pola długie - jedna kolumna */}
            <input className="w-full p-2 rounded-xl bg-white/70 shadow-inner" name="scope" value={form.scope} onChange={handleChange} placeholder="Zakres prac / etapy / elementy oferty" />
            <input className="w-full p-2 rounded-xl bg-white/70 shadow-inner" name="deliverables" value={form.deliverables} onChange={handleChange} placeholder="Rezultaty: co klient dostanie (np. liczba postów, makiety, strategia)" />
            <input className="w-full p-2 rounded-xl bg-white/70 shadow-inner" name="pricing" value={form.pricing} onChange={handleChange} placeholder="Wycena / rozliczenie (kwota lub zasady)" required />
            <textarea className="w-full p-2 rounded-xl bg-white/70 shadow-inner min-h-[48px] resize-y" name="notes" value={form.notes} onChange={handleChange} placeholder="Dodatkowe uwagi, notatki, szczególne wymagania (opcjonalnie)" />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-500 text-white px-6 py-2 rounded-xl shadow font-semibold hover:bg-blue-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> {loading ? "Generowanie..." : "Wygeneruj ofertę AI"}
              </button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </form>
        )}
        {/* STEP 2: PREVIEW */}
        {step === 2 && (
          <div>
            <div className="flex gap-2 mb-2 flex-wrap">
              <button type="button" onClick={reset} className="py-2 px-4 bg-gray-200 rounded-xl hover:bg-gray-300">Nowa oferta</button>
              <button type="button" onClick={handleSave} className="py-2 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-lg" disabled={loading}>Zapisz</button>
              <button type="button" onClick={handleDownloadPDF} className="py-2 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 shadow-lg">Pobierz PDF</button>
            </div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <div className="mt-3 border border-white/30 rounded-xl bg-white/60 p-5 shadow-inner max-h-96 overflow-auto" ref={ref}>
              <div className="text-lg font-semibold mb-2 text-gray-900">Wygenerowana oferta:</div>
              {offer
                ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(offer),
                    }}
                  />
                )
                : <div className="text-gray-400">Brak wygenerowanej oferty.</div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
