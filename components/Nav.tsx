'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, Receipt, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { getDisplayName, getInitials, getCreatorColor } from '@/lib/auth'
import { LogoMC } from './LogoMC'

const links = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/expenses', label: 'Dépenses', icon: Receipt },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = getDisplayName(user)
  const initials = getInitials(displayName)
  const avatarColor = getCreatorColor(displayName)

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden sm:flex items-center justify-between px-6 py-3 bg-[#1C1C1E] border-b border-[#2C2C2E] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <LogoMC size={36} />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Marca Club</p>
            <p className="text-[#C9A84C] text-[10px] tracking-widest uppercase">Gestion interne</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                    : 'text-[#8E8E93] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}>
            {initials}
          </div>
          <span className="text-sm font-medium text-[#EBEBF5]/80">{displayName}</span>
          <button
            onClick={handleLogout}
            className="ml-1 p-2 rounded-xl text-[#8E8E93] hover:bg-white/5 hover:text-red-400 transition"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Mobile top header */}
      <header className="sm:hidden flex items-center justify-between px-4 py-3 bg-[#1C1C1E] border-b border-[#2C2C2E] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <LogoMC size={30} />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Marca Club</p>
            <p className="text-[#C9A84C] text-[9px] tracking-widest uppercase">Gestion interne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}>
            {initials}
          </div>
          <button onClick={handleLogout} className="p-2 text-[#8E8E93] hover:text-red-400 transition">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C1C1E] border-t border-[#2C2C2E] flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                active ? 'text-[#C9A84C]' : 'text-[#636366]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
