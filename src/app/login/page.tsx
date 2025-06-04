// app/(guest)/login/page.tsx (zakładając strukturę Next.js 13+ z App Router)

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { Briefcase } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.replace('/dashboard')
  }

  return (
    /* Tutaj dodajemy klasę .app-background */
    <div className="app-background min-h-screen flex items-center justify-center">
      <div className="relative w-80 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl">
        {/* ◀️ Przycisk powrotu */}
        <Link
          href="/"
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

        {/* Logo + nazwa (obok siebie) */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Briefcase className="w-10 h-10 text-white" />
          <span className="text-white text-2xl font-semibold">FreelanceKit</span>
        </div>

        {/* Formularz */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="
              w-full p-3 rounded-lg 
              bg-white/20 placeholder-white/70 text-white
              focus:outline-none focus:ring-2 focus:ring-blue-300
            "
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="
              w-full p-3 rounded-lg 
              bg-white/20 placeholder-white/70 text-white
              focus:outline-none focus:ring-2 focus:ring-blue-300
            "
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="
              w-full py-3 mt-2 rounded-lg 
              bg-gradient-to-r from-blue-400 to-purple-500
              text-white font-medium
            "
          >
            Zaloguj się
          </button>
        </form>

        {/* Linki */}
        <div className="flex justify-between mt-4 text-sm text-white/80">
          <Link href="/register" className="hover:underline">
            Zarejestruj się
          </Link>
          <Link href="/reset-password" className="hover:underline">
            Odzyskaj hasło
          </Link>
        </div>
      </div>
    </div>
  )
}
