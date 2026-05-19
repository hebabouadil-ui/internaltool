import type { User } from '@supabase/supabase-js'

export function getDisplayName(user: User | null): string {
  if (!user) return 'Admin'
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Admin'
  )
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function getCreatorColor(name: string): string {
  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
  ]
  const idx = (name.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}
