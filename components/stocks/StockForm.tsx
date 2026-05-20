'use client'
import { useState } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { createTrip, updateTrip } from '@/lib/db'
import type { Trip, TripStatus } from '@/lib/types'
import { format } from 'date-fns'

interface StockFormProps {
  trip?: Trip
  onSave: (trip: Trip) => void
  onCancel: () => void
}

const statusOptions = [
  { value: 'open', label: 'En cours (pas encore parti)' },
  { value: 'arrived', label: 'Arrivé au Maroc' },
  { value: 'closed', label: 'Clôturé' },
]

export function StockForm({ trip, onSave, onCancel }: StockFormProps) {
  const [name, setName] = useState(trip?.name ?? '')
  const [date, setDate] = useState(trip?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [origin, setOrigin] = useState(trip?.origin ?? 'Espagne')
  const [customsRate, setCustomsRate] = useState(String(trip?.customs_rate ?? '0'))
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? 'open')
  const [notes, setNotes] = useState(trip?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Le nom du stock est requis')
    const rate = parseFloat(customsRate)
    if (isNaN(rate) || rate < 0 || rate > 100) return setError('Taux de douane invalide (0–100%)')

    setLoading(true)
    setError('')

    try {
      const payload = {
        name: name.trim(),
        date,
        origin: origin.trim() || 'Espagne',
        customs_rate: rate,
        status,
        notes: notes.trim() || null,
      }

      const saved = trip
        ? await updateTrip(trip.id, payload)
        : await createTrip(payload)

      onSave(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nom du stock *"
        placeholder="ex : Madrid — Mai 2026"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date du voyage *"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label="Origine"
          placeholder="Espagne"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Taux de douane (%)</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={customsRate}
            onChange={(e) => setCustomsRate(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-800 outline-none transition border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">%</span>
        </div>
        <p className="text-xs text-gray-400">Appliqué sur le total d'achat de ce stock</p>
      </div>

      <Select
        label="Statut"
        options={statusOptions}
        value={status}
        onChange={(e) => setStatus(e.target.value as TripStatus)}
      />

      <Input
        label="Notes (optionnel)"
        placeholder="Informations supplémentaires..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {trip ? 'Enregistrer' : 'Créer le stock'}
        </Button>
      </div>
    </form>
  )
}
