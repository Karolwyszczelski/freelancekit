export default function LandingPage() {
  return (
    <section className="px-6 py-20 max-w-4xl mx-auto text-center space-y-8">
      <h2 className="text-4xl font-extrabold">Witaj w FreelanceKit</h2>
      <p className="text-lg">
        Kompleksowe narzędzie dla freelancerów – CRM, generator ofert, kanban, portfolio i więcej.
      </p>
      <a
        href="/login"
        className="inline-block px-8 py-4 bg-gradient-to-r from-gradientStart to-gradientEnd rounded-full text-white font-medium"
      >
        Zaloguj się / Zarejestruj
      </a>
      {/* Tutaj możesz dorzucić sekcje „Funkcje”, „Cena” itp. */}
    </section>
  )
}
