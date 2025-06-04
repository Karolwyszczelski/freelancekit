// src/app/kalkulator/page.tsx
"use client";

import { useState } from "react";

type Profession = 
  | "Influencer"
  | "Programista"
  | "Social Media Manager"
  | "Graphic Designer"
  | "Inna";

export default function KalkulatorPage() {
  // Wybor profesji
  const [profession, setProfession] = useState<Profession>("Influencer");

  // =========================
  // 1. STATE DLA INFLUENCERA
  // =========================
  const [infPlatforma, setInfPlatforma] = useState<string>("Instagram");
  const [infFollowers, setInfFollowers] = useState<number>(0);
  const [infEngagement, setInfEngagement] = useState<number>(0);
  const [infNisza, setInfNisza] = useState<string>("");
  const [infGeografia, setInfGeografia] = useState<string>("Polska");
  const [infFormaty, setInfFormaty] = useState({
    post: false,
    karuzela: false,
    story: false,
    reels: false,
    live: false,
    artykul: false,
  });
  const [infEkskluzywnosc, setInfEkskluzywnosc] = useState<boolean>(false);
  const [infLicencja, setInfLicencja] = useState<boolean>(false);
  const [infDodajCTA, setInfDodajCTA] = useState<boolean>(false);

  // ===========================
  // 2. STATE DLA PROGRAMISTY
  // ===========================
  const [progHourlyRate, setProgHourlyRate] = useState<number>(0);
  const [progEstimatedHours, setProgEstimatedHours] = useState<number>(0);
  const [progComplexity, setProgComplexity] = useState<"Niska" | "Średnia" | "Wysoka">("Średnia");
  const [progTechStack, setProgTechStack] = useState<string>("React/Next.js");
  const [progTravelCost, setProgTravelCost] = useState<number>(0);
  const [progLicenseCost, setProgLicenseCost] = useState<number>(0);

  // ================================
  // 3. STATE DLA SOCIAL MEDIA MANAGERA
  // ================================
  const [smmChannels, setSmmChannels] = useState<number>(1);
  const [smmPostsPerWeek, setSmmPostsPerWeek] = useState<number>(4);
  const [smmCommunityHours, setSmmCommunityHours] = useState<number>(2);
  const [smmAdBudget, setSmmAdBudget] = useState<number>(0);
  const [smmStrategyFee, setSmmStrategyFee] = useState<number>(0);

  // ============================
  // 4. STATE DLA GRAPHIC DESIGNERA
  // ============================
  const [gdType, setGdType] = useState<"Logo" | "UI/UX" | "Ilustracja" | "Inne">("Logo");
  const [gdBasePrice, setGdBasePrice] = useState<number>(0);
  const [gdRevisions, setGdRevisions] = useState<number>(1);
  const [gdLicenseUsage, setGdLicenseUsage] = useState<boolean>(false);
  const [gdComplexity, setGdComplexity] = useState<"Niska" | "Średnia" | "Wysoka">("Średnia");

  // ================================
  // 5. STATE DLA INNYCH / OGÓLNE
  // ================================
  const [otherDescription, setOtherDescription] = useState<string>("");
  const [otherBaseRate, setOtherBaseRate] = useState<number>(0);
  const [otherAdditionalCost, setOtherAdditionalCost] = useState<number>(0);

  // =============================
  // 6. PODATKI I TERMINY (WSPÓLNE)
  // =============================
  const [vat, setVat] = useState<boolean>(true);
  const [kwotaNetto, setKwotaNetto] = useState<number>(0);

  const [terminPublikacji, setTerminPublikacji] = useState<string>("");
  const [czasAkceptacji, setCzasAkceptacji] = useState<number>(2);
  const [okresEksploatacji, setOkresEksploatacji] = useState<string>("3");
  const [ekspres, setEkspres] = useState<boolean>(false);

  // ======================
  // Wyniki Podsumowania
  // ======================
  const [wyniki, setWyniki] = useState<{
    bazowa: number;
    dodatki: number;
    netto: number;
    brutto: number;
  }>({
    bazowa: 0,
    dodatki: 0,
    netto: 0,
    brutto: 0,
  });

  // =================================
  // FUNKCJE OBLICZEŃ DLA KAŻDEJ ROLI
  // =================================

  const policzInfluencer = () => {
    // 1. Stawka bazowa: (followers /1000)*20*(1 + engagement/100)
    const bazowa = Math.round(
      (infFollowers / 1000) * 20 * (1 + infEngagement / 100)
    );
    // 2. Dodatek za formaty (przykład: post +10%, story +5%, reels +20%, art +15%)
    let formatMultiplier = 0;
    if (infFormaty.post) formatMultiplier += 0.1;
    if (infFormaty.karuzela) formatMultiplier += 0.15;
    if (infFormaty.story) formatMultiplier += 0.05;
    if (infFormaty.reels) formatMultiplier += 0.2;
    if (infFormaty.live) formatMultiplier += 0.25;
    if (infFormaty.artykul) formatMultiplier += 0.15;

    // 3. Dodatek za ekskluzywność/licencję/CTA
    const exMultiplier = infEkskluzywnosc ? 0.2 : 0;
    const licMultiplier = infLicencja ? 0.1 : 0;
    const ctaMultiplier = infDodajCTA ? 0.05 : 0;

    const dodatki =
      bazowa * (formatMultiplier + exMultiplier + licMultiplier + ctaMultiplier);
    const netto = bazowa + Math.round(dodatki) + (ekspres ? bazowa * 0.2 : 0);
    const brutto = vat ? Math.round(netto * 1.23) : netto;

    return { bazowa, dodatki: Math.round(dodatki), netto: Math.round(netto), brutto };
  };

  const policzProgramista = () => {
    // 1. Stawka bazowa: hourlyRate * estimatedHours
    const base = progHourlyRate * progEstimatedHours;
    // 2. Multiplier złożoności: Niska=1.0, Średnia=1.2, Wysoka=1.5
    const complexityMul =
      progComplexity === "Niska" ? 1 : progComplexity === "Średnia" ? 1.2 : 1.5;
    // 3. Tech stack premium (przykład: React/Next = +10%, Nodejs = +5%, AI/ML = +20%)
    let techMul = 0;
    if (progTechStack.includes("React")) techMul = 0.1;
    if (progTechStack.includes("Next")) techMul = 0.1;
    if (progTechStack.includes("AI") || progTechStack.includes("ML")) techMul = 0.2;
    if (progTechStack.includes("Node")) techMul = 0.05;

    const bazowa = Math.round(base * complexityMul * (1 + techMul));
    const dodatki = progTravelCost + progLicenseCost + (ekspres ? bazowa * 0.2 : 0);
    const netto = bazowa + dodatki;
    const brutto = vat ? Math.round(netto * 1.23) : netto;

    return { bazowa, dodatki: Math.round(dodatki), netto: Math.round(netto), brutto };
  };

  const policzSMM = () => {
    // 1. Stawka bazowa: (channels * posts/week * 4) * 50 PLN (przykładowa stawka za post)
    const base = smmChannels * smmPostsPerWeek * 4 * 50;
    // 2. Dodatkowe: community management hours * 100 PLN/h
    const communityCost = smmCommunityHours * 100;
    // 3. Strategia: flat fee
    const strategyCost = smmStrategyFee;
    // 4. Ad budget nie jest kosztem agencji, tylko informacją – nie wliczamy w sumę
    const bazowa = base;
    const dodatki = communityCost + strategyCost + (ekspres ? bazowa * 0.2 : 0);
    const netto = bazowa + dodatki;
    const brutto = vat ? Math.round(netto * 1.23) : netto;

    return { bazowa, dodatki: Math.round(dodatki), netto: Math.round(netto), brutto };
  };

  const policzGD = () => {
    // 1. Stawka bazowa: basePrice * complexityMultiplier
    const complexityMul = gdComplexity === "Niska" ? 1 : gdComplexity === "Średnia" ? 1.2 : 1.5;
    const bazowa = Math.round(gdBasePrice * complexityMul);
    // 2. Dodatki: liczba poprawek * 100 PLN + licencjaUsage ? 200 PLN : 0
    const revisionCost = gdRevisions * 100;
    const licenseCost = gdLicenseUsage ? 200 : 0;
    const dodatki = revisionCost + licenseCost + (ekspres ? bazowa * 0.2 : 0);
    const netto = bazowa + dodatki;
    const brutto = vat ? Math.round(netto * 1.23) : netto;

    return { bazowa, dodatki: Math.round(dodatki), netto: Math.round(netto), brutto };
  };

  const policzOther = () => {
    const bazowa = otherBaseRate;
    const dodatki = otherAdditionalCost + (ekspres ? bazowa * 0.2 : 0);
    const netto = bazowa + dodatki;
    const brutto = vat ? Math.round(netto * 1.23) : netto;
    return { bazowa, dodatki: Math.round(dodatki), netto: Math.round(netto), brutto };
  };

  // ============================
  // OBSŁUGA SUBMITU (WSZYSTKIE)
  // ============================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let wynik;
    switch (profession) {
      case "Influencer":
        wynik = policzInfluencer();
        break;
      case "Programista":
        wynik = policzProgramista();
        break;
      case "Social Media Manager":
        wynik = policzSMM();
        break;
      case "Graphic Designer":
        wynik = policzGD();
        break;
      case "Inna":
      default:
        wynik = policzOther();
        break;
    }
    setWyniki(wynik);
    setKwotaNetto(wynik.netto);
  };

  // ======================
  // JSX RENDER
  // ======================
  return (
    // Usuńmy bg-transparent – zostawiamy tylko flex-1 i padding,
    // żeby dziedziczyć globalne tło z `globals.css`.
    <div className="flex-1 p-6">
      <h1 className="text-4xl font-bold text-white mb-6">Kalkulator oferty</h1>

      {/* 1. Zakładka wyboru profesji */}
      <div className="flex gap-4 mb-8">
        {[
          "Influencer",
          "Programista",
          "Social Media Manager",
          "Graphic Designer",
          "Inna",
        ].map((prof) => (
          <button
            key={prof}
            onClick={() => setProfession(prof as Profession)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              profession === prof
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {prof}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* === INFLUENCER SECTION === */}
        {profession === "Influencer" && (
          <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dane influencera
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platforma */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Platforma
                </label>
                <select
                  value={infPlatforma}
                  onChange={(e) => setInfPlatforma(e.target.value)}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option className="bg-[#2A1A4D] text-white">Instagram</option>
                  <option className="bg-[#2A1A4D] text-white">TikTok</option>
                  <option className="bg-[#2A1A4D] text-white">YouTube</option>
                  <option className="bg-[#2A1A4D] text-white">LinkedIn</option>
                  <option className="bg-[#2A1A4D] text-white">Facebook</option>
                </select>
              </div>
              {/* Followers */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Liczba obserwujących
                </label>
                <input
                  type="number"
                  value={infFollowers}
                  onChange={(e) => setInfFollowers(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Engagement Rate */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Engagement rate (%)
                </label>
                <input
                  type="number"
                  value={infEngagement}
                  onChange={(e) => setInfEngagement(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Nisza */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Nisza / kategoria
                </label>
                <input
                  type="text"
                  value={infNisza}
                  onChange={(e) => setInfNisza(e.target.value)}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="np. moda, uroda, lifestyle"
                />
              </div>
              {/* Geografia */}
              <div className="md:col-span-2">
                <label className="block mb-1 text-white font-medium">
                  Zasięg geograficzny
                </label>
                <select
                  value={infGeografia}
                  onChange={(e) => setInfGeografia(e.target.value)}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option className="bg-[#2A1A4D] text-white">Polska</option>
                  <option className="bg-[#2A1A4D] text-white">
                    Zachodnia Europa
                  </option>
                  <option className="bg-[#2A1A4D] text-white">USA</option>
                  <option className="bg-[#2A1A4D] text-white">Globalnie</option>
                </select>
              </div>
            </div>

            {/* Format Kampanii */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-3">
                Wybór formatu kampanii
              </h3>
              <div className="flex flex-wrap gap-6">
                {[ 
                  { label: "Post statyczny", key: "post" },
                  { label: "Karuzela", key: "karuzela" },
                  { label: "Story", key: "story" },
                  { label: "Reels / film", key: "reels" },
                  { label: "Live streaming", key: "live" },
                  { label: "Artykuł sponsorowany", key: "artykul" },
                ].map((fmt) => (
                  <label key={fmt.key} className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={infFormaty[fmt.key as keyof typeof infFormaty]}
                      onChange={() =>
                        setInfFormaty((f) => ({
                          ...f,
                          [fmt.key]: !f[fmt.key as keyof typeof infFormaty],
                        }))
                      }
                      className="mr-2 accent-purple-400"
                    />
                    {fmt.label}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-6 mt-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={infEkskluzywnosc}
                    onChange={() => setInfEkskluzywnosc(!infEkskluzywnosc)}
                    className="mr-2 accent-purple-400"
                  />
                  Ekskluzywność (+20%)
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={infLicencja}
                    onChange={() => setInfLicencja(!infLicencja)}
                    className="mr-2 accent-purple-400"
                  />
                  Licencja na użycie materiału (+10%)
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={infDodajCTA}
                    onChange={() => setInfDodajCTA(!infDodajCTA)}
                    className="mr-2 accent-purple-400"
                  />
                  Dodaj CTA (swipe-up/link) (+5%)
                </label>
              </div>
            </div>
          </section>
        )}

        {/* === PROGRAMISTA SECTION === */}
        {profession === "Programista" && (
          <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dane programisty
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stawka godzinowa */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Stawka godzinowa (PLN/h)
                </label>
                <input
                  type="number"
                  value={progHourlyRate}
                  onChange={(e) =>
                    setProgHourlyRate(Number(e.target.value))
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Szacowane godziny */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Szacowane godziny pracy
                </label>
                <input
                  type="number"
                  value={progEstimatedHours}
                  onChange={(e) =>
                    setProgEstimatedHours(Number(e.target.value))
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Złożoność projektu */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Złożoność projektu
                </label>
                <select
                  value={progComplexity}
                  onChange={(e) =>
                    setProgComplexity(
                      e.target.value as "Niska" | "Średnia" | "Wysoka"
                    )
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option className="bg-[#2A1A4D] text-white">Niska</option>
                  <option className="bg-[#2A1A4D] text-white">Średnia</option>
                  <option className="bg-[#2A1A4D] text-white">Wysoka</option>
                </select>
              </div>
              {/* Tech stack */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Tech stack / technologia
                </label>
                <input
                  type="text"
                  value={progTechStack}
                  onChange={(e) => setProgTechStack(e.target.value)}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="np. React/Next.js, Node.js, AI/ML"
                />
              </div>
              {/* Koszt podróży */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Koszt podróży (PLN)
                </label>
                <input
                  type="number"
                  value={progTravelCost}
                  onChange={(e) => setProgTravelCost(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
              {/* Koszt licencji */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Koszt licencji / narzędzi (PLN)
                </label>
                <input
                  type="number"
                  value={progLicenseCost}
                  onChange={(e) => setProgLicenseCost(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
            </div>
          </section>
        )}

        {/* === SOCIAL MEDIA MANAGER SECTION === */}
        {profession === "Social Media Manager" && (
          <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dane Social Media Managera
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Liczba kanałów */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Liczba obsługiwanych kanałów
                </label>
                <input
                  type="number"
                  value={smmChannels}
                  onChange={(e) => setSmmChannels(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={1}
                  required
                />
              </div>
              {/* Posty na tydzień */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Posty na tydzień (sumarycznie)
                </label>
                <input
                  type="number"
                  value={smmPostsPerWeek}
                  onChange={(e) => setSmmPostsPerWeek(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Godziny community management */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Godziny community management / tyg.
                </label>
                <input
                  type="number"
                  value={smmCommunityHours}
                  onChange={(e) =>
                    setSmmCommunityHours(Number(e.target.value))
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
              {/* Budżet reklamowy (informacyjnie) */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Budżet reklamowy (PLN) – nie wliczany
                </label>
                <input
                  type="number"
                  value={smmAdBudget}
                  onChange={(e) => setSmmAdBudget(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
              {/* Opłata za strategię */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Opłata za strategię (PLN)
                </label>
                <input
                  type="number"
                  value={smmStrategyFee}
                  onChange={(e) => setSmmStrategyFee(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
            </div>
          </section>
        )}

        {/* === GRAPHIC DESIGNER SECTION === */}
        {profession === "Graphic Designer" && (
          <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dane Graphic Designera
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Typ projektu */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Typ projektu
                </label>
                <select
                  value={gdType}
                  onChange={(e) =>
                    setGdType(
                      e.target.value as "Logo" | "UI/UX" | "Ilustracja" | "Inne"
                    )
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option className="bg-[#2A1A4D] text-white">Logo</option>
                  <option className="bg-[#2A1A4D] text-white">UI/UX</option>
                  <option className="bg-[#2A1A4D] text-white">Ilustracja</option>
                  <option className="bg-[#2A1A4D] text-white">Inne</option>
                </select>
              </div>
              {/* Cena bazowa */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Cena bazowa (PLN)
                </label>
                <input
                  type="number"
                  value={gdBasePrice}
                  onChange={(e) => setGdBasePrice(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                  required
                />
              </div>
              {/* Liczba poprawek */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Liczba poprawek
                </label>
                <input
                  type="number"
                  value={gdRevisions}
                  onChange={(e) => setGdRevisions(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
              {/* Licencja użycia */}
              <div>
                <label className="flex items-center text-white font-medium">
                  <input
                    type="checkbox"
                    checked={gdLicenseUsage}
                    onChange={() => setGdLicenseUsage(!gdLicenseUsage)}
                    className="mr-2 accent-purple-400"
                  />
                  Licencja na użycie (+200 PLN)
                </label>
              </div>
              {/* Złożoność projektu */}
              <div>
                <label className="block mb-1 text-white font-medium">
                  Złożoność projektu
                </label>
                <select
                  value={gdComplexity}
                  onChange={(e) =>
                    setGdComplexity(
                      e.target.value as "Niska" | "Średnia" | "Wysoka"
                    )
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option className="bg-[#2A1A4D] text-white">Niska</option>
                  <option className="bg-[#2A1A4D] text-white">Średnia</option>
                  <option className="bg-[#2A1A4D] text-white">Wysoka</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* === INNA PROFESJA SECTION === */}
        {profession === "Inna" && (
          <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Dane para inne
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 text-white font-medium">
                  Opis usługi
                </label>
                <input
                  type="text"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Krótki opis usługi"
                />
              </div>
              <div>
                <label className="block mb-1 text-white font-medium">
                  Cena bazowa (PLN)
                </label>
                <input
                  type="number"
                  value={otherBaseRate}
                  onChange={(e) => setOtherBaseRate(Number(e.target.value))}
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
              <div>
                <label className="block mb-1 text-white font-medium">
                  Dodatkowe koszty (PLN)
                </label>
                <input
                  type="number"
                  value={otherAdditionalCost}
                  onChange={(e) =>
                    setOtherAdditionalCost(Number(e.target.value))
                  }
                  className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={0}
                />
              </div>
            </div>
          </section>
        )}

        {/* ===== PODATKI & TERMINY (WSZYSTKIE) ===== */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Podatki i terminy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Podatek VAT */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="text-white font-medium">Podatek:</span>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="vat"
                  checked={vat}
                  onChange={() => setVat(true)}
                  className="mr-2 accent-purple-400"
                />
                Faktura VAT (23%)
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="vat"
                  checked={!vat}
                  onChange={() => setVat(false)}
                  className="mr-2 accent-purple-400"
                />
                Rachunek bez VAT
              </label>
            </div>
            {/* Termin publikacji */}
            <div>
              <label className="block mb-1 text-white font-medium">
                Termin publikacji
              </label>
              <input
                type="date"
                value={terminPublikacji}
                onChange={(e) => setTerminPublikacji(e.target.value)}
                className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {/* Czas na akceptację */}
            <div>
              <label className="block mb-1 text-white font-medium">
                Czas na akceptację (dni)
              </label>
              <input
                type="number"
                value={czasAkceptacji}
                onChange={(e) => setCzasAkceptacji(Number(e.target.value))}
                className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min={0}
              />
            </div>
            {/* Okres eksploatacji */}
            <div>
              <label className="block mb-1 text-white font-medium">
                Okres eksploatacji treści (miesiące)
              </label>
              <select
                value={okresEksploatacji}
                onChange={(e) => setOkresEksploatacji(e.target.value)}
                className="w-full bg-transparent border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option className="bg-[#2A1A4D] text-white">3</option>
                <option className="bg-[#2A1A4D] text-white">6</option>
                <option className="bg-[#2A1A4D] text-white">12</option>
              </select>
            </div>
            {/* Ekspres */}
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={ekspres}
                onChange={() => setEkspres(!ekspres)}
                className="mr-2 accent-purple-400"
              />
              Ekspresowa usługa (+20%)
            </label>
          </div>
        </section>

        {/* ===== PODSUMOWANIE ===== */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Wynik kalkulacji
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between text-white">
              <span className="font-medium">Stawka bazowa:</span>
              <span>{wyniki.bazowa} PLN</span>
            </div>
            <div className="flex justify-between text-white">
              <span className="font-medium">Dodatki:</span>
              <span>{wyniki.dodatki} PLN</span>
            </div>
            <div className="flex justify-between text-white">
              <span className="font-medium">Kwota netto:</span>
              <span>{wyniki.netto} PLN</span>
            </div>
            <div className="flex justify-between text-white">
              <span className="font-medium">Kwota brutto:</span>
              <span>{wyniki.brutto} PLN</span>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
            >
              Oblicz ofertę
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
