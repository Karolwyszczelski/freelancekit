'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { Briefcase } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Walidacja haseł
    if (password !== confirm) {
      setError('Hasła nie są identyczne')
      return
    }

    setLoading(true)

    // 1️⃣ Rejestracja użytkownika w auth.users
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (signUpError || !signUpData.user) {
      setLoading(false)
      setError(signUpError?.message || 'Wystąpił błąd podczas rejestracji')
      return
    }

    const userId = signUpData.user.id

    // 2️⃣ Wstawienie rekordu do profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        full_name: fullName,
        role: null,
        hourly_rate: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        portfolio_url: null
      }])

    setLoading(false)

    if (profileError) {
      setError('Nie udało się utworzyć profilu: ' + profileError.message)
      return
    }

    // 3️⃣ Przekierowanie na stronę logowania
    router.push('/login')
  }

  return (
    <div className="relative w-80 p-6
                    bg-white/10 backdrop-blur-md border border-white/20
                    rounded-3xl">
     {/* ◀️ Przycisk powrotu */}
      <Link
        href="/login"
        className="
          absolute w-10 h-10 
          bg-white/20 hover:bg-white/30 
          rounded-full flex items-center justify-center
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" 
          className="w-4 h-4 text-white"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Briefcase className="w-10 h-10 text-white" />
        <span className="text-white text-2xl font-semibold">FreelanceKit</span>
      </div>

      {/* Formularz rejestracji */}
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Imię i nazwisko"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-white/70 text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-white/70 text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-white/70 text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="password"
          placeholder="Powtórz hasło"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-white/70 text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 mt-2 rounded-lg
                     bg-gradient-to-r from-blue-400 to-purple-500
                     text-white font-medium"
          disabled={loading}
        >
          {loading ? 'Wysyłanie…' : 'Zarejestruj się'}
        </button>
      </form>

      {/* Link do logowania */}
      <div className="text-center mt-4 text-sm text-white/80">
        Masz już konto?{' '}
        <Link href="/login" className="hover:underline">
          Zaloguj się
        </Link>
      </div>
    </div>
  )
}
