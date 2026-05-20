'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoMC } from '@/components/LogoMC'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <LogoMC size={72} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Marca Club</h1>
          <p className="text-[#C9A84C] text-xs tracking-[0.2em] uppercase mt-1">Espace Admin</p>
        </div>

        {/* Form card */}
        <div className="bg-[#2C2C2E] rounded-2xl border border-[#3C3C3E] p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="admin@marca-club.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1C1C1E] border border-[#3C3C3E] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#48484A] outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1C1C1E] border border-[#3C3C3E] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#48484A] outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2 text-center border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#8B6914' : 'linear-gradient(135deg, #E8C96A 0%, #C9A84C 50%, #A67C32 100%)',
                color: '#1C1C1E',
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-[#48484A] mt-5">
          Accès réservé aux administrateurs
        </p>
      </div>
    </div>
  )
}
